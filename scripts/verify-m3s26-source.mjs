/** Exact release checksum validation; MUST NOT self-hash the manifest. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const name='M3S26_SHA256_MANIFEST.json';
const manifest=JSON.parse(await fs.readFile(path.join(root,name),'utf8'));
if(manifest.schema!=='beforeroll-m3s26-distribution-sha256-v1'||!Array.isArray(manifest.files)||manifest.files.length<210)throw Error('Invalid M3-S26 distribution manifest');
const actual=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){
 const full=path.join(dir,e.name),rel=path.relative(root,full).split(path.sep).join('/');
 if(e.isDirectory())await walk(full);
 else if(e.isFile()&&rel!==name)actual.push(rel);
 else if(!e.isFile()&&!e.isDirectory())throw Error('Unsupported link/special file: '+rel);
}}
await walk(root);actual.sort();
if(JSON.stringify(actual)!==JSON.stringify(manifest.files.map(x=>x.path)))throw Error('Manifest paths differ from distribution');
for(const item of manifest.files){
 if(!/^[a-f0-9]{64}$/.test(item.sha256))throw Error('Invalid SHA-256 entry');
 if(createHash('sha256').update(await fs.readFile(path.join(root,item.path))).digest('hex')!==item.sha256)throw Error('Source differs from manifest: '+item.path);
}
console.log(`M3S26_SOURCE_INTEGRITY=PASS FILES=${manifest.files.length}`);
