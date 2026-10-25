/** Source-linked production operations. Human schedules and prerequisites are NOT
 * permits, model predictions, verified approvals, or authority to begin filming.
 * All time geometry uses IANA zones; DST ambiguity/gaps fail closed.
 */
import {createHash} from 'node:crypto';
import {assertWorkspaceSources} from './production-workspace.mjs';
import {sourcePointSlice,clockToMinutes} from './engine.mjs';
import {verifySourceUnit} from './permit-intelligence.mjs';

const sha=s=>createHash('sha256').update(s,'utf8').digest('hex');
const digest=x=>sha(JSON.stringify(x));
const txt=(x,max=200)=>typeof x==='string'&&x.trim()!==''&&x.length<=max;
const hex=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const decisions=new Set(['OPEN','NEEDS_SOURCE','BLOCKED','HUMAN_CONFIRMED_NOT_AUTHORITY']);
const sceneOf=(w,id)=>w.callSheet?.scenes?.find(s=>s.id===id);
const sceneHash=(w,id)=>{const s=sceneOf(w,id);return s?sha(sourcePointSlice(w.callSheet.text,s.source.start,s.source.end)):null;};
function validDate(x){if(typeof x!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(x))return false;
 const [y,m,d]=x.split('-').map(Number);return new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)===x;}
