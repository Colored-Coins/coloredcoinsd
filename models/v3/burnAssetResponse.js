exports.models = {
    "burnAssetResponse": {
        "id": "burnAssetResponse",
        "required": ["txHex"],
        "properties": {
            "txHash": {
                "type": "string",       
                "address": "Hex of the transaction"
            }
        }
    }
}

