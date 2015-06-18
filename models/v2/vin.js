exports.models = {
    "vin": {
        "id": "vin",
        "required": ["txid", "vout", "scriptSig"],
        "properties": {
            "txid": {
                "type": "string",
                "description": "transaction id"
            },
            "vout": {
                "type": "integer",
                "format": "int32",
                "description": "ouput index"
            },
             "scriptSig": {
                "type": "scriptSig",
                "description": "scriptSig"
            }
        }
    }
}