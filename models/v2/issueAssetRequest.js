exports.models = {
    "issueAssetRequest": {
        "id": "issueAssetRequest",
        "required": ["issueAddress", "amount", "fee", "reissue"],
        "properties": {
             "issueAddress": {
                "type": "string",
                "description": "Base58 public key address of asset issuer"
            },
            "amount": {
               "type": "integer",
                "format": "int32",
                "description": "Amount of the asset to issue"
            },
            "fee": {
                "type": "integer",
                "format": "int32",
                "description": "Mining fee for the transaction, in satoshi",
                "minimum": "1000",
                "maximum": "1000000000"
            },
            "pubKeyReturnMultisigDust": {
                "type": "string",
                "description": "Encoded public key if you want to receive the multisig dust if multisig is needed for the metadata"
            },
            "financeOutput": {
                "type": "vout",
                "description": "Use this vout as the first input, for the transaction"
            },
            "financeOutputTxid": {
                "type": "string",
                "description": "txid containing the output used for finance"
            },
            "reissueable":{
                "type": "boolean",
                "description": "Can the asset be reissued, in simple cases there is no need for mint tokens, the same key can resissue the asset"
            },
            "aggregationPolicy": {
              "type": "string",
              "enum": ["aggregatable", "dispersed"],
              "description": "Can assets be aggregated"
            },
            "flags" : {
                "type": "flags",
                "description": "Flags for this transaction"
            },
            "divisibility": {
               "type": "integer",
                "format": "int32",
                "minimum": "0",
                "maximum": "8",
                "description": "How divisible is the asset (the smallest transferable amount of an asset is 10^(-divisibility))"
            },
            "transfer": {
                "type": "array",
                "items": {
                    "$ref": "transfer"
                },
                "description": "Where to transfer assets from the issuance"
            },
            "rules": {
                "type": "rules",
                "description": "Section used only if the transaction is a reissueance trasaction"
            },
             "metadata": {
                "type": "metadata",
                "description": "Additional data to be associated with the issuance transaction"
            }
        }
    }
}