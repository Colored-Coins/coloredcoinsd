exports.models = {
    "rawTxHex": {
        "id": "rawTxHex",
        "required": ['txHex'],
        "properties": {
           "txHex": {
                "type": "string",
                "description": "signed raw transaction hex to upload"
            }            
        }
    }
}