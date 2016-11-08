exports.models = {
    "burn": {
        "id": "burn",
        "required": [ "amount", "assetId"],
        "properties": {
            "amount": {
                "type": "number",
                "format": "double",
                "description": "Amount of units of the asset to burn"
            },
            "assetId": {
                "type": "string",
                "description": "Id of the asset"
            }
        }
    }
}

