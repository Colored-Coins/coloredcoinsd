module.exports = (function () {
    var google = require('../../googleapi.js');
    var sw = require("swagger-node-express");
    var utils = require('../../utils.js');
    var config = require('../../config.js');
    var redis = require('redis');
    var Q = require("q");
    var AWS = require("aws-sdk");
    var api = require('../../coluutils.js');

    var creds = {};
    creds.AWSAKI = process.env.AWSAKI;
    creds.AWSSSK = process.env.AWSSSK; 


    function color() { };

    console.log("loading color")

    color.registerRoutes = function registerRoutes(app, path, swagger, allowAddEndpoint) {
     



        //endpoint to issue an asset
        var issueAsset = {
            'spec': {
                "description": "",
                "path": "/issue",
                "notes": "Returns a issued asset",
                "summary": "",
                "method": "POST",
                "parameters": [
                        sw.bodyParam("issueAssetRequest", "Asset Issue Object", "issueAssetRequest")
                ],
                "type": "issueAssetResponse",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "issueAsset"
            },
            'action': function (req, res) {
                console.log("issue action");
                tryIssueAsset(req, res);
            }
        };

        swagger.addPost(issueAsset);

        //endpoint to send an asset
         var sendAsset = {
            'spec': {
                "description": "",
                "path": "/sendasset",
                "notes": "Returns a issued asset",
                "summary": "",
                "method": "POST",
                "parameters": [
                        sw.bodyParam("sendAssetRequest", "Asset Send Object", "sendAssetRequest")
                ],
                "type": "sendAssetResponse",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "sendAsset"
            },
            'action': function sendAsset(req, res) {
                console.log("send asset action");
                trySendAsset(req, res);
            }
        };

        if(allowAddEndpoint(sendAsset)) {
            swagger.addPost(sendAsset);
        }


        var broadcastTx = {
            'spec': {
                "description": "",
                "path": "/broadcast",
                "notes": "broadcasts a raw transaction to the bitcoin network",
                "summary": "",
                "method": "POST",
                "parameters": [
                        sw.bodyParam("rawTxHex", "Hex of a singed transaction", "rawTxHex")
                ],
                "type": "broadcastTxResponse",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "broadcastTx"
            },
            'action': function (req, res) {
                console.log("broadcast asset action");
                tryBroadcastAsset(req, res);
            }
        };

        swagger.addPost(broadcastTx);

        //endpoint to get asset metadata
        var getAssetMetadata = {
            'spec': {
                "description": "",
                "path": "/assetmetadata/{assetId}/{utxo}?",
                "notes": "Returns information about an asset issuence",
                "summary": "",
                "method": "GET",
                "parameters": [
                    sw.pathParam("assetId", "ID of Asset we want to get info for", "string"),
                    sw.pathParam("utxo", "provide data for secific utxo", "string", true)
                ],
                "type": "assetMetadataResponse",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "getAssetMetadata"
            },
            'action': function (req, res) {
                api.getAssetMetadata(req.params.assetId, req.params.utxo).
                then(
                    function(data) { res.status(200).send(data) }, 
                    function(err) { res.status(400).send({error: err.message}) } 
                )
            }
        };

        swagger.addGet(getAssetMetadata);


        //endpoint to get all the assets and utxo's in an address
        var getAddressInfo = {
            'spec': {
                "description": "",
                "path": "/addressinfo/{address}",
                "notes": "Returns information about utxo's held by an address",
                "summary": "",
                "method": "GET",
                "parameters": [
                    sw.pathParam("address", "base58 address", "string"),
                ],
                "type": "addressInfoResponse",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "getAddressInfo"
            },
            'action': function (req, res) {
              api.getAddressInfo(req.params.address).
              then(function(data) {
                var jsondata = api.safeParse(data)
                res.status(200).send(Array.isArray(req.params.address) ? jsondata : jsondata[0])
              },
              function (data) { res.status(400).send(data) })
            }
        };

        swagger.addGet(getAddressInfo);

        // endpoint to get all adresses holding an asset
         var getHoldingAdressesForAsset = {
            'spec': {
                "description": "",
                "path": "/stakeholders/{assetId}/{numConfirmations}?",
                "notes": "Returns a all adresses holding the asset",
                "summary": "",
                "method": "GET",
                "parameters": [
                        sw.pathParam("assetId", "ID of Asset we want to get info for", "string"),
                        sw.pathParam("numConfirmations", "min confermations (optional)", "integer", false)
                ],
                "type": "assetHolders",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "getStakeholders"
            },
            'action': function (req, res) {
                console.log("get stakeholders action");
                trygetAssetStakeholders(req, res);
            }
        };

        swagger.addGet(getHoldingAdressesForAsset);


        console.log(path + ": color routes added.");


    }

    /**
     * @api {get} /asset/:id Request User information
     * @apiName GetAssetMetadata
     * @apiGroup Color
     *
     * @apiParam {Number} id Asset unique ID.
     *
     * @apiSuccess {Object} AssetMetadata asset metadata.
     * 
     */
    function tryGetAddress(req, res) {
        try {
            var adder = utils.getAssetAddressId(req.body.address);
            client = redis.createClient();
            client.hmset("addresses", req.body.address, req.body.email, function(err, data){
                console.log(data);
            });
            trySendGoogleAnalyticsEvent(req, 'Get Address');
            res.json({adress: adder});
        }
        catch(e) {
             res.status(500).send({ error: e.message });
        }
    }

    function tryBroadcastAsset(req, res) {

        console.log("tryBroadcastAsset")
        api.broadcastTx(req.body.txHex).
        then(function(txid){
            api.requestParseTx(txid);
            trySendGoogleAnalyticsEvent(req, 'Broadcast Asset');
            res.status(200).send({txid: txid});
        }).
        catch(function(error) { 
            console.log({ error: error.message, stack: error.stack});
            res.status(500).send({ error: error.message })
        }).done();

    }


    function tryIssueAsset(req, res) {

        console.log("issueAsset")
        validateInput(req.body).
        then(checkParameters).
        then(api.uploadMetadata).
        then(api.createIssueTransaction).
        then(function(data){
            api.seedMetadata(data.metadata.sha1)
            var response = {txHex: data.txHex, assetId: data.assetId, coloredOutputIndexes: data.coloredOutputIndexes }
            if(data.metadata.privateKey) { response.privateKey = data.metadata.privateKey }
            if(data.multisigOutputs && data.multisigOutputs.length > 0) { response.multisigOutputs = data.multisigOutputs }
            trySendGoogleAnalyticsEvent(req, 'Issue Asset');
            res.status(200).send(response);
        }).
        catch(function(error) { 
            console.log({ error: error.message, stack: error.stack});
            res.status(error.json ? 404 : 500).send(error.json ? error.json : { error: error.message })
        }).done();

    }


    function returnError(res, error) {
         console.log(arguments);
         res.status(500).send({ error: error.message }) 
    }


    function checkParameters(input) {
        var deferred = Q.defer()
        if(input && (input.to || input.transfer)) {
            var transferArr = input.to || input.transfer
            if(transferArr.some(function(transfer) {
                if(transfer.address && transfer.pubKeys) {
                    return true
                }
                return false
            })) { deferred.reject(new Error("can't use both an address and pubKeys, please choose one")) }
            else if(transferArr.some(function(transfer) {
                if(transfer.pubKeys && !transfer.m) {
                    return true
                }
                return false
            })) { deferred.reject(new Error("missing parameter m, number for signatures required for multisig reedem")) }
            else if(transferArr.some(function(transfer) {
                if(!transfer.pubKeys && !transfer.address) {
                    return true
                }
                return false
            })) { deferred.reject(new Error("missing parameter address or pubKeys in transfer object")) }

            else { deferred.resolve(input) }
        }
        else
            deferred.resolve(input)
        return deferred.promise
    }

    function validateInput(input, musthave, oneof) {
        var deferred = Q.defer();
        var valid = true;
        var missing = ''
        if(musthave) {
            musthave.forEach(function (property){
                if(valid) {
                    valid = input.hasOwnProperty(property)
                    if(!valid) missing = property
                }
            })
        }
        if(oneof) {
            missing += 'any of: '
            valid = oneof.some(function (property) {
                valid = input.hasOwnProperty(property)
                if(!valid) missing += (property + ', ')        
                return valid;
            })
        }
        
        if (valid){
            deferred.resolve(input);
        }
        else {
            deferred.reject(new Error("input is invalid missing: " + missing));
        }
           
        return deferred.promise;
    }


    

    function trySendAsset(req, res) {
        console.log('try send asset v2')
        try{
            //var reqData = JSON.parse(req.body)
            console.log('parsed ok');
            validateInput(req.body, null, ['from', 'sendutxo']).
            then(checkParameters).
            then(api.uploadMetadata).
            then(api.createSendAssetTansaction).
            then(function(data) {
                 api.seedMetadata(data.metadata.sha1);
                 trySendGoogleAnalyticsEvent(req, 'Send Asset');
                 res.json({ txHex: data.tx.toHex(), metadataSha1: data.metadata.sha1, multisigOutputs: data.multisigOutputs });
            })
            .catch(function(error) {
                 console.log(error)
                 res.status(error.json ? 404 : 500).send( error.json ? error.json : { error: error.message });
            });  
        }
        catch(e) {
            console.log(e)
             res.status(500).send({ error: e.message });
        }
    }

    function trygetAssetStakeholders(req, res) {
        try{
            api.getAssetStakeholders(req.params.assetId, req.params.numConfirmations)
            .then(function(data) {
                 trySendGoogleAnalyticsEvent(req, 'Get Asset Stake Holders');              
                 res.json(data);
            })
            .catch(function(error){
                 res.status(500).send({ error: error.message });
            });  
        }
        catch(e) {
             res.status(500).send({ error: e.message });
        }
    }

    function newAssetResponseFromOpenAssets(newAsset, callback) {
        try {
            var hex = JSON.parse(newAsset.transaction);
            var resp = {
                txHex: hex.raw,
                metadata: newAsset.asset.metadata,
                assetId: newAsset.assetId,
                assetAdress: newAsset.asset.address
            }
            callback(resp, null);
        }
        catch (e) {
            console.log(e);
            callback(null, e);
        }
    }

    function getOpenAssetsItem(AssetDefinition) {
        var deferred = Q.defer();
        if (AssetDefinition.selfhost) {
            var openAsset = {
                fees: AssetDefinition.fee,
                from: AssetDefinition.issue_adress,
                address: utils.getAssetAddressId(AssetDefinition.issue_adress),
                amount: AssetDefinition.amount,
                metadata: "u=" + AssetDefinition.metadat_url
            };
            deferred.resolve(openAsset);
        }
        else {
            hostMetadataFile(AssetDefinition)
            .then(function (url) {
                var openAsset = {
                    fees: AssetDefinition.fee,
                    from: AssetDefinition.issue_adress,
                    address: utils.getAssetAddressId(AssetDefinition.issue_adress),
                    amount: AssetDefinition.amount,
                    metadata: "u=" + url
                }
                deferred.resolve(openAsset);
            },
            function (error) {
                console.log(error);
                deferred.reject(new Error("error code was " + error));
            });

        }

        return deferred.promise;
    }

    function hostMetadataFile(AssetDefinition) {
        console.log("hostMetadataFile");
       var deferred = Q.defer();
        if(config.useS3 && process.env.AWSAKI && process.env.AWSSSK) {
              console.log("s3");
                 AWS.config.update({ accessKeyId: process.env.AWSAKI,
                        secretAccessKey: process.env.AWSSSK
                    });

                var s3bucket = new AWS.S3({params: {Bucket: 'coloredcoin-assets'}});
                var longurl = generateLocalMetadataPath(AssetDefinition);
                google.getShortUrl(longurl)
                .then(function (url) {
                    AssetDefinition.contract_url = url;
                    var metadata = utils.getMetadataFromAsset(AssetDefinition);
                    s3bucket.upload({Key: AssetDefinition.short_name, Body:JSON.stringify(metadata), ContentType: 'application/json' }, function(err, data) {
                        if (err) {
                          console.log("Error uploading data: ", err);
                            deferred.reject(new Error("Status code was " + err));
                        } else {
                          console.log("Successfully uploaded data to myBucket/myKey");
                           deferred.resolve(url);
                        }
                    });
                }, function (error) {
                    deferred.reject(new Error("Status code was " + response.statusCode));
                });

                
        }
        else
        {
            var longurl = generateLocalMetadataPath(AssetDefinition);
            google.getShortUrl(longurl)
            .then(function (url) {
                AssetDefinition.contract_url = url;
                utils.createMetadata(AssetDefinition);
                deferred.resolve(url);
            },
            function (error) {
                deferred.reject(new Error("Status code was " + response.statusCode));
            });
            
        }
        return deferred.promise;
      
    }

    function generateLocalMetadataPath(AssetDefinition) {
        if(config.useS3) {
             var path = "https://s3.amazonaws.com/coloredcoin-assets/" + AssetDefinition.short_name;
             return path;
        }
        else
        {
            var path = config.machineurl + "/metadata/" + AssetDefinition.short_name;
            return path;
        }
    }

    function returnIssuedAsset(transaction) {
        return transaction
    }

    function trySendGoogleAnalyticsEvent(req, action) {
         if (req.visitor) {
            var network = config.testnet === 'true' ? "testnet" : "mainnet"
            var category = 'API_' + network
            req.visitor.event(category, action).send()
         }
         else {
            console.log('Wont send analytics event, no accountId')
         }
    }

    return color;
})();