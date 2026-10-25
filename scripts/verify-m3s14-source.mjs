/** No model request, no mutation. Verify distribution against pinned source hashes. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'M3S14_SHA256_MANIFEST.json'),'utf8'));
if(manifest.schema!=='beforeroll-m3s14-source-manifest-v1'||!Array.isArray(manifest.files)||!manifest.files.length)throw Error('Invalid source manifest');
const excluded=new Set(['M3S14_SHA256_MANIFEST.json']);
const actual=[];
async function visit(directory){for(const entry of await fs.readdir(directory,{withFileTypes:true})){
 const absolute=path.join(directory,entry.name),relative=path.relative(root,absolute).split(path.sep).join('/');
 if(entry.isDirectory())await visit(absolute);
 else if(entry.isFile()&&!excluded.has(relative))actual.push(relative);
 else if(!entry.isFile()&&!entry.isDirectory())throw Error('Unexpected non-file entry: '+relative);
}}
await visit(root);actual.sort();const expected=manifest.files.map(x=>x.path);
if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Manifest file set mismatch; unexpected, missing, or reordered files');
for(const item of manifest.files){if(!/^[a-f0-9]{64}$/.test(item.sha256))throw Error('Invalid expected hash');const bytes=await fs.readFile(path.join(root,item.path));const hash=createHash('sha256').update(bytes).digest('hex');if(hash!==item.sha256)throw Error('SHA256 mismatch: '+item.path);}
console.log(`M3S14_SOURCE_INTEGRITY=PASS FILES=${manifest.files.length}`);
