export function concatBytes(...arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const a of arrays) { out.set(a, p); p += a.length; }
  return out;
}

export function bytesToHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex) {
  const s = String(hex).trim().toLowerCase();
  if (!/^[0-9a-f]*$/.test(s) || (s.length & 1)) throw new Error('Invalid hex');
  return Uint8Array.from(s.match(/../g) || [], x => Number.parseInt(x, 16));
}

export function reverseBytes(bytes) { return Uint8Array.from(bytes).reverse(); }

export function u32le(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) throw new Error('u32 out of range');
  return Uint8Array.of(n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255);
}

export function u64le(value) {
  let n = BigInt(value);
  if (n < 0n || n > 0xffffffffffffffffn) throw new Error('u64 out of range');
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) { out[i] = Number(n & 255n); n >>= 8n; }
  return out;
}

export function varInt(value) {
  const n = BigInt(value);
  if (n < 0n) throw new Error('Negative varint');
  if (n < 0xfdn) return Uint8Array.of(Number(n));
  if (n <= 0xffffn) return Uint8Array.of(0xfd, Number(n & 255n), Number((n >> 8n) & 255n));
  if (n <= 0xffffffffn) return concatBytes(Uint8Array.of(0xfe), u32le(Number(n)));
  return concatBytes(Uint8Array.of(0xff), u64le(n));
}

export function bigintToBytes(value, length = 32) {
  let n = BigInt(value);
  if (n < 0n) throw new Error('Negative bigint');
  const out = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) { out[i] = Number(n & 255n); n >>= 8n; }
  if (n !== 0n) throw new Error('Bigint does not fit');
  return out;
}

export function bytesToBigint(bytes) {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  return n;
}

export function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
