var _ = require('lodash')
var bitcoinjs = require('bitcoinjs-lib')

var findBestMatchByNeededAssets = function (utxos, assetList, key, tx, inputvalues, metadata) {
  console.log('findBestMatchByNeededAssets: start for ' + key)

  var selectedUtxos = []
  var foundAmount = 0

  // 1. try to find a utxo with such amount of the asset which is greater or equal to the target amount
  var bestGreaterOrEqualAmountUtxo = findBestGreaterOrEqualAmountUtxo(utxos, assetList, key)
  if (bestGreaterOrEqualAmountUtxo) {
    console.log('bestGreaterOrEqualAmountUtxo = ', bestGreaterOrEqualAmountUtxo)
    selectedUtxos[0] = bestGreaterOrEqualAmountUtxo
  } else {
    // 2. try to get the minimal number of utxos where the sum of their amount of the asset greater than or equal to the remaining target amount
    console.log('try to get utxos smaller than amount')
    var utxosSortedByAssetAmount = _.sortBy(utxos, function (utxo) { return -getUtxoAssetAmount(utxo, key) })
    var found = utxosSortedByAssetAmount.some(function (utxo) {
      selectedUtxos.push(utxo)
      foundAmount += getUtxoAssetAmount(utxo, key)
      return foundAmount >= assetList[key].amount
    })
    if (!found) selectedUtxos.length = 0
  }

  console.log('selectedUtxos = ',  _.map(selectedUtxos, function (utxo) { return { utxo: (utxo.txid + ':' + utxo.index), amount: getUtxoAssetAmount(utxo, key) } }))

  if (!selectedUtxos.length) {
    console.log('not enough amount')
    return false
  }

  console.log('adding inputs by assets and amounts')
  var lastAssetId
  selectedUtxos.some(function (utxo) {
    utxo.assets.forEach(function (asset) {
      try {
        var overflow = true
        console.log('maybe adding input for ' + asset.assetId)
        if (assetList[asset.assetId] && !assetList[asset.assetId].done) {
          console.log('probably adding input for ' + asset.assetId)
          console.log('transfer request: ' + assetList[asset.assetId].amount + ' available in utxo: ' + asset.amount)
          console.log('adding input')
          var inputIndex = tx.ins.length
          if (!tx.ins.some(function (txutxo, i) {
            if (txutxo.index === utxo.index && bitcoinjs.bufferutils.reverse(txutxo.hash).toString('hex') === utxo.txid) {
              console.log('more assets in same utxo')
              inputIndex = i
              return true
            }
            return false
          })) {
            tx.addInput(utxo.txid, utxo.index)
            console.log('setting input value ' + utxo.value + ' actual: ' + Math.round(utxo.value))
            inputvalues.amount += Math.round(utxo.value)
            console.log('setting input in asset list')
            if (metadata.flags && metadata.flags.injectPreviousOutput) {
              tx.ins[tx.ins.length - 1].script = bitcoinjs.Script.fromHex(utxo.scriptPubKey.hex)
            }
          }

          var aggregationPolicy = asset.aggregationPolicy || 'aggregatable'  // TODO - remove after all assets have this field
          var inputIndexInAsset = assetList[asset.assetId].inputs.length
          console.log('inputIndex = ' + inputIndex)
          console.log('inputIndexInAsset = ' + inputIndexInAsset)
          if (assetList[asset.assetId].amount <= asset.amount) {
            var totalamount = asset.amount
            if (aggregationPolicy === 'aggregatable' && lastAssetId === asset.assetId && assetList[asset.assetId].inputs.length) {
              console.log('#1 assetList[' + asset.assetId + '].inputs[' + (inputIndexInAsset - 1) + '].amount += ' + assetList[asset.assetId].amount)
              assetList[asset.assetId].inputs[inputIndexInAsset - 1].amount += assetList[asset.assetId].amount
            } else {
              console.log('#2 assetList[' + asset.assetId + '].inputs.push({ index: ' + inputIndex + ', amount: ' + assetList[asset.assetId].amount + '})')
              assetList[asset.assetId].inputs.push({index: inputIndex, amount: assetList[asset.assetId].amount})
            }
            console.log('setting change')
            assetList[asset.assetId].change = totalamount - assetList[asset.assetId].amount
            console.log('setting done')
            assetList[asset.assetId].done = true
          } else {
            if (aggregationPolicy === 'aggregatable' && lastAssetId === asset.assetId && assetList[asset.assetId].inputs.length) {
              console.log('#3 assetList[' + asset.assetId + '].inputs[' + (inputIndexInAsset - 1) + '].amount += ' + asset.amount)
              assetList[asset.assetId].inputs[inputIndexInAsset - 1].amount += asset.amount
            } else {
              console.log('#4 assetList[' + asset.assetId + '].inputs.push({ index: ' + inputIndex + ', amount: ' + asset.amount + '})')
              assetList[asset.assetId].inputs.push({index: inputIndex, amount: asset.amount})
            }
            assetList[asset.assetId].amount -= asset.amount
          }
        } else {
          console.log('not adding input for ' + asset.assetId)
        }
      } catch (e) { console.log('findBestMatchByNeededAssets: error = ', e) }

      lastAssetId = asset.assetId
    })

    console.log('returning ' + assetList[key].done)
    return assetList[key].done
  })
  console.log('findBestMatchByNeededAssets: done')
  return true
}

