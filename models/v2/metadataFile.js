exports.models = {
    "metadataFile": {
        "id": "metadataFile",
        "required": ["data", "rules"],
        "properties": {
             "data": {
                "type": "metadata",
                "description": "assetId string"
            },
            "rules": {
                "type": "rules",
                "description": "section used only if the transaction is a reissueance trasaction"
            }
        }
    }
}