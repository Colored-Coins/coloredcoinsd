module.exports = (function () {
    var config = require("./config");
    var Client = require('node-rest-client').Client;
    var Q = require("q");
    var rpc = require("bitcoin");
    var AWS = require("aws-sdk");
    var crypto = require('crypto');
    var bitcoinjs = require('bitcoinjs-lib');
    var bn = require('bignumber.js');
    var cc = require('cc-transaction');
    var assetIdencoder = require('cc-assetid-encoder');
    var _ = require('lodash')



    var creds = {};
    creds.AWSAKI = process.env.AWSAKI;
    creds.AWSSSK = process.env.AWSSSK; 

    var client = new Client();

    var rpcclient = new rpc.Client(config.bitcoind);

    function coluutils() {
         client.registerMethod("getaddressutxos", config.blockexplorer.url + "/api/getaddressutxos?address=${address}", "GET");
        //coluutils.getBlockCount().then(function() { console.log('count:', arguments[0][1]); } );
        //coluutils.sendRawTransaction("0100000001c37465105275a6de0163220da4db306cb5815e1f5b76f5868c7d2b7c5b13aa0d0f0000008b483045022100e570db30b46c3758d65cf01c91a1ad6ec068fd2fcec75f22242434fbe2eb13990220268ab329874cba6f962e5ec281ffeb3f86392af36eb7b8bdf2693e608eb59633014104ecf1a1c51032dd523f1a23ca734d3740314b3d7d3db6011b50d50aec4c6e5a1043909082e54fe48b74d84b256b25552f82e9e2316da29485b1c9df003febac3dffffffff0240060000000000001976a91472c383889fc9d4c4658feabe478ae08698120cd888ac00000000000000001976a91496ab0dbf3d61fb63d07da6981cfa5d5341c5587088ac00000000").then(function() { console.log(arguments) } );

    }

    coluutils.sendRawTransaction = function sendRawTransaction(txHex) {     
        return callservice('sendrawtransaction',txHex);       
    }

    coluutils.getBlockCount = function getBlockCount() {     
        return callservice('getblockcount');       
    }
    coluutils.getTransactionListForAddress = function getTransactionListForAddress(address, no_confirmations) {
      var deferred = Q.defer();
      var confirmations = no_confirmations || 0;
      callservice('listunspent', confirmations)
      .then(function(unspents) {
        console.log('got unspents')
        var batch = []
          unspents.forEach(function(unspent){
              batch.push({method: "getrawtransaction", params:[unspent.txid,1]});
          })
          callwithbatch(batch)
          .then(function(transactions){
              var useable = unspents.filter(function(unspent, i) {

                console.log("checking unspent "  + unspent.txid + ":" + unspent.vout)
                var keep = true;
                if(config.checkFinanaceValidty) {
                  transactions[i].vout.some(function(vout, x){
                    if(vout.scriptPubKey && 
                    vout.scriptPubKey.asm && 
                    vout.scriptPubKey.asm.indexOf("OP_RETURN") != -1)
                    {
                      // if its our rncoding then check the ouput isn't a color
                      if(!isOkToIssue(vout, unspent.vout)) {
                         keep = false;
                         console.log("input removed: " + vout.scriptPubKey.asm )
                         return true;
                       }
                    }
                    return x == (transactions[i].vout.length -1);
                  })
                } // check validity
                unspent.transaction = transactions[i];
                console.log(unspent.txid + " keep: " + keep)
                return keep;
              }) //unsepnts.filter


              console.log('resovle get inputs')
              console.log(useable)
             // console.log(unspents)
              deferred.resolve(useable);
          })
      })
       return deferred.promise;
    }

    function callwithbatch(batch) {
        var ret =[];
        var deferred = Q.defer();
        console.log('batching')
        console.log(batch)
        rpcclient.cmd(batch, function(err, data, placeholder, done){
          console.log('still batching')
            if(err) ret.push(err)
            else ret.push(data)
            if(done) 
              {
                console.log('batching done')
                deferred.resolve(ret);
              }
        })
         return deferred.promise;
    }

    function isOkToIssue(vout, index)
    {
       var isok = false;
        if (vout.scriptPubKey && vout.scriptPubKey.type == 'nulldata') {

               console.log('found OP_RETURN')

               var hex = get_opreturn_data(vout.scriptPubKey.hex) // remove op_return (0x6a) and data length?
                console.log(hex)
               if (check_version(hex)) {
                  console.log('hex: ', hex)
                 var ccdata = cc.createFromHex(hex).toJson()
                 ccdata.payments.some(function(payment){
                    if(payment.output != index)
                      isok = true;
                    else
                      isok = false
                    return !isok;
                 })
               }
             }
         return isok;
}

var check_version = function (hex) {
 var version = hex.toString('hex').substring(0, 4)
 if (version.toLowerCase() == '4343') {
   return true
 }
 return false
}

var get_opreturn_data = function (hex) {
    return hex.substring(4)
}



    function callservice() {
        var deferred = Q.defer();

        var args = [].slice.call(arguments);
        var command = args[0];
        args.shift();
        var batch = [{
            method: command,
            params: args
        }];



        rpcclient.cmd(batch, function(err){
          if (err) {
             console.log(err);
              deferred.reject(new Error("failed: Status code was " + err));
          }
          else {
            deferred.resolve(arguments[1]);
          }

        });
        
       
        return deferred.promise;
    }


    coluutils.validateIssueTrasaction = function validateIssueTrasaction(data) {
      var deferred = Q.defer();
      // lets check if this is the first issue
       var key = sha1(sha256(data)).toString('hex');
       // send key to sevice to check if we already have it
        AWS.config.update({ accessKeyId: process.env.AWSAKI,
                        secretAccessKey: process.env.AWSSSK });


        var s3bucket = new AWS.S3({params: {Bucket: 'coloredcoin-assets'}});
        s3bucket.headObject({Key: key}, function(error, headobject){


            if(error && error.code === "NotFound") { 
              //all is well
              deferred.resolve(data);
            }
            else {
              // are we reissueing
              if(data.reissue) {

              }
              else
                deferred.reject(new Error("cant reissue without correct assetId"));
          }   
        });


       // check with block explorer that transaction is ok
       
       return deferred.promise;
    }

    coluutils.createAssetFile = function createAssetFile(data) {
      console.log(data);
        var deferred = Q.defer();

        var key = sha1(sha256(data)).toString('hex');
        
        AWS.config.update({ accessKeyId: process.env.AWSAKI,
                        secretAccessKey: process.env.AWSSSK });

        var s3bucket = new AWS.S3({params: {Bucket: 'coloredcoin-assets'}});

        s3bucket.upload({Key: key, Body:data, ContentType: 'application/json' }, function(err, data) {
            if (err) {
              console.log("Error uploading data: ", err);
                deferred.reject(new Error("Status code was " + err));
            } else {
             // console.log("Successfully uploaded data to coloredcoin-assets");
               deferred.resolve({ metadata: "https://s3.amazonaws.com/coloredcoin-assets/" + key });
            }
        });
               

                
        return deferred.promise;


    }

    coluutils.createIssueTransaction = function createIssueTransaction(metadata) {
        var deferred = Q.defer();

        tx = new bitcoinjs.Transaction();
        // find inputs to cover the issuence
        addInputsForIssueTransaction(tx, metadata).
        then(function(args){
            tx = encodeColorScheme(args);
            deferred.resolve({txHex: tx.toHex(), assetId: args.assetId || "0"});
        }).
        catch(function(err) {
          deferred.reject(err);
        });
          

        return deferred.promise;
    }

     coluutils.createSendAssetTansaction = function createSendAssetTansaction(metadata) {
        var deferred = Q.defer();

        tx = new bitcoinjs.Transaction();
        // find inputs to cover the issuence
        addInputsForSendTransaction(tx, metadata).
        then(function(tx){
            console.log(tx)
            deferred.resolve(tx);
        }).
        catch(function(err) {
          console.log(err)
          deferred.reject(err);
        });
          

        return deferred.promise;
    }

    




    function encodeColorScheme(args) {
      var metadata = JSON.parse(args.metadata)
      var encoder = cc.newTransaction(0x4343, 0x01)
      encoder.setLockStatus(!metadata.reissueable)
      console.log("amount and div " + metadata.amount+" "+ metadata.divisibility)
      encoder.setAmount(metadata.amount, metadata.divisibility);
      if(metadata.metadata || metadata.rules) {
         if(config.writemultisig) {
            // write the hashes to the first outpt and encode
         }
      }

      console.log(metadata.transfer)
      if(metadata.transfer) {
        metadata.transfer.forEach(function(transferobj, i){
          console.log("payment " + transferobj.amount + " " + args.tx.outs.length)
          encoder.addPayment(0, transferobj.amount, args.tx.outs.length)
          args.tx.addOutput(transferobj.address, config.mindustvalue)
        })
      }

      //add op_return
      console.log("before encode done")
      var buffer = encoder.encode();

      console.log("encoding done")
      var ret = bitcoinjs.Script.fromChunks(
                              [
                                bitcoinjs.opcodes.OP_RETURN,
                                buffer.codeBuffer
                              ]);

      args.tx.addOutput(ret, 0);

      // add change
      args.tx.addOutput(metadata.issueAddress , args.change);

      return args.tx;

    }


    function getUnspentsByAddress(address)
    {
        var deferred = Q.defer();
        var args = {
                    path: { "address": address }

                }
        client.methods.getaddressutxos(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("getAddressBalance:(200) " + data);
                deferred.resolve(data);
            }
            else if(data) {
                console.log("rejecting with: " + response.statusCode + " " + data);
                deferred.reject(new Error(response.statusCode + " " + data));
            }
            else {
                console.log("rejecting with: " + response.statusCode);
                deferred.reject(new Error("Status code was " + response.statusCode));
            }
        }).on('error', function (err) {
                console.log('something went wrong on the request', err.request.options);
                deferred.reject(new Error("Status code was " + err.request.options));
            });

        return deferred.promise;
    }

    function comupteCost(withfee, metadata ){
       fee = withfee ? config.minfee : 0;

        if(metadata.to && metadata.to.length)
        {
          metadata.to.forEach(function(to) {
            fee += config.mindustvalue
          })
        }
        if(!metadata.rules && !metadata.metadata)
          return fee
        else
          return fee + config.writemultisig ? config.mindustvalue  : 0;
    }

    function addInputsForSendTransaction(tx, metadata) {
        var deferred = Q.defer()
        var satoshiCost = comupteCost(true, metadata)
        var totalInputs = { amount: 0 }
        
        try{
        if(metadata.from) {
          getUnspentsByAddress(metadata.from)
          .then(function(data){
            var utxos = JSON.parse(data).utxos
            console.log('got unspents for ' + metadata.from + " from block explorer")
             var assetList = []
             metadata.to.forEach(function(to) {
                console.log(to.assetId)
                if(!assetList[to.assetId]) 
                  assetList[to.assetId] = { amount: 0, addresses: [], input: 0, done: false, change: 0, encodeAmount: 0 }
                assetList[to.assetId].amount += to.amount
                assetList[to.assetId].encodeAmount = assetList[to.assetId].amount;
                assetList[to.assetId].addresses.push({ address: to.address, amount: to.amount})              
             })

             console.log('finshed creating per asset list')
             for( var asset in assetList)
             {
                console.log('working on asset: ' + asset)
                console.log(utxos)
                var assetUtxo = utxos.filter(function (element, index, array) {
                  console.log('checking element ' + element )
                   return element.assets.some(function(a){
                      console.log('checking ' + a.assetId + ' and '+ asset)
                      return (a.assetId == asset)
                   })
                })
                if(assetUtxo) {
                  console.log("have utxo list")
                  var key = asset;
                   if(!findBestMatchByNeededAssets (assetUtxo, assetList, key, tx, totalInputs, metadata)) {
                      deferred.reject(new Error('Not Enough aseet of ' + key ))
                      return;
                   }
                }
                else {
                  console.log("no utxo list")
                  deferred.reject(new Error('Not output with asset ' + asset ))
                }

             }
             console.log('reached encoder')
             var encoder = cc.newTransaction(0x4343, 0x01)

              var curentValueInSatoshi = _.sum(tx.ins, function(input) { return input.amount; });
              if(satoshiCost > curentValueInSatoshi) {
                  if(!insertSatoshiToTransaction(utxos, tx, (satoshiCost - curentValueInSatoshi), totalInputs, metadata)) {
                     console.log('not enough satoshi in account for fees')
                    deferred.reject(new Error('not enough satoshi in account for fees' ))
                    return;
                  }
              }

             // done with the inputs now add outputs and encode
             if(metadata.rules || metadata.metadata){
              //TODO: HASHES so we maybe drop them in first output
             }

             for( asset in assetList)
             {

                currentAsset = assetList[asset];
                console.log('encodeing asset ' + asset)
                if(!currentAsset.done) {
                  console.log('current asset state is bad ' + asset)
                  deferred.reject(new Error('Not Enough aseet of ' + asset ))
                  return
                }
                
                var uniAssets = _.uniq(currentAsset.addresses, function(item) { return item.address } )
                console.log(uniAssets)
                uniAssets.forEach(function(address) {
                  console.log('adding output ' + (tx.outs ? tx.outs.length : 0) + " for address: " + address.address + " with value " + config.mindustvalue)
                  console.log('mapping to input ' + currentAsset.input + ' with amount ' + address.amount)
                  encoder.addPayment(currentAsset.input, address.amount, (tx.outs ? tx.outs.length : 0))
                  console.log('putting input in transaction')
                  tx.addOutput(address.address, config.mindustvalue);
                  console.log(tx)
                  console.log('adding output ' + (tx.outs.length -1))
                })
                console.log('done adding colored outputs')
             }
            console.log("before using encoder")
            try{
              var buffer = encoder.encode();
            }
            catch(e) {
              console.log(e)
            }
            console.log("encoding done")
            var ret = bitcoinjs.Script.fromChunks(
                                    [
                                      bitcoinjs.opcodes.OP_RETURN,
                                      buffer.codeBuffer
                                    ]);

            tx.addOutput(ret, 0);
            var allOutputValues =  _.sum(tx.outs, function(output) { return output.value; });
            console.log('all inputs: ' + totalInputs.amount + ' all outputs: ' + allOutputValues);
            var lastOutputValue = totalInputs.amount - (allOutputValues + metadata.fee)
            if(lastOutputValue)
              tx.addOutput(metadata.from, lastOutputValue);
            console.log('success')
            deferred.resolve(tx);
            return;
          })
        }
      }
      catch(e){
        console.log(e)
      }

        return deferred.promise
    }

    function findBestMatchByNeededAssets(utxos, assetList, key, tx, inputvalues, metadata) {
      var foundAmount = 0
      var sortedutxo = utxos;
      for( asset in assetList) {
        console.log('findBestMatchByNeededAssets checking asset: ' + asset +' key is ' + key )
        sortedutxo =_.sortBy(sortedutxo, function(utxo) {
          console.log(utxo.assets)
            utxo.score = 0;
            utxo.assets.forEach(function(a){
                console.log('about to asset ' + asset +' to asset ' +a.assetId )
                if(((a.assetId == asset) && !assetList[asset].done)) { console.log('score += 1'); utxo.score += 1; }
                if(((a.assetId == asset) && !assetList[asset].done && a.amount >= assetList[key].amount)) { console.log('score' + utxo.score); utxo.score += 100000; }
                if(a.assetId == key) {console.log('amount += ' + a.amount); foundAmount += a.amount;} 
            })
            console.log('score is ' + utxo.score)
            return utxo.score;
        })
      }
      console.log('sorted utxos by score and assets')
      // do we have enough for the transfer
      if(foundAmount < assetList[key].amount) {
         console.log('not enough amount')
        return false;
      }
      
      console.log('adding inputs by assets and amounts')    
      sortedutxo.some(function(utxo) {
        console.log('interating over ' + utxo )
          utxo.assets.forEach(function(asset) {
            try{
              console.log('maybe adding input for ' + asset.assetId )
              if(assetList[asset.assetId] && !assetList[asset.assetId].done) {
                 console.log('probably adding input for ' + asset.assetId )
                 console.log(assetList[asset.assetId].amount + ' ' + asset.amount)
                if(assetList[asset.assetId].amount <= asset.amount) {
                    console.log('setting change')
                    assetList[asset.assetId].change = asset.amount - assetList[asset.assetId].amount
                     console.log('setting done')
                    assetList[asset.assetId].done = true
                    console.log('adding input')
                    tx.addInput(utxo.txid, utxo.index);
                    console.log('setting input value ' + utxo.value)
                    inputvalues.amount += utxo.value
                     console.log('setting input in asset list')
                    assetList[asset.assetId].input = tx.ins.length -1;
                    if(metadata.flags.injectPreviousOutput) {
                      tx.ins[tx.ins.length -1].script = 
                      bitcoinjs.Script.fromHex (utxo.scriptPubKey.hex)
                    }
                }
                else {
                  assetList[asset.assetId].amount -= asset.amount;
                } 
              }
              else
                console.log('not adding input for ' + asset.assetId )
            }
            catch(e) { console.log(e) }
            })

          console.log('returning ' + assetList[key].done )
          return assetList[key].done;
      })
      console.log('done with findBestMatchByNeededAssets')
      return true;
      /*sortedutxo.forEach(function(utxo){

      })*/
    }

    function addInputsForIssueTransaction(tx, metadata) {
        var deferred = Q.defer()
        var metaObj = JSON.parse(metadata)
        var assetId = ''
        
        console.log("======================")
        console.log(metaObj)
        //simple mode
        if(metaObj.financeOutput) {
          /*if(metaObj.financeOutput.scriptPubKey && 
                  metaObj.financeOutput.scriptPubKey.asm && 
                  metaObj.financeOutput.scriptPubKey.asm.indexOf("OP_RETURN") != -1)
          {
              deferred.reject(new Error(''))
          }*/

          current = new bn(metaObj.financeOutput.value)
          cost = new bn(getIssuenceCost(metaObj))
          
          console.log("adding utxo from api")
          tx.addInput(metaObj.financeOutputTxid, metaObj.financeOutput.n)
          if(metaObj.flags.injectPreviousOutput) {
               tx.ins[tx.ins.length -1].script = 
                  bitcoinjs.Script.fromHex (metaObj.financeOutput.scriptPubKey.hex)
          }

          opts = {
              'cc_metadata': [{
                'type': 'issuance',
                'lockStatus': !metaObj.reissueable
              }],
              'vin': [{
                'txid': metaObj.financeOutputTxid,
                'vout': metaObj.financeOutput.n
                //'scriptSig': {
                //  'asm': '3045022100daf8f8d65ea908a28d90f700dc932ecb3b68f402b04ba92f987e8abd7080fcad02205ce81b698b8013b86813c9edafc9e79997610626c9dd1bfb49f60abee9daa43801 029b622e5f0f87f2be9f23c4d82f818a73e258a11c26f01f73c8b595042507a574',
                //}
                //'address': metaObj.financeOutput.scriptPubKey.addresses[0]
              }]
            };

            if(opts.cc_metadata[0].lockStatus)
                scriptSig.asm = metaObj.financeOutput.scriptPubKey.asm;
            else {
                console.log("++++++sending pedo address : " + metaObj.financeOutput.scriptPubKey.addresses[0])
                opts.vin[0].address = metaObj.financeOutput.scriptPubKey.addresses[0]
              }

          console.log('encoding asset: ')
          console.log(opts)
          assetId = assetIdencoder(opts)
          console.log('assetId: ' + assetId)
          deferred.resolve({tx: tx, metadata: metadata, change: (toSatoshi(current) - cost), assetId: assetId})
          return deferred.promise; 
        }


        // tempararly work with bitcoind though 
        // check there is no op_return in tx for the utxo we are about to use
        // TODO: need to check if we can decode it and its ours
        getUnspentsByAddress(metaObj.issueAddress)
        .then(function (data) {
            var utxos = JSON.parse(data).utxos
            console.log('got unspents for ' + metaObj.issueAddress + " from block explorer")
            //add to transaction enough inputs so we can cover the cost
            //send change if any back to us
            var current = new bn(0);
            cost = new bn(getIssuenceCost(metaObj));
            change = new bn(0)
            var hasEnoughEquity = utxos.some(function (utxo) {
              if(utxo.assets.length == 0) {
                  console.log('current amount ' + utxo.value + " needed " + cost)
                  tx.addInput(utxo.txid, utxo.index)
                  current = current.add(utxo.value)
                  if(metaObj.flags.injectPreviousOutput) {
                    tx.ins[tx.ins.length -1].script = bitcoinjs.Script.fromHex(utxo.scriptPubKey.hex)
                  }  

              }
              console.log(current + " " + cost + " " + (current >= cost))
              return current.comparedTo(cost) >= 0;
            })
            console.log("hasEnoughEquity: " + hasEnoughEquity)
            if(!hasEnoughEquity){
               return {success: false} 
            }
 
           /* for(transaction in transactions) {
               if(toSatoshi(current).comparedTo(cost) >= 0) {
                  if(toSatoshi(current).comparedTo(cost) > 0) 
                    {
                     // tx.addOutput(metaObj.issueAddress, toSatoshi(current) - cost);
                     change = toSatoshi(current) - cost;
                    }
                  break;
                }

                tx.addInput(transactions[transaction].txid, transactions[transaction].vout);
                if(metaObj.flags.injectPreviousOutput) {
                    tx.ins[tx.ins.length -1].script = 
                    bitcoinjs.Script.fromHex (transactions[transaction].transaction.vout[transactions[transaction].vout].scriptPubKey.hex)
                }
                current = current.plus( transactions[transaction].amount );
            }*/
            change = current - cost
            console.log('finished adding inputs to tx')
            return { success: (toSatoshi(current).comparedTo(cost) > 0), change: change};
        }).
        then(function(state) {
          console.log('return the tx to encode')
          if(state.success) deferred.resolve({tx: tx, metadata: metadata, change: state.change, assetId: assetId});
          else  deferred.reject(new Error("Not enough funds to cover issuence"));
        }).
        catch(function(error) {
            console.log(error) 
        });


        return deferred.promise;
    }

    //TODO: check if we can find the sum in mul
    function insertSatoshiToTransaction(utxos, tx, missing, inputsValue, metadata) 
    {
      console.log("missing: " +  missing);
      var paymentDone = false;
      var missingbn = new bn(missing)
      var currentAmount = new bn(0)
      if(metadata.financeOutput && metadata.financeOutputTxid) {
        console.log('finance sent through api with value ' + toSatoshi(new bn(metadata.financeOutput.value)).toNumber() )
        console.log(toSatoshi(new bn(metadata.financeOutput.value)))
        console.log(missingbn)
        if(toSatoshi(new bn(metadata.financeOutput.value)).minus(missingbn) >= 0)
        {
          //TODO: check there is no asset here
           console.log('funding tx ' + metadata.financeOutputTxid)
           tx.addInput( metadata.financeOutputTxid, metadata.financeOutput.n)
           inputsValue.amount += toSatoshi(new bn(metadata.financeOutput.value)).toNumber() 
           paymentDone = true;
           return paymentDone;

        }
      }

       var hasEnoughEquity = utxos.some(function (utxo) {
              if(utxo.assets.length == 0) {
                  console.log('current amount ' + utxo.value + " needed " + missing)
                  tx.addInput(utxo.txid, utxo.index)
                  currentAmount = currentAmount.add(utxo.value)
                  if(metaObj.flags.injectPreviousOutput) {
                    tx.ins[tx.ins.length -1].script = bitcoinjs.Script.fromHex(utxo.scriptPubKey.hex)
                  }  

              }
              return currentAmount.comparedTo(missingbn) >= 0 
            })

      return hasEnoughEquity;
    }

    function getIssuenceCost(metaobj) {
       return getTotalIssuenceCost(metaobj, true); 
    }

    function getTotalOuputValue(metaobj) {
      return getTotalIssuenceCost(metaobj, false);
    }

    function getTotalIssuenceCost(metaobj, withfee)
    {
        fee = withfee ? config.minfee : 0;
      // simple case where there aren't any mints or bill sizes
       // if(!bills && !mints) {
        if(metaobj.transfer && metaobj.transfer.length)
        {
          metaobj.transfer.forEach(function(to) {
            fee += config.mindustvalue
          })
        }
        if(!metaobj.rules && !metaobj.metadata)
          return fee
        else
          return fee + config.writemultisig ? config.mindustvalue  : 0;
       // }
    }

    function getNextOutputValue(metadata) {
     // if(!bills && !mints)
        return new bn(getTotalOuputValue(metadata));
     // else
      //  throw new Error("Cant find next output value");
    }

    function addOutputs(tx, metadata) {
      var deferred = Q.defer();
      var total_out = new bn(getTotalOuputValue(metadata));
      while(total_out.toNumber()) {
            nextOutputValue = getNextOutputValue(metadata);

            total_out = total_out.minus(nextOutputValue);
      }


      return deferred.promise;
    }

    function addOutput() {

    }

    function sha256(buffer) {
        return crypto.createHash('sha256').update(buffer).digest()
    }

    function sha1(buffer) {
        return crypto.createHash('sha1').update(buffer).digest()
    }

    function toSatoshi(btc) {
      return btc.mul(100000000);
    }

    coluutils();

    return coluutils;
})();