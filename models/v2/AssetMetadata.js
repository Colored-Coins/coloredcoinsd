exports.models = {
    "AssetMetadata": {
        "id": "AssetMetadata",
        "required": ["issuer", "divisibility", "version", "type", "description"],
        "properties": {
            "issuer": {
                "type": "string",
                "description": "Name of the asset issuer"
            },
            "divisibility": {
                "type": "integer",
                "format": "int32",
                "description": "How divisible is the asset",
                "minimum": "1",
                "maximum": "20"
            },
            "icon_url": {
                "type": "string",
                "description": "The URL to an icon representing the asset, image file should be 48x48 pixels"
            },
            "image_url": {
                "type": "string",
                "description": "he URL to an image representing the asset, image file should be 260 pixels wide at least"
            },
            "version": {
                "type": "string",
                "description": "Version as string (currently 1.0)"
            },
            "type": {
                "type": "string",
                "description": "String for the type of the token"
            },
            "description": {
                "type": "string",
                "description": "String that describes the asset"
            }
        }
    }
}