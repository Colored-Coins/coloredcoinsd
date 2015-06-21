process.env.NODE_ENV = 'QA'
var assert = require("assert")
var app = require(__dirname + '/../server')
describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function (done){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
      done()
    })
  })
})