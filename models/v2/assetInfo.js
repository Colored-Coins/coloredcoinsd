exports.models = {
    "assetInfo": {
        "id": "assetInfo",
        "required": ["assetId", "amount", "issueTxid", "divisibility", "lockStatus"],
        "properties": {
            "amount": {
                "type": "integer",
                "format": "int32",
                "description": "Name of the category"
            },
            "assetId": {
                "type": "string",
                "description": "Name of the category"
            },
             "issueTxid": {
                "type": "string",
                "description": "Name of the category"
            },
             "divisibility": {
                "type": "integer",
                "format": "int32",
                "description": "Name of the category"
            },
             "lockStatus": {
                "type": "boolean",
                "description": "Name of the category"
            }
        }
    }
}