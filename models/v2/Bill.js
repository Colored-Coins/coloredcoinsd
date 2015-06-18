exports.models = {

    "Bill": {
        "id": "Bill",
        "required": ["size", "amount", "outindex"],
        "properties": {
             "size": {
                "type": "string",
                "description": "note size for a single staoshi"
            },
            "outindex": {
                "type": "integer",
                "format": "int32",
                "description": "output index which represents this bill (-1 if no bills of this type were issued)"
            },
            "amount": {
                "type": "string",
                "description": "how much were sent on the output (the ouput needs to be padded sometimes so not all of the value in it is the actual amount)"
            }
        }
    }


}