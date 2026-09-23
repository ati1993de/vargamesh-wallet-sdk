# Validation record — 2026-09-23

Local developer-preview validation completed before packaging:

- Node.js: `v22.16.0`
- unit tests: **4/4 PASS**
- SHA-256 implementation cross-check vs Node crypto: **PASS**
- RIPEMD-160 implementation cross-check vs Node crypto: **PASS**
- private key `1` -> compressed public key: independently reproduced: **PASS**
- public key -> VMESH `vm1...` address: independently reproduced: **PASS**
- private key -> compressed VMESH WIF: independently reproduced: **PASS**
- RFC6979 deterministic message signature: independent Python `cryptography` secp256k1 verification: **PASS**
- signed transaction input signature: independent Python `cryptography` secp256k1 verification: **PASS**
- transaction `txid`: independent parser/hash recomputation: **PASS**
- transaction `wtxid`: independent parser/hash recomputation: **PASS**
- vector regeneration reproducibility: **PASS**
- JavaScript syntax check: **PASS**

## Still required before production status

Run `scripts/core-validate.sh` on the current VargaMesh mainnet node. This is deliberately not claimed as completed here because the packaging environment does not have access to the node's localhost RPC.

For production wallet use, also perform a controlled real-UTXO spend test from a dedicated disposable wallet and obtain an independent security review of the cryptographic/key-management implementation.
