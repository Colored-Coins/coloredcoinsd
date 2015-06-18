exports.models = {
    "FeeObject": {
        "id": "FeeObject",
        "required": ["to", "amount" ],
        "properties": {
             "to": {
                "type": "string",
                "description": "Base58 public key adress that weill revice the fee"
            },
            "amount": {
                "type": "integer",
                "format": "int32",
                "description": "amount of asset you wish to recive as transfer fee"
            },
            "asset": {
                "type": "string",
                "description": "Asset identifyier for the fee you wish to recive (if empty is BTC)"
            }
        }
    }
}