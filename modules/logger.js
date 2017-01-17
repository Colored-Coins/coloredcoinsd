var winston = require('winston')
var fs = require('fs')

var defaultTransports = [
  new (winston.transports.Console)({
    colorize: true,
    silent: false
  })
]

module.exports = function (settings) {
  var dir = settings.log_dir || '../log'
  var logentries_api_key = settings.logentries_api_key
  var cli = settings.cli
  var transports = settings.transports || defaultTransports
  var level = settings.level || 'silly'
  var logger
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  logger = new (winston.Logger)({level: level, transports: transports})
  var myToken = logentries_api_key
  if (myToken) {
    logger.add(winston.transports.Logentries, {
      token: myToken,
      level: level,
      colorize: true,
      silent: false,
      prettyPrint: true
    })
  }
  logger.filters.push(function (msg, meta, level) {
    return '(' + process.pid + ') - ' + msg
  })

  if (cli) logger.cli()
  return logger
}
