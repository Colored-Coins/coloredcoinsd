exports.models = {
    "assetHolders": {
        "id": "assetHolders",
        "required": ["minConfirmations", "assetId", "owners"],
        "properties": {
            "minConfirmations": {
                "type": "integer",
                "format": "int64",
                "description": "block height at which to start search"
            },
            "assetId": {
                "type": "string",
                "description": "Id of the asset to search"
            },
            "holders": {
                "type": "array",
                "items": {
                    "$ref": "assetHolder"
                },
                "description": "List of holding adresses, scripts and quantaties"
            }
        }
    }
}