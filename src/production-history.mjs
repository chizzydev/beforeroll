/** Complete, paginated read-only history from the authoritative workspace/dossier.
 * No independent approval state, provider requests or silent history truncation. */
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function productionHistory(w,d,journals,{offset=0,limit=20,kind='ALL',state='ALL',search='',selectedId=null,recovery=null}={}){
 const kinds=['ALL','MODEL','SOURCES','REVIEWS','AUTHORITY','OPERATIONS','RECOVERY'];
 if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>100||!kinds.includes(kind)||!['ALL','CURRENT','HISTORICAL','UNCERTAIN'].includes(state)||typeof search!=='string'||search.length>200)throw Error('History filters or pagination invalid');
 const rows=[],tasks=new Map(d.sceneTasks.map(t=>[t.id,t])),latest=new Map(d.currentTaskReviews.map(r=>[r.evidenceId,r.sequence]));
 const add=(category,id,title,status,detail,context={})=>rows.push({category,id,title,status,...context,detail,notClearance:true});
 const imports=w.imports??[];
 imports.forEach((r,i)=>{const doc=w.documents.find(x=>r.documentId?x.id===r.documentId:x.importReceipt?.rawHash===r.rawHash&&x.importReceipt?.revision===r.revision),current=r.kind==='callSheet'?w.callSheet?.importReceipt?.revision===r.revision:doc?.importReceipt?.revision===r.revision;
  add('SOURCES',`source:${i}:${r.rawHash}`,`${r.kind}: ${r.name}`,current?'CURRENT':'HISTORICAL',r,{documentId:r.documentId??doc?.id??null,originalHash:r.rawHash});});
 for(const r of w.reviewActions??[])add('REVIEWS',`review:${r.sequence}`,`${r.decision} by ${r.reviewer}`,latest.get(r.evidenceId)===r.sequence?'CURRENT':'HISTORICAL',r,{sceneId:tasks.get(r.evidenceId)?.sceneId??null});
 for(const r of d.documentaryLinks)add('AUTHORITY',`link:${r.id}`,`${r.fromId} ${r.kind} ${r.toId}`,r.status==='HUMAN_ASSERTED_UNVERIFIED'?'CURRENT':'HISTORICAL',r,{documentId:r.fromId});
 for(const r of d.sceneScopeClaims)add('AUTHORITY',`scope:${r.id}`,`${r.sceneId}: ${r.kind}`,r.sourceState==='CURRENT_UNVERIFIED'?'CURRENT':'HISTORICAL',r,{sceneId:r.sceneId,documentId:r.documentId});
 const lastProvenance=new Map();for(const r of w.authorityDocumentHistory??[])lastProvenance.set(r.documentId,r.id);
 for(const r of w.authorityDocumentHistory??[]){const doc=w.documents.find(d=>d.id===r.documentId);const current=lastProvenance.get(r.documentId)===r.id&&doc?.authority&&JSON.stringify(doc.authority)===JSON.stringify(r.metadata)&&(doc.analysisEpoch??0)===(r.documentEpoch??0);add('AUTHORITY',`provenance:${r.id}`,`Provenance: ${r.documentId}`,current?'CURRENT':'HISTORICAL',r,{documentId:r.documentId});}
 for(const doc of w.documents)if(doc.authority&&!lastProvenance.has(doc.id))add('AUTHORITY',`provenance:${doc.id}:${doc.revision}`,`Provenance: ${doc.id} (legacy current record)`,'CURRENT',doc.authority,{documentId:doc.id});
 for(const r of d.operations.schedules)add('OPERATIONS',`schedule:${r.id}`,`${r.sceneId}: dated schedule`,r.sourceState==='CURRENT_HUMAN_DATED'?'CURRENT':'HISTORICAL',r,{sceneId:r.sceneId});
 const conditions=new Map(d.operations.conditions.map(c=>[c.id,c]));
 for(const r of d.operations.conditions)add('OPERATIONS',`condition:${r.id}`,`${r.sceneId}: ${r.title}`,r.sourceState==='CURRENT_HUMAN_CLAIM'?'CURRENT':'HISTORICAL',r,{sceneId:r.sceneId,documentId:r.documentId});
 const decisions=new Map();for(const r of w.conditionDecisions??[])decisions.set(r.conditionId,r.id);
 for(const r of w.conditionDecisions??[])add('OPERATIONS',`decision:${r.id}`,`Prerequisite review: ${r.decision}`,conditions.get(r.conditionId)?.sourceState==='CURRENT_HUMAN_CLAIM'&&decisions.get(r.conditionId)===r.id?'CURRENT':'HISTORICAL',r,{sceneId:conditions.get(r.conditionId)?.sceneId??null});
 for(const j of journals){
  const manifest=new Map((j.run.taskManifest??[]).map(t=>[t.id,t]));
  add('MODEL',`run:${j.planKey}`,`Clocked journal: ${j.run.checkpoint.confirmedCompleted}/${j.run.checkpoint.callsPlanned} completed`,j.sourceValidation==='CURRENT_EXACT_PLAN'?'CURRENT':'HISTORICAL',{planKey:j.planKey,sourceValidation:j.sourceValidation,createdAt:j.run.createdAt,updatedAt:j.run.updatedAt,attempts:j.run.checkpoint.attempts,state:j.run.checkpoint.state,sha256:j.sha256});
  for(const e of j.run.checkpoint.entries){
   if(e.status==='NOT_ATTEMPTED')continue;
   const t=tasks.get(e.id),identity=t??manifest.get(e.id),uncertain=['IN_FLIGHT','BILLING_UNKNOWN'].includes(e.status);
   add('MODEL',`attempt:${j.planKey}:${e.id}`,`${identity?.sceneId??'Historical scene (ID absent from legacy journal)'}: ${e.status}${e.inheritedFromPlanKey?' (retained copy, not a new charge)':''}`,uncertain?'UNCERTAIN':t?'CURRENT':'HISTORICAL',{...e,identity:identity??null,journalPlanKey:j.planKey,sourceValidation:j.sourceValidation,origin:e.finding?.controlledTest?'CONTROLLED_TEST_RESPONSE_NOT_CLOCKED':e.finding?.replayOrigin??'LOCAL_OWNER_RUN_NOT_CRYPTOGRAPHICALLY_ATTESTED'},{sceneId:identity?.sceneId??null,documentId:identity?.documentId??null});
  }
 }
 if(recovery)add('RECOVERY',`recovery:${recovery.backupSha256}`,'Verified encrypted recovery','CURRENT',recovery);
 const needle=search.trim().toLocaleLowerCase();
 const filtered=rows.filter(r=>(kind==='ALL'||r.category===kind)&&(state==='ALL'||r.status===state)&&(!needle||JSON.stringify(r).toLocaleLowerCase().includes(needle)));
 const selected=selectedId?rows.find(r=>r.id===selectedId)??null:null;
 const page=filtered.slice(offset,offset+limit);
 const body={schema:'beforeroll-production-history-v1',productionId:w.id,persistedVersion:d.persistedVersion,dossierSha256:d.sha256,total:rows.length,filteredTotal:filtered.length,
  filter:{kind,state,search},pagination:{offset,limit,shown:page.length,hasMore:offset+page.length<filtered.length},
  records:page.map(({detail,...r})=>r),selected,notClearance:true};
 return {...body,sha256:hash(body)};
}
