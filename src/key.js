import { MAINNET } from './constants.js';
import { base58CheckDecode, base58CheckEncode } from './base58.js';
import { addressFromPublicKey } from './address.js';
import { concatBytes, hexToBytes, bytesToHex } from './bytes.js';
import { CURVE_N, publicKeyCompressed, validatePrivateKey } from './secp256k1.js';

export class VargaMeshKey {
  constructor(privateKey){validatePrivateKey(privateKey);this.privateKey=new Uint8Array(privateKey);}
  static fromPrivateHex(hex){return new VargaMeshKey(hexToBytes(hex));}
  static async fromWif(wif){const p=await base58CheckDecode(wif);if(p.length!==34||p[0]!==MAINNET.wifVersion||p[33]!==1)throw new Error('Not a compressed VMESH mainnet WIF');return new VargaMeshKey(p.slice(1,33));}
  static generate(){if(!globalThis.crypto?.getRandomValues)throw new Error('Secure random generator unavailable');for(;;){const b=globalThis.crypto.getRandomValues(new Uint8Array(32));try{return new VargaMeshKey(b);}catch{}}}
  privateHex(){return bytesToHex(this.privateKey);}
  publicKey(){return publicKeyCompressed(this.privateKey);}
  async address(){return addressFromPublicKey(this.publicKey());}
  async wif(){return base58CheckEncode(concatBytes(Uint8Array.of(MAINNET.wifVersion),this.privateKey,Uint8Array.of(1)));}
}
export { CURVE_N };