var findBestGreaterOrEqualAmountUtxo = function (utxos, assetList, key) {
  console.log('findBestGreaterOrEqualAmountUtxo for ', key)
  console.log('assetList[' + key + '].amount = ', assetList[key].amount)
  var foundLargerOrEqualAmountUtxo = false

  utxos.forEach(function (utxo) {
    utxo.score = 0
    var assetAmount = getUtxoAssetAmount(utxo, key)
    if (assetAmount < assetList[key].amount) {
      // console.log('for utxo ' + utxo.txid + ':' + utxo.index + ', assetAmount = ' + assetAmount + ', no score.')
      return
    }
    foundLargerOrEqualAmountUtxo = true
    if (assetAmount === assetList[key].amount) {
      // console.log('for utxo ' + utxo.txid + ':' + utxo.index + ', assetAmount = ' + assetAmount + ', score += 10000')
      utxo.score += 10000
    } else {  // assetAmount > assetList[key].amount
      // console.log('for utxo ' + utxo.txid + ':' + utxo.index + ', assetAmount = ' + assetAmount + ', score += 1000')
      utxo.score += 1000
    }

    for (var assetId in assetList) {
      if (assetId === key) continue

      assetAmount = getUtxoAssetAmount(utxo, assetId)
      console.log('checking assetId = ' + assetId)
      if (assetAmount === assetList[assetId].amount) {
        console.log('for utxo ' + utxo.txid + ':' + utxo.index + ', assetAmount = ' + assetAmount + ', score += 100')
        utxo.score += 100
      } else if (assetAmount > assetList[assetId].amount) {
        console.log('for utxo ' + utxo.txid + ':' + utxo.index + ', assetAmount = ' + assetAmount + ', score += 10')
        utxo.score += 10
      } else {  // assetAmount < assetList[assetId].amount
        console.log('for utxo ' + utxo.txid + ':' + utxo.index + ', assetAmount = ' + assetAmount + ', score += ' + (assetAmount / assetList[assetId].amount))
        utxo.score += assetAmount / assetList[assetId].amount
      }
    }
  })

  console.log('findBestGreaterOrEqualAmountUtxo: done iterating over utxos')
  return foundLargerOrEqualAmountUtxo && _.maxBy(utxos, function (utxo) { return utxo.score })
}

var getUtxoAssetAmount = function (utxo, assetId) {
  return _(utxo.assets).filter(function (asset) { return asset.assetId === assetId }).sumBy('amount')
}

module.exports = findBestMatchByNeededAssets
