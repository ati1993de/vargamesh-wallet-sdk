# RPC / API notes

VargaMesh Core follows the Bitcoin Core JSON-RPC model. Common wallet-integration calls include `getblockchaininfo`, `getnetworkinfo`, `getblockcount`, `validateaddress`, `decoderawtransaction`, `testmempoolaccept` and `sendrawtransaction`.

Core RPC should normally stay private/localhost or behind authenticated infrastructure. Do not expose wallet RPC credentials to a browser.

The public VargaMesh API used by the current Android/WebWallet is rooted at `https://vargacoin.com/api/v1` and includes read endpoints for status/config/address/UTXOs plus `POST /broadcast` for a fully signed raw transaction. Private keys are not part of the broadcast request.
