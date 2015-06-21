exports.models = {
    "assetHolder": {
        "id": "assetHolder",
        "required": ["address", "amount"],
        "properties": {
            "address": {
                "type": "string",
                "description": "Adress holding the asset"
            },
            "amount": {
                "type": "string",                
                "description": "quantity of the asset"
            }
        }
    }
}