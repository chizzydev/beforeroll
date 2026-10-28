/** Typed source claims, never documentary authority. No network or mutations. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {discoverSourceUnits} from './permit-intelligence.mjs';
const contract=JSON.parse(readFileSync(new URL('./documentary-fill-contract.json',import.meta.url),'utf8'));
const hash=x=>createHash('sha256').update(x).digest('hex');
export const DOCUMENTARY_CONTRACT_SHA256=hash(JSON.stringify({contract,sceneScopeVersion:6}));
export function documentaryPayload(text,scenes){
 if(!text||!Array.isArray(scenes)||!scenes.length||scenes.length>63)throw Error('INVALID_DOCUMENTARY_SCOPE');
 return {text,...structuredClone(contract),fields:{...structuredClone(contract.fields),scene_scope:{type:'choice',
  description:'Identify the target scene(s) of this documentary investigation. For current conditions and variations, match the described activity. For a request or proposal, identify WHICH existing scene the proposed change asks to alter, even when the requested action contradicts that scene\'s current plan; e.g. a proposed change to an interview targets the interview scene, not a different scene already doing the requested action. This association does NOT mean approval or an imposed obligation. Do not match merely by shared location. Historical-only records need no current target. Leave empty when no target can be established. Planned scenes: '+JSON.stringify(scenes.map(s=>({id:s.id,row:s.row}))),
  options:scenes.map(s=>s.id).concat(scenes.length>1?['all_selected_scenes','scope_not_established']:['scope_not_established'])}}};
}
/** Transparent routing heuristic only; never a proof that skipped text is irrelevant. */
export function documentaryEligible(text){return /\b(consent|written|agreement|authori[sz]\w*|variation|request\w*|draft|reference\w*|schedule|annex|letter|permission|histor\w*|previous|condition|lender)\b/i.test(text);}
const fail=()=>{throw Error('INVALID_DOCUMENTARY_RESPONSE');};
const probability=n=>Number.isFinite(n)&&n>=0&&n<=1;
export function decodeDocumentary({payload,response,unit,document,requestSha256,responseSha256}){
 const sourceHash=document.sourceHash??document.sourceSha256;
 if(hash(document.text)!==sourceHash||Array.from(document.text).slice(unit.start,unit.end).join('')!==unit.text||payload.text!==unit.text||hash(JSON.stringify(payload))!==requestSha256||! /^[a-f0-9]{64}$/.test(responseSha256??''))throw Error('DOCUMENTARY_SOURCE_OR_REQUEST_MISMATCH');
 const known=discoverSourceUnits(document.text).units.find(u=>u.id===unit.id);
 if(!known||known.start!==unit.start||known.end!==unit.end||known.hash!==unit.hash)throw Error('DOCUMENTARY_UNIT_IDENTITY_MISMATCH');
 if(!response||typeof response.model!=='string'||!response.model||!response.fields||response.mode==='native_vision')fail();
 const keys=Object.keys(payload.fields);
 if(Object.keys(response.fields).length!==keys.length||keys.some(k=>!Object.hasOwn(response.fields,k)))fail();
 const fields={};
 for(const key of keys){
  const def=payload.fields[key],f=response.fields[key];if(!f||typeof f!=='object'||Array.isArray(f)||!Object.hasOwn(f,'value'))fail();
  if(f.confidence!==undefined&&!probability(f.confidence))fail();
  if(def.type==='extract'){
   if(f.source==='generated'||f.source==='inferred')fail();
   if(f.value===null){if(f.start!==undefined||f.end!==undefined)fail();fields[key]={value:null,confidence:f.confidence??null};continue;}
   if(typeof f.value!=='string'||!f.value||!Number.isInteger(f.start)||!Number.isInteger(f.end)||f.start<0||f.end<=f.start||f.end>Array.from(payload.text).length||Array.from(payload.text).slice(f.start,f.end).join('')!==f.value)fail();
   const range=[unit.start+f.start,unit.start+f.end];
   if(Array.from(document.text).slice(...range).join('')!==f.value)fail();
   fields[key]={value:f.value,unitRange:[f.start,f.end],permitRange:range,confidence:f.confidence??null};
  }else{
   const values=def.type==='multiselect'?f.value:[f.value];
   if(!Array.isArray(values)||new Set(values).size!==values.length||values.some(v=>!def.options.includes(v)))fail();
   if(f.probabilities!==undefined&&(!f.probabilities||Object.entries(f.probabilities).some(([k,v])=>!def.options.includes(k)||!probability(v))))fail();
   fields[key]={value:structuredClone(f.value),confidence:f.confidence??null,probabilities:f.probabilities??null};
  }
 }
 const role=fields.claimed_role.value;
 if(role!=='unrelated_or_unclear'&&!fields.claim_quote.value)fail();
 if(role==='claims_issued_variation'&&/\b(not(?:\s+\w+){0,3}\s+issued|unissued|unsigned|not approved|awaiting approval)\b/i.test(fields.claim_quote.value??''))throw Error('DOCUMENTARY_STATUS_CONTRADICTION');
 const selectedScope=fields.scene_scope.value;
 const scope=Array.isArray(selectedScope)?selectedScope:selectedScope==='all_selected_scenes'?payload.fields.scene_scope.options.filter(s=>!['all_selected_scenes','scope_not_established'].includes(s)):[selectedScope];
 if(scope.includes('scope_not_established')&&scope.length>1)throw Error('DOCUMENTARY_SCOPE_CONTRADICTION');
 if(scope.length&&!scope.includes('scope_not_established')&&!fields.scope_quote.value)throw Error('DOCUMENTARY_SCOPE_WITHOUT_SOURCE');
 return {schema:'beforeroll-documentary-claim-v1',role,fields,sceneIds:scope.filter(s=>s!=='scope_not_established'),documentId:document.id,unitId:unit.id,
  sourceSentence:unit.text,sourceHash,requestSha256,responseSha256,model:response.model,
  actualIssuance:'UNVERIFIED',authenticity:'UNVERIFIED',supportingEvidence:'UNESTABLISHED_REQUIRES_HUMAN_INVENTORY',fulfillment:'UNVERIFIED',notClearance:true};
}
