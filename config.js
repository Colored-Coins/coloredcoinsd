var config = {
  testnet: true,
  google_api_key: 'AIzaSyBJfxobLSO_IM9tI1ATWpOelVInNuH1kBM',
  machineurl: 'http://api.coloredcoins.org',
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
    url: 'http://testnet.elasticbeanstalk.com'
  },
  torrentServer: {
    url: 'http://dev.metadata.coloredcoins.org'
  },
  piwik: {
    url: 'https://analytics.colu.co/piwik.php',
    token: '04ed96c9526091a248bc30f4dff36ed6',
    siteid: 12,
    debug: true,
    result_dim_id: 1,
    method_dim_id: 2,
    version_dim_id: 3
  },
  minfee: 1000,
  writemultisig: true,
  mindustvalue: 600,
  mindustvaluemultisig: 700,
  feePerKb: 1000,
  checkFinanaceValidty: true
}


function module_exists (name) {
  try {
    return require.resolve(name) 
  } catch (e) {
    return false
  }
}

if (module_exists('./config-local')) {
  module.exports = require('./config-local')
} else {
  config.blockexplorer.url = process.env.BLOCKEXPLORER_URL || config.blockexplorer.url
  config.machineurl = process.env.MACHINEURL || config.machineurl
  config.bitcoind.host = process.env.BITCOIND_HOST || config.bitcoind.host
  config.bitcoind.port = process.env.BITCOIND_PORT || config.bitcoind.port
  config.bitcoind.user = process.env.BITCOIND_USER || config.bitcoind.user
  config.bitcoind.pass = process.env.BITCOIND_PASS || config.bitcoind.pass
  config.bitcoind.path = process.env.BITCOIND_PATH || config.bitcoind.path
  config.torrentServer.url = process.env.TORRENT_SERVER_URL || config.torrentServer.url
  config.testnet = process.env.TESTNET || config.testnet
  config.torrentServer.token = process.env.TORRENT_SERVER_TOKEN || config.torrentServer.token
  config.minfee = parseInt(process.env.MINFEE || '' + config.minfee, 10)
  config.mindustvalue = parseInt(process.env.MINDUSTVALUE || '' + config.mindustvalue, 10)
  config.mindustvaluemultisig = parseInt(process.env.MINDUSTVALUEMULTISIG || '' + config.mindustvaluemultisig, 10)
  config.feePerKb = parseInt(process.env.FEEPERKB || '' + config.feePerKb, 10)
  config.piwik.url = process.env.PIWIK_URL || config.piwik.url
  config.piwik.token = process.env.PIWIK_TOKEN || config.piwik.token
  config.piwik.siteid = parseInt(process.env.PIWIK_SITEID || config.piwik.siteid || '0', 10)
  config.piwik.result_dim_id = process.env.PIWIK_RESULT_DIM_ID || config.piwik.result_dim_id
  config.piwik.method_dim_id = process.env.PIWIK_METHOD_DIM_ID || config.piwik.method_dim_id
  config.piwik.version_dim_id = process.env.PIWIK_VERSION_DIM_ID || config.piwik.version_dim_id
  config.piwik.debug = process.env.PIWIK_DEBUG || config.piwik.debug
  config.piwik.enabled = config.piwik.url && config.piwik.token && config.piwik.siteid
  module.exports = config
}
