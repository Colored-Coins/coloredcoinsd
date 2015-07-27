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
     



        



         //endpoint to swap an asset with another or btc
         var swapAsset = {
            'spec': {
                "description": "",
                "path": "/swapasset",
                "notes": "Returns a tx",
                "summary": "",
                "method": "POST",
                "parameters": [
                        sw.bodyParam("swapAssetRequest", "Asset Send Object", "swapAssetRequest")
                ],
                "type": "swapAssetResponse",
                "errorResponses": [swagger.errors.notFound('asset')],
                "nickname": "swapAsset"
            },
            'action': function (req, res) {
                console.log("swap asset action");
                trySwapAsset(req, res);
            }
        };

        swagger.addPost(swapAsset);



      


        console.log(path + ": color routes added.");


    }

   


    function trySwapAsset(req, res) {
        console.log("swapAsset")
        res.status(400).send({ error: 'not implemented'})
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

    return color;
})();