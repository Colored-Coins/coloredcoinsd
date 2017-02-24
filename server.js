var express = require('express')
var config = require('./config')
var bodyParser = require('body-parser')
var cors = require('cors')
var piwik = require('./piwik')
var logger = require('./modules/logger')
var requestId = require('cc-request-id')
var errors = require('cc-errors')
var session = require('continuation-local-storage').createNamespace(config.serverName)
var clsify = require('cls-middleware')
var expressWinston = require('express-winston')
var url = require('url')

var controllers = require('./controllers')
var _ = require('lodash')

var App = module.exports = {}

// Add some string methods, remove it when we'll move to ECMA6 (Node.JS >4.x)
App.initPolyfills = function() {
  if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function (suffix) {
      return this.indexOf(suffix, this.length - suffix.length) !== -1
    }
  }
  if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (searchString, position) {
      position = position || 0
      return this.substr(position, searchString.length) === searchString
    }
  }
  if (typeof Object.assign !== 'function') {
    Object.assign = function (target, varArgs) { // .length of function is 2
      'use strict'
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object')
      }

      var to = Object(target)

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index]

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey]
            }
          }
        }
      }
      return to
    }
  }
}

App.init = function(app) {
  var whitelist = config.corsWhitelist
  console.log('whitelist =', JSON.stringify(whitelist))
  var corsOptions
  if (whitelist) {
    whitelist = whitelist.split(',')
    console.log('whitelist =', JSON.stringify(whitelist))
    corsOptions = {
      origin: function (origin, callback){
        var originIsWhitelisted = whitelist.some(function (neddle) {
          return origin && origin.endsWith(neddle)
        })
        console.log('checking whitelist: ' + originIsWhitelisted + ' for: ' + origin)
        callback(null, originIsWhitelisted)
      }
    }
  }
  
  app.use(cors(corsOptions))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  
  app.use(function (req, res, next) {
    var request_metadata = controllers.get_metadata(req)
    if (request_metadata) {
      req.metadata = {}
      req.metadata.function_name = request_metadata.function_name
      req.metadata.version = request_metadata.version
    }
    next()
  })
  
  app.use(clsify(session))
  app.use(function (req, res, next) {
    session.set('context', {req: req, res: res})
    next()
  })
  if (config.secret) {
    app.use(requestId({secret: config.secret, namespace: config.serverName}))
  }

  // Adds optional express logging to winston logger
  expressWinston.requestWhitelist = _.concat(expressWinston.requestWhitelist, ['body', 'log_ip', 'log_url'])
  app.use(expressWinston.logger({
    winstonInstance: logger({logentries_api_key: process.env.LETOKEN}),
    meta: true,
    colorStatus: true
  }))
  app.use(function (req, res, next) {
    var ip = req.headers['x-forwarded-for'] || (req.connection && req.connection.remoteAddress)
    ip = ip || (req.socket && req.socket.remoteAddress) || (req.connection && req.connection.socket && req.connection.socket.remoteAddress)
    var parsed_url = url.parse(req.url) || {}
    var log_url = (parsed_url.pathname && parsed_url.pathname.toLowerCase()) || ''
    log_url = log_url.substring(0, getNthOccurrenceIndex(log_url, '/', 3))
    // for log-entries to parse Key-Value-Pairs ("/" in value is causing problems)
    req.log_ip = "'" + ip + "'"
    req.log_url = "'" + log_url + "'"
    next()
  })

  function getNthOccurrenceIndex(string, subString, index) {
    return string.split(subString, index).join(subString).length;
  }

  if (config.piwik.enabled) {
    console.log('Piwik is ENABLED, its configuration is: ' + JSON.stringify(config.piwik))
    app.use(piwik(config.piwik))
  } else {
    console.log('Piwik is DISABLED')
  }
  
  controllers.register(app)
  app.get('/is_running', function (req, res, next) { res.send('OK') })
  
  var docs_handler = express.static(__dirname + '/node_modules/swagger-node-express/swagger-ui');
  app.get(/^\/docs(\/.*)?$/, function (req, res, next) {
    if (req.url === '/docs') { // express static barfs on root url w/o trailing slash
      req.url = '/' + req.url.substr('/docs'.length)
    } else {
      req.url = req.url.substr('/docs'.length)
    }
    return docs_handler(req, res, next)
  })
  
  var options = {
    setHeaders: function (res, path, stat) {
      res.set('Content-Type', 'application/json; charset=utf-8')
    }
  }
  
  app.get('/headers', function (req, res, next) {
    console.log(req.headers)
    res.status(200).send({done: true})
  })
  
  app.use('/metadata', express.static(__dirname + '/static/metadata', options))
  app.use('/doc', express.static(__dirname + '/doc'))
  app.use('/', express.static(__dirname + '/doc'))
  
  app.use(errors.errorHandler({env: config.env}))
}
