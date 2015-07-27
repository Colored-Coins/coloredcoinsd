exports.models = {
    "urlItem": {
        "id": "urlItem",
        "required": ["name", "url", "mimeType" ],
        "properties": {
            "name": {
                "type": "string",
                "description": "Array of fee itmes and locking items"
            },
            "url": {
                "type": "string",
                "description": "Name of the category"
            },
            "mimeType": {
                "type": "string",
                "description": "mime type of data in that url"
            },
            "dataHash": {
                "type": "string",
                "description": "hash of the data in that url"
            }
        }
    }
}