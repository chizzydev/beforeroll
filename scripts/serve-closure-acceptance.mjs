/** Generated-only local acceptance environment. No owner production directory.
 * Default: visibly controlled responses. --live-budget-16 uses the local key
 * with a durable, non-resetting limit of 16 new dispatch intents, no retries.
 */
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {deflateRawSync} from 'node:zlib';
import {createAppServer} from '../server.mjs';import {parseLocalEnv} from '../src/local-env.mjs';
import {createWorkspaceStore} from '../src/workspace-store.mjs';import {createDurableExecution} from '../src/durable-execution.mjs';
import {createProduction,applySourceImport,recordReview} from '../src/production-workspace.mjs';import {inspectImport} from '../src/source-intake.mjs';
import {createSourceOriginalVault} from '../src/source-originals.mjs';import {planIntelligence} from '../src/intelligence-workflow.mjs';
import {recordSceneAuthority} from '../src/scene-authority.mjs';import {recordSceneSchedule,recordCondition,decideCondition} from '../src/production-operations.mjs';
const root=path.resolve(import.meta.dirname,'..'),directory=path.join(root,'.beforeroll-data','closure-browser'),fixtures=path.join(root,'.beforeroll-data','closure-fixtures');
const live=process.argv.includes('--live-budget-16');const store=createWorkspaceStore({directory}),execution=createDurableExecution({directory}),vault=createSourceOriginalVault({directory});
await fs.mkdir(fixtures,{recursive:true});await fs.mkdir(directory,{recursive:true});
const sha=x=>createHash('sha256').update(x).digest('hex');
function zip(files){const data=[],cd=[];let offset=0;const n16=n=>{const b=Buffer.alloc(2);b.writeUInt16LE(n);return b;},n32=n=>{const b=Buffer.alloc(4);b.writeUInt32LE(n>>>0);return b;};
 for(const [name,value] of Object.entries(files)){const raw=Buffer.from(value),compressed=deflateRawSync(raw),f=Buffer.from(name);let crc=0xffffffff;for(const n of raw){crc^=n;for(let j=0;j<8;j++)crc=(crc>>>1)^(crc&1?0xedb88320:0);}crc=(crc^0xffffffff)>>>0;
 const head=Buffer.concat([n32(0x04034b50),n16(20),n16(0),n16(8),n16(0),n16(0),n32(crc),n32(compressed.length),n32(raw.length),n16(f.length),n16(0),f]);data.push(head,compressed);
 cd.push(Buffer.concat([n32(0x02014b50),n16(20),n16(20),n16(0),n16(8),n16(0),n16(0),n32(crc),n32(compressed.length),n32(raw.length),n16(f.length),n16(0),n16(0),n16(0),n16(0),n32(0),n32(offset),f]));offset+=head.length+compressed.length;}
 const central=Buffer.concat(cd);return Buffer.concat([...data,central,n32(0x06054b50),n16(0),n16(0),n16(cd.length),n16(cd.length),n32(central.length),n32(offset),n16(0)]);}
