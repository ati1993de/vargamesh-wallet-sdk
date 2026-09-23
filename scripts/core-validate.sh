#!/usr/bin/env bash
set -euo pipefail
CLI="${VMESH_CLI:-vargamesh-cli}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VEC="$ROOT/test-vectors/wallet-vectors.json"
command -v "$CLI" >/dev/null 2>&1 || { echo "FAIL: $CLI not found. Set VMESH_CLI=/path/to/vargamesh-cli"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "FAIL: python3 required"; exit 1; }
ADDR="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["key"]["address"])' "$VEC")"
RAW="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["transaction"]["raw_hex"])' "$VEC")"
TXID="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["transaction"]["txid"])' "$VEC")"
WTXID="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["transaction"]["wtxid"])' "$VEC")"
EXPECTED_GENESIS='00000000b0c55c00c13e2ee67b54fe33c327c8806f8da5050cfa47095d182d9a'
echo '=== VargaMesh Core wallet SDK validation ==='
CHAIN="$($CLI getblockchaininfo)"; echo "$CHAIN" | python3 -m json.tool >/dev/null
GENESIS="$($CLI getblockhash 0)"; [[ "$GENESIS" == "$EXPECTED_GENESIS" ]] || { echo "FAIL genesis: $GENESIS"; exit 1; }; echo "PASS genesis $GENESIS"
VALID="$($CLI validateaddress "$ADDR")"; python3 - "$VALID" <<'PY'
import json,sys
j=json.loads(sys.argv[1])
assert j.get('isvalid') is True, j
print('PASS validateaddress')
PY
DECODED="$($CLI decoderawtransaction "$RAW")"
python3 - "$DECODED" "$TXID" "$WTXID" <<'PY'
import json,sys
j=json.loads(sys.argv[1]); txid,wtxid=sys.argv[2:]
assert j.get('txid')==txid,(j.get('txid'),txid)
# Bitcoin-Core-derived decoderawtransaction normally exposes witness hash as `hash`.
if 'hash' in j: assert j['hash']==wtxid,(j['hash'],wtxid)
assert len(j.get('vin',[]))==1,j
assert len(j.get('vout',[]))==2,j
print('PASS decoderawtransaction / txid / witness structure')
PY
echo 'INFO: testmempoolaccept is intentionally not a PASS criterion for this vector: its prevout is synthetic and therefore absent from the UTXO set.'
echo 'RESULT: CORE FORMAT VALIDATION PASS'
