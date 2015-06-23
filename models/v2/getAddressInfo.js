exports.models = {
    "addressInfoResponse": {
        "id": "addressInfoResponse",
        "required": ["address", "utxos"],
        "properties": {
            "address": {
                "type": "string",
                "description": "Array of fee itmes and locking items"
            },
            "utxos": {
                "type": "array",
                "items": {
                    "$ref": "ccUtxo"
                },
                "description": "Name of the category"
            }
        }
    }
}