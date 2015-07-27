exports.models = {
    "metadata": {
        "id": "metadata",
        "required": [],
        "properties": {
             "assetId": {
                "type": "string",
                "description": "assetId string"
            },
             "assetName": {
                "type": "string",
                "description": "Name of the asset"
            },
             "assetGenesis": {
                "type": "string",
                "description": "block + tx of the genisis for this asset"
            },
            "issuer": {
                "type": "string",
                "description": "Name of the asset issuer"
            },
            "description": {
                "type": "string",
                "description": "String that describes the asset"
            }, 
             "urls": {
                 "type": "array",
                "items": {
                    "$ref": "urlItem"
                },
                "description": "section used only if the transaction is a reissueance trasaction"
            },
            "encryptions": {
                 "type": "array",
                "items": {
                    "$ref": "encryptSection"
                },
                "description": "section used only if the transaction is a reissueance trasaction"
            },      
            "userData": {
                "type": "json",
                "description": "section used only if the transaction is a reissueance trasaction"
            }
        }
    }
}