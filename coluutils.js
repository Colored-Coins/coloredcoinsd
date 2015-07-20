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
         client.registerMethod("getaddressutxos", config.blockexplorer.url + "/api/getaddressutxos?address=${address}", "GET")
         client.registerMethod("getassetholders", config.blockexplorer.url + "/api/getassetholders?assetId=${assetid}&confirmations=${minconf}", "GET")
         client.registerMethod("getassetinfo", config.blockexplorer.url + "/api/getassetinfo?assetId=${assetid}&utxo=${utxo}", "GET")
         client.registerMethod("gettransaction", config.blockexplorer.url + "/api/gettransaction?txid=${txid}", "GET")
         client.registerMethod("getutxo", config.blockexplorer.url + "/api/getutxo?txid=${txid}&index=${index}", "GET")
         client.registerMethod("preparsetx", config.blockexplorer.url + "/api/parsetx?txid=${txid}", "POST")
         client.registerMethod("upload", config.torrentServer.url + "/addMetadata?token=${token}", "POST")
         client.registerMethod("seed", config.torrentServer.url + "/shareMetadata?token=${token}&torrentHash=${torrentHash}", "GET")
         client.registerMethod("download", config.torrentServer.url + "/getMetadata?token=${token}&torrentHash=${torrentHash}", "GET")
        //coluutils.getBlockCount().then(function() { console.log('count:', arguments[0][1]); } );
        //coluutils.sendRawTransaction("0100000001c37465105275a6de0163220da4db306cb5815e1f5b76f5868c7d2b7c5b13aa0d0f0000008b483045022100e570db30b46c3758d65cf01c91a1ad6ec068fd2fcec75f22242434fbe2eb13990220268ab329874cba6f962e5ec281ffeb3f86392af36eb7b8bdf2693e608eb59633014104ecf1a1c51032dd523f1a23ca734d3740314b3d7d3db6011b50d50aec4c6e5a1043909082e54fe48b74d84b256b25552f82e9e2316da29485b1c9df003febac3dffffffff0240060000000000001976a91472c383889fc9d4c4658feabe478ae08698120cd888ac00000000000000001976a91496ab0dbf3d61fb63d07da6981cfa5d5341c5587088ac00000000").then(function() { console.log(arguments) } );

    }

    coluutils.sendRawTransaction = function sendRawTransaction(txHex) {     
        return callservice('sendrawtransaction',txHex);       
    }

    coluutils.getBlockCount = function getBlockCount() {     
        return callservice('getblockcount');       
    }
    coluutils.broadcastTx = function broadcastTx(txHex) {
      return callservice('sendrawtransaction', txHex); 
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
              deferred.reject(new Error("Bitcoind: Status code was " + err));
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


        var s3bucket = new metadatOfUtxo({params: {Bucket: 'coloredcoin-assets'}});
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


    coluutils.createIssueTransaction = function createIssueTransaction(metadata) {
        var deferred = Q.defer();
        metadata.divisibility = metadata.divisibility || 0

        tx = new bitcoinjs.Transaction();
        // find inputs to cover the issuence
        addInputsForIssueTransaction(tx, metadata).
        then(function(args){
            var txResponse = encodeColorScheme(args);
            deferred.resolve({txHex: txResponse.tx.toHex(), assetId: args.assetId || "0", metadata: metadata});
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
        then(function(data){
            console.log(data.tx)
            deferred.resolve(data);
        }).
        catch(function(err) {
          console.log(err)
          deferred.reject(err);
        });
          

        return deferred.promise;
    }

    




    function encodeColorScheme(args) {
      var addMultisig = false;
      var metadata = args.metadata
      var encoder = cc.newTransaction(0x4343, 0x01)
      var reedemScripts = []
      encoder.setLockStatus(!metadata.reissueable)
      console.log("amount and div " + metadata.amount+" "+ metadata.divisibility)
      encoder.setAmount(metadata.amount, metadata.divisibility);
      if(metadata.metadata || metadata.rules) {
         if(config.writemultisig) {
            if(!metadata.sha1 || !metadata.sha2) {
               console.log("something went wrong with torrent sever")
               throw new Error('missing sha1 or sha2 cannot issue, check torrent server')
            }
            encoder.setHash(metadata.sha1, metadata.sha2)
         }
      }

      //console.log(metadata.transfer)
      if(metadata.transfer) {
        metadata.transfer.forEach(function(transferobj, i){
          console.log("payment " + transferobj.amount + " " + args.tx.outs.length )
          encoder.addPayment(0, transferobj.amount, args.tx.outs.length)
          // check multisig
          if(transferobj.pubKeys && transferobj.m) {
             var multisig = generateMultisigAddress(transferobj.pubKeys, transferobj.m)
             reedemScripts.push({index: tx.outs.length , reedemScript: multisig.reedemScript, address: multisig.address})
          }
          else
            args.tx.addOutput(transferobj.address, config.mindustvalue)
        })
      }

      //add op_return
      console.log("before encode done")
      var buffer = encoder.encode()

      console.log("encoding done, buffer: ")
      if(buffer.leftover && buffer.leftover.length > 0)
      {
        encoder.shiftOutputs()
        buffer = encoder.encode()
        addMultisig = true;
      }
      var ret = bitcoinjs.Script.fromChunks(
                              [
                                bitcoinjs.opcodes.OP_RETURN,
                                buffer.codeBuffer
                              ]);

      args.tx.addOutput(ret, 0);


      // need to encode hashes in first tx
      if(addMultisig) {
        if(buffer.leftover && buffer.leftover.length == 1)
              addHashesOutput(args.tx, metadata.pubKeyReturnMultisigDust, buffer.leftover[0])
        else if(buffer.leftover && buffer.leftover.length == 2)
              addHashesOutput(args.tx, metadata.pubKeyReturnMultisigDust, buffer.leftover[1], buffer.leftover[0])
        else
          throw new Error('have hashes and enough room we offested inputs for nothing')

      }

      console.log(args)
      // add change
      var allOutputValues =  _.sum(args.tx.outs, function(output) { return output.value; });
      console.log('all inputs: ' + args.totalInputs.amount + ' all outputs: ' + allOutputValues);
      var lastOutputValue = args.totalInputs.amount - (allOutputValues + metadata.fee)
      console.log('adding change output with: ' + lastOutputValue)
      console.log('total inputs: ' + args.totalInputs.amount)
      console.log('total fee: ' + metadata.fee)
      console.log('total output without fee: ' + allOutputValues)
      args.tx.addOutput(metadata.issueAddress , lastOutputValue ? lastOutputValue : args.change);


      return { tx: args.tx, multisigOutputs: reedemScripts}

    }


    coluutils.getAssetMetadata = function getAssetMetadata(assetId, utxo) {
      var self = this
       var deferred = Q.defer()

        getAssetInfo(assetId, utxo).
        then(function(data){
          if(!data.issuanceTxid) {
            if(utxo) {
                console.log('rejecting request since issuanceTxid is missing for specific utxo')
                deferred.reject(new Error('missing issuanceTxid for utxo: ' + utxo))
            }
            else {
                deferred.resolve(data)
            }
          }
          else
          {
            var txid = utxo.split(':')[0]
            var promises = []
            promises.push(getTransastion(data.issuanceTxid))
            if(data.issuanceTxid !== txid) promises.push(getTransastion(txid))

            console.log('requesting issue tx: ' + data.issuanceTxid)
            console.log('requesting utxo tx: ' + txid)
            Q.all(promises).done(function(values){

                  var hashes = []
                  var getHashes = []
                  var multisignum = 0
                  values.forEach(function(txbufer, i) {
                    var tx = JSON.parse(txbufer)
                    console.log('tx')
                    console.log(tx)
                    console.log(tx.vout[0].scriptPubKey.hex)

                     var script = {}
                     if(tx.ccdata[0].multiSig && tx.ccdata[0].multiSig.length > 0) {
                          script = bitcoinjs.Script.fromHex(tx.vout[0].scriptPubKey.hex)
                          multisignum =  script.chunks.length - 3;
                          console.log('multisignum: ' + multisignum);
                     }
                     else if(!tx.ccdata[0].torrentHash) {
                        console.log('no metadata anywhere for ' + (i ? 'utxo' : 'issue'))
                        return;
                     }

                     var sha1 = tx.ccdata[0].torrentHash || script.chunks[3]
                     var sha2 = tx.ccdata[0].sha2 || script.chunks[2]
                     hashes.push({sha1: sha1, sha2: sha2})
                     console.log('requesting torrent by hash: ' + sha1)
                     getHashes.push(self.downloadMetadata(sha1))
                  })
                  if(getHashes.length == 0) {
                      deferred.resolve(data)
                  }
                  else {
                    Q.all(getHashes).done(function(metas){
                        var first = JSON.parse(metas[0])
                        var second = metas.length > 1 ? JSON.parse(metas[1]) : first
                        data.metadataOfIssuence = first
                        data.sha2Issue = hashes[0].sha2.toString('hex')
                        if(metas.length > 1){
                          data.metadataOfUtxo = second
                          data.sha2Utxo = hashes[1].sha2.toString('hex')
                        }
                        deferred.resolve(data)
                     }, function(err){
                        deferred.reject(new Error(err))
                     })

                  }
            })
          }
        }).
        catch(function(error) {
            console.log(error) 
            deferred.reject(new Error(error))
        });


        return deferred.promise
    }



    coluutils.seedMetadata = function seedMetadata(hash) {
        var deferred = Q.defer()
        var token = config.torrentServer.token

        if(!hash) {
          console.log('no metadata to seed')
          return deferred.resolve()
        }
        
        var args = {
                    path: { "token": token,
                            "torrentHash": hash },                      
                    headers:{"Content-Type": "application/json"} 

                }


         client.methods.seed(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("seed:(200) " + data);
                //var torretdata = JSON.parse(data)
                deferred.resolve(data);
            }
            else if(data) {
                console.log("seed: rejecting with: " + response.statusCode + " " + data);
                deferred.reject(new Error(response.statusCode + " " + data));
            }
            else {
                console.log("seed: rejecting with: " + response.statusCode);
                deferred.reject(new Error("Status code was " + response.statusCode));
            }
        }).on('error', function (err) {
                console.log('seed: something went wrong on the request', err.request.options);
                deferred.reject(new Error("Status code was " + err.request.options));
            });

        return deferred.promise;
    }



    coluutils.downloadMetadata = function downloadMetadata(hash) {
        var deferred = Q.defer()
        var token = config.torrentServer.token
        
        if(!hash) {
          console.log('no metadata to seed')
          return deferred.resolve()
        }
        
        var args = {
                    path: { "token": token,
                            "torrentHash": hash },                      
                    headers:{"Content-Type": "application/json"} 

                }


         client.methods.download(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("download:(200) " + data);
                var torretdata = JSON.parse(data)
                deferred.resolve(data);
            }
            else if(data) {
                console.log("download: rejecting with: " + response.statusCode + " " + data);
                deferred.reject(new Error('no response form torrent server'));
            }
            else {
                console.log("download: rejecting with: " + response.statusCode);
                deferred.reject(new Error("Status code was " + response.statusCode));
            }
        }).on('error', function (err) {
                console.log('download: something went wrong on the request', err.request.options);
                deferred.reject(new Error("Status code was " + err.request.options));
            });

        return deferred.promise;
    }  

    coluutils.uploadMetadata =  function uploadMetadata(metadata) 
    {
      console.log('uploadMetadata')
      var deferred = Q.defer()
      var token = config.torrentServer.token

      console.log(metadata.metadata)
      if(!metadata.metadata && !metadata.rules) {
        console.log('uploadMetadata: no metadata and no rules')
        deferred.resolve(metadata)
        return deferred.promise
      }
        var metafile = {}
        if(metadata.metadata)
          metafile.data = metadata.metadata
        if(metadata.rules)
          metafile.rules = metadata.rules
            
        var args = {
                    path: { "token": token },
                    data : {
                      "metadata": metafile
                    },
                    headers:{"Content-Type": "application/json"} 

                }
        client.methods.upload(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("upload:(200) " + data);
                var torretdata = JSON.parse(data)
                metadata.sha1 = torretdata.torrentHash
                metadata.sha2 = torretdata.sha2
                deferred.resolve(metadata);
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

    function getUnspentArrayByAddressOrUtxo(address, utxo) {
      if(utxo) {
        console.log('using specific utxo: ' + utxo)
          return getUtxo(utxo.split(':')[0], utxo.split(':')[1] )
      }
      else {
        console.log('using utxo for address: ' + address)
        return getUnspentsByAddress(address)
      }
    }


     function getUtxo(txid, index) {

      var deferred = Q.defer();
        var args = {
                    path: { "txid": txid, "index": index},
                    headers:{"Content-Type": "application/json"} 
                }
         try{

      
        client.methods.gettransaction(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("getUtxo:(200)");
                deferred.resolve([data]);
            }
            else if(data) {
                console.log("getUtxo: rejecting with: " + response.statusCode + " " + data);
                deferred.reject(new Error(response.statusCode + " " + data));
            }
            else {
                console.log("getUtxo: rejecting with: " + response.statusCode);
                deferred.reject(new Error("Status code was " + response.statusCode));
            }
        }).on('error', function (err) {
                console.log('something went wrong on the request', err.request.options);
                deferred.reject(new Error("Status code was " + err.request.options));
            });
      }
      catch(e) { console.log(e) }

        return deferred.promise;
      
    }

    function getTransastion(txid) {

      var deferred = Q.defer();
        var args = {
                    path: { "txid": txid },
                    headers:{"Content-Type": "application/json"} 
                }
         try{

      
        client.methods.gettransaction(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("getTransastion:(200)");
                deferred.resolve([data]);
            }
            else if(data) {
                console.log("getTransastion: rejecting with: " + response.statusCode + " " + data);
                deferred.reject(new Error(response.statusCode + " " + data));
            }
            else {
                console.log("getTransastion: rejecting with: " + response.statusCode);
                deferred.reject(new Error("Status code was " + response.statusCode));
            }
        }).on('error', function (err) {
                console.log('something went wrong on the request', err.request.options);
                deferred.reject(new Error("Status code was " + err.request.options));
            });
      }
      catch(e) { console.log(e) }

        return deferred.promise;
      
    }


