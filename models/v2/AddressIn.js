exports.models = {
    "AddressIn": {
        "id": "AddressIn",
        "required": ["address", "email"],
        "properties": {
            "address": {
                "type": "string",
                "description": "Category unique identifier"
            },
            "email": {
                "type": "string",
                "description": "Name of the category"
            }
        }
    }
}