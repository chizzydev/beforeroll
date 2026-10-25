import test from 'node:test';import assert from 'node:assert/strict';import {once} from 'node:events';import {createAppServer} from '../server.mjs';
let server,base;
test.before(async()=>{server=createAppServer();server.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}`;});
test.after(()=>server.close());
test('recorded fixture route returns actual owner-run synthetic response',async()=>{const r=await fetch(base+'/fixtures/F01');assert.equal(r.status,200);const d=await r.json();assert.equal(d.fields.principal_filming_end.value,'17:00');assert.equal(d.origin.includes('real Clocked API'),true);});
test('no key in health metadata and live is off by default',async()=>{const r=await fetch(base+'/api/health');const b=await r.json();assert.equal(b.liveEnabled,false);assert.equal(JSON.stringify(b).includes('CLOCKED_API_KEY'),false);});
test('unconfigured API cannot spend credits',async()=>{const r=await fetch(base+'/api/extract',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'test'})});assert.equal(r.status,503);});
test('no arbitrary static path traversal',async()=>{const r=await fetch(base+'/server.mjs');assert.equal(r.status,404);});
test('CSP and no-cache are present',async()=>{const r=await fetch(base+'/');assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/default-src 'none'/);assert.equal(r.headers.get('cache-control'),'no-store');});

test('CSP-safe timetable helper is served as a first-party module', async()=>{
 const server=createAppServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const address=server.address();
  const res=await fetch(`http://127.0.0.1:${address.port}/src/timeline.mjs`);
  assert.equal(res.status,200);
  assert.match(await res.text(),/export function timelineGeometry/);
  assert.match(res.headers.get('content-security-policy'),/style-src 'self'/);
 }finally{await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));}
});
