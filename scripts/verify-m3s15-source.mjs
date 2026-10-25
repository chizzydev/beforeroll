/** Verify every file against the pinned distribution manifest. No writes or network calls. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const name='M3S15_SHA256_MANIFEST.json';
const manifest=JSON.parse(await fs.readFile(path.join(root,name),'utf8'));
if(manifest.schema!=='beforeroll-m3s15-source-manifest-v1'||!Array.isArray(manifest.files)||!manifest.files.length)throw Error('Invalid M3S15 manifest');
const actual=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){
 const full=path.join(dir,e.name),relative=path.relative(root,full).split(path.sep).join('/');
 if(e.isDirectory())await walk(full);
 else if(e.isFile()&&relative!==name)actual.push(relative);
 else if(!e.isFile()&&!e.isDirectory())throw Error('Unexpected symlink or special file: '+relative);
}}
await walk(root);actual.sort();
const entries=manifest.files.map(e=>e.path);
if(JSON.stringify(actual)!==JSON.stringify(entries))throw Error('Distribution file set missing, extra or unsorted');
for(const entry of manifest.files){if(!/^[0-9a-f]{64}$/.test(entry.sha256))throw Error('Invalid manifest digest');
 const bytes=await fs.readFile(path.join(root,entry.path));
 if(createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('SHA256 mismatch: '+entry.path);
}
console.log(`M3S15_SOURCE_INTEGRITY=PASS FILES=${manifest.files.length}`);
