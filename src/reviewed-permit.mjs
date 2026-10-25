/** M3-S25: fail-explicit human-reviewed binary permit transcription.
 * Binary identity and transcription identity are kept distinct. No OCR/model
 * extraction, legal authority, signature, or completeness is asserted.
 */
import {createHash} from 'node:crypto';
import {validateDocxContainer} from './docx-intake.mjs';
import {discoverSourceUnits} from './permit-intelligence.mjs';
const sha=data=>createHash('sha256').update(data).digest('hex');
const fail=message=>{throw Error('Reviewed permit: '+message);};
const textOK=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);
const b64=/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
function sourceBinary(file){
 if(!file||!textOK(file.name,180)||/[\\/]/.test(file.name)||file.text!==undefined||typeof file.contentBase64!=='string'||!b64.test(file.contentBase64)||file.contentBase64.length>12*1024*1024)fail('Exact safe original binary filename and canonical base64 required');
 const bytes=Buffer.from(file.contentBase64,'base64');
 if(!bytes.length||bytes.length>8*1024*1024||bytes.toString('base64')!==file.contentBase64)fail('Original exceeds 8 MiB or has invalid base64');
 const ext=/\.(pdf|docx)$/i.exec(file.name)?.[1]?.toUpperCase();
 if(!ext)fail('Reviewed permit fallback only supports original PDF/DOCX');
 if(ext==='PDF'){
  if(!/^%PDF-(?:1\.[0-7]|2\.0)\b/.test(bytes.subarray(0,8).toString('latin1'))||!bytes.subarray(Math.max(0,bytes.length-2048)).includes(Buffer.from('%%EOF')))fail('Original does not appear to be a valid PDF container');
 }else validateDocxContainer(bytes);
 return {bytes,ext};
}
function normalizedText(segments){
 if(!Array.isArray(segments)||segments.length<1||segments.length>250)fail('Transcribe between 1 and 250 source sections');
 const map=[],parts=[];let position=0;
 for(const [index,section] of segments.entries()){
  if(!section||typeof section!=='object'||!textOK(section.reference,150)||!textOK(section.text,40000))fail(`Section ${index+1} needs a precise original locator and visible text`);
  const reference=section.reference.trim();
  if(!/^(?:Page\s+\d{1,5}|Section\s+[\w.\- ]{1,90}|Paragraph\s+\d{1,5}|Table\s+\d{1,5})$/i.test(reference))fail(`Section ${index+1} needs Page, Section, Paragraph or Table reference`);
  const value=section.text.replace(/\r\n?/g,'\n').trim();
  if(!value||/\f/.test(value))fail(`Section ${index+1} has unsupported blank/form-feed text`);
  if(index)position+=2;
  const start=position;position+=Array.from(value).length;
  map.push({kind:'owner-verified-section',reference,ordinal:index+1,start,end:position});parts.push(value);
 }
 const text=parts.join('\n\n');if(Array.from(text).length>40000)fail('Normalized source exceeds 40,000 codepoints');
 return {text,sourceMap:map};
}
function identity(a){return sha(JSON.stringify({schema:a.schema,sourceFormat:a.sourceFormat,rawHash:a.rawHash,normalizedHash:a.normalizedHash,reviewer:a.reviewer,reason:a.reason,attestedComplete:a.attestedComplete,sections:a.sections}));}
export function inspectReviewedPermit({file,transcription}){
 const {bytes,ext}=sourceBinary(file);
 if(!transcription||transcription.attestedComplete!==true||!textOK(transcription.reviewer,150)||!textOK(transcription.reason,2000))fail('Name a reviewer, explain the original comparison and explicitly attest completeness');
 const {text,sourceMap}=normalizedText(transcription.sections);
 const preview=discoverSourceUnits(text);if(!preview.allNonWhitespaceRepresented)fail('Reviewed transcription has uncovered source text');
 const sourceFormat=`${ext}_OWNER_VERIFIED_PERMIT_TRANSCRIPTION_V1`,rawHash=sha(bytes),normalizedHash=sha(text);
 const attestation={schema:'beforeroll-reviewed-permit-v1',sourceFormat,rawHash,normalizedHash,reviewer:transcription.reviewer.trim(),reason:transcription.reason.trim(),attestedComplete:true,
  sections:sourceMap.map((m,i)=>({reference:m.reference,ordinal:m.ordinal,start:m.start,end:m.end,text:transcription.sections[i].text.replace(/\r\n?/g,'\n').trim()})),
  status:'HUMAN_TRANSCRIPTION_NOT_INDEPENDENTLY_VERIFIED'};
 attestation.sha256=identity(attestation);
 return {schema:'beforeroll-source-import-v1',kind:'permit',name:file.name,sourceFormat,rawHash,byteCount:bytes.length,normalizedHash,text,sourceMap,
  reviewedPermitAttestation:attestation,requiresHumanTextReview:false,verifiedTextExtraction:false,notClearance:true,
  warnings:['Human transcription, not automatic PDF/Word text extraction or OCR. Original bytes are retained by exact SHA-256.',
   'Reviewer attests coverage; BeforeRoll did NOT independently verify text against original pages, signatures, amendments or attachments.']};
}
export function verifyReviewedPermitReceipt(receipt,text){
 const a=receipt?.reviewedPermitAttestation;if(!a)return true;
 if(a.schema!=='beforeroll-reviewed-permit-v1'||a.status!=='HUMAN_TRANSCRIPTION_NOT_INDEPENDENTLY_VERIFIED'||a.attestedComplete!==true||
  !['PDF_OWNER_VERIFIED_PERMIT_TRANSCRIPTION_V1','DOCX_OWNER_VERIFIED_PERMIT_TRANSCRIPTION_V1'].includes(a.sourceFormat)||
  a.sourceFormat!==receipt.sourceFormat||a.rawHash!==receipt.rawHash||a.normalizedHash!==receipt.normalizedHash||a.normalizedHash!==sha(text)||
  !textOK(a.reviewer,150)||!textOK(a.reason,2000)||a.sha256!==identity(a))fail('Original/transcription receipt identity mismatch');
 const reconstructed=normalizedText(a.sections);
 if(reconstructed.text!==text||JSON.stringify(reconstructed.sourceMap)!==JSON.stringify(receipt.sourceMap))fail('Original section map/text were altered');
 if(!discoverSourceUnits(text).allNonWhitespaceRepresented)fail('Reviewed source coverage gap');
 return true;
}
