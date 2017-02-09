exports.models = {
    "swapAssetRequest": {
        "id": "swapAssetRequest",
        "required": ["fee", "trades"],
        "properties": {
            "fee": {
                "type": "integer",       
                "description": "Fees for transaction in satoshi"
            },
            "pubKeyReturnMultisigDust": {
                "type": "string",
                "description": "encoded public key if you want to recive the multisig dust if multisig is needed for the metadata"
            },
            "financeOutput": {
                "type": "vout",
                "description": "use this vout as the first input, for the transaction"
            },
            "financeOutputTxid": {
                "type": "string",
                "description": "txid containing the output used for finanace"
            },
            "trades": {
                "type": "array",
                "items": {
                    "$ref": "tradeAsset"
                },
                "description": "Array of tradeAsset items"
            },
            "flags" : {
                "type": "flags",
                "description": "Flags for this transaction"
            },
            "splitChange": {
                "type": "boolean",
                "description": "split bitcoin and colored change into two different outputs"
            }
        }
    }
}

