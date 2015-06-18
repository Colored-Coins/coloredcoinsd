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
            }
        }
    }
}