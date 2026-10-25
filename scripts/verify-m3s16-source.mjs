/** Verify every distributed source file against the fixed package manifest. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const name='M3S16_SHA256_MANIFEST.json';
const manifest=JSON.parse(await fs.readFile(path.join(root,name),'utf8'));
if(manifest.schema!=='beforeroll-m3s16-source-manifest-v1'||!Array.isArray(manifest.files)||manifest.files.length<140)throw Error('Invalid M3-S16 source manifest');
const actual=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){
 const full=path.join(dir,e.name),relative=path.relative(root,full).split(path.sep).join('/');
 if(e.isDirectory())await walk(full);
 else if(e.isFile()&&relative!==name)actual.push(relative);
 else if(!e.isFile()&&!e.isDirectory())throw Error('Unexpected symlink or special file: '+relative);
}}
await walk(root);actual.sort();
if(JSON.stringify(actual)!==JSON.stringify(manifest.files.map(x=>x.path)))throw Error('Distributed file set incomplete, extra, or unsorted');
for(const item of manifest.files){if(!/^[a-f0-9]{64}$/.test(item.sha256))throw Error('Bad manifest digest');
 const b=await fs.readFile(path.join(root,item.path));if(createHash('sha256').update(b).digest('hex')!==item.sha256)throw Error('M3-S16 source SHA-256 mismatch: '+item.path);
}
console.log(`M3S16_SOURCE_INTEGRITY=PASS FILES=${manifest.files.length}`);
