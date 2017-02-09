exports.models = {
    "swapAssetRequest": {
        "id": "swapAssetRequest",
        "required": ["fee", "trades"],
        "properties": {
            "fee": {
                "type": "integer",       
                "description": "Mining fee for the transaction, in satoshi"
            },
            "pubKeyReturnMultisigDust": {
                "type": "string",
                "description": "Encoded public key if you want to receive the multisig dust if multisig is needed for the metadata"
            },
            "financeOutput": {
                "type": "vout",
                "description": "use this vout as the first input, for the transaction"
            },
            "financeOutputTxid": {
                "type": "string",
                "description": "txid containing the output used for finance"
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
            }
        }
    }
}

