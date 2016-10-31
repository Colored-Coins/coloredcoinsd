var express = require('express')
var config = require('./config')
var bodyParser = require('body-parser')
var cors = require('cors')
var piwik = require('./piwik')
var morgan = require('morgan')
var requestId = require('cc-request-id')
var errors = require('cc-errors')
var session = require('continuation-local-storage').createNamespace(config.serverName)
var clsify = require('cls-middleware')

var fs = require('fs')
var log4js = require('log4js')

var controllers = require('./controllers')
var _ = require('lodash')


var App = module.exports = {}

App.init = function(app) {
  app.use(morgan('combined'))
  
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
