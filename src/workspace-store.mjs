/** Local-only durable project repository, owner-operated, zero network calls.
 * All mutations require an optimistic version. Files are atomic, checksummed,
 * permissions-limited and validated against exact original Unicode sources.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {importWorkspace,exportWorkspace} from './production-workspace.mjs';
import {assertAuthorityIntegrity} from './document-authority.mjs';
import {assertSceneAuthorityIntegrity} from './scene-authority.mjs';
import {assertProductionOperationsIntegrity} from './production-operations.mjs';
const hash=x=>createHash('sha256').update(x,'utf8').digest('hex');
function validId(id){if(typeof id!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id))throw Error('Workspace id must be 1-80 safe characters');return id;}
export function createWorkspaceStore({directory}){
 if(typeof directory!=='string'||!path.isAbsolute(directory))throw Error('Absolute workspace data directory required');
 let queue=Promise.resolve();
 const serialize=(fn)=>{const task=queue.then(fn);queue=task.catch(()=>{});return task;};
 const filename=id=>path.join(directory,validId(id)+'.json');
 const init=async()=>{await fs.mkdir(directory,{recursive:true,mode:0o700});const info=await fs.lstat(directory);if(!info.isDirectory()||info.isSymbolicLink())throw Error('Invalid project storage directory');};
 async function load(id){
  await init();let str;try{str=await fs.readFile(filename(id),'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}
  let wrapper;try{wrapper=JSON.parse(str);}catch{throw Error('Stored workspace JSON corrupted');}
  if(wrapper?.schema!=='beforeroll-persisted-workspace-v1'||!Number.isSafeInteger(wrapper.version)||wrapper.version<1||!wrapper.workspace||wrapper.sha256!==hash(JSON.stringify(wrapper.workspace)))throw Error('Stored workspace integrity failure');
  const workspace=importWorkspace(JSON.stringify(wrapper.workspace));assertAuthorityIntegrity(workspace);assertSceneAuthorityIntegrity(workspace);assertProductionOperationsIntegrity(workspace);if(workspace.id!==id)throw Error('Stored workspace identity mismatch');
  return {version:wrapper.version,workspace,updatedAt:wrapper.updatedAt,sha256:wrapper.sha256};
 }
 async function persist(workspace,{expectedVersion}={}){
  return serialize(async()=>{
   const id=validId(workspace?.id);
   await init();
   // Cross-process writer fence: the CLI and local server must not race.
   // A stranded lock requires deliberate owner inspection, never automatic deletion.
   let lock;
   try{lock=await fs.open(path.join(directory,'.beforeroll-write.lock'),'wx',0o600);}
   catch(e){if(e.code==='EEXIST'){const conflict=new Error('Another writer or unrecovered lock exists; no changes made');conflict.httpStatus=409;throw conflict;}throw e;}
   try{
   const previous=await load(id);const actual=previous?.version??0;
   if(!Number.isSafeInteger(expectedVersion)||expectedVersion<0)throw Error('Expected persisted version required');
   if(actual!==expectedVersion){const e=new Error(`Version conflict: expected ${expectedVersion}, current ${actual}`);e.httpStatus=409;throw e;}
   const clean=importWorkspace(exportWorkspace(workspace));assertAuthorityIntegrity(clean);assertSceneAuthorityIntegrity(clean);assertProductionOperationsIntegrity(clean);
   const wrapper={schema:'beforeroll-persisted-workspace-v1',version:actual+1,updatedAt:new Date().toISOString(),workspace:clean,sha256:hash(JSON.stringify(clean))};
   const temp=path.join(directory,`.${id}.${randomUUID()}.tmp`);
   try{
    await fs.writeFile(temp,JSON.stringify(wrapper)+'\n',{flag:'wx',mode:0o600});
    await fs.rename(temp,filename(id));
   }finally{await fs.unlink(temp).catch(()=>{});}
   return {id,version:wrapper.version,updatedAt:wrapper.updatedAt,sha256:wrapper.sha256,workspace:clean};
   }finally{await lock.close();await fs.unlink(path.join(directory,'.beforeroll-write.lock'));}
  });
 }
 async function list(){
  await init();const names=(await fs.readdir(directory)).filter(x=>/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}\.json$/.test(x)).sort();
  const items=[];for(const name of names){const id=name.slice(0,-5);const p=await load(id);items.push({id,title:p.workspace.title,revision:p.workspace.revision,version:p.version,documentCount:p.workspace.documents.length,sceneCount:p.workspace.callSheet?.scenes?.length??0,updatedAt:p.updatedAt});}
  return items;
 }
 return {load,persist,list,directory};
}
