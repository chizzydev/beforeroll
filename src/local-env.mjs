/** Local-only .env configuration. No dependencies, no uploads, no client exposure.
 * Never load this during --evaluate or an imported server test fixture.
 */
import {readFileSync} from 'node:fs';
import path from 'node:path';
const PERMITTED=new Set(['HOST','PORT','BEFOREROLL_LIVE_ENABLED','CLOCKED_API_KEY','BEFOREROLL_OPERATOR_TOKEN','BEFOREROLL_OWNER_TOKEN','BEFOREROLL_MAX_CALLS_PER_HOUR','BEFOREROLL_PDFTOTEXT_PATH']);
export function parseLocalEnv(source){
 if(typeof source!=='string'||source.length>16384)throw Error('Local .env exceeds allowed size');
 const out=Object.create(null);
 const lines=source.replace(/^\uFEFF/,'').split(/\r?\n/);
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();if(!line||line.startsWith('#'))continue;
  const match=/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/.exec(line);
  if(!match)throw Error(`Invalid local .env assignment on line ${i+1}`);
  const key=match[1];if(!PERMITTED.has(key))throw Error(`Unsupported local .env setting: ${key}`);
  if(Object.hasOwn(out,key))throw Error(`Duplicate local .env setting: ${key}`);
  let value=match[2].trim();
  if(value.startsWith('"')||value.startsWith("'")){
   const q=value[0];if(!value.endsWith(q)||value.length<2)throw Error(`Unclosed quoted .env value on line ${i+1}`);
   value=value.slice(1,-1);
  }else if(/[\r\n"']/.test(value))throw Error(`Quote .env values containing quotes (line ${i+1})`);
  if(/[\x00-\x1F\x7F]/.test(value))throw Error(`Control character in local .env on line ${i+1}`);
  out[key]=value;
 }
 return out;
}
export function loadLocalEnv({directory,env=process.env}={}){
 if(typeof directory!=='string')throw Error('Application directory required');
 const filename=path.join(directory,'.env');
 let body;try{body=readFileSync(filename,'utf8');}catch(e){if(e?.code==='ENOENT')return {found:false,applied:[]};throw e;}
 const settings=parseLocalEnv(body);
 const applied=[];
 for(const [key,value] of Object.entries(settings)){
  // Explicit process settings (e.g. launcher-selected loopback port) win.
  if(!Object.hasOwn(env,key)){env[key]=value;applied.push(key);}
 }
 return {found:true,applied}; // Intentionally never return secret values.
}
