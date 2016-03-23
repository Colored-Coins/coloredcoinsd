var assert = require('assert')
var findBestMatchByNeededAssets = require('../modules/findBestMatchByNeededAssets')
var bitcoinjs = require('bitcoinjs-lib')
var _ = require('lodash')

var metadata = {}

var getUtxoAssetAmount = function (utxo, assetId) {
  return _(utxo.assets).filter(function (asset) { return asset.assetId === assetId }).sumBy('amount')
}

var findInput = function (utxos, tx, inputIndex) {
	return _.find(utxos, function (utxo) { return (utxo.txid === tx.ins[inputIndex].hash.toString('hex')) && (utxo.index === tx.ins[inputIndex].index) })
}

describe('Test UTXO selection algorithm', function () {

  it('should return a single UTXO with equal amount to the target amount', function (done) {
  	var tx = new bitcoinjs.Transaction()
  	var inputvalues = {amount: 0}
  	var assetList = {
			A: {
				amount: 750,
				inputs: []
			}
		}
		var utxos = []
		for (var i = 0 ; i < 1000 ; i++) {
			utxos.push({
				index: i,
				txid: '0000000000000000000000000000000000000000000000000000000000000000',
				value: 4000,
				assets: [
					{
						assetId: 'A',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000001',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'dispersed'
					}
				]
			}) 
		}
    findBestMatchByNeededAssets(utxos, assetList, 'A', tx, inputvalues, metadata)
    assert.equal(tx.ins.length, 1)
    assert.equal(assetList['A'].inputs.length, 1)
    assert.equal(findInput(utxos, tx, 0).assets[0].amount === assetList['A'].inputs[0].amount, true)
    done()
  })

  it('should return a single UTXO with greater amount than the target amount', function (done) {
  	var tx = new bitcoinjs.Transaction()
  	var inputvalues = {amount: 0}
  	var assetList = {
			A: {
				amount: 750,
				inputs: []
			}
		}
		var utxos = []
		for (var i = 0 ; i < 1000 ; i++) {
			utxos.push({
				index: i,
				txid: '0000000000000000000000000000000000000000000000000000000000000000',
				value: 4000,
				assets: [
					{
						assetId: 'A',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000001',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'dispersed'
					}
				]
			}) 
		}
  	utxos.splice(750, 1)
    findBestMatchByNeededAssets(utxos, assetList, 'A', tx, inputvalues, metadata)
    assert.equal(tx.ins.length, 1)
    assert.equal(assetList['A'].inputs.length, 1)
    assert.equal(findInput(utxos, tx, 0).assets[0].amount > assetList['A'].inputs[0].amount, true)
    done()
  })

  it('should return minimal number of utxos with amount lower than target, different payments with dispersed asset', function (done) {
  	var tx = new bitcoinjs.Transaction()
  	var inputvalues = {amount: 0}
  	var assetList = {
			A: {
				amount: 3960,
				inputs: []
			}
		}
		var utxos = []
		for (var i = 0 ; i < 1000 ; i++) {
			utxos.push({
				index: i,
				txid: '0000000000000000000000000000000000000000000000000000000000000000',
				value: 4000,
				assets: [
					{
						assetId: 'A',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000001',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'dispersed'
					}
				]
			}) 
		}
    findBestMatchByNeededAssets(utxos, assetList, 'A', tx, inputvalues, metadata)
    assert.equal(tx.ins.length, 4)
    assert.equal(assetList['A'].inputs.length, 4)
    assert.equal(findInput(utxos, tx, 0).assets[0].amount, 999)
    assert.equal(findInput(utxos, tx, 1).assets[0].amount, 998)
    assert.equal(findInput(utxos, tx, 2).assets[0].amount, 997)
    assert.equal(findInput(utxos, tx, 3).assets[0].amount, 996)
    done()
  })

  it('should return minimal number of utxos with amount lower than target, same payment with aggregatable asset', function (done) {
  	var tx = new bitcoinjs.Transaction()
  	var inputvalues = {amount: 0}
  	var assetList = {
			A: {
				amount: 3960,
				inputs: []
			}
		}
		var utxos = []
		for (var i = 0 ; i < 1000 ; i++) {
			utxos.push({
				index: i,
				txid: '0000000000000000000000000000000000000000000000000000000000000000',
				value: 4000,
				assets: [
					{
						assetId: 'A',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000001',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'aggregatable'
					}
				]
			}) 
		}
    findBestMatchByNeededAssets(utxos, assetList, 'A', tx, inputvalues, metadata)
    assert.equal(tx.ins.length, 4)
    assert.equal(assetList['A'].inputs.length, 1)		// = number of payments
    assert.equal(findInput(utxos, tx, 0).assets[0].amount, 999)
    assert.equal(findInput(utxos, tx, 1).assets[0].amount, 998)
    assert.equal(findInput(utxos, tx, 2).assets[0].amount, 997)
    assert.equal(findInput(utxos, tx, 3).assets[0].amount, 996)
    assert.equal(assetList['A'].inputs[0].amount, 3960)
    done()
  })

  it('should return minimal number of utxos with amount lower than target, aggregate few instances of an aggregatable asset in same utxo', function (done) {
  	var tx = new bitcoinjs.Transaction()
  	var inputvalues = {amount: 0}
  	var assetList = {
			A: {
				amount: 3960,
				inputs: []
			}
		}
		var utxos = []
		for (var i = 0 ; i < 1000 ; i++) {
			utxos.push({
				index: i,
				txid: '0000000000000000000000000000000000000000000000000000000000000000',
				value: 4000,
				assets: [
					{
						assetId: 'A',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000001',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'aggregatable'
					},
					{
						assetId: 'A',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000001',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'aggregatable'
					}
				]
			}) 
		}
    findBestMatchByNeededAssets(utxos, assetList, 'A', tx, inputvalues, metadata)
    assert.equal(tx.ins.length, 2)
    assert.equal(assetList['A'].inputs.length, 1)		// = number of payments
    assert.equal(assetList['A'].inputs[0].amount, 3960)
    assert.equal(findInput(utxos, tx, 0).assets[0].amount, 999)
    assert.equal(findInput(utxos, tx, 0).assets[0].amount, 999)
    assert.equal(findInput(utxos, tx, 1).assets[1].amount, 998)
    assert.equal(findInput(utxos, tx, 1).assets[1].amount, 998)
    done()
  })

	it('should return minimal number of utxos with amount lower than target, aggregate payments of aggregatable assets and split payments when different asset IDs', function (done) {
		var tx = new bitcoinjs.Transaction()
		var inputvalues = {amount: 0}
		var assetList = {
			A: {
				amount: 3960,
				inputs: []
			},
			B: {
				amount: 3960,
				inputs: []				
			}
		}
		var utxos = []
		for (var i = 0 ; i < 1000 ; i++) {
			utxos.push({
				index: i,
				txid: '0000000000000000000000000000000000000000000000000000000000000000',
				value: 4000,
				assets: [
					{
						assetId: ((i % 2) === 1) ? 'A' : 'B',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000001',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'aggregatable'
					}
				]
			}) 
		}
		findBestMatchByNeededAssets(utxos, assetList, 'A', tx, inputvalues, metadata)
		findBestMatchByNeededAssets(utxos, assetList, 'B', tx, inputvalues, metadata)
		assert.equal(tx.ins.length, 8)
		assert.equal(assetList['A'].inputs.length, 1)
		assert.equal(assetList['B'].inputs.length, 1)
		assert.equal(assetList['A'].inputs[0].amount, 3960)
		assert.equal(assetList['B'].inputs[0].amount, 3960)
		assert.equal(findInput(utxos, tx, 0).assets[0].amount, 999)
		assert.equal(findInput(utxos, tx, 0).assets[0].assetId, 'A')
		assert.equal(findInput(utxos, tx, 1).assets[0].amount, 997)
		assert.equal(findInput(utxos, tx, 1).assets[0].assetId, 'A')
		assert.equal(findInput(utxos, tx, 2).assets[0].amount, 995)
		assert.equal(findInput(utxos, tx, 2).assets[0].assetId, 'A')
		assert.equal(findInput(utxos, tx, 3).assets[0].amount, 993)
		assert.equal(findInput(utxos, tx, 3).assets[0].assetId, 'A')
		assert.equal(findInput(utxos, tx, 4).assets[0].amount, 998)
		assert.equal(findInput(utxos, tx, 4).assets[0].assetId, 'B')
		assert.equal(findInput(utxos, tx, 5).assets[0].amount, 996)
		assert.equal(findInput(utxos, tx, 5).assets[0].assetId, 'B')
		assert.equal(findInput(utxos, tx, 6).assets[0].amount, 994)
		assert.equal(findInput(utxos, tx, 6).assets[0].assetId, 'B')
		assert.equal(findInput(utxos, tx, 7).assets[0].amount, 992)
		assert.equal(findInput(utxos, tx, 7).assets[0].assetId, 'B')
		done()
	})

	it('should return minimal number of utxos with amount lower than target, split payments when inputs contain different asset IDs', function (done) {
		var tx = new bitcoinjs.Transaction()
		var inputvalues = {amount: 0}
		var assetList = {
			A: {
				amount: 3960,
				inputs: []
			}
		}
		var utxos = []
		for (var i = 0 ; i < 1000 ; i++) {
			utxos.push({
				index: i,
				txid: '0000000000000000000000000000000000000000000000000000000000000000',
				value: 4000,
				assets: [
					{
						assetId: 'A',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000001',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'aggregatable'
					},
					{
						assetId: 'B',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000002',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'aggregatable'
					}		
				]
			}) 
		}
		findBestMatchByNeededAssets(utxos, assetList, 'A', tx, inputvalues, metadata)
		assert.equal(tx.ins.length, 4)
		assert.equal(assetList['A'].inputs.length, 4)
		assert.equal(assetList['A'].inputs[0].amount, 999)
		assert.equal(assetList['A'].inputs[1].amount, 998)
		assert.equal(assetList['A'].inputs[2].amount, 997)
		assert.equal(assetList['A'].inputs[3].amount, 966)	// leftover
		done()
	})

  it('should return minimal number of utxos with amount lower than target for different asset IDs, split payments when inputs contain different asset IDs', function (done) {
  	var tx = new bitcoinjs.Transaction()
  	var inputvalues = {amount: 0}
  	var assetList = {
			A: {
				amount: 3960,
				inputs: []
			},
			B: {
				amount: 3960,
				inputs: []
			}
		}
		var utxos = []
		for (var i = 0 ; i < 1000 ; i++) {
			utxos.push({
				index: i,
				txid: '0000000000000000000000000000000000000000000000000000000000000000',
				value: 4000,
				assets: [
					{
						assetId: 'A',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000001',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'aggregatable'
					},
					{
						assetId: 'B',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000002',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'aggregatable'
					}		
				]
			}) 
		}
    findBestMatchByNeededAssets(utxos, assetList, 'A', tx, inputvalues, metadata)
    findBestMatchByNeededAssets(utxos, assetList, 'B', tx, inputvalues, metadata)
    assert.equal(tx.ins.length, 4)
    assert.equal(assetList['A'].inputs.length, 4)
    assert.equal(assetList['B'].inputs.length, 4)
    assert.equal(assetList['A'].inputs[0].amount, 999)
    assert.equal(assetList['A'].inputs[0].index, 0)
    assert.equal(assetList['A'].inputs[1].amount, 998)
    assert.equal(assetList['A'].inputs[1].index, 1)
    assert.equal(assetList['A'].inputs[2].amount, 997)
    assert.equal(assetList['A'].inputs[2].index, 2)
    assert.equal(assetList['A'].inputs[3].amount, 966)	// leftover
    assert.equal(assetList['A'].inputs[3].index, 3)

    assert.equal(assetList['B'].inputs[0].amount, 999)
    assert.equal(assetList['B'].inputs[0].index, 0)
    assert.equal(assetList['B'].inputs[1].amount, 998)
    assert.equal(assetList['B'].inputs[1].index, 1)
    assert.equal(assetList['B'].inputs[2].amount, 997)
    assert.equal(assetList['B'].inputs[2].index, 2)
    assert.equal(assetList['B'].inputs[3].amount, 966)	// leftover
    assert.equal(assetList['B'].inputs[3].index, 3)
    done()
  })

  it('should return minimal number of utxos with amount lower than target for different asset IDs, split payments when inputs contain different asset IDs, aggregate when aggregatable', function (done) {
  	var tx = new bitcoinjs.Transaction()
  	var inputvalues = {amount: 0}
  	var assetList = {
			A: {
				amount: 3960,
				inputs: []
			},
			B: {
				amount: 3960,
				inputs: []
			}
		}
		var utxos = []
		var utxo
		for (var i = 0 ; i < 1000 ; i++) {
			utxo = {
				index: i,
				txid: '0000000000000000000000000000000000000000000000000000000000000000',
				value: 4000,
				assets: [
					{
						assetId: 'A',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000001',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'aggregatable'
					}	
				]
			}
			if (i === 999 || i === 998) {
				utxo.assets.push({
					assetId: 'B',
	 				amount: i + 1000,
	 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000002',
	 				divisibility: 2,
	 				lockStatus: false,
	 				aggregationPolicy: 'aggregatable'					
				})
			}
			utxos.push(utxo)
		}
    findBestMatchByNeededAssets(utxos, assetList, 'A', tx, inputvalues, metadata)
    findBestMatchByNeededAssets(utxos, assetList, 'B', tx, inputvalues, metadata)
    assert.equal(tx.ins.length, 4)
    assert.equal(assetList['A'].inputs.length, 3)
    assert.equal(assetList['B'].inputs.length, 2)
    assert.equal(assetList['A'].inputs[0].amount, 999)
    assert.equal(assetList['A'].inputs[0].index, 0)
    assert.equal(assetList['A'].inputs[1].amount, 998)
    assert.equal(assetList['A'].inputs[1].index, 1)
    assert.equal(assetList['A'].inputs[2].amount, 1963) // aggregate
    assert.equal(assetList['A'].inputs[2].index, 2)

    assert.equal(assetList['B'].inputs[0].amount, 1999)
    assert.equal(assetList['B'].inputs[0].index, 0)
    assert.equal(assetList['B'].inputs[1].amount, 1961) // leftover
    assert.equal(assetList['B'].inputs[1].index, 1)
    done()
  })

  it('should return minimal number of utxos with amount lower than target for different asset IDs, split payments when inputs contain different asset IDs, don\'t aggregate when dispersed', function (done) {
  	var tx = new bitcoinjs.Transaction()
  	var inputvalues = {amount: 0}
  	var assetList = {
			A: {
				amount: 3960,
				inputs: []
			},
			B: {
				amount: 3960,
				inputs: []
			}
		}
		var utxos = []
		var utxo
		for (var i = 0 ; i < 1000 ; i++) {
			utxo = {
				index: i,
				txid: '0000000000000000000000000000000000000000000000000000000000000000',
				value: 4000,
				assets: [
					{
						assetId: 'A',
		 				amount: i,
		 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000001',
		 				divisibility: 2,
		 				lockStatus: false,
		 				aggregationPolicy: 'dispersed'
					}	
				]
			}
			if (i === 999 || i === 998) {
				utxo.assets.push({
					assetId: 'B',
	 				amount: i + 1000,
	 				issueTxid: '0000000000000000000000000000000000000000000000000000000000000002',
	 				divisibility: 2,
	 				lockStatus: false,
	 				aggregationPolicy: 'aggregatable'					
				})
			}
			utxos.push(utxo)
		}
    findBestMatchByNeededAssets(utxos, assetList, 'A', tx, inputvalues, metadata)
    findBestMatchByNeededAssets(utxos, assetList, 'B', tx, inputvalues, metadata)
    assert.equal(tx.ins.length, 4)
    assert.equal(assetList['A'].inputs.length, 4)
    assert.equal(assetList['B'].inputs.length, 2)
    assert.equal(assetList['A'].inputs[0].amount, 999)
    assert.equal(assetList['A'].inputs[0].index, 0)
    assert.equal(assetList['A'].inputs[1].amount, 998)
    assert.equal(assetList['A'].inputs[1].index, 1)
    assert.equal(assetList['A'].inputs[2].amount, 997) // does not aggregate even though does not have other assets in inputs
    assert.equal(assetList['A'].inputs[2].index, 2)
    assert.equal(assetList['A'].inputs[3].amount, 966)
    assert.equal(assetList['A'].inputs[3].index, 3)

    assert.equal(assetList['B'].inputs[0].amount, 1999)
    assert.equal(assetList['B'].inputs[0].index, 0)
    assert.equal(assetList['B'].inputs[1].amount, 1961) // leftover
    assert.equal(assetList['B'].inputs[1].index, 1)
    done()
  })

})