/** Exact M3-S29 distribution file-set and SHA-256 verification; no network. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const filename='M3S29_SHA256_MANIFEST.json';
const manifest=JSON.parse(await fs.readFile(path.join(root,filename),'utf8'));
if(manifest.schema!=='beforeroll-m3s29-distribution-sha256-v1'||manifest.version!=='0.27.0'||!Array.isArray(manifest.files)||manifest.files.length<229)throw Error('Invalid M3-S29 distribution manifest');
const actual=[];
async function scan(dir){
 for(const item of await fs.readdir(dir,{withFileTypes:true})){
  const full=path.join(dir,item.name),rel=path.relative(root,full).split(path.sep).join('/');
  if(item.isDirectory())await scan(full);
  else if(item.isFile()&&rel!==filename)actual.push(rel);
  else if(!item.isFile()&&!item.isDirectory())throw Error('Unsupported distribution file type '+rel);
 }
}
await scan(root);actual.sort();
if(JSON.stringify(actual)!==JSON.stringify(manifest.files.map(x=>x.path)))throw Error('Distribution file inventory disagrees with M3-S29 manifest');
for(const item of manifest.files){
 if(!/^[a-f0-9]{64}$/.test(item.sha256))throw Error('Invalid distribution hash');
 const digest=createHash('sha256').update(await fs.readFile(path.join(root,item.path))).digest('hex');
 if(digest!==item.sha256)throw Error('Distribution checksum mismatch: '+item.path);
}
console.log('M3S29_SOURCE_INTEGRITY=PASS FILES='+manifest.files.length);
