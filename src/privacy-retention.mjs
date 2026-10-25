/** Local owner retention: never expire active/historical source receipts or model journals.
 * Only unreferenced, aged, exact-hash original blobs are candidates for explicit
 * garbage collection. A plan digest binds the owner's confirmation to the scan.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {referencedOriginals} from './source-originals.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const AGE_MS=30*86400000;
export async function retentionPlan(store,{now=Date.now(),minimumAgeDays=30}={}){
 if(minimumAgeDays<30||!Number.isInteger(minimumAgeDays)||minimumAgeDays>3650)throw Error('Retention minimum age must be at least 30 days');
 const ids=(await store.list()).map(x=>x.id),referenced=new Set();
 for(const id of ids){const saved=await store.load(id);for(const source of referencedOriginals(saved.workspace))referenced.add(source.rawHash);}
 const root=path.join(store.directory,'.source-originals');
 let entries=[];try{entries=await fs.readdir(root);}catch(e){if(e.code!=='ENOENT')throw e;}
 const candidates=[],skipped=[],invalid=[];
 for(const name of entries.sort()){
  if(!/^[a-f0-9]{64}\.bin$/.test(name)){invalid.push(name);continue;}
  const expected=name.slice(0,64),file=path.join(root,name),stat=await fs.lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()){invalid.push(name);continue;}
  if(referenced.has(expected)){skipped.push({name,reason:'REFERENCED'});continue;}
  if(now-stat.mtimeMs<minimumAgeDays*86400000){skipped.push({name,reason:'RECENT_ORPHAN'});continue;}
  if(stat.size<1||stat.size>8*1024*1024){invalid.push(name);continue;}
  const actual=hash(await fs.readFile(file));if(actual!==expected){invalid.push(name);continue;}
  candidates.push({name,sha256:expected,bytes:stat.size,modifiedMs:stat.mtimeMs});
 }
 const digest=hash(JSON.stringify({schema:'beforeroll-retention-plan-v1',projectIds:ids,referenced:[...referenced].sort(),candidates,invalid}));
 return {schema:'beforeroll-retention-plan-v1',projectCount:ids.length,protectedOriginals:referenced.size,
  minimumAgeDays,candidateCount:candidates.length,candidates,skippedCount:skipped.length,invalid,
  confirmationSha256:digest,automaticDeletion:false,notice:'No workspace, recorded source receipt, execution journal or preserved historical evidence is ever deleted. Orphans can also be referenced by external backup copies; confirm before pruning.'};
}
export async function pruneOrphanedOriginals(store,{confirmationSha256,now=Date.now(),minimumAgeDays=30}={}){
 const plan=await retentionPlan(store,{now,minimumAgeDays});
 if(typeof confirmationSha256!=='string'||confirmationSha256!==plan.confirmationSha256)throw Error('Orphan retention plan changed or owner confirmation missing; nothing deleted');
 const root=path.join(store.directory,'.source-originals');let bytesFreed=0;
 for(const blob of plan.candidates){
  // Recheck immediately before each unlink; do not follow symlinks.
  const file=path.join(root,blob.name),stat=await fs.lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==blob.bytes||stat.mtimeMs!==blob.modifiedMs||now-stat.mtimeMs<AGE_MS||hash(await fs.readFile(file))!==blob.sha256)throw Error('Original blob changed after retention review; stop pruning');
  // A newly persisted receipt between plan and unlink must veto the deletion.
  for(const item of await store.list()){const saved=await store.load(item.id);if(referencedOriginals(saved.workspace).some(x=>x.rawHash===blob.sha256))throw Error('Source became referenced before retention cleanup');}
  await fs.unlink(file);bytesFreed+=blob.bytes;
 }
 return {schema:'beforeroll-retention-result-v1',deletedOrphanCount:plan.candidateCount,bytesFreed,
  workspacesDeleted:0,journalsDeleted:0,referencedSourcesDeleted:0,ownerConfirmed:true};
}
