/** Conservative .docx text import. No shell, external code, macros or network.
 * Only unambiguous main-body paragraphs and ordinary table cells are accepted;
 * unsupported document features fail closed instead of dropping conditions.
 */
import {inflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const decoder=new TextDecoder('utf-8',{fatal:true});
const limitBytes=8*1024*1024;
const fail=msg=>{throw Error('DOCX: '+msg);};
function u16(b,o){if(o<0||o+2>b.length)fail('ZIP bounds');return b.readUInt16LE(o);}
function u32(b,o){if(o<0||o+4>b.length)fail('ZIP bounds');return b.readUInt32LE(o);}
function crc32(buffer){let crc=0xffffffff;for(const byte of buffer){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^(crc&1?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function entries(bytes){
 if(bytes.length>limitBytes||bytes.length<22)fail('Invalid or oversized ZIP');
 let eocd=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(u32(bytes,i)===0x06054b50){eocd=i;break;}
 if(eocd<0||u16(bytes,eocd+4)!==0||u16(bytes,eocd+6)!==0)fail('Missing or multi-disk central directory');
 const count=u16(bytes,eocd+10),size=u32(bytes,eocd+12),offset=u32(bytes,eocd+16);
 if(count>300||count===0||offset+size>eocd||count===65535||size===0xffffffff)fail('Unsupported ZIP directory/ZIP64');
 const output=new Map();let p=offset,totalUncompressed=0;
 for(let i=0;i<count;i++){
  if(u32(bytes,p)!==0x02014b50)fail('Invalid central directory record');
  const flags=u16(bytes,p+8),method=u16(bytes,p+10),crc=u32(bytes,p+16),compressed=u32(bytes,p+20),length=u32(bytes,p+24),nameLen=u16(bytes,p+28),extra=u16(bytes,p+30),comment=u16(bytes,p+32),local=u32(bytes,p+42);
  if(flags&1||flags&0x40||![0,8].includes(method)||nameLen<1||compressed===0xffffffff||length===0xffffffff)fail('Encrypted or unsupported ZIP entry');
  if(p+46+nameLen+extra+comment>bytes.length)fail('ZIP directory overflow');
  let name;try{name=decoder.decode(bytes.subarray(p+46,p+46+nameLen));}catch{fail('Invalid ZIP name');}
  if(name.startsWith('/')||name.includes('\\')||name.split('/').includes('..')||output.has(name))fail('Unsafe/duplicate ZIP path');
  p+=46+nameLen+extra+comment;
  totalUncompressed+=length;if(totalUncompressed>16*1024*1024)fail('Uncompressed ZIP data limit exceeded');
  if(name.endsWith('/'))continue;
  if(u32(bytes,local)!==0x04034b50)fail('ZIP local entry missing');
  if(u16(bytes,local+8)!==method)fail('ZIP compression mismatch');
  const localFlags=u16(bytes,local+6),localNameLength=u16(bytes,local+26),localExtraLength=u16(bytes,local+28);
  if(localFlags!==flags||localNameLength!==nameLen||local+30+localNameLength+localExtraLength>bytes.length||
   !bytes.subarray(local+30,local+30+localNameLength).equals(bytes.subarray(p-(46+nameLen+extra+comment)+46,p-(46+nameLen+extra+comment)+46+nameLen)))fail('ZIP local/central filename or flags mismatch');
  // ZIP data-descriptor mode may omit local lengths. Otherwise require exact
  // CRC and lengths to defend against inconsistent header/path indirection.
  if(!(flags&8)&&(u32(bytes,local+14)!==crc||u32(bytes,local+18)!==compressed||u32(bytes,local+22)!==length))fail('ZIP local/central CRC mismatch or length mismatch');
  const start=local+30+localNameLength+localExtraLength;
  if(start+compressed>bytes.length||length>2*1024*1024&&name==='word/document.xml')fail('ZIP entry outside bounds or XML too large');
  const raw=bytes.subarray(start,start+compressed);
  let expanded;try{expanded=method===0?raw:inflateRawSync(raw,{maxOutputLength:16*1024*1024});}catch{fail('ZIP inflate failed');}
  if(expanded.length!==length||crc32(expanded)!==crc)fail('ZIP entry length/CRC mismatch');
  output.set(name,expanded);
 }
 if(p!==offset+size)fail('ZIP directory trailing data');return output;
}
const xml=raw=>{try{return decoder.decode(raw);}catch{fail('Invalid UTF-8 XML');}};
/** Container verification for human transcription fallback; requires actual
 * OOXML package but does not mistake extracting zero text for seeing the page. */
export function validateDocxContainer(source){
 if(!Buffer.isBuffer(source))fail('Original DOCX buffer required');
 const zip=entries(source);
 if(!zip.has('[Content_Types].xml')||!zip.has('word/document.xml')||!zip.has('_rels/.rels'))fail('Not a complete Word .docx');
 const types=xml(zip.get('[Content_Types].xml'));
 if(!types.includes('wordprocessingml.document.main+xml')||/macroEnabled|vbaProject/i.test(types)||[...zip.keys()].some(n=>/vbaProject|activeX|word\/embeddings\/|\.bin$/i.test(n)))fail('Unsupported or macro-enabled Office package (including embedded objects)');
 if([...zip].some(([n,b])=>n.endsWith('.rels')&&/TargetMode\s*=\s*[\"']External[\"']/i.test(xml(b))))fail('External relationship requires human security examination before importing binary');
 const word=xml(zip.get('word/document.xml'));
 if(/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(word)||!/<w:document\b/.test(word)||!/<w:body\b/.test(word))fail('Malformed/active Word document structure');
 return {structureVerified:true,entries:zip.size,hasMedia:[...zip.keys()].some(n=>/^word\/media\//.test(n)),containsExternalLinks:[...zip].some(([n,b])=>n.endsWith('.rels')&&/TargetMode\s*=\s*["']External["']/i.test(xml(b)))};
}

function decodeEntity(value){return value.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi,(_,entity)=>{
 const known={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};if(known[entity])return known[entity];
 const num=entity.startsWith('#x')?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10);
 if(!Number.isInteger(num)||num===0||num>0x10ffff||(num>=0xd800&&num<=0xdfff))fail('Illegal XML character reference');return String.fromCodePoint(num);
 });}
/** Avoid silently accepting unknown XML entities or markup in text nodes. */
function plainText(s){if(/&(?!(?:#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);)/i.test(s))fail('Unrecognized XML entity');return decodeEntity(s);}
export function extractDocx(source){
 if(!Buffer.isBuffer(source))fail('Original binary buffer required');
 const zip=entries(source);
 if(!zip.has('[Content_Types].xml')||!zip.has('word/document.xml')||!zip.has('_rels/.rels'))fail('Not an ordinary .docx package');
 const types=xml(zip.get('[Content_Types].xml'));
 if(!types.includes('wordprocessingml.document.main+xml')||/macroEnabled|vbaProject/i.test(types)||[...zip.keys()].some(n=>/vbaProject|\.bin$/i.test(n)))fail('Unsupported or macro-enabled Office package');
 const relationships=[...zip].filter(([n])=>n.endsWith('.rels')).map(([n,b])=>[n,xml(b)]);
 for(const [name,value]of relationships)if(/\bTargetMode\s*=\s*["']External["']/i.test(value))fail(`External relationship found in ${name}; inspect original offline`);
 if([...zip.keys()].some(n=>/^word\/(?:embeddings|charts|media|activeX|attachments|footnotes|endnotes|comments)\//i.test(n)||/^word\/(?:footnotes|endnotes|comments|header\d*|footer\d*)\.xml$/i.test(n)))fail('Embedded or attached Word content requires manual source verification');
 const document=xml(zip.get('word/document.xml'));
 if(/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(document))fail('Unsupported XML entity/doctype');
 const unsupported=/<w:(?:del|ins|moveFrom|moveTo|commentReference|commentRangeStart|commentRangeEnd|delText|vanish|footnoteReference|endnoteReference|headerReference|footerReference|drawing|pict|object|altChunk|txbxContent|fldChar|instrText|sdt|vMerge|gridSpan)\b/i;
 const found=unsupported.exec(document);if(found)fail(`Unsupported review-critical Word feature ${found[0]}; supply reviewed text instead`);
 if(/<w:(?:tbl|p|t)\b/.test(document)===false)fail('No readable body text');
 const body=/<w:body(?:\s[^>]*)?>([\s\S]*?)<\/w:body\s*>/i.exec(document)?.[1];if(!body)fail('Missing document body');
 const tokens=body.match(/<[^>]+>|[^<]+/g)||[];
 let pOn=false,txtOn=false,pText='',cellText=[],rowCells=[],table=false,cell=false,rows=[],i=0;
 const finishParagraph=()=>{if(!pOn)fail('Invalid paragraph close');pOn=false;if(cell){cellText.push(pText);}else if(pText.trim()){rows.push({kind:'paragraph',text:pText});}pText='';};
 for(const token of tokens){
  if(token[0]!=='<'){if(txtOn)pText+=plainText(token);continue;}
  if(/^<w:tbl(?:\s|>)/i.test(token)){if(table)fail('Nested tables need human extraction');table=true;continue;}
  if(/^<\/w:tbl\s*>/i.test(token)){if(!table||cell)fail('Malformed Word table');table=false;continue;}
  if(/^<w:tr(?:\s|>)/i.test(token)){if(!table)fail('Invalid table row');rowCells=[];continue;}
  if(/^<\/w:tr\s*>/i.test(token)){if(rowCells.length)rows.push({kind:'table-row',text:rowCells.map(s=>s.trim()).join(' | ')});rowCells=[];continue;}
  if(/^<w:tc(?:\s|>)/i.test(token)){if(!table)fail('Cell outside table');cell=true;cellText=[];continue;}
  if(/^<\/w:tc\s*>/i.test(token)){if(!cell)fail('Invalid cell');rowCells.push(cellText.join(' / '));cell=false;continue;}
  if(/^<w:p(?:\s|>)/i.test(token)){if(pOn)fail('Nested paragraph');pOn=true;pText='';continue;}
  if(/^<\/w:p\s*>/i.test(token)){finishParagraph();continue;}
  if(/^<w:t(?:\s|>)/i.test(token)){if(!pOn)fail('Text outside paragraph');txtOn=true;continue;}
  if(/^<\/w:t\s*>/i.test(token)){txtOn=false;continue;}
  if(/^<w:(?:tab|br|cr)(?:\s|\/|>)/i.test(token)&&pOn){pText+=/^<w:tab/i.test(token)?'\t':' ';continue;}
  if(++i>100000)fail('Excessive Word XML structure');
 }
 if(pOn||txtOn||table||cell)fail('Unclosed Word document structures');
 const kept=rows.filter(r=>r.text.trim());if(!kept.length)fail('No visible paragraphs extracted');
 const parts=[];let cursor=0;const map=[];
 for(const [index,item] of kept.entries()){
  if(index)cursor+=2;
  const start=cursor,cps=Array.from(item.text).length;cursor+=cps;parts.push(item.text);
  map.push({kind:item.kind,part:'word/document.xml',ordinal:index+1,start,end:cursor});
 }
 const text=parts.join('\n\n');
 if(Array.from(text).length>40000)fail('Extracted text exceeds permit source limit');
 return {text,sourceMap:map,sourceFormat:'DOCX_MAIN_BODY_TEXT_V1',warnings:['DOCX main-body text extracted; verify reading order, table meaning, omitted attachments, and source authority against original file.','DOCX ZIP bytes SHA-256 retained; character offsets refer to extracted normalized text, not binary file.'],originalPartSha256:sha(zip.get('word/document.xml'))};
}
