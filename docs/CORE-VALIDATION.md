# Validate against a running VargaMesh Core node

The repository includes a non-spending validation script:

```bash
VMESH_CLI=/path/to/vargamesh-cli ./scripts/core-validate.sh
```

It verifies:

1. block 0 equals the expected VargaMesh mainnet genesis;
2. Core accepts the deterministic `vm1...` compatibility address;
3. Core decodes the deterministic signed transaction;
4. decoded `txid` and witness hash match the SDK vectors.

The vector uses a synthetic prevout, so it is intentionally **not broadcast** and cannot be accepted into the mempool. A true spend-acceptance test requires a real disposable UTXO controlled by a dedicated test key and should be performed manually on an isolated test wallet before production use.
