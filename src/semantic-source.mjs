// Browser-safe exact source character range helpers. No model interpretation.
const cp = s => Array.from(s);
export function slicePoints(s,start,end){return cp(s).slice(start,end).join('');}
export function excerptFromRange(text,start,end){
 if(typeof text!=='string'||!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>cp(text).length)throw Error('Invalid source character range');
 const quote=slicePoints(text,start,end);
 if(quote.trim().length<25||quote.length>1800)throw Error('Select one complete 25-1800 character source clause.');
 return quote;
}
export function sentenceCandidates(source){
 if(typeof source!=='string'||source.length>12000)throw Error('Permit must be 12,000 characters or fewer');
 const found=[];
 for(const m of source.matchAll(/[^.!?\r\n]+[.!?]?/gu)){
  const chunk=m[0];const leading=chunk.length-chunk.trimStart().length;
  const trimmed=chunk.trim();
  if(trimmed.length<25 || trimmed.length>1800)continue;
  const pos=m.index+leading;
  const start=cp(source.slice(0,pos)).length;
  found.push({start,end:start+cp(trimmed).length,text:trimmed});
 }
 return found.slice(0,80);
}
/** Zero-credit coverage preview over original Unicode codepoint positions.
 * Not a clause discovery or safety judgment. Missing short statements are surfaced
 * as exact contiguous source ranges rather than silently called evaluated.
 */
export function previewSourceCoverage(source){
 const candidates=sentenceCandidates(source),p=Array.from(source),covered=new Uint8Array(p.length);
 for(const c of candidates)for(let i=c.start;i<c.end;i++)covered[i]=1;
 const spans=[];let begin=-1;
 for(let i=0;i<=p.length;i++){
  const missing=i<p.length&&!covered[i];
  if(missing&&begin<0)begin=i;
  if(!missing&&begin>=0){
   const raw=p.slice(begin,i).join('');
   if(raw.trim())spans.push({start:begin,end:i,text:raw});
   begin=-1;
  }
 }
 return {candidatesDetected:candidates.length,sourcePoints:p.length,uncovered:spans,hasUncovered:spans.length>0};
}
