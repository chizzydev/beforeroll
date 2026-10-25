/** Exact M3-S30 distribution inventory and checksums, offline and read-only. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const filename='M3S30_SHA256_MANIFEST.json';
const manifest=JSON.parse(await fs.readFile(path.join(root,filename),'utf8'));
if(manifest.schema!=='beforeroll-m3s30-distribution-sha256-v1'||manifest.version!=='0.28.0'||!Array.isArray(manifest.files)||manifest.files.length<236)throw Error('Invalid evaluation release inventory');
const actual=[];
async function scan(dir){for(const item of await fs.readdir(dir,{withFileTypes:true})){
 const full=path.join(dir,item.name),rel=path.relative(root,full).split(path.sep).join('/');
 if(item.isDirectory())await scan(full);
 else if(item.isFile()&&rel!==filename)actual.push(rel);
 else if(!item.isFile()&&!item.isDirectory())throw Error('Unsupported file type '+rel);
}}
await scan(root);actual.sort();
if(JSON.stringify(actual)!==JSON.stringify(manifest.files.map(x=>x.path)))throw Error('Distribution inventory mismatch');
for(const file of manifest.files){
 if(!/^[a-f0-9]{64}$/.test(file.sha256))throw Error('Invalid manifest hash '+file.path);
 const actualSha=createHash('sha256').update(await fs.readFile(path.join(root,file.path))).digest('hex');
 if(actualSha!==file.sha256)throw Error('Distribution SHA-256 mismatch '+file.path);
}
console.log('M3S30_SOURCE_INTEGRITY=PASS FILES='+manifest.files.length);
