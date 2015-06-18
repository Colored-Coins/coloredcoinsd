exports.models = {
    "addressAssetValue": {
        "id": "addressAssetValue",
        "required": ["address", "assetId", "value" ],
        "properties": {
            "address": {
              "type": "string",
                "description": "Name of the category"
            },
            "assetId": {
                "type": "string",
                "description": "Name of the category"
            },
            "value": {
                "type": "string",
                "description": "Name of the category"
            }
        }
    }
}