/** Optional professional PDF text-engine adapter (Poppler pdftotext).
 * Explicit local opt-in only: BEFOREROLL_PDFTOTEXT_PATH must be absolute.
 * This parses text layers, never OCR or authenticity; human verification required.
 * No shell, no network, no service, no native bundled binary.
 */
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=s=>{throw Error('PDF text-layer adapter: '+s);};
const utf8=new TextDecoder('utf-8',{fatal:true});
export function extractLocalPdfText(bytes,{toolPath=process.env.BEFOREROLL_PDFTOTEXT_PATH,spawn=spawnSync}={}){
 if(!Buffer.isBuffer(bytes)||bytes.length<16||bytes.length>8*1024*1024||!/^%PDF-(?:1\.[0-7]|2\.0)\b/.test(bytes.subarray(0,8).toString('latin1')))fail('Original PDF bytes required (max 8 MiB)');
 if(typeof toolPath!=='string'||!toolPath||!path.isAbsolute(toolPath))fail('Set BEFOREROLL_PDFTOTEXT_PATH to a trusted absolute local Poppler pdftotext executable; otherwise use human-reviewed original transcription');
 const started=spawn(toolPath,['-layout','-enc','UTF-8','-','-'],{input:bytes,timeout:15000,maxBuffer:2*1024*1024,windowsHide:true,shell:false,encoding:null,env:{PATH:process.env.PATH??'',SYSTEMROOT:process.env.SYSTEMROOT??'',SystemRoot:process.env.SystemRoot??''}});
 if(started.error||started.status!==0||started.signal)fail(`Local converter failed or timed out (${started.error?.code??started.signal??started.status}). Use human-reviewed original transcription`);
 let output;try{output=utf8.decode(started.stdout);}catch{fail('Local converter returned invalid UTF-8');}
 if(!output||/[\u0000-\u0008\u000b\u000e-\u001f\u007f]/.test(output))fail('Local converter returned untrustworthy control bytes');
 const pages=output.replace(/\r\n?/g,'\n').split('\f');
 // pdftotext emits ONE trailing form-feed sentinel. Extra empty pages are
 // genuine unsupported image-only pages; never erase them while normalizing.
 if(pages.length>1&&!pages.at(-1).trim())pages.pop();
 if(!pages.length||pages.length>100)fail('Missing readable pages or more than 100 pages');
 const chunks=[],sourceMap=[];let cursor=0;
 for(const [i,page]of pages.entries()){
  // Strip surrounding blank lines, but preserve internal whitespace for visual review.
  const normalized=page.replace(/\u00a0/g,' ').trim();
  if(!normalized){sourceMap.push({page:i+1,start:cursor,end:cursor,emptyTextLayer:true});continue;}
  if(chunks.length)cursor+=2;
  const start=cursor;cursor+=Array.from(normalized).length;
  chunks.push(normalized);sourceMap.push({page:i+1,start,end:cursor,emptyTextLayer:false});
 }
 const text=chunks.join('\n\n');
 if(!text||Array.from(text).length>40000||pages.some(x=>!x.trim()))fail('Empty/scanned page or extracted source exceeds 40,000 characters. Use human transcription of the original');
 return {text,sourceMap,rawHash:sha(bytes),sourceFormat:'PDF_POPPLER_TEXT_LAYER_HUMAN_REVIEW_V1',requiresHumanTextReview:true,
  warnings:['Text layer extracted by an owner-installed local Poppler binary. Not OCR or a visual-layout completeness certificate.',
   'Multi-column order, form values, signatures, stamps and image-only material MUST be compared with the original pages before analysis. No automated authority claim.']};
}
