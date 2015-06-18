module.exports = (function () {
    var config = require("./config");
    var bitcore = require('bitcore');
    var Q = require("q");
    var BCRpcClient = require('bitcoind-rpc');
    var configuration = {
        protocol: 'http',
        user: 'rotem',
        pass: 'bitcoind',
        host: 'localhost',
        port: '8332',
      };


function bitcoindrpc() {}

var rpc2 = new BCRpcClient(configuration);

  var txids = [];

  function showNewTransactions() {
    rpc2.getRawMemPool(function (err, ret) {
      if (err) {
        console.error(err);
        return setTimeout(showNewTransactions, 10000);
      }

      function batchCall() {
        ret.result.forEach(function (txid) {
          if (txids.indexOf(txid) === -1) {
            rpc2.getRawTransaction(txid);
          }
        });
      }

      rpc2.batch(batchCall, function(err, rawtxs) {
        if (err) {
          console.error(err);
          return setTimeout(showNewTransactions, 10000);
        }

        rawtxs.map(function (rawtx) {
          var tx = new bitcore.Transaction(rawtx.result);
          console.log('\n\n\n' + tx.id + ':', tx.toObject());
        });

        txids = ret.result;
        setTimeout(showNewTransactions, 2500);
      });
    });
  }

  showNewTransactions();

  return bitcoindrpc;
})();