exports.models = {
    "AssetHolders": {
        "id": "AssetHolders",
        "required": ["block_height", "asset_id", "owners"],
        "properties": {
            "block_height": {
                "type": "integer",
                "format": "int64",
                "description": "block height at which to start search"
            },
            "asset_id": {
                "type": "string",
                "description": "Id of the asset to search"
            },
            "owners": {
                "type": "array",
                "items": {
                    "$ref": "AssetHolder"
                },
                "description": "List of holding adresses, scripts and quantaties"
            }
        }
    }
}