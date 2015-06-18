exports.models = {

    "Mints": {
        "id": "Mints",
        "required": ["outindex", "amount"],
        "properties": {
            "outindex": {
                "type": "integer",
                "format": "int32",
                "description": "output index which represents where the mint tokens are if there are no mints only the original key can reissue the asset"
            },
            "amount": {
                "type": "string",
                "description": "how much were sent on the output (the ouput needs to be padded sometimes so not all of the value in it is the actual amount)"
            }
        }
    }


}