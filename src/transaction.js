import { MAINNET } from './constants.js';
import { addressToScriptPubKey } from './address.js';
import { hash160, dsha256 } from './hash.js';
import { signDigest } from './secp256k1.js';
import { bytesToHex, concatBytes, hexToBytes, reverseBytes, u32le, u64le, varInt } from './bytes.js';

function normalizeUtxo(u) {
  const txid = String(u.txid).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(txid)) throw new Error('Invalid UTXO txid');
  const vout = Number(u.vout);
  const valueSats = BigInt(u.valueSats ?? u.sats);
  if (!Number.isSafeInteger(vout) || vout < 0 || vout > 0xffffffff || valueSats <= 0n) {
    throw new Error('Invalid UTXO');
  }
  // The caller MUST independently verify spendability and VNS ownership anchors.
  // An absent annotation is NOT permission to spend.
  return {
    txid, vout, valueSats,
    spendable: u.spendable === true,
    protected: u.protected === true || u.vnsAnchor === true || u.locked === true
  };
}
function outpointId(u) { return u.txid + ':' + u.vout; }
function requireUnprotectedInputs(inputs) {
  const seen = new Set();
  for (const u of inputs) {
    if (!u.spendable || u.protected) throw new Error('Unsafe or unclassified UTXO: spendability must be independently confirmed; VNS anchors may not be spent');
    const id = outpointId(u);
    if (seen.has(id)) throw new Error('Duplicate UTXO outpoint');
    seen.add(id);
  }
}
function outpoint(u){return concatBytes(reverseBytes(hexToBytes(u.txid)),u32le(u.vout));}
function serializeOutput(o){return concatBytes(u64le(o.valueSats),varInt(o.scriptPubKey.length),o.scriptPubKey);}

export function estimateFee(inputs,outputs,feeRateSatVb=MAINNET.defaultFeeRateSatVb){const rate=BigInt(feeRateSatVb);if(rate<1n)throw new Error('Fee rate must be >= 1 sat/vB');return (10n+68n*BigInt(inputs)+31n*BigInt(outputs))*rate;}

export async function createSpend({
  utxos, destination, amountSats, feeRateSatVb = MAINNET.defaultFeeRateSatVb, key,
  // Trusted VNS indexers/wallet metadata must supply protected outpoints.
  protectedOutpoints = [], includeOutpoints = []
}) {
  const amount = BigInt(amountSats);
  if (amount <= 0n) throw new Error('Amount must be greater than zero');
  const protectedSet = new Set(protectedOutpoints.map(x => String(x).toLowerCase()));
  const includedSet = new Set(includeOutpoints.map(x => String(x).toLowerCase()));
  const inputs = utxos.map(normalizeUtxo);
  const allIds = new Set();
  for (const u of inputs) {
    const id = outpointId(u);
    if (allIds.has(id)) throw new Error('Duplicate UTXO outpoint');
    allIds.add(id);
  }
  const available = inputs.filter(u =>
    u.spendable && !u.protected && !protectedSet.has(outpointId(u)) &&
    (includedSet.size === 0 || includedSet.has(outpointId(u)))
  ).sort((a,b) => a.valueSats === b.valueSats ? 0 : (a.valueSats > b.valueSats ? -1 : 1));
  if (includedSet.size && [...includedSet].some(id => !available.some(u => outpointId(u) === id))) {
    throw new Error('Coin control selected an unavailable or protected UTXO');
  }
  if (!available.length) throw new Error('No independently approved, unprotected UTXOs are available');
  const selected=[];let total=0n,fee=0n;
  for(const u of available){selected.push(u);total+=u.valueSats;fee=estimateFee(selected.length,2,feeRateSatVb);if(total>=amount+fee)break;}
  if(total<amount+fee)throw new Error('Insufficient confirmed UTXOs');
  const outputs=[{valueSats:amount,scriptPubKey:await addressToScriptPubKey(destination)}];
  let change=total-amount-fee;
  if(change>=MAINNET.dustSats){outputs.push({valueSats:change,scriptPubKey:await addressToScriptPubKey(await key.address())});}
  else{fee+=change;change=0n;}
  const signed=await buildP2wpkhTransaction({inputs:selected,outputs,key});
  return{...signed,selected,inputTotalSats:total,amountSats:amount,feeSats:fee,changeSats:change,feeRateSatVb:BigInt(feeRateSatVb)};
}

export async function buildP2wpkhTransaction({inputs,outputs,key}){
  const ins = inputs.map(normalizeUtxo);
  if (!ins.length || !outputs.length) throw new Error('Empty transaction');
  requireUnprotectedInputs(ins);
  const outs=outputs.map(o=>({valueSats:BigInt(o.valueSats),scriptPubKey:new Uint8Array(o.scriptPubKey)}));
  const version=u32le(2),sequence=u32le(0xffffffff),lockTime=u32le(0);
  const hashPrevouts=await dsha256(concatBytes(...ins.map(outpoint)));
  const hashSequence=await dsha256(concatBytes(...ins.map(()=>sequence)));
  const hashOutputs=await dsha256(concatBytes(...outs.map(serializeOutput)));
  const pub=key.publicKey(),pkh=await hash160(pub);
  const scriptCode=concatBytes(Uint8Array.of(0x19,0x76,0xa9,0x14),pkh,Uint8Array.of(0x88,0xac));
  const witnesses=[],signatures=[];
  for(const u of ins){const preimage=concatBytes(version,hashPrevouts,hashSequence,outpoint(u),scriptCode,u64le(u.valueSats),sequence,hashOutputs,lockTime,u32le(1));const sighash=await dsha256(preimage);const sigObj=await signDigest(sighash,key.privateKey);const sig=concatBytes(sigObj.der,Uint8Array.of(1));witnesses.push(concatBytes(Uint8Array.of(2),varInt(sig.length),sig,varInt(pub.length),pub));signatures.push({sighashHex:bytesToHex(sighash),derHex:bytesToHex(sigObj.der)});}
  const vin=concatBytes(varInt(ins.length),...ins.map(u=>concatBytes(outpoint(u),Uint8Array.of(0),sequence)));
  const vout=concatBytes(varInt(outs.length),...outs.map(serializeOutput));
  const noWitness=concatBytes(version,vin,vout,lockTime);
  const raw=concatBytes(version,Uint8Array.of(0,1),vin,vout,...witnesses,lockTime);
  const txid=bytesToHex(reverseBytes(await dsha256(noWitness)));
  const wtxid=bytesToHex(reverseBytes(await dsha256(raw)));
  return{rawHex:bytesToHex(raw),txid,wtxid,signatures};
}
