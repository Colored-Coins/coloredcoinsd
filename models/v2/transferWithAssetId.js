exports.models = {
    "transferWithAssetId": {
        "id": "transferWithAssetId",
        "required": ["address", "amount", "assetId"],
        "properties": {
            "address": {
                "type": "string",       
                "address": "Address that will recive the asset"
            },
            "amount": {
                "type": "number",
                "format": "double",
                "description": "Represendts and amount of an asset"
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
                "description": "send to a multisig adress instead of an address"
            },
            "m": {
                "type": "integer",
                "format": "int32",
                "description": "number of signatures needed to reedeem the multisig"
            }
        }
    }
}

