exports.models = {

    "Reissue": {
        "id": "Reissue",
        "required": ["assetId", "blockhash", "txhash"],
        "properties": {
             "assetId": {
                "type": "string",
                "description": "assetId is the hash of the original issueance"
            },
            "blockhash": {
                "type": "string",
                "description": "block where the original issueance transaction is"
            },
            "txhash": {
                "type": "integer",
                "format": "int32",
                "description": "transaction hash of orignial issueance"
            }
        }
    }


}