function nextDay(date){const [y,m,d]=date.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+1)).toISOString().slice(0,10);}
const zoneFormatters=new Map();
function formatter(zone){if(!txt(zone,80))throw Error('IANA timezone is required');let f=zoneFormatters.get(zone);
 if(!f){try{f=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});f.format(new Date());}catch{throw Error('Unsupported IANA timezone');}
  if(zoneFormatters.size>50)zoneFormatters.clear();zoneFormatters.set(zone,f);}return f;
}
function localParts(zone,epoch){const parts={};for(const x of formatter(zone).formatToParts(new Date(epoch)))if(x.type!=='literal')parts[x.type]=x.value;
 return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
/** Reject nonexistent and ambiguous local times, rather than arbitrarily picking
 * a DST offset. Sample offsets on both sides of the transition, then round-trip.
 */
export function resolveLocalTime(date,time,zone){
 if(!validDate(date)||clockToMinutes(time)===null)throw Error('Use an actual ISO date and HH:MM local clock');
 formatter(zone);const naive=Date.parse(`${date}T${time}:00Z`);const offsets=new Set();
 for(let h=-36;h<=36;h+=3){const trial=naive+h*3600000;
  const p=localParts(zone,trial),ms=Date.parse(p+':00Z');offsets.add((ms-trial)/60000);
 }
 const candidates=[...offsets].map(offset=>naive-offset*60000)
  .filter(epoch=>Number.isSafeInteger(epoch)&&localParts(zone,epoch)===`${date}T${time}`);
 const unique=[...new Set(candidates)];
 if(!unique.length)throw Error(`Nonexistent local time (DST gap) ${date} ${time} ${zone}`);
 if(unique.length>1)throw Error(`Ambiguous local time (DST overlap) ${date} ${time} ${zone}`);
 return new Date(unique[0]).toISOString();
}
function resolveSceneWindow({date,timeZone,start,end,endsNextDay}){
 if(typeof endsNextDay!=='boolean')throw Error('Explicit endsNextDay flag required');
 if(clockToMinutes(start)===null||clockToMinutes(end)===null)throw Error('Source scene clocks must be valid');
 if(endsNextDay?clockToMinutes(end)>clockToMinutes(start):clockToMinutes(end)<=clockToMinutes(start))throw Error('Overnight day rollover must match original scene clocks');
 const startUtc=resolveLocalTime(date,start,timeZone);
 const endDate=endsNextDay?nextDay(date):date;
 const endUtc=resolveLocalTime(endDate,end,timeZone);
 const minutes=(Date.parse(endUtc)-Date.parse(startUtc))/60000;
 if(minutes<=0||minutes>24*60)throw Error('Scene UTC interval must be positive and no longer than 24 hours');
 return {startUtc,endUtc,endDate,durationMinutes:minutes};
}
function currentSchedule(w,entry){return (sceneOf(w,entry.sceneId)?.sourceEpoch??0)===(entry.sceneEpoch??0)&&sceneHash(w,entry.sceneId)===entry.sceneRowHash;}
function findSource(w,docId,unitId){const d=w.documents.find(d=>d.id===docId);const u=d?.units.find(u=>u.id===unitId);return {d,u};}
function currentCondition(w,item){if((sceneOf(w,item.sceneId)?.sourceEpoch??0)!==(item.sceneEpoch??0)||sceneHash(w,item.sceneId)!==item.sceneRowHash||latestScheduleEntries(w).get(item.sceneId)?.id!==item.scheduleId)return false;
 if(item.documentId){const {d,u}=findSource(w,item.documentId,item.unitId);
  if(!d||!u||(d.analysisEpoch??0)!==(item.documentEpoch??0)||d.sourceHash!==item.documentHash||u.hash!==item.unitHash||!verifySourceUnit(d.text,u))return false;
 }
 return true;
}
function latestScheduleEntries(w){const m=new Map();for(const e of w.sceneSchedules??[])m.set(e.sceneId,e);return m;}
function activeConditions(w){const decisionsMap=new Map();for(const e of w.conditionDecisions??[])decisionsMap.set(e.conditionId,e);return decisionsMap;}
export function recordSceneSchedule(w,{sceneId,date,timeZone,endsNextDay,reviewer,reason}){
 assertWorkspaceSources(w);assertProductionOperationsIntegrity(w);
 const s=sceneOf(w,sceneId);if(!s||s.needsReview)throw Error('Choose a complete original call-sheet scene');
 if(!txt(reviewer,150)||!txt(reason,2000))throw Error('Schedule reviewer and source/date rationale required');
 const window=resolveSceneWindow({date,timeZone,start:s.start,end:s.end,endsNextDay});
 if((w.sceneSchedules?.length??0)>=2500)throw Error('Too many schedule history records');
 const base={sceneId,sceneRowHash:sceneHash(w,sceneId),date,timeZone,start:s.start,end:s.end,endsNextDay,reviewer,reason,...window,...(s.sourceEpoch>0?{sceneEpoch:s.sourceEpoch}:{})};
 const id=digest(base);if((w.sceneSchedules??[]).some(e=>e.id===id))throw Error('Duplicate exact scene schedule');
 (w.sceneSchedules??(w.sceneSchedules=[])).push({...base,id,recordedAtRevision:w.revision+1,notClearance:true});
 w.revision++;return w;
}
export function recordCondition(w,{sceneId,title,documentId=null,unitId=null,dueLocal=null,reviewer,reason}){
 assertWorkspaceSources(w);assertProductionOperationsIntegrity(w);
 const s=sceneOf(w,sceneId),current=latestScheduleEntries(w).get(sceneId);
 if(!s||!current||!currentSchedule(w,current))throw Error('Record current dated scene schedule before prerequisites');
 if(!txt(title,250)||!txt(reviewer,150)||!txt(reason,2000))throw Error('Condition title, reviewer and rationale required');
 if((documentId===null)!==(unitId===null))throw Error('Both source document and source unit must be supplied');
 let docHash=null,unitHash=null,quote=null;
 if(documentId!==null){const {d,u}=findSource(w,documentId,unitId);
  if(!d||!u||!verifySourceUnit(d.text,u))throw Error('Exact original source condition required');
  docHash=d.sourceHash;unitHash=u.hash;quote=u.text;
 }
 let dueUtc=null;
 if(dueLocal!==null){if(typeof dueLocal!=='string'||!/^20\d{2}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(dueLocal))throw Error('Due time must be YYYY-MM-DDTHH:MM');
  dueUtc=resolveLocalTime(dueLocal.slice(0,10),dueLocal.slice(11),current.timeZone);
 }
 if((w.conditions?.length??0)>=50000)throw Error('Too many condition records');
 const documentEpoch=documentId?findSource(w,documentId,unitId).d.analysisEpoch??0:0;
 const base={sceneId,sceneRowHash:sceneHash(w,sceneId),scheduleId:current.id,title,documentId,unitId,documentHash:docHash,unitHash,quote,dueLocal,dueUtc,timeZone:current.timeZone,reviewer,reason,...(s.sourceEpoch>0?{sceneEpoch:s.sourceEpoch}:{}),...(documentEpoch>0?{documentEpoch}:{})};
 const id=digest(base);if((w.conditions??[]).some(e=>e.id===id))throw Error('Duplicate source-bound prerequisite');
 (w.conditions??(w.conditions=[])).push({...base,id,recordedAtRevision:w.revision+1,notClearance:true});w.revision++;return w;
}
export function decideCondition(w,{conditionId,decision,reviewer,reason}){
 assertWorkspaceSources(w);assertProductionOperationsIntegrity(w);
 if(!decisions.has(decision)||!txt(reviewer,150)||!txt(reason,2000))throw Error('Condition review needs allowed state, reviewer and rationale');
 const condition=(w.conditions??[]).find(x=>x.id===conditionId);
 if(!condition||!currentCondition(w,condition))throw Error('Condition missing or source/scene changed; do not transfer prior approval');
 if((w.conditionDecisions?.length??0)>=100000)throw Error('Condition decision history exhausted');
 const entry={conditionId,decision,reviewer,reason,sequence:(w.conditionDecisions?.length??0)+1,recordedAtRevision:w.revision+1,notClearance:true};
 (w.conditionDecisions??(w.conditionDecisions=[])).push({...entry,id:digest(entry)});w.revision++;return w;
}
export function assertProductionOperationsIntegrity(w){
 assertWorkspaceSources(w);
 const scheduleIds=new Set(),conditionIds=new Set(),decisionIds=new Set();
 for(const record of [...w.sceneSchedules??[],...w.conditions??[]])for(const key of ['sceneEpoch','documentEpoch'])if(record[key]!==undefined&&(!Number.isSafeInteger(record[key])||record[key]<0))throw Error('Operational source lineage invalid');
 for(const e of w.sceneSchedules??[]){const {id,recordedAtRevision,notClearance,...base}=e;
  if(!hex(id)||id!==digest(base)||notClearance!==true||!Number.isSafeInteger(recordedAtRevision)||recordedAtRevision<1||!txt(e.reviewer,150)||!txt(e.reason,2000)||!txt(e.sceneRowHash,64)||!hex(e.sceneRowHash)||!validDate(e.date)||!txt(e.timeZone,80)||!txt(e.sceneId,80))throw Error('Corrupt scene schedule record');
  const derived=resolveSceneWindow(e);
  if(JSON.stringify(derived)!==JSON.stringify({startUtc:e.startUtc,endUtc:e.endUtc,endDate:e.endDate,durationMinutes:e.durationMinutes})||scheduleIds.has(id))throw Error('Scene schedule geometry or identity tampered');
  scheduleIds.add(id);
 }
 for(const e of w.conditions??[]){const {id,recordedAtRevision,notClearance,...base}=e;
  if(!hex(id)||id!==digest(base)||notClearance!==true||!Number.isSafeInteger(recordedAtRevision)||recordedAtRevision<1||!txt(e.title,250)||!txt(e.sceneId,80)||!hex(e.sceneRowHash)||!hex(e.scheduleId)||!scheduleIds.has(e.scheduleId)||!txt(e.reviewer,150)||!txt(e.reason,2000)||!(e.documentId===null&&e.unitId===null||txt(e.documentId,80)&&txt(e.unitId,40)&&hex(e.documentHash)&&hex(e.unitHash)&&txt(e.quote,1750)&&sha(e.quote)===e.unitHash)||conditionIds.has(id))throw Error('Condition source identity corrupted');
  if(e.dueLocal!==null&&(typeof e.dueLocal!=='string'||!/^20\d{2}-\d{2}-\d{2}T\d\d:\d\d$/.test(e.dueLocal)||resolveLocalTime(e.dueLocal.slice(0,10),e.dueLocal.slice(11),e.timeZone)!==e.dueUtc))throw Error('Condition deadline was modified');
  if(e.dueLocal===null&&e.dueUtc!==null)throw Error('Missing source of condition deadline');
  if(e.documentId){const d=w.documents.find(d=>d.id===e.documentId);
   if(!d)throw Error('Referenced condition document lost');
   if(d.sourceHash===e.documentHash){const u=d.units.find(u=>u.id===e.unitId);if(!u||u.hash!==e.unitHash||u.text!==e.quote)throw Error('Exact condition quote corrupted');}}
  conditionIds.add(id);
 }
 for(const e of w.conditionDecisions??[]){const {id,...base}=e;
  if(!hex(id)||digest(base)!==id||!conditionIds.has(e.conditionId)||!decisions.has(e.decision)||!txt(e.reviewer,150)||!txt(e.reason,2000)||e.notClearance!==true||e.sequence!==decisionIds.size+1||decisionIds.has(id))throw Error('Condition decision history corrupted');
  decisionIds.add(id);
 }
 return true;
}
function isoInstant(x){if(typeof x!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T\d\d:\d\d:\d\d\.\d{3}Z$/.test(x)||!Number.isFinite(Date.parse(x))||new Date(x).toISOString()!==x)throw Error('asOf must be canonical UTC ISO-8601 instant');return x;}
export function projectOperations(w,{asOf='2026-01-01T00:00:00.000Z'}={}){
 assertProductionOperationsIntegrity(w);isoInstant(asOf);
 const active=latestScheduleEntries(w),decisions=activeConditions(w);
 const schedules=(w.sceneSchedules??[]).map(e=>({...e,sourceState:!currentSchedule(w,e)?'STALE_SCENE_SOURCE':active.get(e.sceneId)?.id===e.id?'CURRENT_HUMAN_DATED':'SUPERSEDED_SCHEDULE'}));
 const conditions=(w.conditions??[]).map(e=>{const current=currentCondition(w,e),d=decisions.get(e.id),latest=active.get(e.sceneId);
  const sourceState=!current?'STALE_SOURCE_OR_SCENE':!latest||!currentSchedule(w,latest)?'SCHEDULE_NEEDS_REVIEW':e.timeZone!==latest.timeZone?'TIMEZONE_CHANGED_REVIEW_REQUIRED':'CURRENT_HUMAN_CLAIM';
  const deadlineState=!e.dueUtc?'NO_DOCUMENTED_DEADLINE':e.dueUtc<asOf?'PAST_DUE':e.dueUtc<latest?.startUtc?'DUE_BEFORE_SCENE':'DUE_DURING_OR_AFTER_SCENE';
  return {...e,sourceState,decision:current?d?.decision??'OPEN':'STALE_REVIEW',latestDecision:current?d??null:null,deadlineState};
 });
 const scenes=(w.callSheet?.scenes??[]).map(s=>{
  const schedule=active.get(s.id),state=!schedule?'UNDATED_NO_AUTHORITY':currentSchedule(w,schedule)?'DATED_HUMAN_PLAN_NOT_AUTHORITY':'STALE_SCENE_SOURCE';
  const related=conditions.filter(c=>c.sceneId===s.id),current=related.filter(c=>c.sourceState==='CURRENT_HUMAN_CLAIM');
  const open=current.filter(c=>c.decision!=='HUMAN_CONFIRMED_NOT_AUTHORITY'),pastDue=current.filter(c=>c.deadlineState==='PAST_DUE'&&c.decision!=='HUMAN_CONFIRMED_NOT_AUTHORITY');
  return {sceneId:s.id,sceneSourceHash:sceneHash(w,s.id),scheduleState:state,startUtc:state==='DATED_HUMAN_PLAN_NOT_AUTHORITY'?schedule.startUtc:null,endUtc:state==='DATED_HUMAN_PLAN_NOT_AUTHORITY'?schedule.endUtc:null,timeZone:state==='DATED_HUMAN_PLAN_NOT_AUTHORITY'?schedule.timeZone:null,
   prerequisiteCount:related.length,currentPrerequisites:current.length,openPrerequisites:open.length,pastDuePrerequisites:pastDue.length,
   operationsState:state!=='DATED_HUMAN_PLAN_NOT_AUTHORITY'?'SCHEDULE_REVIEW_REQUIRED':open.length?'PREREQUISITES_OUTSTANDING':'HUMAN_PREREQUISITES_RECORDED_NOT_CLEARANCE',notClearance:true};
 });
 return {schema:'beforeroll-production-operations-v1',workspaceId:w.id,revision:w.revision,asOf,scenes,schedules,conditions,conditionDecisions:w.conditionDecisions??[],summary:{scenes:scenes.length,dated:scenes.filter(s=>s.scheduleState==='DATED_HUMAN_PLAN_NOT_AUTHORITY').length,openPrerequisites:scenes.reduce((n,s)=>n+s.openPrerequisites,0),pastDuePrerequisites:scenes.reduce((n,s)=>n+s.pastDuePrerequisites,0),staleConditions:conditions.filter(c=>c.sourceState!=='CURRENT_HUMAN_CLAIM').length},
  notClearance:true,notice:'Dates, scope, condition fulfillment and signatures are human-entered, NOT verified filming authorization. Never infer clearance from a zero count.'};
}
