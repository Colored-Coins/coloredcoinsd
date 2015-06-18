exports.models = {
    "holdersList": {
        "id": "holdersList",
        "required": ["address", "locked"],
        "properties": {
            "address": {
                "type": "string",
                "description": "Array of fee itmes and locking items"
            },
            "locked": {
                "type": "boolean",
                "description": "Name of the category"
            }
        }
    }
}