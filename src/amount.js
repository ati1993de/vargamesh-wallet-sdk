import { MAINNET } from './constants.js';
export function parseCoins(value){const s=String(value).trim();if(!/^\d+(\.\d{0,8})?$/.test(s))throw new Error('Invalid VMESH amount');const [a,b='']=s.split('.');return BigInt(a)*MAINNET.coin+BigInt((b+'00000000').slice(0,8));}
export function formatCoins(sats){let n=BigInt(sats);const neg=n<0n;if(neg)n=-n;const s=`${n/MAINNET.coin}.${(n%MAINNET.coin).toString().padStart(8,'0')}`;return neg?'-'+s:s;}
