/** Exact M3-S27 distribution verification, excluding only its own manifest. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const filename='M3S27_SHA256_MANIFEST.json';
const manifest=JSON.parse(await fs.readFile(path.join(root,filename),'utf8'));
if(manifest.schema!=='beforeroll-m3s27-distribution-sha256-v1'||!Array.isArray(manifest.files)||manifest.files.length<215)throw Error('Invalid M3-S27 distribution manifest');
const actual=[];
async function scan(dir){
 for(const e of await fs.readdir(dir,{withFileTypes:true})){
  const rel=path.relative(root,path.join(dir,e.name)).split(path.sep).join('/');
  if(e.isDirectory())await scan(path.join(dir,e.name));
  else if(e.isFile()&&rel!==filename)actual.push(rel);
  else if(!e.isFile()&&!e.isDirectory())throw Error('Unsupported file type '+rel);
 }
}
await scan(root);actual.sort();
if(JSON.stringify(actual)!==JSON.stringify(manifest.files.map(f=>f.path)))throw Error('Distribution file paths differ from manifest');
for(const entry of manifest.files){
 if(!/^[a-f0-9]{64}$/.test(entry.sha256))throw Error('Invalid manifest hash');
 const actualHash=createHash('sha256').update(await fs.readFile(path.join(root,entry.path))).digest('hex');
 if(actualHash!==entry.sha256)throw Error('Distribution checksum mismatch: '+entry.path);
}
console.log(`M3S27_SOURCE_INTEGRITY=PASS FILES=${manifest.files.length}`);
