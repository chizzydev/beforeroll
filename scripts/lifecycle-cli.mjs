/** M3-S20 owner-only local lifecycle backup, verification and opt-in recovery.
 * Examples:
 * node scripts/lifecycle-cli.mjs backup project_id C:\\Users\\HP\\Downloads\\project-backup.json
 * node scripts/lifecycle-cli.mjs verify C:\\Users\\HP\\Downloads\\project-backup.json
 * node scripts/lifecycle-cli.mjs restore C:\\Users\\HP\\Downloads\\project-backup.json C:\\Users\\HP\\BeforeRollRecovered project_id
 * No internet access, no Clocked calls and no overwrite of an existing workspace.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createDurableExecution} from '../src/durable-execution.mjs';
import {createSourceOriginalVault} from '../src/source-originals.mjs';
import {workspaceDirectory} from '../src/workspace-location.mjs';
import {createLifecycleBackup,verifyLifecycleBackup,restoreLifecycleBackup} from '../src/production-lifecycle.mjs';
import {encryptOwnerBackup,decryptOwnerBackup} from '../src/secure-backup.mjs';
const [cmd,...args]=process.argv.slice(2);
const directory=workspaceDirectory();
async function readBackup(file){
 const abs=path.resolve(file||'');const stats=await fs.stat(abs);
 if(!stats.isFile()||stats.size<20||stats.size>96*1024*1024)throw Error('Owner backup must be a JSON file of 20 bytes to 96 MiB');
 return JSON.parse(await fs.readFile(abs,'utf8'));
}
function backupPassphrase(){
 const value=process.env.BEFOREROLL_BACKUP_PASSPHRASE;
 if(!value||value.length<14)throw Error('Provide BEFOREROLL_BACKUP_PASSPHRASE (minimum 14 characters) via a local secure prompt, never as a command argument');
 return value;
}
async function main(){
 if(cmd==='backup-encrypted'){
  const [id,filename]=args;if(!id||!filename||!path.isAbsolute(filename))throw Error('Usage: backup-encrypted <workspace-id> <new-absolute-file.json>');
  const store=createWorkspaceStore({directory});const saved=await store.load(id);if(!saved)throw Error('Production not found');
  const execution=createDurableExecution({directory});const backup=await createLifecycleBackup(saved,execution,{sourceVault:createSourceOriginalVault({directory})});verifyLifecycleBackup(backup,execution);
  const secured=await encryptOwnerBackup(backup,backupPassphrase());
  await fs.writeFile(filename,JSON.stringify(secured)+'\n',{flag:'wx',mode:0o600});
  console.log('LIFECYCLE_ENCRYPTED_BACKUP=PASS ID='+id+' ENCRYPTION=AES_256_GCM KDF=SCRYPT');return;
 }
 if(cmd==='verify-encrypted'){
  const [filename]=args;if(!filename)throw Error('Usage: verify-encrypted <absolute-file.json>');
  const bundle=await readBackup(filename),backup=await decryptOwnerBackup(bundle,backupPassphrase());
  const x=verifyLifecycleBackup(backup,createDurableExecution({directory}));
  console.log('LIFECYCLE_ENCRYPTED_VERIFY=PASS ID='+x.workspaceId+' JOURNALS='+x.journalCount+' ORIGINALS='+x.originalFileCount);return;
 }
 if(cmd==='restore-encrypted'){
  const [filename,destination,confirmId]=args;
  if(!filename||!destination||!path.isAbsolute(destination)||!confirmId)throw Error('Usage: restore-encrypted <absolute-file.json> <absolute-empty-dir> <exact-id>');
  const bundle=await readBackup(filename),backup=await decryptOwnerBackup(bundle,backupPassphrase());
  if(backup.workspaceId!==confirmId)throw Error('Recovery owner project ID confirmation mismatch');
  const store=createWorkspaceStore({directory:path.resolve(destination)}),execution=createDurableExecution({directory:store.directory});
  const result=await restoreLifecycleBackup(backup,{workspaceStore:store,execution,ownerConfirmed:true});
  console.log('LIFECYCLE_ENCRYPTED_RESTORE=PASS ID='+result.workspaceId+' ORIGINALS='+result.restoredOriginals+' MODEL_CALLS=ZERO');return;
 }

 if(cmd==='backup'){
  const [id,filename]=args;if(!id||!filename)throw Error('Usage: backup <workspace-id> <new-absolute-file.json>');
  if(!path.isAbsolute(filename))throw Error('Backup output must be an absolute path');
  const store=createWorkspaceStore({directory});const saved=await store.load(id);if(!saved)throw Error('Production does not exist');
  const execution=createDurableExecution({directory});const backup=await createLifecycleBackup(saved,execution,{sourceVault:createSourceOriginalVault({directory})});
  verifyLifecycleBackup(backup,execution);
  await fs.writeFile(filename,JSON.stringify(backup,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(`LIFECYCLE_BACKUP=PASS ID=${id} JOURNALS=${backup.journals.length} ORIGINAL_FILES=${backup.originalSources?.preserved??0} ORIGINALS_MISSING=${backup.originalSources?.missingOriginalSha256.length??0} SHA256=${backup.sha256}`);return;
 }
 if(cmd==='verify'){
  const [filename]=args;if(!filename)throw Error('Usage: verify <absolute-file.json>');
  const backup=await readBackup(filename);const verified=verifyLifecycleBackup(backup,createDurableExecution({directory}));
  console.log(`LIFECYCLE_BACKUP_VERIFY=PASS ID=${verified.workspaceId} JOURNALS=${verified.journalCount} CURRENT=${verified.currentRun} ARCHIVED=${verified.archivedRuns} ORIGINAL_FILES=${verified.originalFileCount} ORIGINALS_MISSING=${verified.missingOriginalFiles}`);return;
 }
 if(cmd==='restore'){
  const [filename,destination,confirmationId]=args;
  if(!filename||!destination||!confirmationId||!path.isAbsolute(destination))throw Error('Usage: restore <absolute-file.json> <absolute-empty-destination-directory> <exact-project-id>');
  const backup=await readBackup(filename);
  if(backup.workspaceId!==confirmationId)throw Error('Owner project-id confirmation mismatch; no changes made');
  const store=createWorkspaceStore({directory:path.resolve(destination)}),execution=createDurableExecution({directory:store.directory});
  const verified=await restoreLifecycleBackup(backup,{workspaceStore:store,execution,ownerConfirmed:true});
  console.log(`LIFECYCLE_RESTORE=PASS ID=${verified.workspaceId} NEW_VERSION=${verified.recoveredVersion} JOURNALS=${verified.restoredJournals} ORIGINAL_FILES=${verified.restoredOriginals} MODEL_CALLS=ZERO`);return;
 }
 throw Error('Use: backup-encrypted <id> <file> | verify-encrypted <file> | restore-encrypted <file> <empty-dir> <exact-id> | legacy backup/verify/restore');
}
main().catch(e=>{console.error('BEFOREROLL_LIFECYCLE_ERROR='+e.message);process.exitCode=1;});
