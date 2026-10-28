/** Current server-derived queue rendered with exact clause distinctions, never merged. */
import {esc,label,readable} from './presentation.mjs';
const sceneLabel=s=>s?String(s).replace(/^S(?=\d)/,'Scene '):'Production';
export function actionHeading(a){
 const scene=sceneLabel(a.sceneId),clause=a.unitId?`passage ${a.unitId}`:'documentary scope';
 switch(a.code){
  case 'INVESTIGATE_DISCOVERY_UNCERTAINTY':return `${scene} · Investigate uncertainty in ${a.documentId??'source'} / ${a.unitId??'scope'}`;
  case 'REVIEW_EXACT_SOURCE_TASK':return `${scene} · Review ${clause}`;
  case 'FOLLOW_UP_HUMAN_REVIEW':return `${scene} · Follow up on ${clause}`;
  case 'VERIFY_MODEL_GRANT_SCOPE':return `${scene} · Verify claimed permission in ${clause}`;
  case 'MODEL_ONLY_NEEDS_DOCUMENTARY_SCOPE':return `${scene} · Check grant scope for ${clause}`;
  case 'RESOLVE_DOCUMENTARY_GRANT_SCOPE':return `${scene} · Review variation in ${clause}`;
  default:return readable(a.subject);
 }
}
export function actionSource(m,a){
 if(a.sourceQuote)return a.sourceQuote;
 if(!a.documentId||!a.unitId)return null;
 return m.overview?.documents?.find(d=>d.id===a.documentId)?.units?.find(u=>u.id===a.unitId)?.text??null;
}
export function actionContext(m,a){
 const parts=[];
 if(a.documentId)parts.push(`Document ${a.documentId}`);
 if(a.unitId)parts.push(`Passage ${a.unitId}`);
 if(a.code==='MODEL_ONLY_NEEDS_DOCUMENTARY_SCOPE'||a.code==='VERIFY_MODEL_GRANT_SCOPE')parts.push('This clause only · not a scene-wide finding');
 if(a.taskId)parts.push('Exact source check');
 parts.push(label(a.category));
 const quote=actionSource(m,a);
 return `<div class="work-context"><small>${esc(parts.join(' · '))}</small>${quote?`<p class="work-excerpt"><span class="sr-only">Source quotation: </span>“${esc(Array.from(quote).slice(0,170).join(''))}${Array.from(quote).length>170?'…':''}”</p>`:''}</div>`;
}
