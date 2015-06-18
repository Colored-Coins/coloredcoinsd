var assert = require('assert')
var Client = require('node-rest-client').Client
var should = require('should'); 
var assert = require('assert');
var request = require('supertest');


/*
{
  "issueAddress": "string",
  "name": "string",
  "short_name": "string",
  "amount": "string",
  "fee": "integer",
  "issuer": "string",
  "icon_url": "string",
  "image_url": "string",
  "version": "string",
  "type": "string",
  "description": "string",
  "reissueable": "boolean",
  "reissue": {
    "assetId": "string",
    "blockhash": "string",
    "txhash": "integer"
  },
  "bills": [
    {
      "size": "string",
      "outindex": "integer",
      "amount": "string"
    }
  ],
  "transferfees": {
    "reissueMuteable": "boolean",
    "canAddonTransfer": "boolean",
    "fees[
      {
        "size": "string",
        "outindex": "integer",
        "amount": "string"
      }
    ]
  },
  "validity": {
    "maxTransferTimes": "integer",
    "validOnlyForAdresses": [
      "string"
    ]
  },
  "constraints": [
    {
      "requireOnline": "boolean"
    }
  ],
  "mints": {
    "outindex": "integer",
    "amount": "string"
  },
  "test": [
    null
  ]
}*/



describe ('Api tests', function () {
  describe ('issueAsset', function () {
    this.timeout(10000);
    it('should create an inssue asset trasantion', function (done) {
    	var issuedata = {
			  "issueAddress": "mxNTyQ3WdFMQE7SGVpSQGXnSDevGMLq7dg",
			  "name": "test asset d2",
			  "short_name": "tst12a",
			  "amount": "1000",
			  "fee": 1000,
			  "issuer": "anon",
			  "icon_url": "",
			  "image_url": "",
			  "version": "1.0",
			  "type": "none",
			  "description": "la la la la",
			  "reissueable": true,
			  "transferfees": {
			    "reissueMuteable": true,
			    "canAddonTransfer": false,
			    "fees": [
			      {
			       "to": "mxNTyQ3WdFMQE7SGVpSQGXnSDevGMLq7dg",
             "amount": "600",
             "asset": "sadfasdfasd"
			      }
			    ]
			  },
			  "mints": {
			    "outindex": 0,
			    "amount": "100"
			  }
			}
	    request('http://localhost:8080')
		.post('/v2/issue')
		.send(issuedata)
	    // end handles the response
		.end(function(err, res, body) {
	          if (err) {
	            throw err;
	          }
	          assert('foo' !== 'bar', 'foo is not bar');
	          //throw new Error("missing prev key");
	          // this is should.js syntax, very clear
	          if(res.status != 200)
	          	throw new Error("Unexpected server response: " + JSON.stringify(res.body));
	          //res.status.should.be.equal(200)	          
	          
	          

	          done();
	        });
	    });
    })
  })