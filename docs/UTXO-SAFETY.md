# VNS ownership UTXO safety / coin control

This SDK implements **fail-closed input selection** for P2WPKH spends.
An absent `spendable: true` annotation is **not** authorization to sign. 
Explicitly flagged `vnsAnchor`, `protected`, or `locked` UTXOs are never selected.

Example:

```js
const tx = await createSpend({
  utxos: [
    { txid: '...', vout: 0, valueSats: 150000n, spendable: true },
    { txid: '...', vout: 1, valueSats: 250000n,
      spendable: false, vnsAnchor: true }
  ],
  // From an independently verified, current VNS ownership registry:
  protectedOutpoints: ['<64-byte txid>:1'],
  includeOutpoints: [],  // Optional explicit coin control
  destination: 'vm1...',
  amountSats: 50000n,
  key
});
```

## Security boundary

**A flag is only as reliable as its source.** The SDK cannot discover VNS ownership anchors from bare address UTXO lists. Consumers must cross-check outpoints against authoritative, fresh VNS ownership records, including name renewal/transfer histories, and refuse signing on lookup errors, stale indexes, mismatched networks or unknown UTXO classification. Do not trust a remote API's `spendable` flag without independent validation. Maintain the protected set in persistent wallet metadata across app restarts and wallet recovery.

The low-level `buildP2wpkhTransaction` also rejects unclassified and protected inputs. The SDK remains developer-preview and is not independently audited.

## Coin control

`includeOutpoints` is a list of `txid:vout` identifiers. A selection containing a protected, unknown or already-spent outpoint fails closed; `protectedOutpoints` overrides `spendable: true`.

## Android integration (not included in this repository)

VargaMesh Android v0.5.0 is a separate codebase. To fix its VNS vulnerability:
1. Discover **all** UTXOs using HD gap-limit scanning, including receiving and change paths.
2. Independently classify VNS ownership anchors, exclude them from automatic selection, and persist classifications.
3. On any classification/indexer failure block sends, do not fall back to spending all UTXOs.
4. Implement explicit coin control with a protected output indicator; protected outputs can never be force-selected.
5. Restore into a disposable wallet and validate multi-address history and VNS ownership recovery before release.
6. Run automated device/emulator tests plus real-device security tests; get independent review for production funds.

This SDK change does **not** claim that the Android app was patched or device-tested.
