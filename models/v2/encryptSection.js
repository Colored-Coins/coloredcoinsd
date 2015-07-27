exports.models = {
    "encryptSection": {
        "id": "encryptSection",
        "required": ["key", "format", "type"],
        "properties": {
            "key": {
                "type": "string",
                "description": "the key inside userData we want to encrypt"
            },
             "pubKey": {
                "type": "string",
                "description": "Public key we will use for the encryption (rsa pubkey)"
            },
            "format": {
                "type": "string",
                "enum": ["pem", "der"],
                "description": "Public key we will use for the encryption (rsa pubkey)"
            },
            "type": {
                "type": "string",
                "enum": ["pkcs1", "pkcs8"],
                "description": "Public key we will use for the encryption (rsa pubkey)"
            }
        }
    }
}