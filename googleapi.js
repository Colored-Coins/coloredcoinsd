module.exports = (function () {
    var config = require("./config");
    var Client = require('node-rest-client').Client;
    var Q = require("q");

    var client = new Client();

    function googleapi() {
        console.log("registering googleapi methods");
        client.registerMethod("shortenUrl", "https://www.googleapis.com/urlshortener/v1/url", "POST");
    }

    googleapi.getShortUrl = function getShortUrl(url) {
        var deferred = Q.defer();
        var args = {
            parameters: { "key": config.google_api_key },
            headers: { "Content-Type": "application/json" },
            data: { "longUrl": url }
        };
        client.methods.shortenUrl(args, function (data, response) {
            console.log(data);
            if (response.statusCode == 200) {
                var json = JSON.parse(data);
                console.log("resoble short url: " + json.id);
                deferred.resolve(json.id);
            }
            else {
                deferred.reject(new Error("Status code was " + response.statusCode));
            }
        }).on('error', function (err) {
            console.log('something went wrong on the request', err.request.options);
            deferred.reject(new Error("Status code was " + err.request.options));
        });

        return deferred.promise;
    }


    googleapi();

    return googleapi;
})();