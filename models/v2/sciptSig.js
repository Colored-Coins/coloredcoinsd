exports.models = {
    "sciptSig": {
        "id": "sciptSig",
        "required": ["asm", "hex"],
        "properties": {
            "asm": {
                "type": "string",
                "description": "asm inside the scriptSig"
            },
            "hex": {
                "type": "string",
                "description": "hex inside the scriptSig"
            }
        }
    }
}