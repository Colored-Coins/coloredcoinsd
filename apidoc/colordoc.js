
/*
     VERSION 0.2.0
*/


/**
     * @api {get} /assetmetadata/:assetId/:utxo Request asset metadata and utxo metadata
     * @apiName GetAssetMetadata
     * @apiGroup ColoredCoinsd
     * @apiDescription This api call is used to get the metadata of the issuence of an asset, if a specific utxo is provided
     * it will also get the metadata for that specific utxo which was set by the previous owner of that asset on the blockchain
     *
     * @apiParam {String} assetId Asset unique ID.
     * @apiParam {String} utxo Unspent in <transaction>:<index> format
     *
 	* @apiSuccess {Number} divisibility How divisible is the asset
 	* @apiSuccess {String} version Version of protocol as string
 	* @apiSuccess {Number} totalSupply Total amount of the asset that was issued
     * @apiSuccess {Number} numOfHolders Number of addresses that have any amount of the asset   
     * @apiSuccess {Number} numOfTransactions Number of transactions that the asset was passed in   
     * @apiSuccess {Number} numOfIssuance Number of times an amount of the asset was issued  
     * @apiSuccess {Number} firstAppearsInBlock First time this asset aapeard in the blockchain (first issue)  
     * @apiSuccess {Object} [metadataOfIssuence] Metadata of the issuence
     * @apiSuccess {Object} [metadataOfIssuence.data] Data section in the metadata file   
     * @apiSuccess {String} [metadataOfIssuence.data.assetId] Asset Id   
     * @apiSuccess {String} [metadataOfIssuence.data.assetName] Asset Name   
     * @apiSuccess {String} [metadataOfIssuence.data.assetGenesis] Genisis transaction where the asset was created (in case of re issue)  
     * @apiSuccess {String} [metadataOfIssuence.data.issuer] Name of the issuer   
     * @apiSuccess {String} [metadataOfIssuence.data.description] Description of the asset   
     * @apiSuccess {Object[]} [metadataOfIssuence.data.urls] Array of URL type objects   
     * @apiSuccess {String} metadataOfIssuence.data.urls.name Name of the url   
     * @apiSuccess {String} metadataOfIssuence.data.urls.url The url    
     * @apiSuccess {String} metadataOfIssuence.data.urls.mimeType Mime type of the data in the url    
     * @apiSuccess {String} [metadataOfIssuence.data.urls.dataHash] If needed hash of the data that in the url (for proof reasons)    
     * @apiSuccess {JSON} [metadataOfIssuence.data.userData] Any aribtrary json data that issuer has enterd   
     * @apiSuccess {Object} [metadataOfIssuence.rules] Object for the rules of the issuence   
     * @apiSuccess {Number} metadataOfIssuence.rules.version Version of the rule system    
     * @apiSuccess {Object} [metadataOfIssuence.rules.fees] 
     * @apiSuccess {Object[]} metadataOfIssuence.rules.fees.items Array of fee type items
     * @apiSuccess {String} metadataOfIssuence.rules.fees.items.address Address to send the fee
     * @apiSuccess {String} metadataOfIssuence.rules.fees.items.assetId Asset id to send fee (btc if none asset)
     * @apiSuccess {Number} metadataOfIssuence.rules.fees.items.value Value to send for the fee (in satoshi or amount)
     * @apiSuccess {Boolean} metadataOfIssuence.rules.fees.locked Feild to specify if following thransaction of the asset can add to this rule type
     * @apiSuccess {Object} [metadataOfIssuence.rules.expiration] Experitaion object used to lown an asseet, when asset expires it moves back to last output
     * @apiSuccess {Number} metadataOfIssuence.rules.expiration.validUntil When the asset is consider expired    
     * @apiSuccess {Boolean} metadataOfIssuence.rules.expiration.locked Feild to specify if following thransaction of the asset can add to this rule type    
     * @apiSuccess {Object[]} [metadataOfIssuence.rules.minters] Array of mitnter objects, (addresses that can issue the asset)   
     * @apiSuccess {String} metadataOfIssuence.rules.minters.address Address of the minter   
     * @apiSuccess {Boolean} metadataOfIssuence.rules.minters.locked Feild to specify if following thransaction of the asset can add to this rule type (if the minter can add minters)  
     * @apiSuccess {Object[]} [metadataOfIssuence.rules.holders] Array of holder type objects, they specify in what addresses the asset is considerd valid    
     * @apiSuccess {String} metadataOfIssuence.rules.holders.adress Address where the asset is considerd valid   
     * @apiSuccess {Boolean} metadataOfIssuence.rules.holders.locked Feild to specify if following thransaction of the asset can add to this rule type       
     * @apiSuccess {Object} [metadataOfUtxo] Metadata of the specific utxo from the transaction
     * @apiSuccess {Object} [metadataOfUtxo.data] Data section in the metadata file    
     * @apiSuccess {String} [metadataOfUtxo.data.assetId] Asset Id    
     * @apiSuccess {String} [metadataOfUtxo.data.assetName] Asset Name   
     * @apiSuccess {String} [metadataOfUtxo.data.assetGenesis] Genisis transaction where the asset was created (in case of re issue)   
     * @apiSuccess {String} [metadataOfUtxo.data.issuer] Name of the issuer    
     * @apiSuccess {String} [metadataOfUtxo.data.description] description of the asset    
     * @apiSuccess {Object[]} [metadataOfUtxo.data.urls] Array of URL type objects    
     * @apiSuccess {String} metadataOfUtxo.data.urls.name Name of the url   
     * @apiSuccess {String} metadataOfUtxo.data.urls.url The url    
     * @apiSuccess {String} metadataOfUtxo.data.urls.mimeType Mime type of the data in the url    
     * @apiSuccess {String} [metadataOfUtxo.data.urls.dataHash] If needed hash of the data that in the url (for proof reasons)  
     * @apiSuccess {JSON} [metadataOfUtxo.data.userData] Any aribtrary json data that the pervious owner of the output has enterd 
     * @apiSuccess {Object} [metadataOfUtxo.rules] Object for the rules of the asset   
     * @apiSuccess {Number} metadataOfUtxo.rules.version Version of the rule system   
     * @apiSuccess {Object} metadataOfUtxo.rules.fees
     * @apiSuccess {Object[]} [metadataOfUtxo.rules.fees.items] Array of fee type items
     * @apiSuccess {String} metadataOfUtxo.rules.fees.items.address Address to send the fee
     * @apiSuccess {String} metadataOfUtxo.rules.fees.items.assetId Asset id to send fee (btc if none asset)
     * @apiSuccess {Number} metadataOfUtxo.rules.fees.items.value Value to send for the fee (in satoshi or amount)
     * @apiSuccess {Boolean} metadataOfUtxo.rules.fees.locked Feild to specify if following thransaction of the asset can add to this rule type
     * @apiSuccess {Object} [metadataOfUtxo.rules.expiration] Experitaion object used to lown an asseet, when asset expires it moves back to last output
     * @apiSuccess {Number} metadataOfUtxo.rules.expiration.validUntil When the asset is consider expired     
     * @apiSuccess {Boolean} metadataOfUtxo.rules.expiration.locked Feild to specify if following thransaction of the asset can add to this rule type    
     * @apiSuccess {Object[]} [metadataOfUtxo.rules.minters] Array of mitnter objects, (addresses that can issue the asset)    
     * @apiSuccess {String} metadataOfUtxo.rules.minters.address Address of the minter   
     * @apiSuccess {Boolean} metadataOfUtxo.rules.minters.locked Feild to specify if following thransaction of the asset can add to this rule type (if the minter can add minters)    
     * @apiSuccess {Object[]} [metadataOfUtxo.rules.holders] Array of holder type objects, they specify in what addresses the asset is considerd valid   
     * @apiSuccess {String} metadataOfUtxo.rules.holders.adress Address where the asset is considerd valid   
     * @apiSuccess {Boolean} metadataOfUtxo.rules.holders.locked Feild to specify if following thransaction of the asset can add to this rule type
     * @apiVersion 0.2.0
     * 
     */




     /**
     * @api {post} /issue  Request to issue a coloredcoins asset
     * @apiName issueAsset
     * @apiGroup ColoredCoinsd
     * @apiDescription This api call is used to get issue assets, it can be funded by a specifc utxo or by any spendable utxo of 
     * the issuer address (see financeOutput). If assets arent specifically sent to other addresses from the issuence then the entire
     * value of the issuence is considerd to be sent to the last output of the transaction.
     *
     * @apiParam {String} issueAddress Base58 public key adress of asset issuer.
     * @apiParam {String} amount Amount of units for the asset you wish to issue.
     * @apiParam {Number} divisibility To how many places is the asset devisible (0-8).
     * @apiParam {Number} fee mining fee for the issueance recommended a minimum of 1000 satoshi.
     * @apiParam {String} [pubKeyReturnMultisigDust] encoded public key if you want to recive the multisig dust if multisig is needed for the metadata.
     * @apiParam {Object} [financeOutput] A vout type object to use in order to finance the issue
     * @apiParam {Number} financeOutput.value Value in BTC of the output
     * @apiParam {Number} financeOutput.n Output index
     * @apiParam {Object} financeOutput.scriptPubKey ScriptPubKey type object
     * @apiParam {String} financeOutput.scriptPubKey.asm Asm for the output
     * @apiParam {String} financeOutput.scriptPubKey.hex Hex for the output
     * @apiParam {String} financeOutput.scriptPubKey.type Bitcoin transaction type
     * @apiParam {Number} [financeOutput.scriptPubKey.reqSigs] Number of required signatures to redeem
     * @apiParam {String[]} [financeOutput.scriptPubKey.adresses] Addresses that can redeem 
     * @apiParam {String} [financeOutputTxid] Txid containing the vout used for the finance
     * @apiParam {Boolean} reissueable Decides if the asset can ever be reissued
     * @apiParam {Object} [flags] A flag type object
     * @apiParam {Boolean} [flags.injectPreviousOutput] If true the input will contain the pervious output script to make siging simpler
     * @apiParam {Object[]} [transfer] Array of transfer type objects (transfers amount of the issued asset to specific addresses)
     * @apiParam {String} [transfer.address] Address to transfer assets to 
     * @apiParam {Number} transfer.amount Amount of Asset to transafer
     * @apiParam {String} [transfer.pubKeys] Optional instead of address send the pubkeys as a string array, we create P2SH
     * @apiParam {String} [transfer.m Number] of signatures required in order to reedem the multisig 
     * @apiParam {Object} [metadata] Metadata of the specific utxo from the transaction   
     * @apiParam {String} [metadata.assetId] Asset Id    
     * @apiParam {String} [metadata.assetName] Asset Name   
     * @apiParam {String} [metadata.assetGenesis] Genisis transaction where the asset was created (in case of re issue)   
     * @apiParam {String} [metadata.issuer] Name of the issuer    
     * @apiParam {String} [metadata.description] description of the asset    
     * @apiParam {Object[]} [metadata.urls] Array of URL type objects    
     * @apiParam {String} metadata.urls.name Name of the url   
     * @apiParam {String} metadata.urls.url The url    
     * @apiParam {String} metadata.urls.mimeType Mime type of the data in the url    
     * @apiParam {String} [metadata.urls.dataHash] If needed hash of the data that in the url (for proof reasons)  
     * @apiParam {Object[]} [metadata.encryptions] Array of encryptSection type objects
     * @apiParam {String} [metadata.encryptions.key] The json key of the value to encrypt within the user section
     * @apiParam {String} [metadata.encryptions.pubKey] Public key we will use for the encryption (rsa pubkey)
     * @apiParam {String} [metadata.encryptions.format] Input format of the key (accepted values: 'pem', 'der')
     * @apiParam {String} [metadata.encryptions.type] Type and padding of the key (accepted values: 'pkcs1', 'pkcs8')
     * @apiParam {JSON} [metadata.userData] Any aribtrary json data that the pervious owner of the output has enterd 
     * @apiParam {Object} [rules] Object for the rules of the asset   
     * @apiParam {Number} rules.version Version of the rule system   
     * @apiParam {Object} rules.fees
     * @apiParam {Object[]} [rules.fees.items] Array of fee type items
     * @apiParam {String} rules.fees.items.address Address to send the fee
     * @apiParam {String} rules.fees.items.assetId Asset id to send fee (btc if none asset)
     * @apiParam {Number} rules.fees.items.value Value to send for the fee (in satoshi or amount)
     * @apiParam {Boolean} rules.fees.locked Feild to specify if following thransaction of the asset can add to this rule type
     * @apiParam {Object} [rules.expiration] Experitaion object used to lown an asseet, when asset expires it moves back to last output
     * @apiParam {Number} rules.expiration.validUntil When the asset is consider expired     
     * @apiParam {Boolean} rules.expiration.locked Feild to specify if following thransaction of the asset can add to this rule type    
     * @apiParam {Object[]} [rules.minters] Array of mitnter objects, (addresses that can issue the asset)    
     * @apiParam {String} rules.minters.address Address of the minter   
     * @apiParam {Boolean} rules.minters.locked Feild to specify if following thransaction of the asset can add to this rule type (if the minter can add minters)    
     * @apiParam {Object[]} [rules.holders] Array of holder type objects, they specify in what addresses the asset is considerd valid   
     * @apiParam {String} rules.holders.adress Address where the asset is considerd valid   
     * @apiParam {Boolean} rules.holders.locked Feild to specify if following thransaction of the asset can add to this rule type
     * @apiSuccess {String} txHex Unsigend transaction hex for the issuence
     * @apiSuccess {String} assetId Asset id for the asset generated
     * @apiVersion 0.2.0
     * 
     */



     /**
     * @api {post} /sendasset Returns a transaction that send the asset
     * @apiName SendAsset
     * @apiGroup ColoredCoinsd
     * @apiDescription This api call is used to transfer assets, it can be funded by a specifc utxo or by any spendable utxo of 
     * the from address (see financeOutput). <sendutxo> can be used to sepcif the specific asset you wish to send, if the transaction has
     * more assets inputed then assets transfferd then the remainder of all the assets is considerd to be spent to the last output
     *
     * @apiParam {Number} fee Fee for transaction in satoshi.
     * @apiParam {String} [pubKeyReturnMultisigDust] encoded public key if you want to recive the multisig dust if multisig is needed for the metadata.
     * @apiParam {String} [from] adress to send the asset from. Any unspents of the specific asset held by that address will be used (optional can used sendutxo instead)
     * @apiParam {String} [sendutxo] Utxo to use for sending the asset itself (<transaction>:<index> format)
     * @apiParam {Object} [financeOutput] A vout type object to use in order to finance the transfer (btc costs)
     * @apiParam {Number} financeOutput.value Value in BTC of the output
     * @apiParam {Number} financeOutput.n Output index
     * @apiParam {Object} financeOutput.scriptPubKey ScriptPubKey type object
     * @apiParam {String} financeOutput.scriptPubKey.asm Asm for the output
     * @apiParam {String} financeOutput.scriptPubKey.hex Hex for the output
     * @apiParam {String} financeOutput.scriptPubKey.type Bitcoin transaction type
     * @apiParam {Number} [financeOutput.scriptPubKey.reqSigs] Number of required signatures to redeem
     * @apiParam {String[]} [financeOutput.scriptPubKey.adresses] Addresses that can redeem
     * @apiParam {String} [financeOutputTxid] Txid containing the vout used for the finance
     * @apiParam {Object[]} to Array of transfer type objects (transfers amount of the specifed asset to specific addresses)
     * @apiParam {String} [to.address] Address to transfer assets to (any base58 address)
     * @apiParam {Number} to.amount Amount of Asset to transafer
     * @apiParam {String} to.assetId Asset ID of Asset to transafer
     * @apiParam {String} [to.pubKeys Optional] instead of address send the pubkeys as a string array, we create P2SH
     * @apiParam {String} [to.m] Number of signatures required in order to reedem the multisig 
     * @apiParam {Object} [flags] A flag type object
     * @apiParam {Boolean} [flags.injectPreviousOutput] If true the input will contain the pervious output script to make siging simpler
     * @apiParam {Object} [metadata] Metadata of the specific utxo from the transaction   
     * @apiParam {String} [metadata.assetId] Asset Id    
     * @apiParam {String} [metadata.assetName] Asset Name   
     * @apiParam {String} [metadata.assetGenesis] Genisis transaction where the asset was created (in case of re issue)   
     * @apiParam {String} [metadata.issuer] Name of the issuer    
     * @apiParam {String} [metadata.description] description of the asset    
     * @apiParam {Object[]} [metadata.urls] Array of URL type objects    
     * @apiParam {String} metadata.urls.name Name of the url   
     * @apiParam {String} metadata.urls.url The url    
     * @apiParam {String} metadata.urls.mimeType Mime type of the data in the url    
     * @apiParam {String} [metadata.urls.dataHash] If needed hash of the data that in the url (for proof reasons)  
     * @apiParam {Object[]} [metadata.encryptions] Array of encryptSection type objects
     * @apiParam {String} [metadata.encryptions.key] The json key of the value to encrypt within the user section
     * @apiParam {String} [metadata.encryptions.pubKey] Public key we will use for the encryption (rsa pubkey)
     * @apiParam {String} [metadata.encryptions.format] Input format of the key (accepted values: 'pem', 'der')
     * @apiParam {String} [metadata.encryptions.type] Type and padding of the key (accepted values: 'pkcs1', 'pkcs8')
     * @apiParam {JSON} [metadata.userData] Any aribtrary json data that the pervious owner of the output has enterd 
     * @apiParam {Object} [rules] Object for the rules of the asset   
     * @apiParam {Number} rules.version Version of the rule system   
     * @apiParam {Object} rules.fees
     * @apiParam {Object[]} [rules.fees.items] Array of fee type items
     * @apiParam {String} rules.fees.items.address Address to send the fee
     * @apiParam {String} rules.fees.items.assetId Asset id to send fee (btc if none asset)
     * @apiParam {Number} rules.fees.items.value Value to send for the fee (in satoshi or amount)
     * @apiParam {Boolean} rules.fees.locked Feild to specify if following thransaction of the asset can add to this rule type
     * @apiParam {Object} [rules.expiration] Experitaion object used to lown an asseet, when asset expires it moves back to last output
     * @apiParam {Number} rules.expiration.validUntil When the asset is consider expired     
     * @apiParam {Boolean} rules.expiration.locked Feild to specify if following thransaction of the asset can add to this rule type    
     * @apiParam {Object[]} [rules.minters] Array of mitnter objects, (addresses that can issue the asset)    
     * @apiParam {String} rules.minters.address Address of the minter   
     * @apiParam {Boolean} rules.minters.locked Feild to specify if following thransaction of the asset can add to this rule type (if the minter can add minters)    
     * @apiParam {Object[]} [rules.holders] Array of holder type objects, they specify in what addresses the asset is considerd valid   
     * @apiParam {String} rules.holders.adress Address where the asset is considerd valid   
     * @apiParam {Boolean} rules.holders.locked Feild to specify if following thransaction of the asset can add to this rule type
     * @apiSuccess {String} txHex Unsigned hex of the send transaction.
     * @apiVersion 0.2.0
     * 
     */



     /**
     * @api {get} /stakeholders/:assetId/:numConfirmations Request asset holders
     * @apiName GetAssetHolders
     * @apiGroup ColoredCoinsd
     * @apiDescription This api call is used to get all the addresses that contain any value of the specifed asset
     *
     * @apiParam {String} assetId Asset unique ID.
     * @apiParam {Number} numConfirmations Number of confiramtions for the utxos to return.     
     * @apiSuccess {Object[]} holders Array of holder objects.
     * @apiSuccess {Object[]} holders.address Address that has holding of the asset.
     * @apiSuccess {Object[]} holders.amount Amount of the asset in the address.
     * @apiVersion 0.2.0
     * 
     */



      /**
     * @api {post} /broadcast Request to send the signed transaction through the api to the bitcoin network
     * @apiName broadcastTransaction
     * @apiGroup ColoredCoinsd
     * @apiDescription This api call is used to send the signed raw transaction hex to the bitcoin network
     *
     * @apiParam {String} txHex The hex of the transaction you want to send.
     * @apiSuccess {String} txid The transaction txid
     * @apiVersion 0.2.0
     * 
     */

     /**
     * @api {get} /addressinfo/:address Request to get asset information for the address
     * @apiName getAddressInfo
     * @apiGroup ColoredCoinsd
     * @apiDescription This api call is used to get all the assets for the address, this information is per utxo
     * owned by the address, also retrives uncolored utxos.
     *
     * @apiParam {String} address Base58 address
     *
     * @apiSuccess {String} address Base58 address
     * @apiSuccess {Object[]} utxos Arry of ccUtxo items
     * @apiSuccess {Object} utxos.scriptPubKey ScriptPubKey type object
     * @apiSuccess {String} utxos.scriptPubKey.asm Asm for the output
     * @apiSuccess {String} utxos.scriptPubKey.hex Hex for the output
     * @apiSuccess {String} utxos.scriptPubKey.type Bitcoin transaction type
     * @apiSuccess {Number} [utxos.scriptPubKey.reqSigs] Number of required signatures to redeem
     * @apiSuccess {String[]} [utxos.scriptPubKey.adresses] Addresses that can redeem
     * @apiSuccess {Object[]} assets Array of assetInfo type objects  
     * @apiSuccess {Number} assets.amount Amount of the asset in the utxo
     * @apiSuccess {String} assets.assetId Asset id
     * @apiSuccess {String} assets.issueTxid Txid that links this utxo to is genises issuence
     * @apiSuccess {Number} assets.divisibility How divisible the asset is
     * @apiSuccess {Boolean} assets.lockStatus Was the issuence locked
     * @apiVersion 0.2.0
     * 
     */


