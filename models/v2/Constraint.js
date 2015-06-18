exports.models = {
    "Constraint": {
        "id": "Constraint",
        "required": ["requireOnline"],
        "properties": {
             "requireOnline": {
                "type": "boolean",
                "description": "Base58 public key adress of asset issuer"
            }
        }
    }

}