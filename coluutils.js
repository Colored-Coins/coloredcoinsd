module.exports = (function () {
    var config = require("./config")
    var Client = require('node-rest-client').Client
    var Q = require("q");
    var rpc = require("bitcoin")
    var AWS = require("aws-sdk")
    var crypto = require('crypto')
    var bitcoinjs = require('bitcoinjs-lib')
    var bn = require('bignumber.js')
    var cc = require('cc-transaction')
    var errors = require('cc-errors')
    var assetIdencoder = require('cc-assetid-encoder')
    var _ = require('lodash')
    var rsa = require('node-rsa')
    var session = require('continuation-local-storage').getNamespace(config.serverName)
    var findBestMatchByNeededAssets = require('./modules/findBestMatchByNeededAssets')

    

    var creds = {}
    creds.AWSAKI = process.env.AWSAKI
    creds.AWSSSK = process.env.AWSSSK

    var CC_TX_VERSION = 0x02

    var client = new Client()

    var rpcclient = new rpc.Client(config.bitcoind)

    function coluutils() {
       //client.registerMethod("getaddressutxos", config.blockexplorer.url + "/api/getaddressutxos?address=${address}", "GET")
       client.registerMethod("getaddressutxos", config.blockexplorer.url + "/api/getaddressesutxos", "POST")
       client.registerMethod("getassetholders", config.blockexplorer.url + "/api/getassetholders?assetId=${assetid}&confirmations=${minconf}", "GET")
       client.registerMethod("getassetinfo", config.blockexplorer.url + "/api/getassetinfo", "GET")
       client.registerMethod("gettransaction", config.blockexplorer.url + "/api/gettransaction?txid=${txid}", "GET")
       client.registerMethod("getutxo", config.blockexplorer.url + "/api/getutxos", "POST")
       client.registerMethod("broadcasttx", config.blockexplorer.url + "/api/transmit", "POST")
      // client.registerMethod("getutxo", config.blockexplorer.url + "/api/getutxo?txid=${txid}&index=${index}", "GET")
       client.registerMethod("preparsetx", config.blockexplorer.url + "/api/parsetx?txid=${txid}", "POST")
       client.registerMethod("upload", config.torrentServer.url + "/addMetadata?token=${token}", "POST")
       client.registerMethod("seed", config.torrentServer.url + "/shareMetadata?token=${token}&torrentHash=${torrentHash}", "GET")
       client.registerMethod("download", config.torrentServer.url + "/getMetadata?token=${token}&torrentHash=${torrentHash}", "GET")
    }

    coluutils.safeParse = function safeParse (item) {
      try {
        if ((typeof item === 'string') || (item instanceof Buffer)) {
          return JSON.parse(item)
        } else {
          return item
        }
      } catch (e) {
        return item
      }
    }
    var safeParse = coluutils.safeParse

    coluutils.sendRawTransaction = function sendRawTransaction(txHex) {     
        return callservice('sendrawtransaction',txHex)       
    }

    coluutils.getBlockCount = function getBlockCount() {     
        return callservice('getblockcount')      
    }

    coluutils.broadcastTxBitcoind = function broadcastTxBitcoind(txHex) {
      return callservice('sendrawtransaction', txHex)
    }


    coluutils.getTransactionListForAddress = function getTransactionListForAddress(address, no_confirmations) {
      var deferred = Q.defer()
      var confirmations = no_confirmations || 0
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
                if (config.checkFinanceValidity) {
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

               var hex = get_opreturn_data(vout.scriptPubKey.asm)
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

var get_opreturn_data = function (asm) {
  return asm.substring('OP_RETURN '.length)
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

    coluutils.createIssueTransaction = function createIssueTransaction (metadata) {
        var deferred = Q.defer();
        metadata.divisibility = metadata.divisibility || 0
        metadata.aggregationPolicy = metadata.aggregationPolicy || 'aggregatable'

        tx = new bitcoinjs.Transaction();
        // find inputs to cover the issuence
        addInputsForIssueTransaction(tx, metadata).
        then(function(args){
            var txResponse = encodeColorScheme(args);
            deferred.resolve({txHex: txResponse.tx.toHex(), assetId: args.assetId || "0", metadata: metadata, multisigOutputs: txResponse.multisigOutputs, coloredOutputIndexes: txResponse.coloredOutputIndexes});
        }).
        catch(function(err) {
            deferred.reject(err);
        });
          

        return deferred.promise;
    }

     coluutils.createSendAssetTansaction = function createSendAssetTansaction (metadata) {
        var deferred = Q.defer();

        tx = new bitcoinjs.Transaction();
        // find inputs to cover the issuence
        addInputsForSendTransaction(tx, metadata).
        then(validateFees).
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

    
function validateFees(data){
   var self = this
   var deferred = Q.defer()

data.tx.ins.forEach( function (input) {
  console.log('in:' + input.script.buffer.length)
})
data.tx.outs.forEach( function (txOut) {
  console.log('out:' + txOut.script.buffer.length)
})

    console.log('fee per kb: ' + data.tx.toBuffer().length /1000.0)
   deferred.resolve(data)

   return deferred.promise;

}




    function encodeColorScheme(args) {
      var addMultisig = false;
      var metadata = args.metadata
      var encoder = cc.newTransaction(0x4343, CC_TX_VERSION)
      var reedemScripts = []
      var coloredOutputIndexes = []
      var coloredAmount = metadata.amount
      encoder.setLockStatus(!metadata.reissueable)
      encoder.setAmount(metadata.amount, metadata.divisibility)
      console.log("amount and div " + metadata.amount+" "+ metadata.divisibility)
      encoder.setAggregationPolicy(metadata.aggregationPolicy)
      console.log('aggregationPolicy = ' + metadata.aggregationPolicy)
      if(metadata.metadata || metadata.rules) {
         if(config.writemultisig) {
            if(!metadata.sha1 || !metadata.sha2) {
               console.log("something went wrong with torrent sever")
               throw new errors.MetadataMissingShaError()
            }
            encoder.setHash(metadata.sha1, metadata.sha2)
         }
      }

      //console.log(metadata.transfer)
      if(metadata.transfer) {
        metadata.transfer.forEach(function(transferobj, i){
          console.log("payment " + transferobj.amount + " " + args.tx.outs.length )
          encoder.addPayment(0, transferobj.amount, args.tx.outs.length)
          coloredAmount -= transferobj.amount
          // check multisig
          if(transferobj.pubKeys && transferobj.m) {
             var multisig = generateMultisigAddress(transferobj.pubKeys, transferobj.m)
             reedemScripts.push({index: args.tx.outs.length , reedemScript: multisig.reedemScript, address: multisig.address})
             args.tx.addOutput(multisig.address, config.mindustvalue)
          }
          else
            args.tx.addOutput(transferobj.address, config.mindustvalue)
        })
      }

      if (coloredAmount < 0) {
        throw new errors.CCTransactionConstructionError({explanation: 'transferring more than issued'})
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
        reedemScripts.forEach(function(item) { item.index +=1 })
      }
      var ret = bitcoinjs.Script.fromChunks(
                              [
                                bitcoinjs.opcodes.OP_RETURN,
                                buffer.codeBuffer
                              ]);

      args.tx.addOutput(ret, 0);

      // add array of colored ouput indexes
      encoder.payments.forEach(function (payment) {
        coloredOutputIndexes.push(payment.output)
      })


      // need to encode hashes in first tx
      if(addMultisig) {
        if(buffer.leftover && buffer.leftover.length == 1)
              addHashesOutput(args.tx, metadata.pubKeyReturnMultisigDust, buffer.leftover[0])
        else if(buffer.leftover && buffer.leftover.length == 2)
              addHashesOutput(args.tx, metadata.pubKeyReturnMultisigDust, buffer.leftover[1], buffer.leftover[0])
        else
          throw new errors.CCTransactionConstructionError({explanation: 'have hashes and enough room we offested inputs for nothing'})

      }

     //console.log(args)
      // add change
      var allOutputValues =  _.sumBy(args.tx.outs, function(output) { return output.value; });
      console.log('all inputs: ' + args.totalInputs.amount + ' all outputs: ' + allOutputValues);
      var lastOutputValue = args.totalInputs.amount - (allOutputValues + metadata.fee)
      if(lastOutputValue < config.mindustvalue) {
        var totalCost = config.mindustvalue + args.totalInputs.amount.toNumber()
        throw new errors.NotEnoughFundsError({
          type: 'issuance',
          fee: metadata.fee,
          totalCost: totalCost,
          missing: config.mindustvalue - lastOutputValue
        })
      }
      if (metadata.flags && metadata.flags.splitChange && lastOutputValue >= 2 * config.mindustvalue && coloredAmount > 0) {
        var bitcoinChange = lastOutputValue - config.mindustvalue
        lastOutputValue = config.mindustvalue
        console.log('adding bitcoin change output with: ' + bitcoinChange)
        args.tx.addOutput(metadata.issueAddress, bitcoinChange) 
      }
      if (coloredAmount > 0) {
        // there's a colored change output
        coloredOutputIndexes.push(tx.outs.length)
      }
      console.log('adding change output with: ' + lastOutputValue)
      console.log('total inputs: ' + args.totalInputs.amount)
      console.log('total fee: ' + metadata.fee)
      console.log('total output without fee: ' + allOutputValues)
      args.tx.addOutput(metadata.issueAddress, lastOutputValue ? lastOutputValue : args.change);

      return { tx: args.tx, multisigOutputs: reedemScripts, coloredOutputIndexes: _.uniq(coloredOutputIndexes)}
    }


    coluutils.getAssetMetadata = function getAssetMetadata(assetId, utxo, verbosity) {
      var self = this
       var deferred = Q.defer()

        getAssetInfo(assetId, utxo, verbosity).
        then(function(data){
          if(!data.issuanceTxid) {
            if(utxo) {
                console.log('rejecting request since issuanceTxid is missing for specific utxo')
                deferred.reject(new errors.MissingIssuanceTxidError({utxo: utxo}))
            }
            else {
                deferred.resolve(data)
            }
          }
          else
          {
            var txid = utxo.split(':')[0]
            var promises = []
            promises.push(getTransaction(data.issuanceTxid))
            if(data.issuanceTxid !== txid) promises.push(getTransaction(txid))

            console.log('requesting issue tx: ' + data.issuanceTxid)
            console.log('requesting utxo tx: ' + txid)
            Q.all(promises).done(function(values){

                  var hashes = []
                  var getHashes = []
                  var multisignum = 0
                  values.forEach(function(txbufer, i) {
                    var tx = safeParse(txbufer)
                    console.log('tx', tx)
                    //console.log('values', values)
                    //console.log('txbufer', txbufer)
                    console.log(tx.vout[0].scriptPubKey.hex)

                     if(!i) {
                      console.log(tx.vin[0])
                        if(tx.vin[0] && tx.vin[0].previousOutput.addresses[0])
                          data.issueAddress =  tx.vin[0].previousOutput.addresses[0]
                     }

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
                        var first = safeParse(metas[0])
                        var second = metas.length > 1 ? safeParse(metas[1]) : first
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
            deferred.reject(error)
        });


        return deferred.promise
    }



    coluutils.seedMetadata = function seedMetadata(hash) {
        var deferred = Q.defer()
        var token = config.torrentServer.token

        if(!hash) {
          console.log('no metadata to seed')
           deferred.resolve()
           return deferred.promise;
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
                //var torretdata = safeParse(data)
                deferred.resolve(data);
            }
            else if(data) {
                console.log("seed: rejecting with: " + response.statusCode + " " + data);
                deferred.reject(new errors.SeedMetadataError({status: response.statusCode, data: data}));
            }
            else {
                console.log("seed: rejecting with: " + response.statusCode);
                deferred.reject(new errors.SeedMetadataError({status: response.statusCode}));
            }
        }).on('error', function (err) {
                console.log('seed: something went wrong on the request', err.request.options);
                deferred.reject(new errors.SeedMetadataError({data: err.request.options}));
            });

        return deferred.promise;
    }



    coluutils.downloadMetadata = function downloadMetadata(hash) {
        var deferred = Q.defer()
        var token = config.torrentServer.token
        
        if(!hash) {
          console.log('no metadata to seed')
          deferred.resolve()
          return deferred.promise;
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
                var torretdata = null
                try{ torretdata = safeParse(data) } catch(e) {torretdata = data }
                deferred.resolve(torretdata);
            }
            else if(data) {
                console.log("download: rejecting with: ", response.statusCode, data);
                deferred.reject(new errors.DownloadMetadataError({status: response.statusCode, data: data}));
            }
            else {
                console.log("download: rejecting with: " + response.statusCode);
                deferred.reject(new errors.DownloadMetadataError({status: response.statusCode}));
            }
        }).on('error', function (err) {
                console.log('download: something went wrong on the request', err.request.options);
                deferred.reject(new errors.DownloadMetadataError({data: err.request.options}));
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
        if(metadata.metadata) {
          var key = tryEncryptData(metadata)
          if(key && key.error) {
            deferred.reject(new errors.UploadMetadataError({explanation: 'Encryption error: ' + key.error}))
            return deferred.promise
          }
          else if(key && key.privateKey) {
            metadata.privateKey = key.privateKey
          }

          metafile.data = metadata.metadata
        }
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
                console.log("upload:(200) ", data);
                var torretdata = safeParse(data)
                metadata.sha1 = torretdata.torrentHash
                metadata.sha2 = torretdata.sha2
                deferred.resolve(metadata);
            }
            else if(data) {
                console.log("rejecting with: " + response.statusCode + " " + data);
                deferred.reject(new errors.UploadMetadataError({status: response.statusCode, data: data}));
            }
            else {
                console.log("rejecting with: " + response.statusCode);
                deferred.reject(new errors.UploadMetadataError({status: response.statusCode}));
            }
        }).on('error', function (err) {
                console.log('something went wrong on the request', err.request.options);
                deferred.reject(new errors.UploadMetadataError({data: err.request.options}));
            });

        return deferred.promise;

    }

    function tryEncryptData(metadata) {
      try {
        if(metadata.metadata && metadata.metadata.encryptions && metadata.metadata.userData) {
          var oneKey = new rsa({b: 1024})
          var returnKey = false
           metadata.metadata.encryptions.forEach(function (encSection){
              returnKey = returnKey || !encSection.pubKey
              var section = metadata.metadata.userData[encSection.key]
              if(section) {
                  var format = encSection.type + '-public-' +  encSection.format
                  var key = encSection.pubKey ? new rsa([encSection.pubKey]) : oneKey
                  var encrypted = key.encrypt(section, 'base64')
                  metadata.metadata.userData[encSection.key] = encrypted
                  console.log(encSection.key + ' encrypted to ' + encrypted )
              }
           })
           return { privateKey: returnKey ? oneKey.exportKey('pkcs8').toString('hex') : '' }
        }
      }
      catch(e) {
        console.log('tryEncryptData: exception' + e)
        return { error: e }
      }
    }

    function getUnspentArrayByAddressOrUtxo(address, utxo) {
      var deferred = Q.defer();
      try{
        if(utxo) {
          console.log('using specific utxo: ' + utxo)
          getUtxo(Array.isArray(utxo) ? utxo : [utxo]).
          then(function (data) {
            if(Array.isArray(data)) {
                var reply = []
                data.forEach(function (utxolist) {
                    var utxolistjson = safeParse(utxolist)
                    if(Array.isArray(utxolistjson))
                    {
                      utxolistjson.forEach(function (autxo) { reply.push(autxo) })
                    }
                    else
                    {
                      reply.push(utxolistjson)
                    }
                })
                 deferred.resolve(reply)
            }
            else {
              var jsondata = safeParse(data)
              deferred.resolve(data)
            }
          })
        }
        else {
          console.log('using utxo for address: ' + address)
          getUnspentsByAddress(Array.isArray(address) ? address : [address]).
          then(function (data) {
              var utxos = []
              var jsondata = data
              jsondata.forEach(function (item) {
                item.utxos.forEach(function (utxo) {
                  utxos.push(utxo)
                })
              })
              deferred.resolve(utxos)
          })
        }
      }
      catch(e){
        deferred.reject(e);
      }
      return deferred.promise
    }


     function getUtxo(utxo) {

      var deferred = Q.defer();
        var args = {
                    //path: { "txid": txid, "index": index},
                    data: {
                      utxos: []
                    },
                    headers: _.assign({"Content-Type": "application/json"}, getHeadersToForward())
                }
         try{

          utxo.forEach(function (utxostring) {
            args.data.utxos.push({txid: utxostring.split(':')[0], index: utxostring.split(':')[1]})
          })

      
        client.methods.getutxo(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("getUtxo:(200)");
                deferred.resolve([data]);
            }
            else if(data) {
                console.log("getUtxo: rejecting with:", response.statusCode, data);
                deferred.reject(data);
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

    function getTransaction(txid) {

      var deferred = Q.defer();
        var args = {
                    path: { "txid": txid },
                    headers: _.assign({"Content-Type": "application/json"}, getHeadersToForward())
                }
         try{

      
        client.methods.gettransaction(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("getTransaction:(200)");
                deferred.resolve(data);
            }
            else if(data) {
                console.log("getTransaction: rejecting with:", response.statusCode, data);
                deferred.reject(data);
            }
            else {
                console.log("getTransaction: rejecting with: " + response.statusCode);
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



coluutils.broadcastTx = function broadcastTx(txhex) {

      var deferred = Q.defer();
        var args = {
                    data: { "txHex": txhex },
                    headers: _.assign({"Content-Type": "application/json"}, getHeadersToForward())
                }
         try{

      
        client.methods.broadcasttx(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("getTransaction:(200)");
                deferred.resolve(data);
            }
            else if(data) {
                console.log("getTransaction: rejecting with:", response.statusCode, data);
                deferred.reject(data);
            }
            else {
                console.log("getTransaction: rejecting with: " + response.statusCode);
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
                    headers: _.assign({"Content-Type": "application/json"}, getHeadersToForward())
                }
                          try{

      
        client.methods.preparsetx(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("requestParseTx:(200) ");
                deferred.resolve(safeParse(data));
            }
            else if(data) {
                console.log("requestParseTx: rejecting with:", response.statusCode, data);
                deferred.reject(data);
            }
            else {
                console.log("requestParseTx: rejecting with:", response.statusCode);
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



    function getAssetInfo(assetId, utxo, verbosity)
    {
        var deferred = Q.defer();
        var args = {
                    parameters: {"assetId": assetId},
                    headers: _.assign({"Content-Type": "application/json"}, getHeadersToForward())
                }
                          try{

        if (typeof utxo !== 'undefined') args.parameters.utxo = utxo
        if (typeof verbosity !== 'undefined') args.parameters.verbosity = verbosity
        client.methods.getassetinfo(args, function (data, response) {
            console.log(data.toString());
            if (response.statusCode == 200) {
                console.log("getAssetInfo:(200) ");
                deferred.resolve(safeParse(data));
            }
            else if(data) {
                console.log("getassetinfo: rejecting with:", response.statusCode, data);
                deferred.reject(data);
            }
            else {
                console.log("getassetinfo: rejecting with: " + response.statusCode);
                deferred.reject(new Error("Status code was ", response.statusCode));
            }
        }).on('error', function (err) {
                console.log('something went wrong on the request', err.request.options);
                deferred.reject(new Error("Status code was ", err.request.options));
            });
      }
      catch(e) { console.log(e); deferred.reject(new Error("error parsing response from block-explorer")); }

        return deferred.promise;
    }

    function getUnspentsByAddress(addresses)
    {
        var deferred = Q.defer();
        addresses = _.uniq(addresses)
        var args = {
                    data: {"addresses" : addresses },
                    headers: _.assign({"Content-Type": "application/json"}, getHeadersToForward())
                }
                          try{

        client.methods.getaddressutxos(args, function (data, response) {
            console.log(data.toString());
            if (response.statusCode == 200) {
                console.log("getUnspentsByAddress:(200) ");
                deferred.resolve(data);
            }
            else if(data) {
                console.log("getUnspentsByAddress: rejecting with:", response.statusCode, data);
                deferred.reject(data);
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
      catch(e) { console.log(e); deferred.reject(new Error("error parsing response from block-explorer")); }

        return deferred.promise;
    }

    //TODO: break this into a generic fee mechanisem where fee and and total inputs amount are diffrent
    // inputs amount can be taked from the sent asset as well, fee variable is missleading
    function comupteCost(withfee, metadata ){
       fee = withfee ? (metadata.fee || config.minfee) : 0;

        if(metadata.to && metadata.to.length)
        {
          metadata.to.forEach(function(to) {
            fee += config.mindustvalue
          })
        }
        if(metadata.rules || metadata.metadata)
          fee += config.writemultisig ? config.mindustvaluemultisig  : 0;

        fee += config.mindustvalue

       console.log("comupteCost: " + fee)
       return fee
    }

    function addInputsForSendTransaction(tx, metadata) {
        var deferred = Q.defer()
        var satoshiCost = comupteCost(true, metadata)
        var totalInputs = { amount: 0 }
        var reedemScripts = []
        var coloredOutputIndexes = []

        console.log('addInputsForSendTransaction')
        
        try{
        if(metadata.from || metadata.sendutxo) {
          getUnspentArrayByAddressOrUtxo(metadata.from, metadata.sendutxo)
          .then(function(utxos){
            if(metadata.from)  
                console.log('got unspents for address: ' + metadata.from  + " from block explorer")
            else {
              console.log('got unspent from parmameter: ' + metadata.sendutxo  + " from block explorer")
              if (utxos[0] && utxos[0].scriptPubKey && utxos[0].scriptPubKey.addresses && utxos[0].scriptPubKey.addresses[0])
                metadata.from = utxos[0].scriptPubKey.addresses[0]
            }
             var assetList = []
             metadata.to.forEach(function(to) {
                console.log(to.assetId)
                if(!assetList[to.assetId]) 
                  assetList[to.assetId] = { amount: 0, addresses: [], done: false, change: 0, encodeAmount: 0, inputs: [] }
                assetList[to.assetId].amount += to.amount
                if (to.burn) {
                  assetList[to.assetId].addresses.push({ address: 'burn', amount: to.amount })
                }
                // generate a multisig address, remember to return the redeem scripts
                else if (!to.address && to.pubKeys && to.m) {
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
                var assetUtxos = utxos.filter(function (element, index, array) {
                  if (!element.assets) { return false }                 
                  return element.assets.some(function(a){
                    console.log('checking ' + a.assetId + ' and '+ asset)
                    return (a.assetId == asset)
                  })
                })
                if(assetUtxos && assetUtxos.length > 0) {
                  console.log("have utxo list")
                  var key = asset;
                  assetUtxos.forEach(function (utxo){ if(utxo.used) {
                      console.log('utxo', utxo)
                      deferred.reject(new errors.OutputAlreadySpentError({output: utxo.txid + ':' + utxo.index}))
                      return deferred.promise 
                  } })
                   if(!findBestMatchByNeededAssets(assetUtxos, assetList, key, tx, totalInputs, metadata)) {
                      deferred.reject(new errors.NotEnoughAssetsError({asset: key}))
                      return;
                   }
                }
                else {
                  console.log("no utxo list")
                  deferred.reject(new errors.NoOutputWithSuchAssetError({asset: asset}))
                }

             }
             console.log('reached encoder')
             var encoder = cc.newTransaction(0x4343, CC_TX_VERSION)
            if(!tryAddingInputsForFee(tx, utxos, totalInputs, metadata, satoshiCost)) {
              deferred.reject(new errors.NotEnoughFundsError({
                type: 'transfer',
                fee: metadata.fee,
                totalCost: satoshiCost,
                missing: satoshiCost - totalInputs.amount
              }))
              console.log('pay it forward')
              return  deferred.promise
            }

             for( asset in assetList)
             {

                var currentAsset = assetList[asset];
                console.log('encoding asset ' + asset)
                if(!currentAsset.done) {
                  console.log('current asset state is bad ' + asset)
                  deferred.reject(new errors.NotEnoughAssetsError({asset: asset}))
                  return
                }

                console.log(currentAsset.addresses)
                var uniAssets = _.uniqBy(currentAsset.addresses, function(item) { return item.address } )
                console.log('uniAssets = ', uniAssets)
                uniAssets.forEach(function(address) {
                  console.log('adding output ' + (tx.outs ? tx.outs.length : 0) + " for address: " + address.address + " with satoshi value " + config.mindustvalue + ' asset value: ' + address.amount)
                  var addressAmountLeft = address.amount
                  console.log('currentAsset = ', currentAsset, ', currentAsset.inputs.length = ', currentAsset.inputs.length)
                  currentAsset.inputs.some(function (input) {
                    if(!input.amount) { return false }
                    if(addressAmountLeft - input.amount > 0 ) {
                        console.log('mapping to input ' + input.index + ' with amount ' + input.amount)
                        if (address.address === 'burn') {
                          encoder.addBurn(input.index, input.amount)
                        } else {
                          encoder.addPayment(input.index, input.amount, (tx.outs ? tx.outs.length : 0))
                        }
                        addressAmountLeft -= input.amount
                        console.log('left to map from next input ' + addressAmountLeft)
                        input.amount = 0
                        return false
                    }
                    else {
                        console.log('mapping to input ' + input.index + ' with amount ' + addressAmountLeft)
                        if (address.address === 'burn') {
                          encoder.addBurn(input.index, addressAmountLeft)
                        } else {
                          encoder.addPayment(input.index, addressAmountLeft, (tx.outs ? tx.outs.length : 0))
                        }
                        input.amount -= addressAmountLeft
                        addressAmountLeft = 0
                        return true
                    }
                  })
                  console.log('putting output in transaction')
                  if (address.address !== 'burn') {
                    tx.addOutput(address.address, config.mindustvalue);
                  }
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
                         throw new errors.MetadataMissingShaError()
                      }
                      encoder.setHash(metadata.sha1, metadata.sha2)
                   }
                }
              var buffer = encoder.encode();
              if(buffer.leftover && buffer.leftover.length > 0)
              {
                  encoder.shiftOutputs()
                  reedemScripts.forEach(function(item) { item.index += 1 })
                  buffer = encoder.encode()
                  if(buffer.leftover.length == 1)
                        addHashesOutput(tx, metadata.pubKeyReturnMultisigDust, buffer.leftover[0])
                  else if(buffer.leftover.length == 2)
                        addHashesOutput(tx, metadata.pubKeyReturnMultisigDust, buffer.leftover[1], buffer.leftover[0])
                  else
                    throw new errors.CCTransactionConstructionError({explanation: 'have hashes and enough room we offested inputs for nothing'})
              }

               // add array of colored ouput indexes
                encoder.payments.forEach(function (payment) {
                  if (typeof payment.output !== 'undefined') coloredOutputIndexes.push(payment.output)
                })
                 
            }
            catch(e) {
              console.log(e)
              deferred.reject(e)
            }
            console.log("encoding done")
            var ret = bitcoinjs.Script.fromChunks(
                                    [
                                      bitcoinjs.opcodes.OP_RETURN,
                                      buffer.codeBuffer
                                    ]);

            tx.addOutput(ret, 0);
            var lastOutputValue = getChangeAmount(tx, metadata.fee, totalInputs)
            var coloredChange = _.keys(assetList).some(function (assetId) {
              return assetList[assetId].change > 0
            })
            var numOfChanges = (metadata.flags && metadata.flags.splitChange && coloredChange && lastOutputValue >= 2 * config.mindustvalue) ? 2 : 1

            if(lastOutputValue < numOfChanges * config.mindustvalue) {
              console.log('trying to add additionl inputs to cover transaction')
              satoshiCost = getInputAmountNeededForTx(tx, metadata.fee) + numOfChanges * config.mindustvalue
              if(!tryAddingInputsForFee(tx, utxos, totalInputs, metadata, satoshiCost)) {
                deferred.reject(new errors.NotEnoughFundsError({
                  type: 'transfer',
                  fee: metadata.fee,
                  totalCost: satoshiCost,
                  missing: config.mindustvalue - lastOutputValue
                }))
                console.log('rejecting~!!!!!')
                return
              }
              lastOutputValue = getChangeAmount(tx, metadata.fee, totalInputs)         
            }
            // TODO: make sure we have a from here, even though we try to use first address found in the utxo we want to send
            // in case we didnt just use an address, there still might not be an address perhaps we should generate a keypair
            // here and return them as well, also we might have mutiple from addresses
            if (numOfChanges === 2) {
              tx.addOutput(Array.isArray(metadata.from) ? metadata.from[0] : metadata.from, lastOutputValue - config.mindustvalue); 
              lastOutputValue = config.mindustvalue 
            }
            if (coloredChange) {
              coloredOutputIndexes.push(tx.outs.length)
            }
            tx.addOutput(Array.isArray(metadata.from) ? metadata.from[0] : metadata.from, lastOutputValue);
            console.log('success')
            deferred.resolve({tx: tx, metadata: metadata, multisigOutputs: reedemScripts, coloredOutputIndexes: _.uniqBy(coloredOutputIndexes) });
            return
          }) // then
        } // if
        else {
           deferred.reject(new errors.CCTransactionConstructionError({status: 400, explanation: 'no from address or sendutxo in input'}))
        }
      } //try
      catch(e){
        console.log(e)
      }

        return deferred.promise
    }

    function getChangeAmount(tx, fee, totalInputValue) {
      var allOutputValues =  _.sumBy(tx.outs, function(output) { return output.value; });
      console.log('getChangeAmount: all inputs: ' + totalInputValue.amount + ' all outputs: ' + allOutputValues)
      return  (totalInputValue.amount - (allOutputValues + fee))
    }


    function tryAddingInputsForFee(tx, utxos,  totalInputs, metadata, satoshiCost) {
        console.log('tryAddingInputsForFee: current transaction value: ' + totalInputs.amount + ' projected cost: ' + satoshiCost)
        if(satoshiCost > totalInputs.amount) {
            if(!insertSatoshiToTransaction(utxos, tx, (satoshiCost - totalInputs.amount), totalInputs, metadata)) {
               console.log('not enough satoshi in account for fees')
              return false
            }
        }
        else
          console.log('No need for additional finance')

        return true
    }

    function addInputsForIssueTransaction(tx, metadata) {
        var deferred = Q.defer()
        var totalInputs = { amount: 0 }
        //var metadata = safeParse(metadata)
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
                metadata.financeOutput.scriptPubKey.hex,
                metadata.divisibility,
                metadata.aggregationPolicy)
          
          deferred.resolve({tx: tx, metadata: metadata, change: current - cost, assetId: assetId, totalInputs: { amount: current }})
          return deferred.promise; 
        }


        // tempararly work with bitcoind though 
        // check there is no op_return in tx for the utxo we are about to use
        // TODO: need to check if we can decode it and its ours
        getUnspentsByAddress([metadata.issueAddress])
        .then(function (data) {
            var jsonresponse = data
            var utxos = []
            jsonresponse.forEach(function (item) {
              item.utxos.forEach(function (utxo) {
                utxos.push(utxo)
              })
            })

           // safeParse(data).utxos
            console.log('got ' + utxos.length + ' unspents for ' + metadata.issueAddress + " from block explorer")
            //add to transaction enough inputs so we can cover the cost
            //send change if any back to us            
            var current = new bn(0);
            var cost = new bn(getIssuenceCost(metadata));
            var change = new bn(0)
            var hasEnoughEquity = utxos.some(function (utxo) {
              utxo.value = Math.round(utxo.value)
              if (!isInputInTx(tx, utxo.txid, utxo.index) && !(utxo.assets && utxo.assets.length)) {
                  console.log('current amount ' + utxo.value + " needed " + cost)
                  tx.addInput(utxo.txid, utxo.index)
                  if(tx.ins.length == 1) { //encode asset 
                    console.log(tx.ins[0].script)
                     assetId = encodeAssetIdInfo(metadata.reissueable, 
                                    utxo.txid,
                                    utxo.index,
                                    utxo.scriptPubKey.hex,
                                    metadata.divisibility,
                                    metadata.aggregationPolicy)
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
          else deferred.reject(new errors.NotEnoughFundsError({
            type: 'issuance',
            explanation: 'address ' + metadata.issueAddress + ' does not have any unused outputs'
          }));
        }).
        catch(function(error) {
            console.log(error) 
            deferred.reject(error)
        });


        return deferred.promise;
    }


    function encodeAssetIdInfo(reissueable, txid, nvout, hex, divisibility, aggregationPolicy) {
       var opts = {
              'ccdata': [{
                'type': 'issuance',
                'lockStatus': !reissueable,
                'divisibility': divisibility,
                'aggregationPolicy': aggregationPolicy
              }],
              'vin': [{
                'txid': txid,
                'vout': nvout,
                'previousOutput': {
                  'hex': hex 
                } 
              }]
            }



        if(!reissueable) {
           console.log('sending assetIdEncoder locked, first input = ' + txid + ':' + nvout)
        }
        else {
            console.log('sending assetIdEncoder unlocked, first input previousOutput = ', opts.vin[0].previousOutput)
          }

          console.log('encoding asset is locked: ' + !reissueable)
          console.log(opts)
          var assetId = assetIdencoder(opts)
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
        if(isInputInTx(tx, metadata.financeOutputTxid, metadata.financeOutput.n))
          return false
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
        else
          console.log('finance output not added to transaction finace value: ' + financeValue.toNumber() + ' still needed: ' + missingbn.toNumber())
      }
      else
        console.log('no financeOutput was given')

       var hasEnoughEquity = utxos.some(function (utxo) {
            utxo.value = Math.round(utxo.value)
              if (!isInputInTx(tx, utxo.txid, utxo.index) && !(utxo.assets && utxo.assets.length)) {
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

    function isInputInTx (tx, txid, index) {
      return tx.ins.some(function (input) {
        var id = bitcoinjs.bufferutils.reverse(input.hash)
        return (id.toString('hex') === txid && input.index === index)
      })
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

         fee += config.mindustvalue

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
                    headers: _.assign({"Content-Type": "application/json"}, getHeadersToForward())
                }
       try{
        client.methods.getassetholders(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                console.log("getAssetStakeholders:(200) " + data);
                deferred.resolve(safeParse(data));
            }
            else if(data) {
                console.log("getAssetStakeholders: rejecting with:", response.statusCode, data);
                deferred.reject(data);
            }
            else {
                console.log("getAssetStakeholders: rejecting with:", response.statusCode);
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
        return getUnspentsByAddress(Array.isArray(address) ? address : [address])
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
      var ecpubkeys = []
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

    function getHeadersToForward() {
      var context = session.get('context')
      return context && context.req && context.req.service && context.req.service.headersToForward
    }

    coluutils();

    return coluutils;
})();