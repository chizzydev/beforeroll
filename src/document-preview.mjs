/** M3-S25: ephemeral, non-authoritative original call-sheet text preview.
 * No write, no Clocked call, no promise of OCR/complete schedule extraction.
 * Structured scene row suggestions are reference text ONLY; a human must
 * recheck original, explicitly attest complete scene count, and import anew.
 */
import {createHash} from 'node:crypto';
import {extractDocx,validateDocxContainer} from './docx-intake.mjs';
import {extractConservativePdf} from './pdf-intake.mjs';
import {extractLocalPdfText} from './practical-pdf.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=s=>{throw Error('Call-sheet preview: '+s);};
export function previewCallSheetOriginal({name,contentBase64}){
 if(typeof name!=='string'||!/^[^\\/\x00-\x1f]{1,180}\.(pdf|docx)$/i.test(name)||typeof contentBase64!=='string'||contentBase64.length>12*1024*1024||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(contentBase64))fail('Select a safe PDF/DOCX original (max 8 MiB)');
 const bytes=Buffer.from(contentBase64,'base64');if(bytes.toString('base64')!==contentBase64||!bytes.length||bytes.length>8*1024*1024)fail('Invalid binary original');
 // Container must be genuine before a soft unsupported-extraction response.
 const isDocx=name.toLowerCase().endsWith('.docx');
 if(isDocx)validateDocxContainer(bytes);
 else if(!/^%PDF-(?:1\.[0-7]|2\.0)\b/.test(bytes.subarray(0,8).toString('latin1'))||!bytes.subarray(-2048).includes(Buffer.from('%%EOF')))fail('PDF header or end marker missing');
 let extracted=null,reason=null;
 try{
  if(isDocx)extracted=extractDocx(bytes);
  else{try{extracted=extractConservativePdf(bytes);}catch{extracted=extractLocalPdfText(bytes);}}
 }catch(e){reason=e.message;}
 const info={schema:'beforeroll-original-document-review-preview-v1',name,originalRawSha256:sha(bytes),byteCount:bytes.length,
  state:extracted?'EXTRACTED_TEXT_NOT_VERIFIED':'MANUAL_TRANSCRIPTION_REQUIRED',sourceFormat:extracted?.sourceFormat??null,
  extractedText:extracted?.text??null,sourceMap:extracted?.sourceMap??[],reason,sceneRowSuggestions:[],notClearance:true,
  warnings:['Temporary read-only extraction for comparison. It is NOT a verified scene register, OCR, evidence of signature, or filming clearance.',
   'Read every source page/table, correct all omissions and import via the explicit reviewed call-sheet attestation.']};
 if(!extracted)return info;
 const draft=[];
 for(const [i,line] of extracted.text.split(/\r?\n/).entries()){
  if(draft.length>=600)break;
  // Only unambiguous literal rows. Never infer missing clocks, scene IDs or location.
  const scene=/^\s*(?:Scene\s+)?([\w.\-]{1,40})\s*\|\s*([^|\r\n]{1,200})\s*\|\s*([01]\d|2[0-3]):([0-5]\d)\s*(?:\-|\|)\s*([01]\d|2[0-3]):([0-5]\d)\s*\|\s*([^|\r\n]{1,800})\s*$/.exec(line);
  if(!scene)continue;
  const match=extracted.sourceMap.find(x=>x.start!==undefined&&Array.from(extracted.text).slice(x.start,x.end).join('').includes(line))??null;
  const reference=match?.page?`Page ${match.page}`:match?.kind==='table-row'?`Table ${match.ordinal}`:match?.ordinal?`Paragraph ${match.ordinal}`:`Line ${i+1} (verify original page)`;
  draft.push({number:scene[1],location:scene[2].trim(),start:scene[3]+':'+scene[4],end:scene[5]+':'+scene[6],activity:scene[7].trim(),reference});
 }
 info.sceneRowSuggestions=draft;
 info.warnings.push(`${draft.length} provisional structured rows detected. Other rows may be omitted. Draft never becomes a call sheet until a human confirms every source scene.`);
 return info;
}
