var config = {
    testnet: true,
    google_api_key: "AIzaSyBJfxobLSO_IM9tI1ATWpOelVInNuH1kBM",
    machineurl: "http://api.coloredcoins.org",
    useS3: true,
    bitcoind: {
          host: 'testnet.api.colu.co',
          port: 80,
          user: 'admin',
          pass: '9lpcjZpv221j47zF',
          path: '/rpc',
          timeout: 30000
    },
    blockexplorer: {
      url: "http://testnet.elasticbeanstalk.com"
    },
    torrentServer: {
      url:"http://development-colu-torrents.elasticbeanstalk.com"
    },
    minfee: 1000,
    writemultisig: true,
    mindustvalue: 600,
    checkFinanaceValidty: true
}


function module_exists( name ) {
  try { return require.resolve( name ) }
  catch( e ) { return false }
}

if(module_exists('./config-local'))
  module.exports = require('./config-local')
else{
  config.blockexplorer.url = process.env.BLOCKEXPLORER_URL || config.blockexplorer.url
  config.machineurl = process.env.MACHINEURL || config.machineurl
  config.bitcoind.host = process.env.BITCOIND_HOST || config.bitcoind.host
  config.bitcoind.port = process.env.BITCOIND_PORT || config.bitcoind.port
  config.bitcoind.user = process.env.BITCOIND_USER || config.bitcoind.user
  config.bitcoind.pass = process.env.BITCOIND_PASS || config.bitcoind.pass
  config.bitcoind.path = process.env.BITCOIND_PATH || config.bitcoind.path
  config.torrentServer.url = process.env.TORRENT_SERVER_URL || config.torrentServer.url
  config.testnet =  process.env.TESTNET || config.testnet

  module.exports = config;
}
