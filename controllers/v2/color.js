module.exports = (function () {
    var google = require('../../googleapi.js');
    var sw = require("swagger-node-express");
    var utils = require('../../utils.js');
    var config = require('../../config.js');
    var redis = require('redis');
    var Q = require("q");
    var AWS = require("aws-sdk");
    var api = require('../../coluutils.js');
    var errors = require('cc-errors');

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
                "notes": "Returns an issued asset",
                "summary": "",
                "method": "POST",
                "parameters": [
                        sw.bodyParam("issueAssetRequest", "Asset Issue Object", "issueAssetRequest")
                ],
                "type": "issueAssetResponse",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "issueAsset"
            },
            'action': function (req, res, next) {
                console.log("issue action");
                tryIssueAsset(req, res, next);
            }
        };

        swagger.addPost(issueAsset);

        //endpoint to send an asset
         var sendAsset = {
            'spec': {
                "description": "",
                "path": "/sendasset",
                "notes": "Returns a sent asset",
                "summary": "",
                "method": "POST",
                "parameters": [
                        sw.bodyParam("sendAssetRequest", "Asset Send Object", "sendAssetRequest")
                ],
                "type": "sendAssetResponse",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "sendAsset"
            },
            'action': function sendAsset(req, res, next) {
                console.log("send asset action");
                trySendAsset(req, res, next);
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
            'action': function (req, res, next) {
                console.log("broadcast asset action");
                tryBroadcastAsset(req, res, next);
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
                    sw.pathParam("assetId", "ID of Asset we want to get info for", "string", true),
                    sw.pathParam("utxo", "provide data for secific utxo", "string", false),
                    sw.queryParam("verbosity", "integer to determine how detailed is the metadata, supported values are 0 and 1 where 0 is the most basic. Default is 1.", "string", false)
                ],
                "type": "assetMetadataResponse",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "getAssetMetadata"
            },
            'action': function (req, res, next) {
                var verbosity = parseInt(req.query.verbosity)
                verbosity = ([0,1].indexOf(verbosity) > -1)? verbosity : 1
                api.getAssetMetadata(req.params.assetId, req.params.utxo, verbosity).
                then(
                    function(data) { res.status(200).send(data) }, 
                    next
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
            'action': function (req, res, next) {
              api.getAddressInfo(req.params.address).
              then(function (data) {
                var jsondata = api.safeParse(data)
                res.status(200).send(Array.isArray(req.params.address) ? jsondata : jsondata[0])
              }, next)
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
                        sw.pathParam("numConfirmations", "min confirmations (optional)", "integer", false)
                ],
                "type": "assetHolders",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "getStakeholders"
            },
            'action': function (req, res, next) {
                console.log("get stakeholders action");
                trygetAssetStakeholders(req, res, next);
            }
        };

        swagger.addGet(getHoldingAdressesForAsset);


        console.log(path + ": color routes added.");


    }

    function tryBroadcastAsset(req, res, next) {
        console.log("tryBroadcastAsset")

        api.broadcastTx(req.body.txHex).
        then(function(txid){
            api.requestParseTx(txid);
            res.status(200).send({txid: txid});
        }).
        catch(next).done();

    }


    function tryIssueAsset(req, res, next) {

        console.log("issueAsset")
        validateInput(req.body).
        then(checkParameters).
        then(api.uploadMetadata).
        then(api.createIssueTransaction).
        then(function(data) {
          api.seedMetadata(data.metadata.sha1)
          var response = {txHex: data.txHex, assetId: data.assetId, coloredOutputIndexes: data.coloredOutputIndexes }
          if(data.metadata.privateKey) { response.privateKey = data.metadata.privateKey }
          if(data.multisigOutputs && data.multisigOutputs.length > 0) { response.multisigOutputs = data.multisigOutputs }
          res.status(200).send(response);
        }).
        catch(next).done();

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
            })) { deferred.reject(new errors.ValidationError({explanation: "Can't use both an address and pubKeys, please choose one"})) }
            else if(transferArr.some(function(transfer) {
                if(transfer.pubKeys && !transfer.m) {
                    return true
                }
                return false
            })) { deferred.reject(new errors.ValidationError({explanation: "Missing parameter m, number for signatures required for multisig reedem"})) }
            else if(transferArr.some(function(transfer) {
                if(!transfer.pubKeys && !transfer.address) {
                    return true
                }
                return false
            })) { deferred.reject(new errors.ValidationError({explanation: "Missing parameter address or pubKeys in transfer object"})) }

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
            deferred.reject(new errors.ValidationError({explanation: ('Input is invalid. Missing: ' + missing)}));
        }
           
        return deferred.promise;
    }


    

    function trySendAsset(req, res, next) {
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
                 res.json({ txHex: data.tx.toHex(), metadataSha1: data.metadata.sha1, multisigOutputs: data.multisigOutputs });
            })
            .catch(next);  
        }
        catch(e) {
            next(e)
        }
    }

    function trygetAssetStakeholders(req, res, next) {
        try{
            api.getAssetStakeholders(req.params.assetId, req.params.numConfirmations)
            .then(function(data) {             
                 res.json(data);
            })
            .catch(next);  
        }
        catch(e) {
            next(e)
        }
    }

    return color;
})();