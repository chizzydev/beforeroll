/** M3-S21: local-only, immutable source-original storage.
 * Blob names are SHA-256 of exact imported bytes. Normalized text is never
 * substituted for an original PDF, DOCX, CSV, JSON or UTF-8 text file.
 * A failed production commit may leave an orphaned blob; no existing blob is
 * ever modified or deleted automatically, avoiding evidence loss on crashes.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const hex=/^[a-f0-9]{64}$/;
const maxFile=8*1024*1024;
const sha=data=>createHash('sha256').update(data).digest('hex');
function requireHash(hash){if(typeof hash!=='string'||!hex.test(hash))throw Error('Original file SHA-256 identity is invalid');return hash;}
function bytesForSource(file){
 if(!file||typeof file!=='object'||(file.text===undefined)===(file.contentBase64===undefined))throw Error('Original source must supply exactly one text or base64 payload');
 if(file.text!==undefined){if(typeof file.text!=='string')throw Error('Original text must be a string');return Buffer.from(file.text,'utf8');}
 if(typeof file.contentBase64!=='string'||!file.contentBase64||file.contentBase64.length>Math.ceil(maxFile/3)*4+8||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.contentBase64))throw Error('Original base64 is malformed or excessive');
 const data=Buffer.from(file.contentBase64,'base64');
 if(data.toString('base64')!==file.contentBase64)throw Error('Original base64 is noncanonical');
 return data;
}
/** Retain historical uploads as well as currently selected files. Each receipt
 * contains the original byte checksum, not the normalized-transcript hash. */
export function referencedOriginals(workspace){
 const map=new Map();
 const add=(r)=>{if(!r?.rawHash)return;const id=requireHash(r.rawHash);
  if(!Number.isSafeInteger(r.byteCount)||r.byteCount<=0||r.byteCount>maxFile)throw Error('Invalid original-file receipt length');
  if(map.has(id)&&map.get(id)!==r.byteCount)throw Error('Conflicting byte counts for original file');map.set(id,r.byteCount);};
 for(const r of workspace.imports??[])add(r);
 for(const d of workspace.documents??[])add(d.importReceipt);
 add(workspace.callSheet?.importReceipt);
 return [...map].sort(([a],[b])=>a.localeCompare(b)).map(([rawHash,byteCount])=>({rawHash,byteCount}));
}
export function createSourceOriginalVault({directory}){
 if(typeof directory!=='string'||!path.isAbsolute(directory))throw Error('Owner-original store requires absolute workspace directory');
 const root=path.join(directory,'.source-originals');
 const filename=hash=>path.join(root,requireHash(hash)+'.bin');
 async function init(){await fs.mkdir(root,{recursive:true,mode:0o700});const st=await fs.lstat(root);if(st.isSymbolicLink()||!st.isDirectory())throw Error('Unsafe original-file store');}
 async function read(rawHash){
  const full=filename(rawHash);await init();let bytes;
  try{const st=await fs.lstat(full);if(!st.isFile()||st.isSymbolicLink()||st.size<=0||st.size>maxFile)throw Error('Invalid original-file blob');bytes=await fs.readFile(full);}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(sha(bytes)!==rawHash)throw Error('Original-file blob checksum mismatch');return bytes;
 }
 async function putBytes(bytes,expectedHash){
  if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>maxFile)throw Error('Original source exceeds the permitted size');
  const rawHash=sha(bytes);if(rawHash!==requireHash(expectedHash))throw Error('Original upload SHA-256 disagrees with parsed source receipt');
  await init();const existing=await read(rawHash);if(existing){if(!existing.equals(bytes))throw Error('Original content-address collision');return {rawHash,byteCount:bytes.length,alreadyPresent:true};}
  const full=filename(rawHash),temp=path.join(root,'.'+randomUUID()+'.tmp');
  try{await fs.writeFile(temp,bytes,{flag:'wx',mode:0o600});
   // Never replace an already present source blob. Atomic link keeps both
   // independent writers from overwriting evidence.
   try{await fs.link(temp,full);}catch(e){if(e.code!=='EEXIST')throw e;const present=await read(rawHash);if(!present?.equals(bytes))throw Error('Concurrent original-file write conflict');}
  }finally{await fs.unlink(temp).catch(()=>{});}
  return {rawHash,byteCount:bytes.length,alreadyPresent:false};
 }
 async function storeImport(file,envelope){
  if(!envelope||envelope.schema!=='beforeroll-source-import-v1')throw Error('Import must be parsed before storing original');
  const bytes=bytesForSource(file);
  if(bytes.length!==envelope.byteCount)throw Error('Original upload length disagrees with parsed source');
  return putBytes(bytes,envelope.rawHash);
 }
 async function relink(workspace,{rawHash,file}){
  const match=referencedOriginals(workspace).find(x=>x.rawHash===rawHash);
  if(!match)throw Error('Requested original file is not referenced by this production');
  const bytes=bytesForSource(file);
  if(bytes.length!==match.byteCount)throw Error('Owner-provided original has wrong byte length');
  return putBytes(bytes,rawHash);
 }
 async function inventory(workspace,{includeBytes=false,maxTotalBytes=32*1024*1024}={}){
  const references=referencedOriginals(workspace),items=[],missingOriginalSha256=[];let totalBytes=0;
  for(const ref of references){const bytes=await read(ref.rawHash);
   if(!bytes){missingOriginalSha256.push(ref.rawHash);continue;}
   if(bytes.length!==ref.byteCount)throw Error('Original file and production receipt length disagree');
   totalBytes+=bytes.length;if(includeBytes&&totalBytes>maxTotalBytes)throw Error('Original archive exceeds explicit 32 MiB backup budget; split the production or retain original documents separately');
   items.push(includeBytes?{...ref,contentBase64:bytes.toString('base64')}:{...ref});
  }
  return {schema:'beforeroll-original-source-inventory-v1',referenced:references.length,preserved:items.length,
   missingOriginalSha256,totalBytes,items,complete:missingOriginalSha256.length===0,notClearance:true};
 }
 return {directory:root,read,putBytes,storeImport,relink,inventory};
}
