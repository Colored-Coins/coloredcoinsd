exports.models = {
    "expirationItem": {
        "id": "expirationItem",
        "required": ["validUntil", "locked"],
        "properties": {
            "validUntil": {
                "type": "integer",
                "format": "int32",
                "description": "valid till block"
            },
            "locked": {
                "type": "boolean",
                "description": "Name of the category"
            }
        }
    }
}