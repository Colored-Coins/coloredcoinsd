exports.models = {
    "burnAssetRequest": {
        "id": "burnAssetRequest",
        "required": ["fee", "burn"],
        "properties": {
            "fee": {
                "type": "integer",       
                "description": "Mining fee for the transaction, in satoshi"
            },
            "pubKeyReturnMultisigDust": {
                "type": "string",
                "description": "Encoded public key if you want to receive the multisig dust if multisig is needed for the metadata"
            },
            "from": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "Addresses to burn and optionally transfer assets from"
            },
            "sendutxo": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "UTXO to burn and optionally transfer assets from"
            },
            "financeOutput": {
                "type": "vout",
                "description": "Use this vout as the first input, for the transaction"
            },
            "financeOutputTxid": {
                "type": "string",
                "description": "txid containing the output used for finance"
            },
            "transfer": {
                "type": "array",
                "items": {
                    "$ref": "transferWithAssetId"
                },
                "description": "Where to transfer assets separately from the burn"
            },
            "burn": {
                "type": "array",
                "items": {
                    "$ref": "burn"
                },
                "description": "What amount of which asset should be reduced from total supply"
            },
            "flags" : {
                "type": "flags",
                "description": "Flags for this transaction"
            },
            "metadata": {
                "type": "metadata",
                "description": "Additional data to be associated with the issuance transaction"
            }
        }
    }
}

