exports.models = {
    "ccUtxo": {
        "id": "ccUtxo",
        "required": ["txid", "index", "value", "blockheight", "used" ,"assets", "scriptPubKey"],
        "properties": {
            "index": {
                "type": "integer",
                "format": "int32",
                "description": "index of the utxo in the transaction"
            },
            "txid": {
                "type": "string",
                "description": "txid"
            },
            "value": {
                 "type": "integer",
                "format": "int32",
                "description": "value in satoshi of the utxo"
            },
            "blockheight": {
                "type": "integer",
                "format": "int32",
                "description": "blockhieght in the blockchain"
            },
            "used": {
                "type": "boolean",
                "description": "flag to show if it was spent"
            },
            "assets": {
                "type": "array",
                "items": {
                    "$ref": "assetInfo"
                },
                "description": "Name of the category"
            },
            "scriptPubKey": {
                "type": "scriptPubKey",
                "description": "flag to show if it was spent"
            }

        }
    }
}