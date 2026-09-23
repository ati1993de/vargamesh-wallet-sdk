import { MAINNET } from './constants.js';
import { hash160 } from './hash.js';
import { encodeWitness, decodeWitness } from './bech32.js';
import { base58CheckDecode, base58CheckEncode } from './base58.js';
import { concatBytes } from './bytes.js';

export async function addressFromPublicKey(publicKey) {
  if (!(publicKey instanceof Uint8Array) || publicKey.length !== 33) throw new Error('Compressed public key required');
  return encodeWitness(MAINNET.bech32Hrp, 0, await hash160(publicKey));
}

export async function legacyP2pkhFromPublicKey(publicKey) {
  return base58CheckEncode(concatBytes(Uint8Array.of(MAINNET.p2pkhVersion), await hash160(publicKey)));
}

export async function addressToScriptPubKey(address) {
  const a=String(address).trim();
  if(a.toLowerCase().startsWith(MAINNET.bech32Hrp+'1')){
    const d=decodeWitness(a);
    if(d.hrp!==MAINNET.bech32Hrp||d.version!==0||d.program.length!==20)throw new Error('Only VMESH v0 P2WPKH addresses are supported');
    return concatBytes(Uint8Array.of(0,20),d.program);
  }
  const p=await base58CheckDecode(a);
  if(p.length!==21)throw new Error('Invalid VMESH address length');
  const h=p.slice(1);
  if(p[0]===MAINNET.p2pkhVersion)return concatBytes(Uint8Array.of(0x76,0xa9,0x14),h,Uint8Array.of(0x88,0xac));
  if(p[0]===MAINNET.p2shVersion)return concatBytes(Uint8Array.of(0xa9,0x14),h,Uint8Array.of(0x87));
  throw new Error('Not a VMESH mainnet address');
}

export async function isValidAddress(address){try{await addressToScriptPubKey(address);return true;}catch{return false;}}
