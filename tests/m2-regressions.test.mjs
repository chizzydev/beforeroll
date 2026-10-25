import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {once} from 'node:events';
import {evaluatePreflight,parseCallSheet} from '../src/engine.mjs';
import {createAppServer} from '../server.mjs';
const fixture = JSON.parse(readFileSync(new URL('../fixtures/R7_F01_RECORDED.json',import.meta.url)));
const call = JSON.parse(readFileSync(new URL('../fixtures/R7_F03_RECORDED.json',import.meta.url))).source;
const review = (end, fields = fixture.fields) => {
  const scenes = parseCallSheet(call).scenes;
  const s15 = scenes.find(s=>s.number==='15');
  s15.end=end;
  s15.edited=true;
  return evaluatePreflight({permitText:fixture.source,callSheetText:call,fields,scenes});
};
test('M2 FIX: 16:10 human-corrected amplified scene is within trusted 16:15 cutoff, not unknown',()=>{
 const result=review('16:10');
 const codes=result.findings.filter(x=>x.sceneId==='S15').map(x=>x.code);
 assert.ok(codes.includes('MANUAL_ROW'));
 assert.ok(codes.includes('SIGNOFF_PENDING'));
 assert.ok(!codes.includes('SOUND_UNKNOWN'),'verified 16:15 is known, not an unknown authorization');
 assert.ok(!codes.includes('SOUND'));
 assert.ok(!codes.includes('OVER_TIME'));
});
test('M2: changing end to 16:20 correctly reports amplified-playback breach',()=>{
 const result=review('16:20');
 const codes=result.findings.filter(x=>x.sceneId==='S15').map(x=>x.code);
 assert.ok(codes.includes('SOUND'));
 assert.ok(!codes.includes('SOUND_UNKNOWN'));
 assert.ok(!codes.includes('OVER_TIME'));
});
test('M2: missing or non-source-backed sound cutoff remains unresolved',()=>{
 const fields=structuredClone(fixture.fields);
 fields.amplified_sound_cutoff={value:null,start:null,end:null};
 const result=review('16:10',fields);
 assert.ok(result.findings.some(x=>x.sceneId==='S15'&&x.code==='SOUND_UNKNOWN'&&x.severity==='review'));
});
test('M2: evidence inspector badge and narrative are conditional on verified citations',()=>{
 const js=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(js,/SCENE SOURCE ONLY/);
 assert.match(js,/PERMIT \+ SCENE LINKED/);
 assert.match(js,/CITATION UNVERIFIED/);
 assert.doesNotMatch(js,/<span class="roundcount">SOURCE-LINKED<\/span>/);
 assert.match(js,/Evidence class: \$\{citationClass\}/);
});
test('M2: mock live transport requires operator gate, posts Clocked Extract payload, and keeps API key server-side',async()=>{
 let calls=0;
 const server=createAppServer({enabled:true,apiKey:'local-test-key-not-real',operatorToken:'operator-test-value',fetchImpl:async(url,opts)=>{
  calls++;
  assert.equal(url,'https://clocked.rezolve.ai/clocked/extract');
  assert.equal(opts.headers.Authorization,'Bearer local-test-key-not-real');
  const payload=JSON.parse(opts.body);
  assert.equal(payload.text,fixture.source);
  assert.ok(payload.fields.principal_filming_end);
  return new Response(JSON.stringify({fields:fixture.fields}),{status:200,headers:{'Content-Type':'application/json','x-clocked-credits':'5'}});
 }});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{
  const base=`http://127.0.0.1:${server.address().port}`;
  const health=await (await fetch(base+'/api/health')).json();
  assert.equal(health.liveEnabled,true);
  assert.ok(!JSON.stringify(health).includes('test-key'));
  const authFail=await fetch(base+'/api/extract',{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':'incorrect'},body:JSON.stringify({text:fixture.source,profile:'standard'})});
  assert.equal(authFail.status,401);assert.equal(calls,0);
  const good=await fetch(base+'/api/extract',{method:'POST',headers:{'Content-Type':'application/json','X-Operator-Token':'operator-test-value'},body:JSON.stringify({text:fixture.source,profile:'standard'})});
  assert.equal(good.status,200);
  const data=await good.json();
  assert.equal(data.source,'live-clocked');assert.equal(data.credits,5);
  assert.equal(data.fields.principal_filming_end.value,'17:00');
  assert.equal(calls,1);
  assert.ok(!JSON.stringify(data).includes('local-test-key'));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
