import { bigintToBytes, bytesToBigint, concatBytes } from './bytes.js';
import { hmacSha256 } from './hash.js';

export const CURVE_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
export const CURVE_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
export const G = Object.freeze({
  x: 55066263022277343669578718895168534326250603453777594175500187360389116729240n,
  y: 32670510020758816978083085130507043184471273380659243275938904335757337482424n
});

export function mod(a, m = CURVE_P) { const r = a % m; return r >= 0n ? r : r + m; }

export function invert(a, m) {
  let x = mod(a, m), b = m, u = 1n, v = 0n;
  if (x === 0n) throw new Error('Inverse of zero');
  while (x !== 0n) { const q = b / x; [b, x] = [x, b % x]; [v, u] = [u, v - q * u]; }
  if (b !== 1n) throw new Error('Not invertible');
  return mod(v, m);
}

function powMod(base, exponent, modulus) {
  let b = mod(base, modulus), e = exponent, out = 1n;
  while (e > 0n) { if (e & 1n) out = (out * b) % modulus; b = (b * b) % modulus; e >>= 1n; }
  return out;
}

export function pointAdd(A, B) {
  if (!A) return B;
  if (!B) return A;
  if (A.x === B.x && mod(A.y + B.y) === 0n) return null;
  let slope;
  if (A.x === B.x && A.y === B.y) {
    if (A.y === 0n) return null;
    slope = mod(3n * A.x * A.x * invert(2n * A.y, CURVE_P));
  } else {
    slope = mod((B.y - A.y) * invert(B.x - A.x, CURVE_P));
  }
  const x = mod(slope * slope - A.x - B.x);
  const y = mod(slope * (A.x - x) - A.y);
  return { x, y };
}

export function scalarMultiply(k, point = G) {
  let n = BigInt(k);
  if (n < 0n || n >= CURVE_N) n = mod(n, CURVE_N);
  if (n === 0n) return null;
  let result = null, addend = point;
  while (n > 0n) { if (n & 1n) result = pointAdd(result, addend); addend = pointAdd(addend, addend); n >>= 1n; }
  return result;
}

export function validatePrivateKey(privateKey) {
  if (!(privateKey instanceof Uint8Array) || privateKey.length !== 32) throw new Error('Private key must be 32 bytes');
  const d = bytesToBigint(privateKey);
  if (d <= 0n || d >= CURVE_N) throw new Error('Invalid private key');
  return d;
}

export function publicKeyCompressed(privateKey) {
  const d = validatePrivateKey(privateKey);
  const P = scalarMultiply(d);
  return concatBytes(Uint8Array.of(P.y & 1n ? 0x03 : 0x02), bigintToBytes(P.x, 32));
}

function decompressPublicKey(publicKey) {
  if (!(publicKey instanceof Uint8Array) || publicKey.length !== 33 || (publicKey[0] !== 2 && publicKey[0] !== 3)) throw new Error('Compressed secp256k1 public key required');
  const x = bytesToBigint(publicKey.slice(1));
  if (x >= CURVE_P) throw new Error('Invalid public key');
  const y2 = mod(x * x * x + 7n);
  let y = powMod(y2, (CURVE_P + 1n) >> 2n, CURVE_P);
  if (mod(y * y) !== y2) throw new Error('Invalid public key point');
  const odd = (y & 1n) === 1n;
  if (odd !== (publicKey[0] === 3)) y = CURVE_P - y;
  return { x, y };
}

function derInt(n) {
  let b = bigintToBytes(n, 32);
  let first = 0; while (first < b.length - 1 && b[first] === 0) first++;
  b = b.slice(first);
  if (b[0] & 0x80) b = concatBytes(Uint8Array.of(0), b);
  return concatBytes(Uint8Array.of(0x02, b.length), b);
}

export function encodeDerSignature(r, s) {
  const a = derInt(r), b = derInt(s), body = concatBytes(a, b);
  return concatBytes(Uint8Array.of(0x30, body.length), body);
}

export function decodeDerSignature(der) {
  if (!(der instanceof Uint8Array) || der.length < 8 || der[0] !== 0x30 || der[1] !== der.length - 2) throw new Error('Invalid DER signature');
  let p = 2;
  const readInt = () => {
    if (der[p++] !== 0x02) throw new Error('Invalid DER integer');
    const len = der[p++]; if (!len || p + len > der.length) throw new Error('Invalid DER length');
    const b = der.slice(p, p + len); p += len;
    if (b[0] & 0x80) throw new Error('Negative DER integer');
    return bytesToBigint(b);
  };
  const r = readInt(), s = readInt();
  if (p !== der.length) throw new Error('Trailing DER data');
  return { r, s };
}

async function deterministicK(privateKey, hash32) {
  const d = validatePrivateKey(privateKey);
  if (!(hash32 instanceof Uint8Array) || hash32.length !== 32) throw new Error('Hash must be 32 bytes');
  const x = bigintToBytes(d, 32);
  const h = bigintToBytes(bytesToBigint(hash32) % CURVE_N, 32);
  let K = new Uint8Array(32);
  let V = new Uint8Array(32); V.fill(1);
  K = await hmacSha256(K, concatBytes(V, Uint8Array.of(0), x, h));
  V = await hmacSha256(K, V);
  K = await hmacSha256(K, concatBytes(V, Uint8Array.of(1), x, h));
  V = await hmacSha256(K, V);
  for (;;) {
    V = await hmacSha256(K, V);
    const k = bytesToBigint(V);
    if (k > 0n && k < CURVE_N) return k;
    K = await hmacSha256(K, concatBytes(V, Uint8Array.of(0)));
    V = await hmacSha256(K, V);
  }
}

export async function signDigest(hash32, privateKey) {
  const d = validatePrivateKey(privateKey);
  if (!(hash32 instanceof Uint8Array) || hash32.length !== 32) throw new Error('Hash must be 32 bytes');
  const z = bytesToBigint(hash32);
  for (;;) {
    const k = await deterministicK(privateKey, hash32);
    const R = scalarMultiply(k);
    const r = R.x % CURVE_N;
    if (r === 0n) continue;
    let s = mod(invert(k, CURVE_N) * (z + r * d), CURVE_N);
    if (s === 0n) continue;
    if (s > (CURVE_N >> 1n)) s = CURVE_N - s;
    return { r, s, der: encodeDerSignature(r, s) };
  }
}

export function verifyDigest(hash32, derSignature, compressedPublicKey) {
  try {
    if (!(hash32 instanceof Uint8Array) || hash32.length !== 32) return false;
    const { r, s } = decodeDerSignature(derSignature);
    if (r <= 0n || r >= CURVE_N || s <= 0n || s >= CURVE_N) return false;
    const Q = decompressPublicKey(compressedPublicKey);
    const z = bytesToBigint(hash32);
    const w = invert(s, CURVE_N);
    const u1 = mod(z * w, CURVE_N), u2 = mod(r * w, CURVE_N);
    const R = pointAdd(scalarMultiply(u1), scalarMultiply(u2, Q));
    return !!R && mod(R.x, CURVE_N) === r;
  } catch { return false; }
}
