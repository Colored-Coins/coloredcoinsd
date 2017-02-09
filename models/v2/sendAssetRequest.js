exports.models = {
    "sendAssetRequest": {
        "id": "sendAssetRequest",
        "required": ["fee", "to"],
        "properties": {
            "fee": {
                "type": "integer",       
                "description": "Mining fee for the transaction, in satoshi",
            },
            "pubKeyReturnMultisigDust": {
                "type": "string",
                "description": "Encoded public key if you want to receive the multisig dust if multisig is needed for the metadata"
            },
            "from": {
                "type": "string",
                "description": "Address to send the asset from"
            },
            "sendutxo": {
                "type": "string",
                "description": "utxo to use for sending the asset itself"
            },
            "financeOutput": {
                "type": "vout",
                "description": "use this vout as the first input, for the transaction"
            },
            "financeOutputTxid": {
                "type": "string",
                "description": "txid containing the output used for finance"
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
                "description": "Additional data to be associated with the issuance transaction"
            }
        }
    }
}

