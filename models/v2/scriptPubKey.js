exports.models = {
    "scriptPubKey": {
        "id": "scriptPubKey",
        "required": ["asm", "hex", "type"],
        "properties": {
            "asm": {
                "type": "string",
                "description": "asm"
            },
            "hex": {
                "type": "string",
                "description": "hex"
            },
            "type": {
                "type": "string",
                "description": "type of contract"
            },
            "reqSigs": {
                "type": "integer",
                "format": "int32",
                "description": "number of signatures"
            },
            "addresses": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "array of addresses"
            }
        }
    }
}