# Audit notes

## Cross-checked references

The alpha package was derived from the same wallet constants and transaction model already used by VargaMesh Android v0.2.0 and the VargaMesh WebWallet. The key=1 compatibility vector is independently reproducible using standard secp256k1 + HASH160 + Bech32 + Base58Check rules.

## Stale documentation found

An older `VargaMesh-Exchange-Integration-v1.0.0` package states an initial block subsidy of **50 VMESH**. The current public VargaMesh Core README states **25 VMESH**. This wallet SDK does not encode subsidy rules. Consensus-critical issuance values must be taken from current Core source, not the older exchange package.

## Security status

This is developer-preview reference code, not an external cryptographic audit. Production wallet vendors should validate the supplied vectors against their own audited secp256k1 implementation and a current VargaMesh Core node before shipping.
