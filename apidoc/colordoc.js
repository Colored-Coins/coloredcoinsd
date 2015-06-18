/**
     * @api {get} /asset/:id Request User information
     * @apiName GetAssetMetadata
     * @apiGroup Color
     *
     * @apiParam {Number} id Asset unique ID.
     *
     * @apiSuccess {String} issuer Name of the asset issuer
 	 * @apiSuccess {Number} divisibility How divisible is the asset
 	 * @apiSuccess {String} icon_url The URL to an icon representing the asset, image file should be 48x48 pixels
 	 * @apiSuccess {String} image_url the URL to an image representing the asset, image file should be 260 pixels wide at least
 	 * @apiSuccess {String} version Version of protocol as string (currently 1.0)
 	 * @apiSuccess {String} type String for the type of the token
 	 * @apiSuccess {String} description String that describes the asset 	  
     * @apiVersion 1.0.0
     * 
     */


     /**
     * @api {post} /coloraddress Get the color address of a corrisponding base58 bitcoin address
     * @apiName GetColoredAddressFromAddress
     * @apiGroup Color
     * @apiDescription Assets can only be sent to a color adress, if you dont have a color adress
     * or wish to send assets to someone only knowing thier bitcoin address use this to get the base58
     * corrisponding color adress
     *
     * @apiParam {String} address your base58 address.
     * @apiParam {String} email your email.
     *
     * @apiSuccess {String} your base58 colored address.
     * @apiVersion 1.0.0
     * 
     */



     /**
     * @api {post} /issue  Request to issue an asset
     * @apiName IssueAsset
     * @apiGroup Color
     *
     * @apiParam {String} issue_adress Base58 public key adress of asset issuer.
     * @apiParam {String} name Name of the asset you want to issue.
     * @apiParam {String} short_name short name for the asset you want to issue.
     * @apiParam {String} amount amount of units for the asset you wish to issue.
     * @apiParam {Number} fee mining fee for the issueance recommended a minimum of 1000 satoshi.
     * @apiParam {Boolean} selfhost Flag to indicate if you are hosting the metadta file or server will (recommended that you host it)
     * @apiParam {String} [metadat_url] url where you host the metadata file (if you host it)
     * @apiParam {Boolean} [sorten_url] use goo.gl to shorten your url and encode it
     * @apiParam {Object} metadata
     * @apiParam {String} metadata.issuer Name of the asset issuer
 	 * @apiParam {Number} metadata.divisibility How divisible is the asset
 	 * @apiParam {String} metadata.icon_url The URL to an icon representing the asset, image file should be 48x48 pixels
 	 * @apiParam {String} metadata.image_url the URL to an image representing the asset, image file should be 260 pixels wide at least
 	 * @apiParam {String} metadata.version Version of protocol as string (currently 1.0)
 	 * @apiParam {String} metadata.type String for the type of the token
 	 * @apiParam {String} metadata.description String that describes the asset 	  	 
     *
     * @apiSuccess {Object} CreatedAsset asset metadata.
     * @apiVersion 1.0.0
     * 
     */



     /**
     * @api {post} /sendasset Returns a transaction that send the asset
     * @apiName SendAsset
     * @apiGroup Color
     *
     * @apiParam {Number} fees Fees for transaction in satoshi.
     * @apiParam {String} Colored adress to send the asset from. 
	 * @apiParam {Object[]} to Array of SendAssetToAdress items.
     * @apiParam {String} to.address Address that will recive the asset
 	 * @apiParam {String} to.amount Units of the asset to send
 	 * @apiParam {String} to.asset_id Id of the asset	  	 
     *
     * @apiSuccess {Object} AssetMetadata asset metadata.
     * @apiVersion 1.0.0
     * 
     */



     /**
     * @api {get} /stakeholders/:assetId/:blockheight Request User information
     * @apiName GetAssetHolders
     * @apiGroup Color
     *
     * @apiParam {String} assetId Asset unique ID.
     * @apiParam {Number} blockheight Block hieght to consider.     
     *
     * @apiSuccess {Object[]} asset asset metadata.
     * @apiSuccess {Number} asset.block_height block height at which to start search.
     * @apiSuccess {String} asset.asset_id asset metadata.
     * @apiSuccess {Object[]} asset.owners asset metadata.
     * @apiSuccess {String} asset.owners.script Script for the asset.
     * @apiSuccess {String} asset.owners.address Adress holding the asset.
     * @apiSuccess {String} asset.owners.asset_quantity quantity of the asset.
     * @apiVersion 1.0.0
     * 
     */



     /**
     * @api {post} /assets  Check blaalnces for address (inculding assets)
     * @apiName GetAssetsForAddress
     * @apiGroup Color
     *
     * @apiParam {String[]} body array of Base58 public key adress .
    
     * @apiSuccess {Object[]} CreatedAsset asset metadata.
     * @apiVersion 1.0.0
     * 
     */