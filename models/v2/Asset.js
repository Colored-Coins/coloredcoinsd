exports.models = {
    "Asset": {
        "id": "Asset",
        "required": ["id", "name"],
        "properties": {
            "id": {
                "type": "integer",
                "format": "int64",
                "description": "Category unique identifier",
                "minimum": "0.0",
                "maximum": "100.0"
            },
            "name": {
                "type": "string",
                "description": "Name of the category"
            }
        }
    }
}