coluutils.requestParseTx = function requestParseTx(txid)
    {
        var deferred = Q.defer();
        var args = {
                    data: { "txid": txid },
                    headers:{"Content-Type": "application/json"} 
                }
                          try{

      
        client.methods.preparsetx(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("requestParseTx:(200) ");
                deferred.resolve(JSON.parse(data));
            }
            else if(data) {
                console.log("requestParseTx: rejecting with: " + response.statusCode + " " + data);
                deferred.reject(new Error(response.statusCode + " " + data));
            }
            else {
                console.log("requestParseTx: rejecting with: " + response.statusCode);
                deferred.reject(new Error("Status code was " + response.statusCode));
            }
        }).on('error', function (err) {
                console.log('something went wrong on the request', err.request.options);
                deferred.reject(new Error("Status code was " + err.request.options));
            });
      }
      catch(e) { console.log(e) }

        return deferred.promise;
    }



    function getAssetInfo(assetIs, utxo)
    {
        var deferred = Q.defer();
        var args = {
                    path: { "assetId": assetIs, "utxo": utxo },
                    headers:{"Content-Type": "application/json"} 
                }
                          try{

      
        client.methods.getassetinfo(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("getAssetInfo:(200) ");
                deferred.resolve(JSON.parse(data));
            }
            else if(data) {
                console.log("getassetinfo: rejecting with: " + response.statusCode + " " + data);
                deferred.reject(new Error(response.statusCode + " " + data));
            }
            else {
                console.log("getassetinfo: rejecting with: " + response.statusCode);
                deferred.reject(new Error("Status code was " + response.statusCode));
            }
        }).on('error', function (err) {
                console.log('something went wrong on the request', err.request.options);
                deferred.reject(new Error("Status code was " + err.request.options));
            });
      }
      catch(e) { console.log(e) }

        return deferred.promise;
    }

    function getUnspentsByAddress(address)
    {
        var deferred = Q.defer();
        var args = {
                    path: { "address": address },
                    headers:{"Content-Type": "application/json"} 
                }
                          try{

      
        client.methods.getaddressutxos(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("getUnspentsByAddress:(200) ");
                deferred.resolve(data);
            }
            else if(data) {
                console.log("getUnspentsByAddress: rejecting with: " + response.statusCode + " " + data);
                deferred.reject(new Error(response.statusCode + " " + data));
            }
            else {
                console.log("getUnspentsByAddress: rejecting with: " + response.statusCode);
                deferred.reject(new Error("Status code was " + response.statusCode));
            }
        }).on('error', function (err) {
                console.log('something went wrong on the request', err.request.options);
                deferred.reject(new Error("Status code was " + err.request.options));
            });
      }
      catch(e) { console.log(e) }

        return deferred.promise;
    }

    //TODO: break this into a generic fee mechanisem where fee and and total inputs amount are diffrent
    // inputs amount can be taked from the sent asset as well, fee variable is missleading
    function comupteCost(withfee, metadata ){
       fee = withfee ? config.minfee : 0;

        if(metadata.to && metadata.to.length)
        {
          metadata.to.forEach(function(to) {
            fee += config.mindustvalue
          })
        }
        if(metadata.rules || metadata.metadata)
          fee += config.writemultisig ? config.mindustvaluemultisig  : 0;

       console.log("comupteCost: " + fee)
       return fee
    }

    function addInputsForSendTransaction(tx, metadata) {
        var deferred = Q.defer()
        var satoshiCost = comupteCost(true, metadata)
        var totalInputs = { amount: 0 }
        var reedemScripts = []

        console.log('addInputsForSendTransaction')
        
        try{
        if(metadata.from || metadata.sendutxo) {
          getUnspentArrayByAddressOrUtxo(metadata.from, metadata.sendutxo)
          .then(function(data){
             // might get utxo through api or array through address
            var utxos = JSON.parse(data).utxos || [JSON.parse(data)] 
            if(metadata.from)  
                console.log('got unspents for address: ' + metadata.from  + " from block explorer")
            else {
              console.log('got unspent: ' + metadata.sendutxo  + " from block explorer")
              if (utxos[0] && utxos[0].scriptPubKey && utxos[0].scriptPubKey.addresses && utxos[0].scriptPubKey.addresses[0])
                metadata.from = utxos[0].scriptPubKey.addresses[0]
            }
             var assetList = []
             metadata.to.forEach(function(to) {
                console.log(to.assetId)
                if(!assetList[to.assetId]) 
                  assetList[to.assetId] = { amount: 0, addresses: [], input: 0, done: false, change: 0, encodeAmount: 0 }
                assetList[to.assetId].amount += to.amount
                assetList[to.assetId].encodeAmount = assetList[to.assetId].amount;
                // generate a multisig adress, remeber to return the reedem scripts
                if(!to.address && to.pubKeys && to.m) {
                    var multisig = generateMultisigAddress(to.pubKeys, to.m)
                    assetList[to.assetId].addresses.push({ address: multisig.address, amount: to.amount, reedemScript: multisig.reedemScript})
                }
                else
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
            if(!tryAddingInputsForFee(tx, utxos,  totalInputs, metadata, satoshiCost)) {
               deferred.reject(new Error('not enough satoshi in account for fees' ))
            }

             /* var curentValueInSatoshi = _.sum(tx.ins, function(input) { return input.amount; });
              console.log('current transaction value: ' + curentValueInSatoshi + ' projected cost: ' + satoshiCost)
              console.log(tx.ins)
              if(satoshiCost > curentValueInSatoshi) {
                  if(!insertSatoshiToTransaction(utxos, tx, (satoshiCost - curentValueInSatoshi), totalInputs, metadata)) {
                     console.log('not enough satoshi in account for fees')
                    deferred.reject(new Error('not enough satoshi in account for fees' ))
                    return;
                  }
              }*/

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
                  if(address.reedemScript) {
                     reedemScripts.push({index: tx.outs.length -1, reedemScript: address.reedemScript, address: address.address})
                  }
                  
                  console.log(tx)
                  console.log('adding output ' + (tx.outs.length -1))
                })
                console.log('done adding colored outputs')
             }
            console.log("before using encoder")
            try{
                //add metadata if we have any
                if(metadata.metadata || metadata.rules) {
                   if(config.writemultisig) {
                      if(!metadata.sha1 || !metadata.sha2) {
                         console.log("something went wrong with torrent sever")
                         throw new Error('missing sha1 or sha2 cannot issue, check torrent server')
                      }
                      encoder.setHash(metadata.sha1, metadata.sha2)
                   }
                }
              var buffer = encoder.encode();
              if(buffer.leftover && buffer.leftover.length > 0)
              {
                  encoder.shiftOutputs()
                  buffer = encoder.encode()
                  if(buffer.leftover.length == 1)
                        addHashesOutput(tx, metadata.pubKeyReturnMultisigDust, buffer.leftover[0])
                  else if(buffer.leftover.length == 2)
                        addHashesOutput(tx, metadata.pubKeyReturnMultisigDust, buffer.leftover[1], buffer.leftover[0])
                  else
                    throw new Error('have hashes and enough room we offested inputs for nothing')
              }
                 
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
            var lastOutputValue = getChangeAmount(tx, metadata.fee, totalInputs)
            if(lastOutputValue < 0) {
              console.log('trying to add additionl inputs to cover transaction')
              satoshiCost = getInputAmountNeededForTx(tx, metadata.fee)
              if(!tryAddingInputsForFee(tx, utxos,  totalInputs, metadata, satoshiCost)) {
                deferred.reject(new Error('not enough satoshi in account for fees' ))
                return
              }
              lastOutputValue = getChangeAmount(tx, metadata.fee, totalInputs)         
            }
            // TODO: make sure we have a from here, even though we try to use first address found in the utxo we want to send
            // in case we didnt just use an address, there still might not be an address perhaps we should generate a keypair
            // here and return them as well
            tx.addOutput(metadata.from, lastOutputValue);
            console.log('success')
            deferred.resolve({tx: tx, metadata: metadata, multisigOutputs: reedemScripts });
            return
          }) // then
        } // if
        else {
           deferred.reject(new Error('no from address or sendutxo in input, cant create transacion'))
        }
      } //try
      catch(e){
        console.log(e)
      }

        return deferred.promise
    }

    function getChangeAmount(tx, fee, totalInputValue) {
      var allOutputValues =  _.sum(tx.outs, function(output) { return output.value; });
      console.log('getChangeAmount: all inputs: ' + totalInputValue.amount + ' all outputs: ' + allOutputValues)
      return  (totalInputValue.amount - (allOutputValues + fee))
    }


    function tryAddingInputsForFee(tx, utxos,  totalInputs, metadata, satoshiCost) {
        console.log('current transaction value: ' + totalInputs.amount + ' projected cost: ' + satoshiCost)
        console.log(tx.ins)
        if(satoshiCost > totalInputs.amount) {
            if(!insertSatoshiToTransaction(utxos, tx, (satoshiCost - totalInputs.amount), totalInputs, metadata)) {
               console.log('not enough satoshi in account for fees')
              return false
            }
        }
        return true
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
                console.log('about to check asset ' + asset +' to asset ' +a.assetId + ' with amount: ' + a.amount)
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
        console.log('interating over ')
        console.log(utxo)
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
                    console.log('setting input value ' + utxo.value + ' actual: ' + Math.round(utxo.value))
                    inputvalues.amount += Math.round(utxo.value)
                     console.log('setting input in asset list')
                    assetList[asset.assetId].input = tx.ins.length -1;
                    if(metadata.flags && metadata.flags.injectPreviousOutput) {
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
        var totalInputs = { amount: 0 }
        //var metadata = JSON.parse(metadata)
        var assetId = ''
        
        console.log("======================")
        console.log(metadata)
        //simple mode
        if(metadata.financeOutput) {

          current = new bn(metadata.financeOutput.value)
          cost = new bn(getIssuenceCost(metadata))
          
          console.log("adding utxo from api")
          tx.addInput(metadata.financeOutputTxid, metadata.financeOutput.n)
          if(metadata.flags && metadata.flags.injectPreviousOutput) {
               tx.ins[tx.ins.length -1].script = 
                  bitcoinjs.Script.fromHex (metadata.financeOutput.scriptPubKey.hex)
          }

          assetId = encodeAssetIdInfo(metadata.reissueable, 
                metadata.financeOutputTxid,
                metadata.financeOutput.n,
                metadata.financeOutput.scriptPubKey.asm,
                metadata.financeOutput.scriptPubKey.addresses[0],
                metadata.divisibility )
          
          deferred.resolve({tx: tx, metadata: metadata, change: current - cost, assetId: assetId, totalInputs: { amount: current }})
          return deferred.promise; 
        }


        // tempararly work with bitcoind though 
        // check there is no op_return in tx for the utxo we are about to use
        // TODO: need to check if we can decode it and its ours
        getUnspentsByAddress(metadata.issueAddress)
        .then(function (data) {
            var utxos = JSON.parse(data).utxos
            console.log('got ' + utxos.length + ' unspents for ' + metadata.issueAddress + " from block explorer")
            //add to transaction enough inputs so we can cover the cost
            //send change if any back to us            
            var current = new bn(0);
            cost = new bn(getIssuenceCost(metadata));
            change = new bn(0)
            var hasEnoughEquity = utxos.some(function (utxo) {
              utxo.value = Math.round(utxo.value)
              if(utxo.assets.length == 0) {
                  console.log('current amount ' + utxo.value + " needed " + cost)
                  tx.addInput(utxo.txid, utxo.index)
                  if(tx.ins.length == 1) { //encode asset 
                    console.log(tx.ins[0].script)
                     assetId = encodeAssetIdInfo(metadata.reissueable, 
                                    utxo.txid,
                                    utxo.index,
                                    utxo.scriptPubKey.asm,
                                    utxo.scriptPubKey.addresses[0],
                                    metadata.divisibility)
                  }
                  console.log('math: ' + current.toNumber() + " " + utxo.value)
                  current = current.add(utxo.value)
                  if(metadata.flags && metadata.flags.injectPreviousOutput) {
                    tx.ins[tx.ins.length -1].script = bitcoinjs.Script.fromHex(utxo.scriptPubKey.hex)
                  }  
                  console.log('current amount: ' + current + " projected cost: " + cost + " are were there yet: " + (current.comparedTo(cost) >= 0))
              }
              else
                console.log('skipping utxo for input, asset found in utxo: ' + utxo.txid +":" +utxo.index)
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
                     // tx.addOutput(metadata.issueAddress, toSatoshi(current) - cost);
                     change = toSatoshi(current) - cost;
                    }
                  break;
                }

                tx.addInput(transactions[transaction].txid, transactions[transaction].vout);
                if(metadata.flags.injectPreviousOutput) {
                    tx.ins[tx.ins.length -1].script = 
                    bitcoinjs.Script.fromHex (transactions[transaction].transaction.vout[transactions[transaction].vout].scriptPubKey.hex)
                }
                current = current.plus( transactions[transaction].amount );
            }*/
            change = current - cost
            console.log('finished adding inputs to tx')
            console.log('chnage ' + current)
            return { success: (current.comparedTo(cost) > 0), change: change, assetId: assetId, totalInputs: { amount: current }};
        }).
        then(function(state) {
          console.log('return the tx to encode')
          if(state.success) deferred.resolve({tx: tx, metadata: metadata, change: state.change, assetId: assetId, totalInputs: state.totalInputs});
          else  deferred.reject(new Error("Not enough funds to cover issuence"));
        }).
        catch(function(error) {
            console.log(error) 
        });


        return deferred.promise;
    }


    function encodeAssetIdInfo(reissueable, txid, nvout, asm, address, divisibility){
       var opts = {
              'cc_data': [{
                'type': 'issuance',
                'lockStatus': !reissueable,
                'divisibility': divisibility
              }],
              'vin': [{
                'txid': txid,
                'vout': nvout
              }]
            }



        if(!reissueable) {
           console.log("++++++sending pedo locked : " + txid)
        }
        else {
            console.log("++++++sending pedo address : " + address)
            opts.vin[0].address = address
          }

          console.log('encoding asset is locked: ' + !reissueable)
          console.log(opts)
          assetId = assetIdencoder(opts)
          console.log('assetId: ' + assetId)
          return assetId
    }

    //TODO: check if we can find the sum in mul
    function insertSatoshiToTransaction(utxos, tx, missing, inputsValue, metadata) 
    {
      console.log("missing: " +  missing);
      var paymentDone = false;
      var missingbn = new bn(missing)
      var financeValue = new bn(0)
      var currentAmount = new bn(0)
      if(metadata.financeOutput && metadata.financeOutputTxid) {
        financeValue = new bn(metadata.financeOutput.value)
        console.log('finance sent through api with value ' + financeValue.toNumber())
        if(financeValue.minus(missingbn) >= 0)
        {
          //TODO: check there is no asset here
           console.log('funding tx ' + metadata.financeOutputTxid)
           tx.addInput( metadata.financeOutputTxid, metadata.financeOutput.n)
           inputsValue.amount += financeValue.toNumber() 
           if( metadata.flags && metadata.flags.injectPreviousOutput) {
                tx.ins[tx.ins.length -1].script = bitcoinjs.Script.fromHex(metadata.financeOutput.scriptPubKey.hex)
           }  
           paymentDone = true;
           return paymentDone;

        }
      }
      else
        console.log('no financeOutput was given')


       var hasEnoughEquity = utxos.some(function (utxo) {
            utxo.value = Math.round(utxo.value)
              if(utxo.assets.length == 0) {
                  console.log('current amount ' + utxo.value + " needed " + missing)
                  tx.addInput(utxo.txid, utxo.index)
                  inputsValue.amount += utxo.value
                  currentAmount = currentAmount.add(utxo.value)
                  if(metadata.flags && metadata.flags.injectPreviousOutput) {
                    tx.ins[tx.ins.length -1].script = bitcoinjs.Script.fromHex(utxo.scriptPubKey.hex)
                  }  

              }
              return currentAmount.comparedTo(missingbn) >= 0 

            })

       console.log("hasEnoughEquity: " + hasEnoughEquity)

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
        if(metaobj.rules || metaobj.metadata)
           fee += config.writemultisig ? config.mindustvaluemultisig  : 0;

         console.log('projected fee is: ' + fee)
         return fee

       // }
    }


    coluutils.getAssetIssueMetadata = function getAssetIssueMetadata()
    {
      var deferred = Q.defer()
       deferred.resolve({ placeholder: 'ok'})
      return deferred.promise
    }

    coluutils.getAssetStakeholders = function getAssetStakeholders(assetid, minconfnum) {
        console.log('getAssetStakeholders: ' + assetid)
        minconfnum = minconfnum || 0
        var deferred = Q.defer();
        var args = {
                    path: { "assetid": assetid, "minconf": minconfnum },
                    headers:{"Content-Type": "application/json"} 
                }
       try{
        client.methods.getassetholders(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("getAssetStakeholders:(200) " + data);
                deferred.resolve(JSON.parse(data));
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
      }
      catch(e) { console.log(e) }

        return deferred.promise;
    }


    coluutils.getAddressInfo = function getAddressInfo(address) {
        return getUnspentsByAddress(address)
    }

    function getNextOutputValue(metadata) {
        return new bn(getTotalOuputValue(metadata));
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

    function addHashesOutput(tx, address, sha2, sha1) {
      var chunks = []
      chunks.push(bitcoinjs.opcodes.OP_1)
      chunks.push(address ? new Buffer(address, 'hex') : new Buffer('03ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex'))
      chunks.push(Buffer.concat([new Buffer('03', 'hex'), sha2], 33))
      if(sha1) {
        chunks.push(Buffer.concat([new Buffer('030000000000000000000000', 'hex'), sha1], 33))
        chunks.push(bitcoinjs.opcodes.OP_3)
      }
      else
        chunks.push(bitcoinjs.opcodes.OP_2)
      chunks.push(bitcoinjs.opcodes.OP_CHECKMULTISIG)

      console.log(chunks)   

      var script = bitcoinjs.Script.fromChunks(chunks)

      //try compute value to pass mindust
      //TODO: actually comput it with the fee from the api request, this assumes static fee per kb
      tx.outs.unshift({ script: script, value: getNoneMinDustByScript(script) })
    }

    function getNoneMinDustByScript(script, usefee)
    {
        fee = usefee || config.feePerKb
        // add 9 to aacount for bitcoind SER_DISK serilaztion before the multiplication
        return (((config.feePerKb * (script.toBuffer().length + 148 + 9 )) / 1000) * 3) 
    }

    function getInputAmountNeededForTx(tx, fee)
    {
        var total = fee || config.feePerKb
        tx.outs.forEach(function(output){
            total += getNoneMinDustByScript(output.script, fee)
        })
        return total
    }


    function generateMultisigAddress(pubKeys, m) {
      var ecpubkeys
      pubKeys.forEach(function(key){
        ecpubkeys.push(bitcoinjs.ECPubKey.fromHex(key))
      })
      var script = bitcoinjs.scripts.multisigOutput(m, ecpubkeys)
      var hash = bitcoinjs.crypto.hash160(script.toBuffer())
      var multisigAdress = new bitcoinjs.Address( hash, config.testnet ? 0xc4 : 0x05)
      var sendto = multisigAdress.toBase58Check()
      return { address: sendto, reedemScript: script.toHex() }
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