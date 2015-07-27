exports.models = {
    "tradeAsset": {
        "id": "tradeAsset",
        "required": ["to"],
        "properties": {
            "from": {
                "type": "string",
                "description": "Adress to send the asset from"
            },
            "sendutxo": {
                "type": "string",
                "description": "utxo to use for sending the asset itself"
            },
            "to": {
                "type": "array",
                "items": {
                    "$ref": "transferWithAssetId"
                },
                "description": "Array of transferWithAssetId items"
            },
            "rules": {
                "type": "rules",
                "description": "section used only if the transaction is a reissueance trasaction"
            },
             "metadata": {
                "type": "metadata",
                "description": "section used only if the transaction is a reissueance trasaction"
            }
        }
    }
}

