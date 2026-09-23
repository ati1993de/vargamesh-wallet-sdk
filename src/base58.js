import { bytesToBigint, bigintToBytes, concatBytes, equalBytes } from './bytes.js';
import { dsha256 } from './hash.js';
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58Encode(bytes) {
  let n = bytesToBigint(bytes), s = '';
  while (n > 0n) { const r = n % 58n; s = ALPHABET[Number(r)] + s; n /= 58n; }
  let zeros = 0; while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  return '1'.repeat(zeros) + s;
}

export function base58Decode(text) {
  const s = String(text);
  let n = 0n;
  for (const c of s) { const i = ALPHABET.indexOf(c); if (i < 0) throw new Error('Invalid Base58 character'); n = n * 58n + BigInt(i); }
  let body = n === 0n ? new Uint8Array() : bigintToBytes(n, Math.ceil(n.toString(16).length / 2));
  let zeros = 0; while (zeros < s.length && s[zeros] === '1') zeros++;
  return concatBytes(new Uint8Array(zeros), body);
}

export async function base58CheckEncode(payload) {
  return base58Encode(concatBytes(payload, (await dsha256(payload)).slice(0, 4)));
}

export async function base58CheckDecode(text) {
  const all = base58Decode(String(text).trim());
  if (all.length < 5) throw new Error('Invalid Base58Check');
  const payload = all.slice(0, -4), checksum = all.slice(-4);
  const expected = (await dsha256(payload)).slice(0, 4);
  if (!equalBytes(checksum, expected)) throw new Error('Base58 checksum mismatch');
  return payload;
}
