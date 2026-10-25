/** M3-S10 offline owner CLI. Same source intake and project store as the HTTP API.
 * Files stay local. No Clocked requests and no external packages.
 * Examples:
 *   node scripts/workspace-cli.mjs init demo "Sample Production"
 *   node scripts/workspace-cli.mjs import demo permit P1 "C:\\permits\\issued.txt"
 *   node scripts/workspace-cli.mjs import demo callSheet - "C:\\permits\\calls.csv"
 *   node scripts/workspace-cli.mjs plan demo
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createProduction,applySourceImport} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {workspaceDirectory} from '../src/workspace-location.mjs';
import {planIntelligence} from '../src/intelligence-workflow.mjs';
const store=createWorkspaceStore({directory:workspaceDirectory()});
const [command,id,...args]=process.argv.slice(2);
function requireId(){if(!id)throw Error('Usage: init/list/show/import/plan; workspace ID required');}
async function main(){
 if(command==='list'){const projects=await store.list();console.log(JSON.stringify(projects,null,2));return;}
 requireId();
 if(command==='init'){
  const title=args.join(' ');const workspace=createProduction({id,title});const saved=await store.persist(workspace,{expectedVersion:0});
  console.log(`WORKSPACE_CREATED=${saved.id} VERSION=${saved.version}`);return;
 }
 const saved=await store.load(id);if(!saved)throw Error('Workspace does not exist');
 if(command==='show'){console.log(JSON.stringify({id:saved.workspace.id,title:saved.workspace.title,version:saved.version,documents:saved.workspace.documents.map(x=>({id:x.id,name:x.name,revision:x.revision,sourceHash:x.sourceHash,sourceUnits:x.units.length})),scenes:saved.workspace.callSheet?.scenes.map(x=>({id:x.id,location:x.location,activity:x.activity}))||[],reviewActions:saved.workspace.reviewActions.length},null,2));return;}
 if(command==='import'){
  const [kind,documentId,filePath]=args;
  if(!kind||!documentId||!filePath)throw Error('Usage: import <workspace> <permit|callSheet> <documentId or -> <filePath>');
  const abs=path.resolve(filePath),stat=await fs.stat(abs);
  if(!stat.isFile()||stat.size>131072||stat.size===0)throw Error('Source file must be nonempty and at most 131072 bytes');
  const data=await fs.readFile(abs);
  const envelope=inspectImport({name:path.basename(abs),kind,contentBase64:data.toString('base64')});
  applySourceImport(saved.workspace,envelope,{documentId:kind==='permit'?documentId:null});
  const next=await store.persist(saved.workspace,{expectedVersion:saved.version});
  console.log(`SOURCE_IMPORTED=${kind} FORMAT=${envelope.sourceFormat} RAW_SHA256=${envelope.rawHash} VERSION=${next.version} REVIEW_NEEDED=YES`);return;
 }
 if(command==='plan'){
  const plan=planIntelligence(saved.workspace);
  console.log(`OFFLINE_PRODUCTION_PLAN=${id} SCENES=${saved.workspace.callSheet.scenes.length} DOCUMENTS=${saved.workspace.documents.length} TASKS=${plan.plannedCalls} CALLS_EXECUTED=0`);
  console.log('PLAN_IS_NOT_FILMING_CLEARANCE=YES');return;
 }
 throw Error('Unknown command');
}
main().catch(err=>{console.error('BEFOREROLL_WORKSPACE_ERROR='+err.message);process.exitCode=1;});