/*
     VERSION 0.3.0
*/


/**
     * @api {post} /sendasset Returns a transaction that send the asset
     * @apiName SendAsset
     * @apiGroup ColoredCoinsd
     * @apiDescription This api call is used to transfer assets, it can be funded by a specifc utxo or by any spendable utxo of 
     * the from address (see financeOutput). <sendutxo> can be used to sepcif the specific asset you wish to send, if the transaction has
     * more assets inputed then assets transfferd then the remainder of all the assets is considerd to be spent to the last output
     *
     * @apiParam {Number} fee Fee for transaction in satoshi.
     * @apiParam {String} [pubKeyReturnMultisigDust] encoded public key if you want to recive the multisig dust if multisig is needed for the metadata.
     * @apiParam {String[]} [from] Array of adresss to send the asset from. Any unspents of the specific asset held by that address will be used (optional can used sendutxo instead)
     * @apiParam {String[]} [sendutxo] Array of Utxos to use for sending the asset itself (<transaction>:<index> format)
     * @apiParam {Object} [financeOutput] A vout type object to use in order to finance the transfer (btc costs)
     * @apiParam {Number} financeOutput.value Value in BTC of the output
     * @apiParam {Number} financeOutput.n Output index
     * @apiParam {Object} financeOutput.scriptPubKey ScriptPubKey type object
     * @apiParam {String} financeOutput.scriptPubKey.asm Asm for the output
     * @apiParam {String} financeOutput.scriptPubKey.hex Hex for the output
     * @apiParam {String} financeOutput.scriptPubKey.type Bitcoin transaction type
     * @apiParam {Number} [financeOutput.scriptPubKey.reqSigs] Number of required signatures to redeem
     * @apiParam {String[]} [financeOutput.scriptPubKey.adresses] Addresses that can redeem
     * @apiParam {String} [financeOutputTxid] Txid containing the vout used for the finance
     * @apiParam {Object[]} to Array of transfer type objects (transfers amount of the specifed asset to specific addresses)
     * @apiParam {String} [to.address] Address to transfer assets to (any base58 address)
     * @apiParam {Number} to.amount Amount of Asset to transafer
     * @apiParam {String} to.assetId Asset ID of Asset to transafer
     * @apiParam {String} [to.pubKeys Optional] instead of address send the pubkeys as a string array, we create P2SH
     * @apiParam {String} [to.m] Number of signatures required in order to reedem the multisig 
     * @apiParam {Object} [flags] A flag type object
     * @apiParam {Boolean} [flags.injectPreviousOutput] If true the input will contain the pervious output script to make siging simpler
     * @apiParam {Object} [metadata] Metadata of the specific utxo from the transaction   
     * @apiParam {String} [metadata.assetId] Asset Id    
     * @apiParam {String} [metadata.assetName] Asset Name   
     * @apiParam {String} [metadata.assetGenesis] Genisis transaction where the asset was created (in case of re issue)   
     * @apiParam {String} [metadata.issuer] Name of the issuer    
     * @apiParam {String} [metadata.description] description of the asset    
     * @apiParam {Object[]} [metadata.urls] Array of URL type objects    
     * @apiParam {String} metadata.urls.name Name of the url   
     * @apiParam {String} metadata.urls.url The url    
     * @apiParam {String} metadata.urls.mimeType Mime type of the data in the url    
     * @apiParam {String} [metadata.urls.dataHash] If needed hash of the data that in the url (for proof reasons)  
     * @apiParam {Object[]} [metadata.encryptions] Array of encryptSection type objects
     * @apiParam {String} [metadata.encryptions.key] The json key of the value to encrypt within the user section
     * @apiParam {String} [metadata.encryptions.pubKey] Public key we will use for the encryption (rsa pubkey)
     * @apiParam {String} [metadata.encryptions.format] Input format of the key (accepted values: 'pem', 'der')
     * @apiParam {String} [metadata.encryptions.type] Type and padding of the key (accepted values: 'pkcs1', 'pkcs8')
     * @apiParam {JSON} [metadata.userData] Any aribtrary json data that the pervious owner of the output has enterd 
     * @apiParam {Object} [rules] Object for the rules of the asset   
     * @apiParam {Number} rules.version Version of the rule system   
     * @apiParam {Object} rules.fees
     * @apiParam {Object[]} [rules.fees.items] Array of fee type items
     * @apiParam {String} rules.fees.items.address Address to send the fee
     * @apiParam {String} rules.fees.items.assetId Asset id to send fee (btc if none asset)
     * @apiParam {Number} rules.fees.items.value Value to send for the fee (in satoshi or amount)
     * @apiParam {Boolean} rules.fees.locked Feild to specify if following thransaction of the asset can add to this rule type
     * @apiParam {Object} [rules.expiration] Experitaion object used to lown an asseet, when asset expires it moves back to last output
     * @apiParam {Number} rules.expiration.validUntil When the asset is consider expired     
     * @apiParam {Boolean} rules.expiration.locked Feild to specify if following thransaction of the asset can add to this rule type    
     * @apiParam {Object[]} [rules.minters] Array of mitnter objects, (addresses that can issue the asset)    
     * @apiParam {String} rules.minters.address Address of the minter   
     * @apiParam {Boolean} rules.minters.locked Feild to specify if following thransaction of the asset can add to this rule type (if the minter can add minters)    
     * @apiParam {Object[]} [rules.holders] Array of holder type objects, they specify in what addresses the asset is considerd valid   
     * @apiParam {String} rules.holders.adress Address where the asset is considerd valid   
     * @apiParam {Boolean} rules.holders.locked Feild to specify if following thransaction of the asset can add to this rule type
     * @apiSuccess {String} txHex Unsigned hex of the send transaction.
     * @apiVersion 0.3.0
     * 
     */