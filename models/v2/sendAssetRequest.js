exports.models = {
    "sendAssetRequest": {
        "id": "sendAssetRequest",
        "required": ["fee", "to"],
        "properties": {
            "fee": {
                "type": "integer",       
                "description": "Fees for transaction in satoshi"
            },
            "from": {
                "type": "string",
                "description": "Adress to send the asset from"
            },
            "financeOutput": {
                "type": "vout",
                "description": "use this vout as the first input, for the transaction"
            },
            "financeOutputTxid": {
                "type": "string",
                "description": "txid containing the output used for finanace"
            },
            "to": {
                "type": "array",
                "items": {
                    "$ref": "transferWithAssetId"
                },
                "description": "Array of transferWithAssetId items"
            },
            "flags" : {
                "type": "flags",
                "description": "Flags for this transaction"
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

