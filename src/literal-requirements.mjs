/** Literal fact validation only. No provider calls, scene applicability or authority inference. */
import {createHash} from 'node:crypto';
import {TextDecoder} from 'node:util';
import {verifySourceUnit,discoverSourceUnits} from './permit-intelligence.mjs';
export const LITERAL_FIELDS=Object.freeze(['required_written_documents','required_physical_protections','required_on_site_personnel']);
export const literalHash=x=>createHash('sha256').update(x).digest('hex');
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,keys)=>object(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const probability=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1;
export function strictUtf8(bytes){
 if(!Buffer.isBuffer(bytes)&&!(bytes instanceof Uint8Array))throw Error('SOURCE_BYTES_REQUIRED');
 return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
}
export function decodeLiteralRequirements({permitBytes,permitSha256,unit,requestBytes,responseBytes,requestSha256,responseSha256,provenance,receipt}){
 const failed=error=>({state:'PARTIAL_INCOMPLETE_REVIEW',facts:[],fieldStates:{},errors:[error],notClearance:true});
 try{
  if(!['OWNER_RECORDED_CLOCKED_EXTRACT','OWNER_CLOCKED_CORE_DISCOVERY','CONTROLLED_SYNTHETIC_FIXTURE_NOT_CLOCKED'].includes(provenance))throw Error('ACCEPTED_PROVENANCE_REQUIRED');
  const permit=strictUtf8(permitBytes);
  if(!/^[a-f0-9]{64}$/.test(permitSha256)||literalHash(permitBytes)!==permitSha256||!verifySourceUnit(permit,unit))throw Error('SOURCE_HASH_OR_UNIT_MISMATCH');
  const known=discoverSourceUnits(permit).units.find(u=>u.id===unit.id);
  if(!known||known.start!==unit.start||known.end!==unit.end||known.hash!==unit.hash)throw Error('UNKNOWN_SOURCE_UNIT');
  if(!/^[a-f0-9]{64}$/.test(requestSha256)||! /^[a-f0-9]{64}$/.test(responseSha256)||literalHash(requestBytes)!==requestSha256||literalHash(responseBytes)!==responseSha256)throw Error('REQUEST_OR_RESPONSE_HASH_MISMATCH');
  if(!receipt||receipt.complete!==true||receipt.httpStatus!==200||receipt.sealed!==false||receipt.transportFault!==null||receipt.requestSha256!==requestSha256||receipt.responseSha256!==responseSha256||receipt.storedBodySha256!==responseSha256||receipt.responseByteLength!==responseBytes.length)throw Error('COMPLETE_MATCHING_RECEIPT_REQUIRED');
  const request=JSON.parse(strictUtf8(requestBytes)),response=JSON.parse(strictUtf8(responseBytes));
  if(request.text!==unit.text||!exact(request.fields,LITERAL_FIELDS)||!exact(response.fields,LITERAL_FIELDS)||typeof response.model!=='string'||!response.model)throw Error('EXACT_THREE_LITERAL_FIELDS_REQUIRED');
  const facts=[],fieldStates={},seen=new Set();
  for(const field of LITERAL_FIELDS){
   const result=response.fields[field];
   if(!object(result)||!Array.isArray(result.value)||!Array.isArray(result.items)||result.items.length!==result.value.length||!probability(result.confidence))throw Error('INVALID_LITERAL_ARRAY');
   if(result.items.length>request.fields[field].max_items)throw Error('LITERAL_ITEM_LIMIT');
   for(const [index,item] of result.items.entries()){
    if(!object(item)||typeof item.value!=='string'||!item.value.trim()||result.value[index]!==item.value||
     !Number.isSafeInteger(item.start)||!Number.isSafeInteger(item.end)||item.start<0||item.end<=item.start||item.end>Array.from(unit.text).length||
     !probability(item.confidence)||(item.p_verify!==undefined&&!probability(item.p_verify))||
     Array.from(unit.text).slice(item.start,item.end).join('')!==item.value||
     Array.from(permit).slice(unit.start+item.start,unit.start+item.end).join('')!==item.value)throw Error('LITERAL_OFFSET_OR_VALUE_MISMATCH');
    const key=JSON.stringify([field,item.start,item.end]);if(seen.has(key))continue;seen.add(key);
    facts.push({field,quote:item.value,unitId:unit.id,unitRange:[item.start,item.end],permitRange:[unit.start+item.start,unit.start+item.end],
     sourceSentence:unit.text,sourceUnitRange:[unit.start,unit.end],permitSha256,unitSha256:unit.hash,
     requestSha256,responseSha256,model:response.model,provenance,issuance:'UNKNOWN',status:'MODEL_SUGGESTED_NOT_HUMAN_CONFIRMED',notClearance:true});
   }
   fieldStates[field]=result.items.length?'LITERAL_REQUIREMENTS_FOUND':'NO_LITERAL_REQUIREMENT_FOUND_IN_THIS_FIELD';
  }
  return {state:'VALIDATED_LITERAL_FACTS_NOT_AUTHORITY',facts,fieldStates,errors:[],notClearance:true};
 }catch(e){return failed(e.message==='The encoded data was not valid for encoding utf-8'?'INVALID_UTF8':/^[A-Z_]+$/.test(e.message)?e.message:'INVALID_LITERAL_RESPONSE');}
}
export function literalTaskTitle(fact){
 if(fact.field==='required_written_documents')return `Locate and verify ${fact.quote}.`;
 if(fact.field==='required_physical_protections')return `Confirm ${fact.quote}.`;
 return /\bthroughout\b/.test(fact.sourceSentence)?`Confirm the ${fact.quote} remains present throughout the take.`:`Confirm the required ${fact.quote} is present.`;
}
