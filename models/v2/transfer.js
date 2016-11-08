exports.models = {
    "transfer": {
        "id": "transfer",
        "required": ["amount"],
        "properties": {
            "address": {
                "type": "string",
                "description": "Address to transfer the asset to"
            },
            "amount": {
                "type": "integer",
                "format": "int32",
                "description": "Amount of units of the asset to transfer"
            },
            "pubKeys": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "Send to a multisig adress instead of an address"
            },
            "m": {
                "type": "integer",
                "format": "int32",
                "description": "Number of signatures needed to reedeem the multisig"
            }
        }
    }
}