exports.models = {
    "AssetHolder": {
        "id": "AssetHolder",
        "required": ["script", "address", "asset_quantity"],
        "properties": {
            "script": {
                "type": "string",
                "description": "Script for the asset"
            },
            "address": {
                "type": "string",
                "description": "Adress holding the asset"
            },
            "asset_quantity": {
                "type": "string",                
                "description": "quantity of the asset"
            }
        }
    }
}