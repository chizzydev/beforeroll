/** BeforeRoll next-generation permit intelligence: provenance before interpretation.
 * Source statements remain EXACT codepoint slices, including short clauses.
 * Segmentation is a reviewable proposal, never legal clause completeness.
 */
import {createHash} from 'node:crypto';
const hash=(s)=>createHash('sha256').update(s,'utf8').digest('hex');
const cp=s=>Array.from(s);
const slice=(s,a,b)=>cp(s).slice(a,b).join('');
export const PERMIT_MAX_POINTS=40000;
export const BLOCK_MAX_POINTS=1750;
export const PERMIT_MAX_BLOCKS=256;
export function sourceFingerprint(text){if(typeof text!=='string')throw Error('Source text required');return hash(text);}
function boundedText(text){
 if(typeof text!=='string'||!text.trim())throw Error('Nonempty source document required');
 const points=cp(text);if(points.length>PERMIT_MAX_POINTS)throw Error('Source exceeds 40,000 Unicode characters; split into separately identified documents');
 if(points.some(c=>c==='\u0000'))throw Error('Null bytes are not supported in permit text');return points;
}
const blank=c=>/^\s$/u.test(c);
const isBreakLine=s=>/^\s*(?:[-*•]\s+|\(?\d+[.)]\s+|(?:Clause|Section|Article|Schedule)\s+[\w.-]+\s*[:.\-])/iu.test(s);
/** Split on blank paragraphs, explicit clause/bullet starts, and sentence boundaries.
 * Never discard a short prohibition, isolated heading, odd unicode, or leftover tail.
 */
export function discoverSourceUnits(text){
 const points=boundedText(text),chunks=[];
 const lines=[];let begin=0;
 for(let i=0;i<=points.length;i++){
  if(i===points.length||points[i]==='\n'){
   const row=points.slice(begin,i).join('');lines.push({start:begin,end:i,text:row});begin=i+1;
  }
 }
 let blockStart=-1,blockEnd=0;
 function close(){if(blockStart>=0){chunks.push([blockStart,blockEnd]);blockStart=-1;}}
 for(const line of lines){
  if(!line.text.trim()){close();continue;}
  if(blockStart>=0&&isBreakLine(line.text))close();
  if(blockStart<0)blockStart=line.start;
  blockEnd=line.end;
 }close();
 // First pass ensures even a one-line `No drones.` and emoji-surrounded clauses survive.
 const preliminary=[];
 for(const [a,b] of chunks){
  const raw=slice(text,a,b);
  // Divide on sentence separators only where the following text starts a plausible new sentence.
  // Keep semicolon-separated qualifications together (they often share authority scope).
  const matches=[...raw.matchAll(/(?<=[.!?])\s+(?=["'“‘(\[]?[\p{Lu}\d])/gu)];
  let previous=0;
  for(const m of matches){
   const i=m.index,sub=raw.slice(previous,i);
   if(sub.trim())preliminary.push([a+cp(raw.slice(0,previous)).length,a+cp(raw.slice(0,i)).length]);
   previous=i+m[0].length;
  }
  if(raw.slice(previous).trim())preliminary.push([a+cp(raw.slice(0,previous)).length,b]);
 }
 const units=[];let serial=0;
 function add(start,end){
  while(start<end&&blank(points[start]))start++;
  while(end>start&&blank(points[end-1]))end--;
  if(end<=start)return;
  if(end-start>BLOCK_MAX_POINTS)throw Error(`Source unit exceeds ${BLOCK_MAX_POINTS} Unicode points at offset ${start}; mark for manual subdivision before analysis. Nothing was silently truncated.`);
  const value=points.slice(start,end).join('');
  const looksHeading=!/[.!?;:]$/.test(value.trim())&&value.length<65&&/^(?:\s*(?:Appendix|Clause|SECTION|CHAPTER|SCHEDULE)\b)/i.test(value);
  units.push({id:`U${String(++serial).padStart(3,'0')}`,start,end,text:value,hash:hash(value),kind:looksHeading?'POSSIBLE_HEADING':'SOURCE_UNIT',status:'NOT_EVALUATED'});
 }
 for(const [a,b]of preliminary)add(a,b);
 if(units.length>PERMIT_MAX_BLOCKS)throw Error('Source produced more than 256 units; manual review required, no truncated subset');
 const marked=new Uint8Array(points.length);
 for(const u of units)for(let j=u.start;j<u.end;j++){
  if(marked[j])throw Error('Overlapping source ranges');marked[j]=1;
 }
 const gaps=[];let gapStart=-1;
 for(let i=0;i<=points.length;i++){
  const missed=i<points.length&&!blank(points[i])&&!marked[i];
  if(missed&&gapStart<0)gapStart=i;
  if(!missed&&gapStart>=0){gaps.push({start:gapStart,end:i,text:points.slice(gapStart,i).join('')});gapStart=-1;}
 }
 // Explicit coverage audit. Failed parsing must be surfaced, never implied complete.
 return {sourceHash:hash(text),sourcePoints:points.length,units,unrepresented:gaps,allNonWhitespaceRepresented:gaps.length===0,
  warning:'Discovery covers visible source text, not legal validity, clause completeness, or semantic interpretation.'};
}
export function verifySourceUnit(text,unit){
 return typeof text==='string'&&unit&&Number.isInteger(unit.start)&&Number.isInteger(unit.end)&&unit.start>=0&&unit.end<=cp(text).length&&unit.end>unit.start&&slice(text,unit.start,unit.end)===unit.text&&hash(unit.text)===unit.hash;
}
export function contextForUnit(units,index,radius=1){
 if(!Array.isArray(units)||!Number.isInteger(index)||index<0||index>=units.length)throw Error('Invalid unit context');
 const before=units.slice(Math.max(0,index-radius),index).map(u=>({id:u.id,start:u.start,end:u.end,text:u.text}));
 const after=units.slice(index+1,index+1+radius).map(u=>({id:u.id,start:u.start,end:u.end,text:u.text}));
 return {before,after};
}
