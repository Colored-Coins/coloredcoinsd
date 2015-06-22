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
                "description": "Amonut of asset to issue",
            },
            "fee": {
                "type": "integer",
                "format": "int32",
                "description": "Minnig fee for issueing the asset",
                "minimum": "1000",
                "maximum": "1000000000"
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
            "reissueable":{
                 "type": "boolean",
                "description": "can the asset be reissued, in simple cases there is no need for mint tokens, the same key can resissue the asset"
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
                "description": "settings that need to be met in order for this asset to be considerd valid"
            },
            "transfer": {
                "type": "array",
                "items": {
                    "$ref": "transfer"
                },
                "description": "Where to transfer assets form the isseance"
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