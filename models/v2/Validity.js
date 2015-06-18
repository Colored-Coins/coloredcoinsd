exports.models = {

    "Validity": {
        "id": "Validity",
        "required": [],
        "properties": {
             "maxTransferTimes": {
                "type": "integer",
                "format": "int32",
                "description": "Base58 public key adress of asset issuer"
            },
            "validOnlyForAdresses": {
                "type": "array",
                 "items": {
                   "type": "string"
                },
                "description": "Base58 public key adress of asset issuer"
            }
        }
    }


}