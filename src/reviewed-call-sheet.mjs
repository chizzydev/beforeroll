/** M3-S22: human-transcribed original PDF/DOCX call sheets.
 * The user enters every scene row and a source locator from the actual original.
 * No OCR, AI reconstruction, or false claim that uploaded binary corroborates rows.
 */
import {createHash} from 'node:crypto';
import {inspectImport} from './source-intake.mjs';
import {validateDocxContainer} from './docx-intake.mjs';
const digest=x=>createHash('sha256').update(x).digest('hex');
const fail=msg=>{throw Error('Reviewed call-sheet: '+msg);};
const good=(x,max)=>typeof x==='string'&&!!x.trim()&&x.length<=max&& !/[\u0000-\u001f\u007f]/.test(x);
const MAX_BYTES=8*1024*1024;
function originalBytes(file){
 if(!file||typeof file!=='object'||!good(file.name,180)||/[\\/]/.test(file.name)||typeof file.contentBase64!=='string'||file.text!==undefined)fail('Supply a safe original binary filename and exact base64 bytes');
 if(file.contentBase64.length>Math.ceil(MAX_BYTES/3)*4+8||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.contentBase64))fail('Invalid base64 content');
 const bytes=Buffer.from(file.contentBase64,'base64');if(!bytes.length||bytes.length>MAX_BYTES||bytes.toString('base64')!==file.contentBase64)fail('Invalid or oversized source bytes');
 const name=file.name.toLowerCase();
 if(name.endsWith('.pdf')){
  if(!bytes.subarray(0,8).toString('latin1').match(/^%PDF-(?:1\.[0-7]|2\.0)\b/)||!bytes.subarray(Math.max(0,bytes.length-2048)).includes(Buffer.from('%%EOF')))fail('Not a structurally recognizable PDF; original required');
  return {bytes,format:'PDF'};
 }
 if(name.endsWith('.docx')){
  // The existing checked ZIP/OOXML extractor is also a structural and no-macro gate.
  validateDocxContainer(bytes);return {bytes,format:'DOCX'};
 }
 fail('Original must be PDF or DOCX; use normal structured CSV/JSON import for other call sheets');
}
function canonicalRows(input,format){
 if(!Array.isArray(input)||input.length<1||input.length>600)fail('Supply 1 to 600 complete transcribed scenes');
 return input.map((r,i)=>{
  if(!r||typeof r!=='object'||Array.isArray(r))fail('Each transcribed row must be an object');
  if(typeof r.number!=='string'&&typeof r.number!=='number')fail('Scene number required on every row');
  for(const key of ['location','start','end','activity','reference'])if(!good(r[key],key==='activity'?1200:220))fail(`Row ${i+1} needs ${key} (including original page/table reference)`);
  if(format==='PDF'&&!/\b(?:page|p\.)\s*\d{1,5}\b/i.test(r.reference))fail(`Row ${i+1} requires an identifiable PDF page reference, e.g. Page 2`);
  return {number:r.number,location:r.location,start:r.start,end:r.end,activity:r.activity,reference:r.reference.trim()};
 });
}
const identity=(receipt)=>digest(JSON.stringify({format:receipt.sourceFormat,original:receipt.rawHash,normalized:receipt.normalizedHash,count:receipt.sceneCount,reviewer:receipt.reviewer,reason:receipt.reason,rows:receipt.rows}));
export function inspectReviewedCallSheet({file,transcription}){
 const {bytes,format}=originalBytes(file);
 if(!transcription||typeof transcription!=='object'||transcription.attestedComplete!==true||!good(transcription.reviewer,150)||!good(transcription.reason,2000))fail('A named human reviewer, detailed basis, and explicit full-scene attestation are required');
 const rows=canonicalRows(transcription.rows,format);
 if(!Number.isSafeInteger(transcription.expectedSceneCount)||transcription.expectedSceneCount!==rows.length)fail('Declared source scene count must equal the number of transcribed rows');
 const normalized=inspectImport({kind:'callSheet',name:'reviewed-scenes.json',text:JSON.stringify({schema:'beforeroll-call-sheet-v1',scenes:rows})});
 const rawHash=digest(bytes),sourceFormat=`${format}_HUMAN_CALL_SHEET_TRANSCRIPTION_V1`;
 const reviewedAttestation={schema:'beforeroll-reviewed-call-sheet-attestation-v1',sourceFormat,rawHash,normalizedHash:normalized.normalizedHash,
  sceneCount:rows.length,reviewer:transcription.reviewer.trim(),reason:transcription.reason.trim(),attestedComplete:true,
  status:'OWNER_TRANSCRIBED_NOT_INDEPENDENTLY_SOURCE_VERIFIED',rows:rows.map((r,i)=>({sceneId:normalized.sourceMap[i].sceneId,sourceReference:r.reference,normalizedRow:normalized.sourceMap[i].normalizedRow}))};
 reviewedAttestation.sha256=identity(reviewedAttestation);
 return {...normalized,name:file.name,sourceFormat,rawHash,byteCount:bytes.length,
  sourceMap:normalized.sourceMap.map((r,i)=>({...r,sourceReference:rows[i].reference,humanTranscribed:true})),
  warnings:['Every scene row was manually transcribed and attested by an owner. No machine extraction or independent PDF/DOCX row verification occurred.',
   'Original file fingerprint is verified, but it does NOT prove that the human transcription is complete or accurate. Compare original against rows before analysis.'],
  reviewedAttestation,verifiedTextExtraction:false,requiresHumanTextReview:false};
}
export function verifyReviewedCallSheetReceipt(receipt,text){
 const a=receipt?.reviewedAttestation;
 if(!a)return true;
 if(a.schema!=='beforeroll-reviewed-call-sheet-attestation-v1'||a.attestedComplete!==true||a.status!=='OWNER_TRANSCRIBED_NOT_INDEPENDENTLY_SOURCE_VERIFIED'||
  !['PDF_HUMAN_CALL_SHEET_TRANSCRIPTION_V1','DOCX_HUMAN_CALL_SHEET_TRANSCRIPTION_V1'].includes(a.sourceFormat)||a.sourceFormat!==receipt.sourceFormat||
  a.rawHash!==receipt.rawHash||a.normalizedHash!==digest(text)||receipt.normalizedHash!==a.normalizedHash||
  !Number.isInteger(a.sceneCount)||a.sceneCount<1||a.sceneCount>600||!good(a.reviewer,150)||!good(a.reason,2000)||
  !Array.isArray(a.rows)||a.rows.length!==a.sceneCount||!Array.isArray(receipt.sourceMap)||receipt.sourceMap.length!==a.sceneCount||a.sha256!==identity(a))fail('Attestation identity is corrupted');
 inspectImport({kind:'callSheet',name:'recheck.txt',text});
 const normalLines=text.split('\n');
 if(normalLines.length!==a.sceneCount)fail('Transcribed row count no longer matches current source');
 for(let i=0;i<a.rows.length;i++){
  const r=a.rows[i],ref=receipt.sourceMap[i],line=normalLines[i];
  if(!good(r.sourceReference,220)||r.normalizedRow!==line||
   ref.sceneId!==r.sceneId||ref.normalizedRow!==r.normalizedRow||ref.sourceReference!==r.sourceReference||ref.humanTranscribed!==true)fail('Transcribed source mapping was changed');
 }
 return true;
}
