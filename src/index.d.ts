export const MAINNET: Readonly<{name:string;ticker:string;decimals:number;coin:bigint;bech32Hrp:string;wifVersion:number;p2pkhVersion:number;p2shVersion:number;p2pPort:number;rpcPort:number;genesisHash:string;protocolVersion:number;dustSats:bigint;defaultFeeRateSatVb:bigint}>;
export class VargaMeshKey { privateKey: Uint8Array; constructor(privateKey:Uint8Array); static fromPrivateHex(hex:string):VargaMeshKey; static fromWif(wif:string):Promise<VargaMeshKey>; static generate():VargaMeshKey; privateHex():string; publicKey():Uint8Array; address():Promise<string>; wif():Promise<string>; }
export function addressFromPublicKey(publicKey:Uint8Array):Promise<string>;
export function legacyP2pkhFromPublicKey(publicKey:Uint8Array):Promise<string>;
export function addressToScriptPubKey(address:string):Promise<Uint8Array>;
export function isValidAddress(address:string):Promise<boolean>;
export function estimateFee(inputs:number,outputs:number,feeRateSatVb?:bigint|number):bigint;
export function createSpend(args:{utxos:Array<{txid:string;vout:number;valueSats?:bigint|number|string;sats?:bigint|number|string}>;destination:string;amountSats:bigint|number|string;feeRateSatVb?:bigint|number;key:VargaMeshKey}):Promise<any>;
export function buildP2wpkhTransaction(args:any):Promise<any>;
export function signDigest(hash32:Uint8Array,privateKey:Uint8Array):Promise<{r:bigint;s:bigint;der:Uint8Array}>;
export function verifyDigest(hash32:Uint8Array,derSignature:Uint8Array,compressedPublicKey:Uint8Array):boolean;
export function parseCoins(value:string|number):bigint;
export function formatCoins(sats:bigint|number|string):string;
export class VargaMeshRpcClient { constructor(args?:{url?:string;username?:string;password?:string;headers?:Record<string,string>}); call(method:string,params?:unknown[]):Promise<any>; getBlockchainInfo():Promise<any>; getNetworkInfo():Promise<any>; getBlockCount():Promise<any>; validateAddress(address:string):Promise<any>; sendRawTransaction(hex:string):Promise<any>; decodeRawTransaction(hex:string):Promise<any>; testMempoolAccept(hex:string):Promise<any>; }
export class VargaMeshPublicApi { constructor(baseUrl?:string); request(path:string,options?:RequestInit):Promise<any>; status():Promise<any>; config():Promise<any>; fee():Promise<any>; address(address:string):Promise<any>; utxos(address:string):Promise<any>; broadcast(rawHex:string):Promise<any>; }
export function bytesToHex(bytes:Uint8Array):string;
export function hexToBytes(hex:string):Uint8Array;
