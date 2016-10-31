if (process.env.NODE_ENV && process.env.NODE_ENV === 'QA') {
  console.log = function () {}
}

var express = require('express')
var config = require('./config')
var server = require('./server')

var fs = require('fs')
var log4js = require('log4js')

var consoleLogger = log4js.getLogger('console')
var logentries = require('le_node')
var _ = require('lodash')

var log = logentries.logger({
  token: process.env.LETOKEN
})


// setup file logger if on elastic
if (fs.existsSync('/var/log/nodejs.log')) {
  log4js.loadAppender('file');
  log4js.addAppender(log4js.appenders.file('/var/log/nodejs.log'), 'eblog');
  consoleLogger = log4js.getLogger('eblog');
}


if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'QA') {
  console.log = (function () {
    // var orig = console.log;
    return function () {
      consoleLogger.debug.apply(consoleLogger, Array.prototype.slice.call(arguments));
      if (process.env.LETOKEN) {
        var args = Array.prototype.slice.call(arguments)
        args.unshift('info')
        log.log.apply(log, (args.length === 2 && typeof (args[1]) === 'object') ? _.cloneDeep(args, true) : args);
      }
    }
  })()
}

if (!process.env.NODE_ENV || process.env.NODE_ENV != 'QA') {
  console.error = (function () {
    var orig = console.error
    return function () {
      consoleLogger.error.apply(consoleLogger, Array.prototype.slice.call(arguments));
      if (process.env.LETOKEN) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('err')
        orig(args)
        log.log.apply(log, (args.length==2 && typeof(args[1])=='object') ? _.cloneDeep(args, true) : args);
      }
    }
  })()
}

// Add some string methods, remove it when we'll move to ECMA6 (Node.JS >4.x)
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

if (!process.env.LETOKEN) {
  console.error('No Logentries token found in enviorment')
} else {
  console.log('Logentries logging active')
}

var app = express()
server.init(app)

var port = process.env.PORT || 8080
app.listen(port)
console.log('Server is listening to *:' + port)
