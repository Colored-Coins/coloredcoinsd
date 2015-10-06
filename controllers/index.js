

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
    console.log('rgister')
    versions.reverse().forEach(function (version, i) {
       var versionpath = express();
       console.log("loading: " + version.b);
       var swagger = sw.createNew();
       var versionpath = express.Router();
       swagger.setAppHandler(versionpath);
       versions.forEach(function (pastversion, x) {
            if(i <= x) // concat older version
                registerVersionedControllers(pastversion.b, versionpath, swagger);
       })
       swagger.configureSwaggerPaths("", "/api-docs", "");
       swagger.configure( config.machineurl + "/" + version.b, "0." + version.b.match( /\d+/g ));

       app.use("/" + version.b, versionpath);
       if(i == 0) {
          app.use("/" , versionpath);
          console.log('app path: ' + app.path() + ' versionpath: ' + version.b )
       }
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
        controllers[version][controller].registerRoutes(app, path.basename(__dirname), swagger, function (swaggerspec) {
            //var functionName = /^function\s+([\w\$]+)\s*\(/.exec( swaggerspec.action.toString() )[ 1 ]
            return !app.stack.some( function (route) {
                return route.route.path == swaggerspec.spec.path
            })
        });
    }
}