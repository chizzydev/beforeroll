/** Dry-run by default. Manual orphan pruning only, never an active project or journal. */
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {workspaceDirectory} from '../src/workspace-location.mjs';
import {retentionPlan,pruneOrphanedOriginals} from '../src/privacy-retention.mjs';
const [operation,confirmation]=process.argv.slice(2);
const store=createWorkspaceStore({directory:workspaceDirectory()});
try{
 if(operation==='inspect'){
  console.log(JSON.stringify(await retentionPlan(store),null,2));
 }else if(operation==='prune-orphans'){
  if(!/^[a-f0-9]{64}$/.test(confirmation??''))throw Error('Usage: prune-orphans <exact-confirmationSha256-from-inspect>');
  console.log(JSON.stringify(await pruneOrphanedOriginals(store,{confirmationSha256:confirmation}),null,2));
 }else throw Error('Use: inspect | prune-orphans <exact-current-retention-plan-hash>');
}catch(e){console.error('OWNER_RETENTION_ERROR='+e.message);process.exitCode=1;}
