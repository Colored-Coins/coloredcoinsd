exports.models = {
    "rules": {
        "id": "rules",
        "required": ["version"],
        "properties": {
            "version": {
                "type": "int32",
                "description": "version of the rule system"
            },
            "fees": {
                "type": "addressAssetValueList",
                "description": "Array of fee itmes and locking items"
            },
            "expiration": {
                "type": "expirationItem",
                "description": "Name of the category"
            },
            "minters": {
                "type": "array",
                "items": {
                    "$ref": "mintersList"
                },
                "description": "Name of the category"
            },
            "holders": {
                "type": "array",
                "items": {
                    "$ref": "holdersList"
                },
                "description": "Name of the category"
            }
        }
    }
}