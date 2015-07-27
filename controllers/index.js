/*var versions = [];
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
*/

var versions = [];
var fs = require('fs');
var express = require('express');
var sw = require("swagger-node-express");
var _ = require('lodash');
var config = require('../config.js');
var controllers = []
var path = require('path')




fs.readdirSync(__dirname + '/').forEach(function (file) {
     var name = "./" + file;
    console.log("checking: " + name);
    var stat = fs.statSync( __dirname + "/" + file);
    if (stat && stat.isDirectory()) {
        console.log("adding version: " + file);
        exports[file] = requireSubDirectory(file);
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
       versions.forEach(function (pastversion, x) {
            if(i >= x) // concat older version
                registerVersionedControllers(pastversion.b, versionpath, swagger);
        })
        swagger.configureSwaggerPaths("", "/api-docs", "");
        swagger.configure( config.machineurl + "/" + version.b, "0." + version.b.match( /\d+/g ));

        app.use("/" + version.b, versionpath);
        if(versions.length -1 == i)
            app.use("/" , versionpath);
    })
}


function requireSubDirectory(subDirName) {
    controllers[subDirName] = []
    require('fs').readdirSync(__dirname + '/' + subDirName + '/').forEach(function(file) {
      if (file.match(/.+\.js/g) !== null && file !== 'index.js') {
        var name = file.replace('.js', '');
        exports[subDirName + '/' +  name] = require('./' +subDirName + '/' + file);
        // try merge file
        controllers[subDirName].push(exports[subDirName + '/' + name]);
      }
    });
}

function registerVersionedControllers(version, app, swagger) {
 console.log("Controllers registerd");
 console.log(controllers)
  console.log(controllers[version])
  console.log(version)
    //register the models
    require("../models")(swagger, version);
    for (var controller in controllers[version]) {
        //register the controllers
        controllers[version][controller].registerRoutes(app, path.basename(__dirname), swagger);
    }
}