import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
test('browser-like no-network render: both never-run source cases load without leaked previous model findings',async()=>{
 const listeners={};let html='';
 const app={set innerHTML(v){html=v;},get innerHTML(){return html;},querySelectorAll(){return []},addEventListener(type,cb){listeners[type]=cb;}};
 const rootBody={append(){}};
 globalThis.document={querySelector(q){return q==='#app'?app:null;},createElement(){return {textContent:'',remove(){}};},body:rootBody};
 globalThis.window={scrollTo(){},addEventListener(type,cb){listeners['window:'+type]=cb;}};
 const savedTimer=setTimeout;
 globalThis.setTimeout=(fn,delay,...args)=>delay>1000?0:savedTimer(fn,delay,...args);
 const fakeRoutes={'/fixtures/F01':'fixtures/R7_F01_RECORDED.json','/fixtures/F03':'fixtures/R7_F03_RECORDED.json','/fixtures/M3S6_UNFAMILIAR_CASES':'fixtures/M3S6_UNFAMILIAR_CASES.json'};
 globalThis.fetch=async url=>{
  const u=String(url);
  if(u==='/api/health')return {ok:true,json:async()=>({liveEnabled:false})};
  assert.ok(u in fakeRoutes,'Unexpected network dependency '+u);
  return {ok:true,json:async()=>JSON.parse(readFileSync(join(ROOT,fakeRoutes[u]),'utf8'))};
 };
 try{
  const source=readFileSync(join(ROOT,'public/app.js'),'utf8').replaceAll(/from '(\/(?:src\/[^']+|workspace-desk\.mjs))'/g,(_match,u)=>`from '${pathToFileURL(u==='/workspace-desk.mjs'?join(ROOT,'public/workspace-desk.mjs'):ROOT+u).href}'`);
  await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  await new Promise(r=>savedTimer(r,15));
  assert.match(html,/Scene 15/);
  assert.ok(listeners.click);
  for(const [id,number,day] of [['U01','47','SUNDAY 08 NOV'],['U02','62','MONDAY 09 NOV']]){
   await listeners.click({target:{closest:()=>({dataset:{unfamiliar:id}})}});
   assert.ok(html.includes('M3-S6 / FROZEN UNFAMILIAR LANGUAGE'),id);
   assert.ok(html.includes(day),id);
   assert.match(html,/AI-OFF BASELINE/);
   assert.ok(html.includes('Scene '+number),id);
   assert.match(html,/0\/2 SCENES ASSESSED FOR DETECTED CLAUSES ONLY/);
   assert.match(html,/NOT AI-EVALUATED/);
   assert.doesNotMatch(html,/98\.9% ACTIVITY|98\.5% GRANT/);
  }
 }finally{globalThis.setTimeout=savedTimer;delete globalThis.document;delete globalThis.window;delete globalThis.fetch;}
});
