exports.models = {
    "transfer": {
        "id": "transfer",
        "required": ["address", "amount"],
        "properties": {
            "address": {
                "type": "string",
                "description": "Array of fee itmes and locking items"
            },
            "amount": {
                "type": "integer",
                "format": "int32",
                "description": "Name of the category"
            },
            "pubKeys": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "send to a multisig adress instead of an address"
            },
            "m": {
                "type": "integer",
                "format": "int32",
                "description": "number of signatures needed to reedeem the multisig"
            }
        }
    }
}