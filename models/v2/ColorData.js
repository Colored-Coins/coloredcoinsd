exports.models = {
    "ColorData": {
        "id": "ColorData",
        "required": ["asset_url", "contract_url", "issuer_address", "raw_quantity",
                    "display_multiple", "value_per_unit", "send_to_address",
        ],
        "properties": {
            "asset_url": {
                "type": "string",
                "description": "full absolute URL of (future) asset web page"
            },
            "contract_url": {
                "type": "string",
                "description": "full absolute URL where you will host the asset contract"
            },
            "issuer_address": {
                "type": "string",
                "description": "registered address of issuer"
            },
            "raw_quantity": {
                "type": "string",
                "description": "number of raw asset units, max 10^14"
            },
            "display_multiple": {
                "type": "string",
                "description": "multiple from raw to display units"
            },      
            "send_to_address": {
                "type": "string",
                "description": "CoinSpark address to send asset"
            }      
        }
    }
}