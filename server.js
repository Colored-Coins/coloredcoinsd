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
var geoip = require('geoip-lite')

var controllers = require('./controllers')
var _ = require('lodash')


var App = module.exports = {}


// Add some string methods, remove it when we'll move to ECMA6 (Node.JS >4.x)
App.initPolyfills = function() {
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (suffix) {
      return this.indexOf(suffix, this.length - suffix.length) !== -1
    }
  }
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
      position = position || 0
      return this.substr(position, searchString.length) === searchString
    }
  }
}


App.init = function(app) {
  var whitelist = ['coloredcoins.org', 'colu.co'];
  var corsOptions = {
    origin: function (origin, callback){
      var originIsWhitelisted = whitelist.some(function (neddle) {
        return origin && origin.endsWith(neddle)
      })
      console.log('checking whitelist: ' + originIsWhitelisted + ' for: ' + origin)
      callback(null, originIsWhitelisted)
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
  expressWinston.requestWhitelist = _.concat(expressWinston.requestWhitelist, ['body', 'ip', 'country', 'log_ip', 'log_url'])
  app.use(expressWinston.logger({
    winstonInstance: logger({logentries_api_key: process.env.LETOKEN}),
    meta: true,
    colorStatus: true
  }))
  app.use(function (req, res, next) {
    var ip = req.headers['x-forwarded-for'] || (req.connection && req.connection.remoteAddress)
    ip = ip || (req.socket && req.socket.remoteAddress) || (req.connection && req.connection.socket && req.connection.socket.remoteAddress)
    // for log-entries to parse Key-Value-Pairs ("/" in value is causing problems)
    req.log_ip = "'" + ip + "'"
    req.log_url = "'" + req.url + "'"
    var geo = geoip.lookup(ip)
    req.country = (geo && geo.country) || 'unknown'
    next()
  })
  
  if (config.piwik.enabled) {
    console.log('Piwik is ENABLED, its configuration is: ' + JSON.stringify(config.piwik))
    app.use(piwik(config.piwik))
  } else {
    console.log('Piwik is DISABLED')
  }
  
  controllers.register(app)
  app.get('/error', function (req, res, next) {
    next(new errors.InvalidTxidError({explanation: 'this is some error'}))
  })
  
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
