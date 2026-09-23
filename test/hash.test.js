import test from 'node:test';import assert from 'node:assert/strict';import { createHash } from 'node:crypto';
import { ripemd160, sha256 } from '../src/hash.js';import { bytesToHex } from '../src/bytes.js';
test('hash primitives match Node crypto',async()=>{const msg=new TextEncoder().encode('VargaMesh');assert.equal(bytesToHex(await sha256(msg)),createHash('sha256').update(msg).digest('hex'));assert.equal(bytesToHex(ripemd160(msg)),createHash('ripemd160').update(msg).digest('hex'));});
