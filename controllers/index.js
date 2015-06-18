var versions = [];
var fs = require('fs');
var express = require('express');
var sw = require("swagger-node-express");
var _ = require('lodash');
var config = require('../config.js');




fs.readdirSync(__dirname + '/').forEach(function (file) {
     var name = "./" + file;
    console.log("checking: " + name);
    var stat = fs.statSync( __dirname + "/" + file);
    if (stat && stat.isDirectory()) {
        console.log("adding version: " + file);
        exports[file] = require(name);
        versions.push({a: exports[file], b: file});

    }
});

module.exports.register = function (app) {
    versions.forEach(function (version, i) {
        var versionpath = express();
        console.log("loading: " + version.b);
        var swagger = sw.createNew();
        var versionpath = express.Router();
        swagger.setAppHandler(versionpath);

        version.a.register(versionpath, swagger);
        swagger.configureSwaggerPaths("", "/api-docs", "");
        swagger.configure( config.machineurl + "/" + version.b, "0." + version.b.match( /\d+/g ));

        app.use("/" + version.b, versionpath);
        if(versions.length -1 == i)
            app.use("/" , versionpath);
    })
}
