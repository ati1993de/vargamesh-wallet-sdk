import { VargaMeshKey, createSpend } from '../src/index.js';
const key=await VargaMeshKey.fromWif(process.env.VMESH_WIF);const destination=process.argv[2];const tx=await createSpend({utxos:JSON.parse(process.env.VMESH_UTXOS),destination,amountSats:1000000n,feeRateSatVb:1n,key});console.log(tx.rawHex);
