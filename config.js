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
      url: "http://coloredcoinsexplore-env.elasticbeanstalk.com"
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
else
  module.exports = config;