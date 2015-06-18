module.exports = (function () {
    var bitcoinjs = require('bitcoinjs-lib');
    var base58check = require('bs58check');
    var fs = require('fs');
    var _ = require('lodash');

    function utils() { };


    function getP2SHVersion(base58Address) {
        var testkey = bitcoinjs.Address.fromBase58Check(base58Address);
        var version = _.find(bitcoinjs.networks, function (network) {
            return (testkey.version == network.scriptHash) || (testkey.version == network.pubKeyHash);
        });
        console.log("==================");
        console.log(version.scriptHash + " " + testkey.version);
        console.log("==================");
        return testkey ? testkey.version : 0x00;
    }

    function getP2SHVersionForOpenAssetsAddress(base58Address) {
        return 0x13;
    }

    function getP2SHVersionForOpenAssetsId(base58Address) {
        var testkey = bitcoinjs.Address.fromBase58Check(base58Address);
        if (testkey.version == bitcoinjs.networks.bitcoin.scriptHash || bitcoinjs.networks.bitcoin.pubKeyHash) {
            console.log("mainnet");
            return 0x17;
        }
        else {
             console.log("testnet");
            return 0x73;
        }
    }


    utils.getAssetAddressId = function getAssetAddressId(base58Address) {
        var addresshash = bitcoinjs.Address.fromBase58Check(base58Address).hash;
        var scriptP2PKH = addresshash; //bitcoinjs.scripts.pubKeyHashOutput(addresshash).getHash();
        var scriptP2SH = new Buffer(scriptP2PKH.length + 2);
        scriptP2PKH.copy(scriptP2SH, 2);
        scriptP2SH[0] = getP2SHVersionForOpenAssetsAddress(base58Address);
        scriptP2SH[1] = getP2SHVersion(base58Address);
        return base58check.encode(scriptP2SH);
    }


    utils.getassetId = function getassetId(base58Address) {
        console.log(base58Address);
        var addresshash = bitcoinjs.Address.fromBase58Check(base58Address).hash;
        console.log(addresshash);
        var scriptP2PKH = bitcoinjs.scripts.pubKeyHashOutput(addresshash).getHash();
        console.log(scriptP2PKH);
        var scriptP2SH = new Buffer(scriptP2PKH.length + 1);
        scriptP2PKH.copy(scriptP2SH, 1);
        scriptP2SH[0] = getP2SHVersionForOpenAssetsId(base58Address);
        console.log(scriptP2SH);
        console.log("++++++++++++++++++++++++");
        return base58check.encode(scriptP2SH);
    }


    utils.createMetadata = function createMetadata(AssetDefinition) {
        console.log("createMetadata: " + AssetDefinition.contract_url);

        try {
            var data = utils.getMetadataFromAsset(AssetDefinition);
            fs.writeFileSync(__dirname + "/static/metadata/" + AssetDefinition.short_name, JSON.stringify(data));
        }
        catch (e) {
            console.log(e);
        }


    }



    utils.getMetadataFromAsset = function createMetadata(AssetDefinition) {
        console.log("createMetadata: " + AssetDefinition.contract_url);

        try {
            metadata = {
                asset_ids: [utils.getassetId(AssetDefinition.issue_adress)
              ],
                contract_url: AssetDefinition.contract_url,
                name_short: AssetDefinition.short_name,
                name: AssetDefinition.name,
                issuer: AssetDefinition.metadata.issuer,
                description: AssetDefinition.metadata.description,
                description_mime: "text/x-markdown; charset=UTF-8",
                type: AssetDefinition.metadata.type,
                divisibility: AssetDefinition.metadata.divisibility,
                link_to_website: true,
                icon_url: AssetDefinition.metadata.icon_url,
                image_url: AssetDefinition.metadata.image_url,
                version: "1.0"
            };
            return metadata;
        }
        catch (e) {
            console.log(e);
            return {};
        }


    }

    return utils;

})();