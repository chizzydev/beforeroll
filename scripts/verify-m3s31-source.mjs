import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(ROOT,'M3S31_SHA256_MANIFEST.json'),'utf8'));
const skip=new Set(['M3S31_SHA256_MANIFEST.json','.env']);
async function enumerate(dir=''){
 const out=[];
 for(const x of await fs.readdir(path.join(ROOT,dir),{withFileTypes:true})){
  const rel=path.posix.join(dir,x.name);
  if(skip.has(rel))continue;
  if(x.isDirectory())out.push(...await enumerate(rel));
  else if(x.isFile())out.push(rel);
  else throw Error('Unexpected non-file distribution entry: '+rel);
 }
 return out;
}
const seen=(await enumerate()).sort();
const listed=manifest.files.map(x=>x.path).sort();
if(JSON.stringify(seen)!==JSON.stringify(listed))throw Error('Distribution filename inventory mismatch');
for(const x of manifest.files){
 const bytes=await fs.readFile(path.join(ROOT,x.path));
 const found=createHash('sha256').update(bytes).digest('hex');
 if(found!==x.sha256)throw Error('Source SHA mismatch: '+x.path);
}
console.log('M3S31_DISTRIBUTION_HASHES=PASS FILES='+manifest.files.length);
