exports.models = {
    "transferWithAssetId": {
        "id": "transferWithAssetId",
        "required": ["address", "amount", "assetId"],
        "properties": {
            "address": {
                "type": "string",       
                "address": "Address that will recive the asset"
            },
            "amount": {
                "type": "number",
                "format": "double",
                "description": "Represendts and amount of an asset"
            },
            "assetId": {
                "type": "string",
                "description": "Id of the asset"
            }
        }
    }
}

