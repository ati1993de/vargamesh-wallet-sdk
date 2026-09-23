# Wallet integration contract

VargaMesh is Bitcoin-Core-derived and uses a native UTXO model. Wallet integration does not require a consensus change.

## Mainnet wallet constants

- ticker: `VMESH`
- decimals: `8`
- curve: `secp256k1`
- primary receive address: SegWit v0 P2WPKH
- Bech32 HRP: `vm`
- compressed WIF version: `190` (`0xBE`)
- legacy P2PKH version: `70`
- legacy P2SH version: `50`
- default P2P: `29666/TCP`
- default RPC: `29667/TCP`
- genesis: `00000000b0c55c00c13e2ee67b54fe33c327c8806f8da5050cfa47095d182d9a`

## Signing scope in v0.1 alpha

The reference transaction builder signs SegWit-v0 P2WPKH inputs with BIP143-style `SIGHASH_ALL`, version 2, final sequence and locktime 0. Destination outputs may be native P2WPKH, legacy P2PKH or legacy P2SH.

The alpha SDK intentionally does not define HD derivation, mnemonics, PSBT policy or hardware-wallet transport. Wallet vendors should map those features to their own audited key-management stack and use the test vectors here to verify VargaMesh address and transaction compatibility.

## Core checks for an integrator

Before enabling deposits or withdrawals, independently verify the network genesis, address prefixes, transaction acceptance, reorg handling and confirmation policy against the current VargaMesh Core source and a synchronized node.
