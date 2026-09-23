export class VargaMeshRpcClient {
  constructor({url='http://127.0.0.1:29667',username,password,headers={}}={}){this.url=url;this.username=username;this.password=password;this.headers=headers;this.id=0;}
  async call(method,params=[]){const headers={'content-type':'application/json',...this.headers};if(this.username!==undefined){headers.authorization='Basic '+btoa(`${this.username}:${this.password??''}`);}const r=await fetch(this.url,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:++this.id,method,params})});const j=await r.json();if(!r.ok||j.error)throw new Error(j?.error?.message||`RPC HTTP ${r.status}`);return j.result;}
  getBlockchainInfo(){return this.call('getblockchaininfo');}
  getNetworkInfo(){return this.call('getnetworkinfo');}
  getBlockCount(){return this.call('getblockcount');}
  validateAddress(address){return this.call('validateaddress',[address]);}
  sendRawTransaction(hex){return this.call('sendrawtransaction',[hex]);}
  decodeRawTransaction(hex){return this.call('decoderawtransaction',[hex]);}
  testMempoolAccept(hex){return this.call('testmempoolaccept',[[hex]]);}
}

export class VargaMeshPublicApi {
  constructor(baseUrl='https://vargacoin.com/api/v1'){this.baseUrl=baseUrl.replace(/\/$/,'');}
  async request(path,options={}){const r=await fetch(this.baseUrl+path,{cache:'no-store',...options,headers:{accept:'application/json',...(options.body?{'content-type':'application/json'}:{}),...(options.headers||{})}});const j=await r.json();if(!r.ok)throw new Error(j?.error||`API HTTP ${r.status}`);return j;}
  status(){return this.request('/status');}
  config(){return this.request('/config');}
  fee(){return this.request('/fee');}
  address(address){return this.request('/address/'+encodeURIComponent(address));}
  utxos(address){return this.request('/utxos/'+encodeURIComponent(address));}
  broadcast(rawHex){return this.request('/broadcast',{method:'POST',body:JSON.stringify({hex:rawHex})});}
}
