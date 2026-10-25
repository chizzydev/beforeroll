/** Local-owner access fence. Sessions are RAM-only; never persist the owner token.
 * This is single-operator device access, NOT a remote account or multi-user system.
 */
import {randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {isIP} from 'node:net';
const COOKIE='beforeroll_owner';
const SESSION_MS=4*60*60*1000;
const MAX_SESSIONS=8;
const sha=v=>createHash('sha256').update(v).digest('hex');
export function constantTimeMatch(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const aa=Buffer.from(sha(a),'hex'),bb=Buffer.from(sha(b),'hex');return timingSafeEqual(aa,bb);}
export function loopbackAddress(value){const ip=String(value??'').replace(/^::ffff:/,'');return ip==='::1'||ip==='127.0.0.1'||/^127\.(?:\d{1,3}\.){2}\d{1,3}$/.test(ip)&&ip.split('.').slice(1).every(x=>Number(x)<=255);}
export function trustedOwnerRequest(req){
 if(!loopbackAddress(req.socket?.remoteAddress))return false;
 if(req.headers['x-forwarded-host']||req.headers['x-forwarded-proto']||req.headers['x-forwarded-for'])return false;
 let url;try{url=new URL('http://'+req.headers.host);}catch{return false;}
 if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))return false;
 if(url.username||url.password||url.pathname!=='/'||url.search||url.hash)return false;
 const port=Number(req.socket.localPort);
 if(url.port!==String(port))return false;
 if(req.headers['sec-fetch-site']&&!['same-origin','none'].includes(req.headers['sec-fetch-site']))return false;
 if(req.headers.origin){
  let origin;try{origin=new URL(req.headers.origin);}catch{return false;}
  if(origin.origin!==url.origin)return false;
 }
 return true;
}
function cookieValue(req){
 const s=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));
 const v=s?.slice(COOKIE.length+1);return /^[a-f0-9]{64}$/.test(v??'')?v:null;
}
export function createOwnerSecurity({token=null,now=()=>Date.now()}={}){
 if(token!==null&&(typeof token!=='string'||token.length<32||token.length>256))throw Error('Owner access token must contain 32-256 characters');
 const sessions=new Map(),failures=[];
 const guarded=Boolean(token);
 const clean=()=>{const t=now();for(const [k,v] of sessions)if(v<=t)sessions.delete(k);while(failures.length&&failures[0]<=t-600000)failures.shift();};
 function authorized(req){if(!guarded)return true;clean();const v=cookieValue(req);const expires=v&&sessions.get(sha(v));return Boolean(expires&&expires>now());}
 function unlock(req,attempt){
  clean();if(!guarded)return {ok:true,unprotected:true};
  if(failures.length>=5)return {ok:false,limited:true};
  if(!constantTimeMatch(token,attempt)){failures.push(now());return {ok:false};}
  failures.length=0;const v=randomBytes(32).toString('hex');sessions.set(sha(v),now()+SESSION_MS);
  while(sessions.size>MAX_SESSIONS)sessions.delete(sessions.keys().next().value);
  return {ok:true,cookie:`${COOKIE}=${v}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS/1000}`};
 }
 function lock(req){const v=cookieValue(req);if(v)sessions.delete(sha(v));return `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;}
 return {guarded,authorized,unlock,lock,sessionMs:SESSION_MS};
}
