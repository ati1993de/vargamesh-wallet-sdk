import test from 'node:test';
import assert from 'node:assert/strict';
import { VargaMeshKey, createSpend, buildP2wpkhTransaction } from '../src/index.js';

const key = VargaMeshKey.fromPrivateHex('0'.repeat(63) + '1');
const recipient = VargaMeshKey.fromPrivateHex('0'.repeat(63) + '2');
const utxo = (txid, extra = {}) => ({ txid: txid.repeat(32), vout: 0, valueSats: 100000000n, ...extra });
async function spend(utxos, opts = {}) {
  return createSpend({
    utxos, key, destination: await recipient.address(), amountSats: 1000000n,
    feeRateSatVb: 1n, ...opts
  });
}
test('rejects UTXOs without independently verified spendability', async () => {
  await assert.rejects(spend([utxo('11')]), /No independently approved/);
});
test('never selects VNS anchors, locked or protected UTXOs', async () => {
  const transaction = await spend([
    utxo('11', { spendable: true, vnsAnchor: true }),
    utxo('22', { spendable: true, locked: true }),
    utxo('33', { spendable: true, protected: true }),
    utxo('44', { spendable: true })
  ]);
  assert.deepEqual(transaction.selected.map(x => x.txid), ['44'.repeat(32)]);
});
test('protected outpoint registry overrides positive spendability annotation', async () => {
  await assert.rejects(spend([utxo('11', { spendable: true })], {
    protectedOutpoints: ['11'.repeat(32) + ':0']
  }), /No independently approved/);
});
test('coin control cannot force protected inputs', async () => {
  await assert.rejects(spend([
    utxo('11', { spendable: true, vnsAnchor: true }),
    utxo('22', { spendable: true })
  ], { includeOutpoints: ['11'.repeat(32) + ':0'] }), /Coin control selected/);
});
test('coin control selects only explicitly requested approved inputs', async () => {
  const tx = await spend([
    utxo('11', { spendable: true }),
    utxo('22', { spendable: true })
  ], { includeOutpoints: ['22'.repeat(32) + ':0'] });
  assert.deepEqual(tx.selected.map(x => x.txid), ['22'.repeat(32)]);
});
test('duplicate outpoints are rejected before signing', async () => {
  await assert.rejects(spend([
    utxo('11', { spendable: true }), utxo('11', { spendable: true })
  ]), /Duplicate UTXO outpoint/);
});
test('low-level signing refuses unclassified or protected inputs', async () => {
  const output = { valueSats: 10000n, scriptPubKey: Uint8Array.of(0x6a) };
  await assert.rejects(buildP2wpkhTransaction({
    inputs: [utxo('11')], outputs: [output], key
  }), /Unsafe or unclassified/);
  await assert.rejects(buildP2wpkhTransaction({
    inputs: [utxo('11', { spendable: true, vnsAnchor: true })],
    outputs: [output], key
  }), /Unsafe or unclassified/);
});