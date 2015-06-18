exports.models = {
    "TransferFees": {
        "id": "TransferFees",
        "required": ["reissueMuteable", "canAddonTransfer", "fees"],
        "properties": {
            "reissueMuteable": {
                "type": "boolean",
                 "description": "can a reissue change the this section?"
            },
            "canAddonTransfer": {
                "type": "boolean",
                "description": "can any tx add thier own fees to the list or is it locked"
            },
             "fees": {
                 "type": "array",
                 "items": {
                    "$ref": "FeeObject"              
                },
                "description": "list of fees for every transfer of this asset"
            }
        }
    }
}