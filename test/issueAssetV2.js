var assert = require('assert')
var request = require('supertest')
var express = require('express')
var server = require('../server')
var bitcoinjs = require('bitcoinjs-lib')
var Transaction = bitcoinjs.Transaction
var tx = new bitcoinjs.Transaction()
var cc = require('cc-transaction')

var get_opreturn_data = function (asm) {
  return asm.substring('OP_RETURN '.length)
}

describe ('Api tests', function () {

  var expressApp
  before(function(done) {
    expressApp = express()
    server.initPolyfills()
    server.init(expressApp)
    done()
  })

  it('should create an issue asset transaction', function (done) {
    var amount = 27514
    var aggregationPolicy = 'dispersed'
    var divisibility = 2
    var lockStatus = false
  	var issuedata = {
  	  'issueAddress': 'mqgqBJfoTomHjoicLYWno4VLh7YJx3gAyp',
  	  'amount': amount,
  	  'fee': 1000,
      'aggregationPolicy': aggregationPolicy,
      'divisibility': divisibility,
  	  'reissueable': !lockStatus,
  	  'transfer': [
        {
          'address': 'msQDDmqiqqKa8eHqGUTR3GwzMLnGGt6Nmd',
          'amount': 32
        }
      ]
  	}
    request(expressApp)
    .post('/v2/issue')
    .send(issuedata)
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err)
      var body = res.body
      assert(body.txHex)
      var decodedTx = Transaction.fromHex(body.txHex)
      var opReturnOut
      decodedTx.outs.forEach(function (out) { if (out.script.toASM().substring(0, 'OP_RETURN'.length) === 'OP_RETURN') opReturnOut = out })
      var opReturnAsm = opReturnOut.script.toASM()
      var ccTx = cc.fromHex(get_opreturn_data(opReturnAsm))
      assert.equal(ccTx.type, 'issuance')
      assert.equal(ccTx.lockStatus, lockStatus)
      assert.equal(ccTx.aggregationPolicy, aggregationPolicy)
      assert.equal(ccTx.divisibility, divisibility)
      assert(body.assetId)
      assert.deepEqual(body.coloredOutputIndexes, [0])
      done();
    });
  });
})