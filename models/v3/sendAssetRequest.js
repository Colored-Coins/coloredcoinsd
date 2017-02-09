exports.models = {
    "sendAssetRequest": {
        "id": "sendAssetRequest",
        "required": ["fee", "to"],
        "properties": {
            "fee": {
                "type": "integer",       
                "description": "Fees for transaction in satoshi"
            },
            "pubKeyReturnMultisigDust": {
                "type": "string",
                "description": "encoded public key if you want to recive the multisig dust if multisig is needed for the metadata"
            },
            "from": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "Adress to send the asset from"
            },
            "sendutxo": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "utxo to use for sending the asset itself"
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
            },
            "splitChange": {
                "type": "boolean",
                "description": "split bitcoin and colored change into two different outputs"
            }
        }
    }
}

