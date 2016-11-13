exports.models = {
    "burnAssetResponse": {
        "id": "burnAssetResponse",
        "required": ["txHex", "coloredOutputIndexes", "multisigOutputs"],
        "properties": {
            "txHex": {
                "type": "string",       
                "address": "Hex of the transaction"
            },
            "coloredOutputIndexes": {
                "type": "array",
                "items": {
                    "type": "number"
                },
                "description": "indexes of outputs assets were explicitly transferred to"
            },
            "multisigOutputs": {
                "type": "array",
                "items": {
                    "type": "number"
                },
                "description": "indexes of multisig outputs"
            }
        }
    }
}

