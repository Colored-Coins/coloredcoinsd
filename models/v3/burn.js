exports.models = {
    "burn": {
        "id": "burn",
        "required": [ "amount", "assetId"],
        "properties": {
            "amount": {
                "type": "integer",
                "format": "int32",
                "description": "Amount of units of the asset to burn"
            },
            "assetId": {
                "type": "string",
                "description": "Id of the asset"
            }
        }
    }
}

