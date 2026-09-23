import test from 'node:test';import assert from 'node:assert/strict';
import { VargaMeshKey, signDigest, verifyDigest, bytesToHex } from '../src/index.js';
import { sha256 } from '../src/hash.js';
test('RFC6979 signature is deterministic, low-S and verifies',async()=>{const k=VargaMeshKey.fromPrivateHex('0000000000000000000000000000000000000000000000000000000000000001');const h=await sha256(new TextEncoder().encode('VargaMesh SDK signing test'));const a=await signDigest(h,k.privateKey),b=await signDigest(h,k.privateKey);assert.equal(bytesToHex(a.der),bytesToHex(b.der));assert.ok(a.s<=0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0n);assert.equal(verifyDigest(h,a.der,k.publicKey()),true);});
