import { concatBytes } from './bytes.js';

function cryptoApi() {
  if (!globalThis.crypto?.subtle) throw new Error('WebCrypto API is required');
  return globalThis.crypto;
}

export async function sha256(data) {
  return new Uint8Array(await cryptoApi().subtle.digest('SHA-256', data));
}

export async function dsha256(data) { return sha256(await sha256(data)); }

export async function hmacSha256(key, data) {
  const k = await cryptoApi().subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await cryptoApi().subtle.sign('HMAC', k, data));
}

// Compact RIPEMD-160 implementation used only because WebCrypto does not expose RIPEMD-160.
export function ripemd160(msg) {
  const K1=[0,0x5a827999,0x6ed9eba1,0x8f1bbcdc,0xa953fd4e], K2=[0x50a28be6,0x5c4dd124,0x6d703ef3,0x7a6d76e9,0];
  const r1=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13];
  const r2=[5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11];
  const s1=[11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
  const s2=[8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];
  const bitLen = msg.length * 8;
  const n = ((msg.length + 9 + 63) >> 6) << 6;
  const b = new Uint8Array(n); b.set(msg); b[msg.length] = 128;
  const dv = new DataView(b.buffer); dv.setUint32(n - 8, bitLen >>> 0, true); dv.setUint32(n - 4, Math.floor(bitLen / 2**32), true);
  let h=[0x67452301,0xefcdab89,0x98badcfe,0x10325476,0xc3d2e1f0];
  const rol=(x,n)=>(x<<n)|(x>>>(32-n));
  const f=(j,x,y,z)=>j<16?x^y^z:j<32?(x&y)|(~x&z):j<48?(x|~y)^z:j<64?(x&z)|(y&~z):x^(y|~z);
  for (let o=0;o<n;o+=64) {
    const X=Array(16); for(let i=0;i<16;i++) X[i]=dv.getUint32(o+i*4,true);
    let [a,b1,c,d,e]=h,[aa,bb,cc,dd,ee]=h;
    for(let j=0;j<80;j++){
      let t=(rol((a+f(j,b1,c,d)+X[r1[j]]+K1[j>>4])|0,s1[j])+e)|0; a=e;e=d;d=rol(c,10);c=b1;b1=t;
      const jj=79-j; t=(rol((aa+f(jj,bb,cc,dd)+X[r2[j]]+K2[j>>4])|0,s2[j])+ee)|0; aa=ee;ee=dd;dd=rol(cc,10);cc=bb;bb=t;
    }
    const t=(h[1]+c+dd)|0; h[1]=(h[2]+d+ee)|0; h[2]=(h[3]+e+aa)|0; h[3]=(h[4]+a+bb)|0; h[4]=(h[0]+b1+cc)|0; h[0]=t;
  }
  const out=new Uint8Array(20), od=new DataView(out.buffer); h.forEach((x,i)=>od.setUint32(i*4,x>>>0,true)); return out;
}

export async function hash160(data) { return ripemd160(await sha256(data)); }
export { concatBytes };
