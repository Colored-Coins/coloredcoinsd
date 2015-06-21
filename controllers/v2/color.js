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

    color.registerRoutes = function registerRoutes(app, path, swagger) {
     



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
            'action': function (req, res) {
                console.log("send asset action");
                trySendAsset(req, res);
            }
        };

        swagger.addPost(sendAsset);

        //endpoint to get asset metadata
        var getAssetMetadata = {
            'spec': {
                "description": "",
                "path": "/assetMetadata/{assetId}/{utxo}?",
                "notes": "Returns information about an asset issuence",
                "summary": "",
                "method": "GET",
                "parameters": [
                    sw.pathParam("assetId", "ID of Asset we want to get info for", "string"),
                    sw.pathParam("utxo", "provide data for secific utxo (optional)", "string", false)
                ],
                "type": "assetMetadata",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "getAssetMetadata"
            },
            'action': function (req, res) {
                api.getAssetMetadata(req.params.assetId).
                then(function(data) { res.status(200).send(data) }, function(data) { res.status(400).send(data); });
            }
        };

        swagger.addGet(getAssetMetadata);

        // endpoint to get all adresses holding an asset
         var getHoldingAdressesForAsset = {
            'spec': {
                "description": "",
                "path": "/stakeholders/{assetId}/{blockheight}?",
                "notes": "Returns a all adresses holding the asset",
                "summary": "",
                "method": "GET",
                "parameters": [
                        sw.pathParam("assetId", "ID of Asset we want to get info for", "string"),
                        sw.pathParam("blockheight", "block hieght to consider (optional)", "integer", false)
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


        console.log("color routes added.");


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
    function  tryGetAddress(req, res){
        try{
            var adder = utils.getAssetAddressId(req.body.address);
            client = redis.createClient();
            client.hmset("addresses", req.body.address, req.body.email, function(err, data){
                console.log(data);
            });
             res.json({adress: adder});
        }
        catch(e) {
             res.status(500).send({ error: e.message });
        }
    }

    function tryIssueAsset(req, res) {

        console.log("issueAsset")
        validateInput(req.body).
        then(api.uploadMetadata).
        then(api.createIssueTransaction).
        then(function(data){
            res.status(200).send(data);
        }).
        catch(function(error) { 
            console.log({ error: error.message, stack: error.stack});
            res.status(500).send({ error: error.message })
        }).done();

    }


    function returnError(res, error) {
         console.log(arguments);
         res.status(500).send({ error: error.message }) 
    }


    function validateInput(input) {
        var deferred = Q.defer();
        var valid = true;
        if (valid){
            deferred.resolve(input);
        }
        else {
            deferred.reject(new Error("metadata is invalid"));
        }
           
        return deferred.promise;
    }

    function trySendAsset(req, res) {
        try{
            console.log(req.body);
            //var reqData = JSON.parse(req.body)
            console.log('parsed ok');
            api.createSendAssetTansaction(req.body)
             .then(function(data){
                 res.json({ txHex: data.toHex()});
            })
            .catch(function(error){
                 console.log(error)
                 res.status(500).send({ error: error.message });
            });  
        }
        catch(e) {
            console.log(e)
             res.status(500).send({ error: e.message });
        }
    }

    function trygetAssetStakeholders(req, res) {
        try{
            api.getAssetStakeholders(req.params.assetId, req.params.blockheight)
            .then(function(data){
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
        return transaction;
    }

    return color;
})();