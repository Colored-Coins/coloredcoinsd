var versions = [];
var fs = require('fs')
var express = require('express')
var sw = require('swagger-node-express')
var _ = require('lodash')
var config = require('../config.js')
var path = require('path')

var controllers = []
var metadata = []

fs.readdirSync(__dirname + '/').forEach(function (file) {
  var name = './' + file
  console.log('checking: ' + name)
  var stat = fs.statSync(__dirname + '/' + file)
  if (stat && stat.isDirectory()) {
    console.log('adding version: ' + file)
    exports[file] = requireSubDirectory(file)
    versions.push({a: exports[file], b: file})
  }
})

module.exports.get_metadata = function (req) {
  var retVal = _.find(metadata, function (o) { return req.originalUrl.startsWith(o.path) })
  return retVal
}

module.exports.register = function (app) {
  console.log('register')
  var latestVersion
  versions.reverse().forEach(function (version, i) {
    // var versionpath = express();
    console.log('loading: ' + version.b)
    var swagger = sw.createNew()
    var versionpath = express.Router()
    swagger.setAppHandler(versionpath)
    versions.forEach(function (pastversion, x) {
      if (i <= x) { // concat older version
        registerVersionedControllers(pastversion.b, versionpath, swagger)
      }
    })
    swagger.configureSwaggerPaths('', '/api-docs', '')
    swagger.configure(config.machineurl + '/' + version.b, '0.' + version.b.match(/\d+/g))

    app.use('/' + version.b, versionpath)
    if (i === 0) {
      app.use('/', versionpath)
      latestVersion = version.b
      console.log('app path: ' + app.path() + ' versionpath: ' + version.b)
    }

    // Add routes metadata into data structure, for further retrival (for now it's only Piwik)
    Object.keys(swagger.resources).forEach(function (key, i) {
      var element = swagger.resources[key]
      var path = '/' + version.b + element.resourcePath
      metadata.push({'path': path, 'function_name': key, 'version': version.b})
      // console.log('Metadata obj: ' + JSON.stringify(metadata[metadata.length - 1]))
    })
  })
  var baseroutemetadata = _.filter(metadata, function (o) { return o.version === latestVersion });
  baseroutemetadata = _.map(baseroutemetadata, function (o) {
    o.path = o.path.replace('/' + latestVersion, '')
    return o
  })
  metadata = metadata.concat(baseroutemetadata)
  console.log('Routes metadata: ' + JSON.stringify(metadata))
}


function requireSubDirectory (subDirName) {
  controllers[subDirName] = []
  fs.readdirSync(__dirname + '/' + subDirName + '/').forEach(function (file) {
    if (file.match(/.+\.js/g) !== null && file !== 'index.js') {
      var name = file.replace('.js', '')
      exports[subDirName + '/' + name] = require('./' + subDirName + '/' + file)
      // try merge file
      controllers[subDirName].push(exports[subDirName + '/' + name])
    }
  })
}

function registerVersionedControllers (version, app, swagger) {
  console.log('Controllers registerd')
  console.log(controllers)
  console.log(controllers[version])
  console.log(version)
  // register the models
  require('../models')(swagger, version)
  for (var controller in controllers[version]) {
    // register the controllers
    controllers[version][controller].registerRoutes(app, path.basename(__dirname), swagger, function (swaggerspec) {
      // var functionName = /^function\s+([\w\$]+)\s*\(/.exec( swaggerspec.action.toString() )[ 1 ]
      return !app.stack.some(function (route) {
        return route.route.path === swaggerspec.spec.path
      })
    })
  }
}