const permitA=['Fictional Permit CT-42 allows filming in Bay Lantern on 12 November 2026.','Motor-driven camera supports may not run across the timber deck unless a separately issued scene-specific variation authorizes the load and protective mats are fitted.'];
const permitB=[permitA[0],'Motor-driven camera supports may not run across the timber deck even when protective mats are fitted; a new load assessment signed by the registrar is required in addition to any earlier scene-specific variation.'];
function docx(lines){return zip({'[Content_Types].xml':'<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>','_rels/.rels':'<Relationships/>','word/document.xml':`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${lines.map(t=>`<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`).join('')}</w:body></w:document>`});}
function pdf(lines){const esc=t=>t.replace(/[()\\]/g,'\\$&');const stream='BT /F1 9 Tf 40 750 Td '+lines.map((l,i)=>(i?'0 -20 Td ':'')+`(${esc(l)}) Tj`).join(' ')+' ET';const objs=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1200 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];let data='%PDF-1.4\n',offsets=[0];for(const [i,o]of objs.entries()){offsets.push(Buffer.byteLength(data));data+=`${i+1} 0 obj\n${o}\nendobj\n`;}const x=Buffer.byteLength(data);data+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;return Buffer.from(data);}
await fs.writeFile(path.join(fixtures,'permit-A.docx'),docx(permitA));await fs.writeFile(path.join(fixtures,'permit-B.docx'),docx(permitB));
await fs.writeFile(path.join(fixtures,'variation.pdf'),pdf(['ISSUED VARIATION V-42 permits Scene 31 to use an electric tracking platform over the timber deck while protective mats and a registrar are present.','An email asks for the same exception for Scene 32, but it is unsigned and no variation for Scene 32 has been issued.']));
await fs.writeFile(path.join(fixtures,'scenes.csv'),'scene,location,start,end,activity\n31,Bay Lantern,09:00,10:00,Electric tracking platform over timber deck with protective mats and registrar\n32,Bay Lantern,11:00,12:00,Camera cart with electric drive over an unprotected timber deck\n');
if(!await store.load('history_fixture')){
 const w=createProduction({id:'history_fixture',title:'CONTROLLED HISTORY FIXTURE — 107 reviews and 65 prerequisites'});
 const intake=async(file,documentId)=>{const e=inspectImport(file);applySourceImport(w,e,{documentId});await vault.storeImport(file,e);};
 await intake({kind:'permit',name:'history.txt',text:'No drones.\n\nKeep exits clear.'},'P');await intake({kind:'callSheet',name:'history.csv',text:'scene,location,start,end,activity\n31,Fictional Hall,09:00,10:00,Handheld camera\n32,Fictional Hall,11:00,12:00,Rolling camera'},null);
 for(let i=0;i<25;i++){
  if(i)await intake({kind:'permit',name:'history.txt',text:`No drones.\n\nKeep exits clear during generated fixture revision ${i}.`},'P');
  await execution.runBatch({workspace:w,plan:planIntelligence(w),maxCalls:1,operatorAuthorized:true,transport:async()=>({response:{answers:{activity_link:{type:'noul',noul:.9},granted_for_scene:{type:'noul',noul:.01}}},credits:0,controlledTest:true})});
 }
 const plan=planIntelligence(w);for(let i=0;i<107;i++){recordReview(w,{evidenceId:plan.taskIds[i%4],decision:'NEEDS_SOURCE',reviewer:'CONTROLLED FIXTURE REVIEWER',reason:'Generated historical review '+i});recordSceneAuthority(w,{sceneId:i%2?'S31':'S32',documentId:'P',unitId:'U001',kind:'RESTRICTION',scope:'EXACT_SCENE',reviewer:'CONTROLLED FIXTURE REVIEWER',reason:'Generated authority history '+i});}
 recordSceneSchedule(w,{sceneId:'S31',date:'2026-11-12',timeZone:'Africa/Lagos',endsNextDay:false,reviewer:'CONTROLLED FIXTURE',reason:'Generated schedule'});
 for(let i=0;i<65;i++){recordCondition(w,{sceneId:'S31',title:'Generated prerequisite '+i,reviewer:'CONTROLLED FIXTURE',reason:'Generated history pagination'});decideCondition(w,{conditionId:w.conditions.at(-1).id,decision:'HUMAN_CONFIRMED_NOT_AUTHORITY',reviewer:'CONTROLLED FIXTURE',reason:'Generated decision '+i});}
 await store.persist(w,{expectedVersion:0});
}
let budget;const budgetPath=path.join(directory,'.live-budget.json');
try{budget=JSON.parse(await fs.readFile(budgetPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;budget={maxNewRequests:16,entries:[]};}
let apiKey='CONTROLLED_TEST_NOT_A_PROVIDER_KEY';if(live){const env=parseLocalEnv(await fs.readFile(path.join(root,'.env'),'utf8'));apiKey=env.CLOCKED_API_KEY;if(!apiKey)throw Error('Local Clocked key unavailable');}
const transport=async(url,options)=>{
 if(!live)return {ok:true,headers:new Headers({'x-clocked-credits':'0'}),json:async()=>({answers:{activity_link:{type:'noul',noul:.9},granted_for_scene:{type:'noul',noul:.01}}})};
 if(budget.entries.length>=16)throw Error('Durable acceptance budget exhausted; no dispatch');
 const entry={ordinal:budget.entries.length+1,requestSha256:sha(options.body),state:'DISPATCH_INTENT',credits:null};budget.entries.push(entry);await fs.writeFile(budgetPath,JSON.stringify(budget,null,2),{mode:0o600});
 const response=await fetch(url,options);entry.state='HTTP_RESPONSE';entry.httpStatus=response.status;const credit=response.headers.get('x-clocked-credits');entry.credits=credit&&/^\d+$/.test(credit)?Number(credit):null;await fs.writeFile(budgetPath,JSON.stringify(budget,null,2),{mode:0o600});console.log('GENUINE_ACCEPTANCE_DISPATCH='+budget.entries.length+' REPORTED_CREDITS='+budget.entries.reduce((n,e)=>n+(e.credits??0),0));return response;
};
const server=createAppServer({workspaceStore:store,executionStore:execution,sourceVault:vault,ownerToken:'closure-fictional-owner-token-local-only',operatorToken:'closure-fictional-operator',apiKey,enabled:true,controlledTestMode:!live,fetchImpl:transport,maxCallsPerHour:32});
server.listen(3041,'127.0.0.1',()=>console.log('CLOSURE_BROWSER=http://127.0.0.1:3041 MODE='+(live?'GENUINE_CLOCKED_MAX_16_NEW':'CONTROLLED_NO_PROVIDER')+' PRIOR_NEW_REQUESTS='+budget.entries.length));
