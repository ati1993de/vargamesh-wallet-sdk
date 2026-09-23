import { VargaMeshKey } from '../src/index.js';
const key=VargaMeshKey.generate();console.log({address:await key.address(),wif:await key.wif()});
