exports.models = {
    "sendAssetResponse": {
        "id": "sendAssetResponse",
        "required": ["txHex"],
        "properties": {
            "txHash": {
                "type": "string",       
                "address": "Hex of the transaction"
            }
        }
    }
}

