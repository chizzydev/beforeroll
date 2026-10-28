/** Owner-operated local app client, NOT a direct provider dispatcher. No ambient .env read. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
let data='';for await(const chunk of process.stdin){data+=chunk;if(data.length>100000)throw Error('Owner input too large');}
try{
 const input=JSON.parse(data.replace(/^\uFEFF/,'')),base=new URL(input.baseUrl);
 if(base.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(base.hostname)||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw Error('Direct local application URL required');
 let cookie='';
 const api=async(route,{method='GET',body,operator=false}={})=>{
  const r=await fetch(new URL(route,base),{method,redirect:'error',headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(operator?{'X-Operator-Token':input.operatorToken}:{})},body:body?JSON.stringify(body):undefined});
  const c=r.headers.get('set-cookie');if(c)cookie=c.split(';')[0];const result=await r.json();
  if(!r.ok)throw Error(`Local application stopped: HTTP ${r.status}: ${result.error??'request failed'}`);return result;
 };
 const health=await api('/api/health');if(health.evaluationMode)throw Error('Use the existing private owner server, never Evaluation Mode');
 await api('/api/owner/unlock',{method:'POST',body:{token:input.ownerToken}});
 if(!input.authorizeLive){
  if(input.sourceIdentityVerified!==true||!input.reviewer?.trim()||!path.isAbsolute(input.evidenceDirectory??''))throw Error('Verified originals, reviewer and absolute private evidence directory required');
  const repository=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
  const out=path.resolve(input.evidenceDirectory);
  if(out.toLowerCase().startsWith(repository.toLowerCase()+path.sep)||out.toLowerCase()===repository.toLowerCase())throw Error('Keep owner cold-run material outside the repository');
  await fs.mkdir(out,{recursive:false,mode:0o700});
  const created=await api('/api/workspaces',{method:'POST',body:{id:input.productionId,title:'Independent fictional cold run'}});let version=created.version;
  for(const [kind,filePath] of [['permit',input.permitPath],['callSheet',input.callSheetPath]]){
   const bytes=await fs.readFile(filePath);const saved=await api(`/api/workspaces/${encodeURIComponent(input.productionId)}/import`,{method:'POST',body:{expectedVersion:version,documentId:kind==='permit'?'COLD_PERMIT':undefined,file:{kind,name:path.basename(filePath),contentBase64:bytes.toString('base64')}}});version=saved.version;
  }
  const workflow=await api(`/api/workspaces/${encodeURIComponent(input.productionId)}/workflow`);
  const body={expectedVersion:version,documentIds:['COLD_PERMIT'],sceneIds:workflow.workspace.callSheet.scenes.map(s=>s.id),verifiedBy:input.reviewer,sourceConfirmed:true,maxCalls:32,creditReservePerCall:4,creditBudget:128};
  const preview=await api(`/api/workspaces/${encodeURIComponent(input.productionId)}/discovery/preview`,{method:'POST',body});
  const approval={schema:'beforeroll-cold-run-owner-approval-v1',baseUrl:base.origin,productionId:input.productionId,body,preview,evidenceDirectory:out,createdAt:new Date().toISOString(),providerCallsMade:0};
  await fs.writeFile(path.join(out,'approval.json'),JSON.stringify({...approval,sha256:hash(approval)},null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(`PREPARED_ONLY: ${preview.plan.decideCalls} Decide + at most ${preview.plan.maxExtractCalls} Extract; maximum ${preview.plan.worstCaseCalls} calls. Zero Clocked calls. Inspect ${path.join(out,'approval.json')}. Separate authorization required.`);
 }else{
  const approval=JSON.parse(await fs.readFile(input.approvalPath,'utf8')),{sha256,...body}=approval;
  if(sha256!==hash(body)||approval.schema!=='beforeroll-cold-run-owner-approval-v1'||approval.baseUrl!==base.origin||!input.operatorToken)throw Error('Approval identity invalid');
  const route=`/api/workspaces/${encodeURIComponent(approval.productionId)}/discovery`,current=await api(route+'/preview',{method:'POST',body:approval.body});
  if(current.previewSha256!==approval.preview.previewSha256||current.existingFence)throw Error('Prepared scope changed or already fenced; no dispatch');
  const intent=path.join(approval.evidenceDirectory,'owner-dispatch-intent.json'),handle=await fs.open(intent,'wx',0o600);
  try{await handle.writeFile(JSON.stringify({approvalSha256:sha256,at:new Date().toISOString(),noRetries:true}));await handle.sync();}finally{await handle.close();}
  await api(route+'/run',{method:'POST',operator:true,body:{...approval.body,previewSha256:current.previewSha256,confirm:'RUN_CORE_DISCOVERY',acceptBillingUncertainty:true}});
  const deadline=Date.now()+30*60*1000;
  for(;;){
   const projection=await api(route),job=projection.jobs.find(j=>j.id===current.plan.id);
   const raw=await api(route+'/evidence');
   const running=raw.jobs.find(j=>j.plan.id===current.plan.id)?.state==='RUNNING';
   if(!running||Date.now()>deadline){
    await fs.writeFile(path.join(approval.evidenceDirectory,'discovery-evidence.json'),JSON.stringify(raw,null,2)+'\n',{flag:'wx',mode:0o600});
    await fs.writeFile(path.join(approval.evidenceDirectory,'discovery-projection.json'),JSON.stringify(projection,null,2)+'\n',{flag:'wx',mode:0o600});
    await fs.writeFile(path.join(approval.evidenceDirectory,'semantic-review-required.md'),'# Independent owner semantic review\n\nVerdict: PENDING — not automatically PASS.\n\nCompare all expected duties written before dispatch against actual quotes and scene bindings. Record missed duties, unsupported/incorrect candidates and costs. Any key missed duty is FAIL; do not change the reference after seeing results. Model-positive grant is never authority.\n',{flag:'wx',mode:0o600});
    console.log(JSON.stringify({state:running?'OWNER_CLIENT_TIMEOUT_INCOMPLETE':job?.state,coverage:job?.coverage,attempts:job?.attempts,reportedCredits:job?.reportedCredits,unknownCreditEntries:job?.unknownCreditEntries,semanticVerdict:'PENDING_OWNER_REVIEW',evidenceDirectory:approval.evidenceDirectory}));if(running)process.exitCode=1;break;
   }
   await new Promise(r=>setTimeout(r,1500));
  }
 }
}catch(e){console.error(e instanceof SyntaxError?'Invalid JSON input or local response. Operation stopped; do not retry live dispatch.':e.message);process.exitCode=1;}
