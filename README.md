# VargaMesh Wallet SDK

Developer-preview reference SDK for wallet integration with the VargaMesh (`VMESH`) mainnet.

**Version:** `0.1.0-alpha.1`  
**Status:** developer preview / integration reference  
**License:** MIT

## Included

- secp256k1 key handling
- compressed VMESH WIF encode/decode
- `vm1...` SegWit-v0/P2WPKH address derivation
- legacy P2PKH/P2SH destination decoding
- deterministic RFC6979 ECDSA with low-S normalization
- BIP143-style P2WPKH transaction signing
- deterministic wallet/signature/transaction test vectors
- VargaMesh Core RPC helper
- VargaMesh public API helper

## Quick start

```js
import { VargaMeshKey, createSpend } from '@vargamesh/wallet-sdk';

const key = VargaMeshKey.generate();
console.log(await key.address());

const spend = await createSpend({
  utxos: [{ txid: '...', vout: 0, valueSats: 100000000n }],
  destination: 'vm1...',
  amountSats: 1000000n,
  feeRateSatVb: 1n,
  key
});

console.log(spend.rawHex);
```

## Compatibility vector

Private key `1` produces:

- pubkey: `0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798`
- address: `vm1qw508d6qejxtdg4y5r3zarvary0c5xw7kr9qdyv`
- WIF: `V7AodfTvGD589KWx5PzgG4yYHZAwcWX7vwMmKJpzHvCEWPqRLj38`

Run:

```bash
npm test
npm run verify:vectors
```

## Important

This repository is intended to make VargaMesh integration reproducible; it does **not** replace VargaMesh Core as the consensus authority. Before handling real funds, validate the vectors and raw transactions against a current synchronized Core node and use an independently audited cryptographic implementation in production.
