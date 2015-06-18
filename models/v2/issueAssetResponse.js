exports.models = {
    "issueAssetResponse": {
        "id": "issueAssetResponse",
        "required": ["txHex", "assetId"],
        "properties": {
            "txHex": {
                "type": "string",       
                "description": "hex of the issuence transaction to be signed and broadcasted"
            },
            "assetId": {
                "type": "string",
                "description": "Id of the newly created asset"
            }
        }
    }
}

