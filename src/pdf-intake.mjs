/** Conservative offline PDF text intake with NO external binary or network dependency.
 * Only standard-font, single-stream, unencrypted, text-only PDF-1.3/1.4/1.5/1.6/1.7,
 * classic xref table, direct page resources, simple horizontal LTR text operators.
 * Unsupported/layout-ambiguous PDFs are rejected, NEVER silently reduced to text.
 * Even accepted extractions require a human textual transcription check before model use.
 */
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
const sha=x=>createHash('sha256').update(x).digest('hex');
const fail=msg=>{throw Error('PDF intake: '+msg);};
const asc=x=>x.toString('latin1');
const cp=x=>Array.from(x).length;
function objects(buffer){
 const ascii=asc(buffer);if(!/^%PDF-1\.[3-7]\r?\n/.test(ascii))fail('requires an original PDF-1.3 through PDF-1.7 file');
 if(!/%%EOF\s*$/.test(ascii))fail('EOF missing or trailing data');
 if(/\/(?:Encrypt|ObjStm|XRef|Prev|AcroForm|Annots|EmbeddedFile|RichMedia|XFA|JavaScript|OpenAction|XObject|CIDFont|Type0|ToUnicode|FontDescriptor|StructTreeRoot)\b/.test(ascii))fail('unsupported security, attachments, structured fonts, annotations or active content');
 const sx=/startxref\s+(\d+)\s+%%EOF\s*$/.exec(ascii);if(!sx)fail('classic cross-reference table required');
 const location=Number(sx[1]);if(location<0||location>=buffer.length||!ascii.slice(location).startsWith('xref'))fail('invalid cross-reference position');
 const area=ascii.slice(location,sx.index),lines=area.replace(/\r\n?/g,'\n').split('\n');if(lines.shift()!=='xref')fail('classic xref required');
 const refs=new Map();let pos=0;while(pos<lines.length){const hdr=lines[pos].trim();if(!hdr||hdr==='trailer')break;
  const match=/^(\d+)\s+(\d+)$/.exec(hdr);if(!match)fail('unsupported xref entry');pos++;
  const [start,count]=[Number(match[1]),Number(match[2])];if(count>1000||start+count>2000)fail('too many PDF objects');
  for(let i=0;i<count;i++){const row=/^(\d{10})\s+(\d{5})\s+([nf])\s*$/.exec(lines[pos++]??'');if(!row)fail('malformed cross-reference entry');if(row[3]==='n'){
   const id=start+i,offset=Number(row[1]);if(Number(row[2])!==0||refs.has(id)||!new RegExp('^'+id+'\\s+0\\s+obj\\b').test(ascii.slice(offset,offset+40)))fail('object offset or generation mismatch');refs.set(id,offset);
  }}
 }
 const tr=area.slice(area.indexOf('trailer'));const root=/\/Root\s+(\d+)\s+0\s+R\b/.exec(tr);if(!root)fail('catalog reference not found');
 if(refs.size<3||refs.size>1000)fail('malformed object table');
 const out=new Map();const sorted=[...refs].sort((a,b)=>a[1]-b[1]);
 for(let i=0;i<sorted.length;i++){
  const [id,at]=sorted[i],end=i+1<sorted.length?sorted[i+1][1]:location,chunk=ascii.slice(at,end);
  const hd=new RegExp('^'+id+'\\s+0\\s+obj\\b').exec(chunk);const e=chunk.lastIndexOf('endobj');if(!hd||e<0||chunk.slice(e+6).trim())fail('inconsistent PDF object boundaries');
  out.set(id,{text:chunk.slice(hd[0].length,e).trim(),offset:at});
 }
 const catalog=out.get(Number(root[1]))?.text;
 if(!catalog||!/\/Type\s*\/Catalog\b/.test(catalog))fail('invalid root catalog');
 return {out,catalog};
}
function ref(dict,key){const match=new RegExp('/'+key+'\\s+(\\d+)\\s+0\\s+R\\b').exec(dict);if(!match)fail('missing indirect '+key);return Number(match[1]);}
function fontCheck(resource,obj){
 const f=/\/Font\s*<<([\s\S]*?)>>/.exec(resource);if(!f)fail('inline Font resource dictionary required');
 const items=[...f[1].matchAll(/\/([\w]+)\s+(\d+)\s+0\s+R\b/g)];if(items.length!==1||f[1].match(/\/[A-Za-z][A-Za-z0-9]*\b/g)?.length!==items.length)fail('exactly one supported base-14 font required');
 const [name,id]=[items[0][1],Number(items[0][2])];const dict=obj.get(id)?.text;
 if(!dict||!/\/Type\s*\/Font\b/.test(dict)||!/\/Subtype\s*\/Type1\b/.test(dict)||!/\/BaseFont\s*\/(?:Helvetica(?:-Bold|-Oblique|-BoldOblique)?|Times-Roman|Times-Bold|Times-Italic|Courier(?:-Bold|-Oblique|-BoldOblique)?)\b/.test(dict)||/\/Encoding\s*\d+\s+0\s+R/.test(dict)||(/\/Encoding\b/.test(dict)&&!/\/Encoding\s*\/WinAnsiEncoding\b/.test(dict)))fail('unverified font/encoding');
 return name;
}
function streamContents(block){
 const match=/^([\s\S]*?)\bstream\r?\n/.exec(block);if(!match||!block.endsWith('endstream'))fail('simple single content stream required');
 const dict=match[1],offset=match[0].length,len=/\/Length\s+(\d+)\b/.exec(dict);if(!len)fail('literal stream length required');
 const n=Number(len[1]);if(n<1||n>1024*1024)fail('excessive content stream');
 const src=Buffer.from(block,'latin1'),bytes=src.subarray(Buffer.byteLength(block.slice(0,offset),'latin1'),Buffer.byteLength(block.slice(0,offset),'latin1')+n);
 if(bytes.length!==n||!/^\s*endstream\s*$/.test(asc(src.subarray(offset+n))))fail('stream length mismatch');
 const filter=/\/Filter\s*\/([\w]+)/.exec(dict);if(filter&&filter[1]!=='FlateDecode')fail('unsupported PDF content compression');
 if(!filter)return asc(bytes);
 let expanded;try{expanded=inflateSync(bytes,{maxOutputLength:1024*1024});}catch{fail('invalid or excessive Flate stream');}
 return asc(expanded);
}
function pdfLiteral(encoded){
 let output='';for(let i=1;i<encoded.length-1;i++){
  let c=encoded[i];if(c==='\\'){
   const next=encoded[++i];if(next===undefined)fail('bad escape');
   if(/[nrtbf]/.test(next)){output+=({n:'\n',r:'\r',t:'\t',b:'\b',f:'\f'})[next];continue;}
   if(next==='\r'||next==='\n'){if(next==='\r'&&encoded[i+1]==='\n')i++;continue;}
   if(/[0-7]/.test(next)){let oct=next;for(let j=0;j<2&&/[0-7]/.test(encoded[i+1]||'');j++)oct+=encoded[++i];c=String.fromCharCode(parseInt(oct,8));}
   else if(next==='('||next===')'||next==='\\')c=next;
   else fail('nonstandard literal escape');
  }
  const code=c.charCodeAt(0);if(code===0||code<32||code>126)fail('non-ASCII or control glyph requires verified ToUnicode map; refused');
  output+=c;
 }
 return output;
}
function tokenize(code){
 const expression=/\s+|%[^\r\n]*|\((?:\\[\s\S]|[^\\()])*\)|\/[\w.-]+|\[|\]|[-+]?\d+(?:\.\d+)?|[A-Za-z*']+/gy;
 const tokens=[];let offset=0;
 while(offset<code.length){expression.lastIndex=offset;const m=expression.exec(code);if(!m)fail('unsupported content operator or nested PDF string');const t=m[0];offset=expression.lastIndex;if(!/^\s+$/.test(t)&&!t.startsWith('%'))tokens.push(t);}
 return tokens;
}
function contentText(code,fontName,pageNumber,streamObject){
 const tokens=tokenize(code),stack=[];let inside=false,usedFont=false,x=0,y=null,lastY=null,current='',lines=[];
 const num=x=>typeof x==='string'&&/^[-+]?\d+(?:\.\d+)?$/.test(x)?Number(x):NaN;
 const finish=()=>{if(current.trim())lines.push({text:current.trim(),page:pageNumber,streamObject});current='';};
 for(let i=0;i<tokens.length;i++){
  const t=tokens[i];if(t==='BT'){if(inside||stack.length)fail('nested text object');inside=true;usedFont=false;y=null;continue;}
  if(t==='ET'){if(!inside||stack.length)fail('unbalanced text object');finish();inside=false;continue;}
  if(['Tf','Tm','Td','TD','T*','Tj','TJ','TL','Tc','Tw','Tz'].includes(t)){
   if(!inside)fail('text operator outside BT/ET');
   if(t==='Tf'){if(stack.length!==2||stack[0]!=='/'+fontName||!(num(stack[1])>0))fail('font is ambiguous');usedFont=true;stack.length=0;continue;}
   if(!usedFont)fail('text display before verified font selection');
   if(t==='Tm'){if(stack.length!==6||!stack.every(v=>Number.isFinite(num(v)))||num(stack[0])!==1||num(stack[1])!==0||num(stack[2])!==0||num(stack[3])!==1)fail('rotated/complex text matrix unsupported');x=num(stack[4]);y=num(stack[5]);stack.length=0;}
   else if(t==='Td'||t==='TD'){if(stack.length!==2||!stack.every(v=>Number.isFinite(num(v))))fail('invalid text offset');x+=num(stack[0]);y=(y??0)+num(stack[1]);stack.length=0;}
   else if(t==='T*'){if(stack.length)fail('invalid T*');finish();y=null;}
   else if(t==='Tj'){
    if(stack.length!==1||!stack[0].startsWith('(')||y===null)fail('unsupported text render');
    if(lastY!==null&&y>lastY+0.5)fail('page text order is not monotonic top-to-bottom');
    if(lastY!==null&&Math.abs(y-lastY)>0.5)finish();lastY=y;current+=pdfLiteral(stack[0]);stack.length=0;
   }else if(t==='TJ'){
    if(stack.length<2||stack[0]!=='['||stack.at(-1)!==']'||y===null)fail('invalid TJ array');
    const letters=[];for(const v of stack.slice(1,-1)){if(v.startsWith('('))letters.push(pdfLiteral(v));else if(!Number.isFinite(num(v)))fail('unsupported TJ item');}
    if(lastY!==null&&y>lastY+0.5)fail('page text order ambiguous');if(lastY!==null&&Math.abs(y-lastY)>0.5)finish();lastY=y;current+=letters.join('');stack.length=0;
   }else{if(stack.length!==1||!Number.isFinite(num(stack[0])))fail('invalid text parameter');stack.length=0;}
   continue;
  }
  if(['q','Q','cm','Do','BI','EI','ID','re','f','S','m','l','h','gs','Tr','Ts',"'",'"'].includes(t))fail('graphics, text rendering or nonstandard layout unsupported');
  stack.push(t);if(stack.length>2000)fail('content operand overflow');
 }
 if(inside||stack.length||!lines.length)fail('content stream has incomplete or missing readable text');
 return lines;
}
export function extractConservativePdf(bytes){
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>8*1024*1024)fail('PDF must be 1 to 8 MiB');
 const {out,catalog}=objects(bytes);const pagesId=ref(catalog,'Pages');const pages=out.get(pagesId)?.text;
 if(!pages||!/\/Type\s*\/Pages\b/.test(pages)||/\/Parent\b/.test(pages))fail('simple page tree required');
 const count=/\/Count\s+(\d+)/.exec(pages),kids=/\/Kids\s*\[([^\]]*)\]/.exec(pages);
 if(!count||!kids||Number(count[1])<1||Number(count[1])>20)fail('PDF page count exceeds supported limit');
 const ids=[...kids[1].matchAll(/(\d+)\s+0\s+R/g)].map(x=>Number(x[1]));if(ids.length!==Number(count[1])||kids[1].replace(/\d+\s+0\s+R\s*/g,'').trim()!=='')fail('unsupported nested page tree');
 const lines=[];
 for(const [ix,id] of ids.entries()){
  const pg=out.get(id)?.text;if(!pg||!/\/Type\s*\/Page\b/.test(pg)||ref(pg,'Parent')!==pagesId||!/\/Resources\s*<</.test(pg))fail('page resources or tree unsupported');
  const font=fontCheck(pg,out),contentId=ref(pg,'Contents'),stream=out.get(contentId)?.text;
  if(!stream)fail('missing page content');lines.push(...contentText(streamContents(stream),font,ix+1,contentId));
 }
 const text=lines.map(x=>x.text).join('\n');if(!text.trim()||cp(text)>40000)fail('empty or oversized visible source');
 const sourceMap=[];let cursor=0;
 for(const line of lines){const start=cursor,end=start+cp(line.text);sourceMap.push({...line,start,end});cursor=end+1;}
 return {text,sourceMap,rawHash:sha(bytes),sourceFormat:'PDF_CONSERVATIVE_TYPE1_TEXT_V1',warnings:[
  'Supported PDF structure is deliberately narrow; this is NOT a full visual-layout, OCR or document authenticity check.',
  'Original bytes and reconstructed transcription must be inspected and acknowledged by a human before Clocked analysis.'
 ],requiresHumanTextReview:true,notClearance:true};
}
