/** BeforeRoll M3-S10: strict, deterministic, zero-network imported source envelope.
 * No PDF text guesses, no silently dropped CSV rows, no generated model scores.
 */
import {createHash} from 'node:crypto';
import {parseCallSheet} from './engine.mjs';
import {discoverSourceUnits} from './permit-intelligence.mjs';
import {extractDocx} from './docx-intake.mjs';
import {extractConservativePdf} from './pdf-intake.mjs';
import {inspectReviewedPermit} from './reviewed-permit.mjs';
import {extractLocalPdfText} from './practical-pdf.mjs';
const sha=s=>createHash('sha256').update(s,'utf8').digest('hex');
const EXT=/\.([a-z0-9]+)$/i;
const utf8=new TextDecoder('utf-8',{fatal:true});
const max=128*1024;
const str=(s,n)=>typeof s==='string'&&s.trim().length>0&&s.length<=n;
function fail(reason){throw Error(reason);}
function sourceBytes({name,contentBase64,text}){
 if(!str(name,180)||/[\\/\x00-\x1f\x7f]/.test(name)||name==='.'||name==='..')fail('Use a safe filename without path separators');
 if((contentBase64===undefined)===(text===undefined))fail('Provide exactly one of contentBase64 or text');
 let data;
 if(contentBase64!==undefined){
  if(typeof contentBase64!=='string'||!contentBase64||contentBase64.length>max*2||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(contentBase64))fail('Invalid base64 file data');
  data=Buffer.from(contentBase64,'base64');
  if(data.toString('base64')!==contentBase64)fail('Noncanonical base64 rejected');
 }else{if(typeof text!=='string')fail('Source text must be a string');data=Buffer.from(text,'utf8');}
 if(!data.length||data.length>max)fail('Source file must contain 1 to 131072 bytes');
 if(data.includes(0))fail('Binary or NUL source content rejected');
 let decoded;try{decoded=utf8.decode(data);}catch{fail('Not valid UTF-8; convert source explicitly before importing');}
 const rawHash=sha(data); // using crypto hash on raw UTF-8 bytes; same bytes as decoded with optional BOM
 const hadBOM=data.length>=3&&data[0]===0xef&&data[1]===0xbb&&data[2]===0xbf;
 if(decoded.startsWith('\ufeff'))decoded=decoded.slice(1);
 if(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(decoded))fail('Source has unsupported control characters');
 return {decoded,rawHash,byteCount:data.length,hadBOM};
}
export function inspectImport({name,text,contentBase64,kind,mediaType,reviewedTranscription}){
 const filename=name;const ext=(EXT.exec(filename||'')||[])[1]?.toLowerCase();
 if(!['permit','callSheet'].includes(kind))fail('kind must be permit or callSheet');
 if(reviewedTranscription!==undefined){
  if(kind!=='permit')fail('Reviewed permit mode is for original PDF/DOCX permits only');
  return inspectReviewedPermit({file:{name,contentBase64,text},transcription:reviewedTranscription});
 }
 if(ext==='pdf'){
  if(!str(name,180)||/[\\/\x00-\x1f\x7f]/.test(name))fail('Unsafe source filename');
  if(kind!=='permit')fail('PDF call-sheet import needs structured human transcription; permits only');
  if(text!==undefined||typeof contentBase64!=='string'||contentBase64.length>12*1024*1024||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(contentBase64))fail('PDF supplied as text is not supported; original base64-encoded binary required');
  const bytes=Buffer.from(contentBase64,'base64');
  if(bytes.toString('base64')!==contentBase64||bytes.length>8*1024*1024||!bytes.length)fail('Invalid PDF file bytes');
  if(mediaType&&!['application/pdf','application/octet-stream'].includes(mediaType))fail('PDF media type mismatch');
  let out;
  try{out=extractConservativePdf(bytes);}catch(conservativeError){
   try{out=extractLocalPdfText(bytes);}catch(fallbackError){
    fail(`Automatic PDF extraction unavailable (${conservativeError.message}; ${fallbackError.message}). Use the original file with the human-reviewed permit transcription workflow, not a guessed extraction.`);
   }
  }
  const preview=discoverSourceUnits(out.text);
  if(!preview.allNonWhitespaceRepresented)fail('PDF transcription contains unrepresented nonwhitespace');
  return {schema:'beforeroll-source-import-v1',kind,name,sourceFormat:out.sourceFormat,rawHash:out.rawHash,byteCount:bytes.length,normalizedHash:sha(out.text),text:out.text,sourceMap:out.sourceMap,warnings:out.warnings,
   requiresHumanTextReview:true,verifiedTextExtraction:false,notClearance:true};
 }
 if(ext==='docx'){
  if(!str(name,180)||/[\\/\x00-\x1f\x7f]/.test(name)||name==='.'||name==='..')fail('Unsafe source filename');
  if(kind!=='permit')fail('DOCX call-sheet import needs explicit reviewed tabular conversion');
  if(text!==undefined||typeof contentBase64!=='string'||contentBase64.length>12*1024*1024||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(contentBase64))fail('DOCX text-based import not supported; upload canonical base64 binary');
  const bytes=Buffer.from(contentBase64,'base64');
  if(bytes.toString('base64')!==contentBase64||bytes.length>8*1024*1024||!bytes.length)fail('Invalid or excessive DOCX bytes');
  if(mediaType&&!['application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/octet-stream'].includes(mediaType))fail('Wrong DOCX media type');
  const out=extractDocx(bytes),preview=discoverSourceUnits(out.text);
  if(!preview.allNonWhitespaceRepresented)fail('DOCX extraction contains unrepresented nonwhitespace');
  return {schema:'beforeroll-source-import-v1',kind,name,sourceFormat:out.sourceFormat,rawHash:sha(bytes),byteCount:bytes.length,normalizedHash:sha(out.text),text:out.text,sourceMap:out.sourceMap,warnings:out.warnings,originalPartSha256:out.originalPartSha256,verifiedTextExtraction:true,notClearance:true};
 }
 const {decoded,rawHash,byteCount,hadBOM}=sourceBytes({name,text,contentBase64});
 if(mediaType && !['text/plain','text/markdown','text/csv','application/json','application/octet-stream'].includes(mediaType))fail('Unsupported mediaType. PDF/Word scans require separately validated text extraction; never guess PDF source text.');
 if(['pdf','doc','docx','rtf','xlsx','xls','html','htm'].includes(ext))fail(`.${ext} intake not supported by this verified local parser; convert the document to reviewed UTF-8 text with provenance first. No silent OCR/extraction.`);
 if(!['txt','md','csv','json'].includes(ext))fail(`Unsupported source extension: .${ext||'(none)'}`);
 if(kind==='permit'&&ext==='csv')fail('CSV is only supported for call sheets');
 let converted=decoded,sourceFormat='UTF8_TEXT',sourceMap=[],warnings=[];
 if(ext==='json'){
  let parsed;try{parsed=JSON.parse(decoded)}catch{fail('Invalid JSON document');}
  if(kind==='permit'){
   if(!parsed||parsed.schema!=='beforeroll-permit-source-v1'||!str(parsed.text,60000))fail('Permit JSON must use schema beforeroll-permit-source-v1 with text');
   converted=parsed.text;sourceFormat='PERMIT_JSON_V1';
  }else{
   if(!parsed||parsed.schema!=='beforeroll-call-sheet-v1'||!Array.isArray(parsed.scenes))fail('Call-sheet JSON must use schema beforeroll-call-sheet-v1 and scenes');
   ({converted,sourceMap}=convertRows(parsed.scenes));sourceFormat='CALL_SHEET_JSON_V1';
  }
 }else if(ext==='csv'){
  const {rows}=readCsv(decoded); if(rows.length<2)fail('CSV has no data rows');
  const head=rows[0].fields.map(x=>x.trim().toLowerCase().replace(/[\s_-]+/g,''));
  const aliases={number:['scene','scenenumber','sceneid','number'],location:['location','filminglocation','site'],start:['start','starttime','from'],end:['end','endtime','to'],activity:['activity','description','action','sceneactivity']};
  const columns={};for(const [key,options]of Object.entries(aliases)){
   const candidates=head.map((h,i)=>options.includes(h)?i:-1).filter(x=>x!==-1);
   if(candidates.length!==1)fail(`CSV header needs exactly one ${key} column`);
   columns[key]=candidates[0];
  }
  const result=rows.slice(1).map(r=>{
   if(r.fields.length!==head.length)fail(`CSV row at line ${r.line} has ${r.fields.length} fields; expected ${head.length}`);
   return {number:r.fields[columns.number],location:r.fields[columns.location],start:r.fields[columns.start],end:r.fields[columns.end],activity:r.fields[columns.activity],csvLine:r.line};
  });
  ({converted,sourceMap}=convertRows(result));sourceFormat='CALL_SHEET_CSV_RFC4180';
 }
 if(ext==='txt'||ext==='md'){
  if(kind==='callSheet'){
   const parsed=parseCallSheet(converted);if(parsed.unsupported.length||!parsed.scenes.length||parsed.scenes.some(x=>x.needsReview))fail('Call sheet text contains unsupported rows or invalid times; no silent omission');
  }
 }
 if(!converted.trim())fail('Imported document is empty');
 if(kind==='permit'){
  const p=discoverSourceUnits(converted);
  if(!p.allNonWhitespaceRepresented)fail('Permit source segmentation left nonwhitespace gaps');
  warnings.push('Automated segmentation is not proof of exhaustive permit authority or authentic signatures.');
 }else{
  const parsed=parseCallSheet(converted);
  if(!parsed.scenes.length||parsed.unsupported.length||parsed.scenes.some(s=>s.needsReview))fail('Call sheet import is not a fully supported scene schedule');
 }
 if(hadBOM)warnings.push('UTF-8 BOM removed for normalized text; original bytes fingerprint retained.');
 return {schema:'beforeroll-source-import-v1',kind,name,sourceFormat,rawHash,byteCount,normalizedHash:sha(converted),text:converted,sourceMap,warnings,verifiedTextExtraction:ext!=='pdf',notClearance:true};
}
function safeCell(x,field){
 const value=typeof x==='number'?String(x):x;
 if(!str(value,1200)||/[\r\n\u0000|]/.test(value))fail(`Invalid ${field} cell; no newline or pipe in a normalized scene`);
 return value.trim();
}
function convertRows(rows){
 if(rows.length<1||rows.length>600)fail('Call sheet requires 1 to 600 complete scenes');
 const seen=new Set(),lines=[],sourceMap=[];
 for(const [i,r] of rows.entries()){
  if(!r||typeof r!=='object')fail(`Invalid scene row ${i+1}`);
  const number=safeCell(r.number??r.scene,'scene number').replace(/^scene\s*/i,'');
  if(!/^[\w.-]{1,40}$/.test(number))fail(`Unsupported scene identifier at row ${i+1}`);
  if(seen.has(number.toUpperCase()))fail(`Duplicate scene number ${number}`);seen.add(number.toUpperCase());
  const location=safeCell(r.location,'location'),start=safeCell(r.start,'start'),end=safeCell(r.end,'end'),activity=safeCell(r.activity,'activity');
  if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start)||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(end))fail(`Invalid 24-hour HH:MM clock at row ${i+1}`);
  const line=`Scene ${number} | ${location} | ${start}-${end} | ${activity}`;
  sourceMap.push({sceneId:`S${number}`,sourceRow:i+1,sourceLine:r.csvLine??null,normalizedRow:line});lines.push(line);
 }
 return {converted:lines.join('\n'),sourceMap};
}
/** RFC-4180 style CSV lexer. Rejects ambiguous malformed and duplicate rows. */
export function readCsv(text){
 if(typeof text!=='string'||!text.trim())fail('Nonempty CSV required');
 let fields=[],field='',rows=[],inQuotes=false,atStart=true,afterQuote=false,line=1,rowLine=1;
 function flushField(){fields.push(field);field='';atStart=true;afterQuote=false;}
 function flushRow(){flushField();if(fields.some(x=>x.trim()))rows.push({line:rowLine,fields});else fail(`Blank CSV row at line ${rowLine}`);fields=[];rowLine=line;}
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(inQuotes){
   if(c==='"') {if(text[i+1]==='"'){field+='"';i++;}else {inQuotes=false;afterQuote=true;}}
   else {field+=c;if(c==='\n')line++;}
  }else if(c==='"'){if(!atStart||afterQuote)fail(`Unexpected CSV quote at line ${line}`);inQuotes=true;atStart=false;}
  else if(c===','){flushField();}
  else if(c==='\r'||c==='\n'){
   if(c==='\r'&&text[i+1]==='\n')i++;
   line++;flushRow();
  }else{if(afterQuote)fail(`Unexpected characters after quoted CSV value at line ${line}`);field+=c;atStart=false;}
  if(rows.length>601)fail('CSV has too many rows');
 }
 if(inQuotes)fail('Unterminated CSV quoted cell');
 if(field.length||fields.length)flushRow();
 return {rows};
}
