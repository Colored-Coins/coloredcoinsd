var express = require('express')
var server = require('./server')

var app = express()
server.init(app)

var port = process.env.PORT || 8080
app.listen(port, function (err) {
  if (err) return console.log('Critical error so killing server, error = ', err)
  console.log('Server is listening to *:' + port)
})
