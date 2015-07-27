exports.models = {
    "assetMetadataResponse": {
        "id": "assetMetadataResponse",
        "required": ["divisibility", "version", "totalSupply","numOfHolders", "numOfTransactions", "numOfIssuance", "firstAppearsInBlock" ],
        "properties": {
            "divisibility": {
                "type": "integer",
                "format": "int32",
                "description": "How divisible is the asset",
                "minimum": "0",
                "maximum": "8"
            },
            "version": {
                "type": "string",
                "description": "Version as string (currently 1.0)"
            },
            "totalSupply": {
                "type": "integer",
                "format": "int32",
                "description": "How divisible is the asset",
            },
            "numOfHolders": {
                "type": "integer",
                "format": "int32",
                "description": "How divisible is the asset",
            },
             "numOfTransactions": {
                "type": "integer",
                "format": "int32",
                "description": "How divisible is the asset",
            },
            "numOfIssuance": {
                "type": "integer",
                "format": "int32",
                "description": "How divisible is the asset",
            },
            "firstAppearsInBlock": {
                "type": "integer",
                "format": "int32",
                "description": "How divisible is the asset",
            },
            "metadataOfIssuence": {
                "type": "metadataFile",
                "description": "section used only if the transaction is a reissueance trasaction"
            },
            "metadataOfUtxo":{
                "type": "metadataFile",
                "description": "section used only if the transaction is a reissueance trasaction"
            },
            "issueAddress": {
                "type": "string",
                "description": "Version as string (currently 1.0)"
            }
        }
    }
}