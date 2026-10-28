/** Offline inventory verification; no credentials, provider transport or workspace writes. */
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url);
const manifest=JSON.parse(await fs.readFile(new URL('RELEASE_MANIFEST.json',root),'utf8'));
if(manifest.schema!=='beforeroll-public-release-manifest-v2'||!Array.isArray(manifest.files))throw Error('Unsupported public inventory');
const seen=new Set();
for(const entry of manifest.files){
 if(typeof entry.path!=='string'||entry.path.includes('\\')||entry.path.startsWith('/')||entry.path.split('/').some(p=>!p||p==='.'||p==='..')||seen.has(entry.path)||entry.path==='RELEASE_MANIFEST.json')throw Error('Unsafe/duplicate inventory path');
 seen.add(entry.path);
 const bytes=await fs.readFile(new URL(entry.path,root));
 if(bytes.length!==entry.bytes||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Public inventory mismatch: '+entry.path);
}
console.log(JSON.stringify({status:'PUBLIC_DISTRIBUTION_INVENTORY_PASS',verifiedFiles:seen.size,manifestSelfHashExcluded:true,providerRequestsNow:0}));
