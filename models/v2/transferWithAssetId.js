exports.models = {
    "transferWithAssetId": {
        "id": "transferWithAssetId",
        "required": [ "amount", "assetId"],
        "properties": {
            "address": {
                "type": "string",       
                "description": "Address to transfer the asset to"
            },
            "amount": {
                "type": "number",
                "format": "integer",
                "description": "Amount of units of the asset to transfer"
            },
            "assetId": {
                "type": "string",
                "description": "Id of the asset"
            },
            "pubKeys": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "Send to a multisig address instead of an address"
            },
            "m": {
                "type": "integer",
                "format": "int32",
                "description": "Number of signatures needed to reedeem the multisig"
            }
        }
    }
}

