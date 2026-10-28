import test from 'node:test';
import assert from 'node:assert/strict';
import {actionHeading,actionContext,actionSource} from '../public/workspace/action-presentation.mjs';
import {readable,countLabel} from '../public/workspace/presentation.mjs';
import {workView} from '../public/workspace/work-view.mjs';
import {overviewView} from '../public/workspace/overview-view.mjs';
import {picker} from '../public/workspace/shell.mjs';

const model={overview:{documents:[{id:'P',units:[{id:'U002',text:'The wheeled carriage is restricted.'},{id:'U003',text:'A distinct addendum may apply only to Scene 47.'}]}]},actionQueue:{actions:[],pagination:{offset:0,hasMore:false},total:0,filteredTotal:0},actionKind:'ALL'};
test('work items retain exact source identity while distinctly describing repeated reviews',()=>{
 const a={code:'REVIEW_EXACT_SOURCE_TASK',sceneId:'S47',documentId:'P',unitId:'U002',category:'HUMAN',subject:'S47: source finding awaits human review',detail:'Inspect original',taskId:'original-task',globalTaskIndex:4,sceneTaskIndex:4,route:'review'};
 const b={...a,unitId:'U003',taskId:'next-task',globalTaskIndex:5,sceneTaskIndex:5};
 assert.notEqual(actionHeading(a),actionHeading(b));
 const html=workView({...model,actionQueue:{...model.actionQueue,actions:[a,b],total:2,filteredTotal:2}});
 assert.match(html,/Scene 47 · Review passage U002/);
 assert.match(html,/Scene 47 · Review passage U003/);
 assert.match(html,/The wheeled carriage is restricted/);
 assert.match(html,/A distinct addendum may apply only to Scene 47/);
 assert.match(html,/data-action-task="original-task"/);
 assert.match(html,/data-action-task="next-task"/);
 assert.match(html,/data-action-global="5"/);
});
test('model-only grant scope refers only to the exact clause, not the whole scene',()=>{
 const action={code:'MODEL_ONLY_NEEDS_DOCUMENTARY_SCOPE',sceneId:'S47',documentId:'P',unitId:'U002',category:'HUMAN'};
 assert.match(actionHeading(action),/passage U002/);
 assert.match(actionContext(model,action),/This clause only · not a scene-wide finding/);
 assert.equal(actionSource(model,action),'The wheeled carriage is restricted.');
 assert(!actionHeading(action).includes('without human documentary basis'));
});
test('source excerpts are escaped and original text is never mutated',()=>{
 const attack='<script>alert(1)</script>';
 const a={sceneId:'S48',documentId:'P',unitId:'U004',category:'HUMAN',sourceQuote:attack};
 assert.match(actionContext(model,a),/&lt;script&gt;/);
 assert(!actionContext(model,a).includes('<script>'));
 assert.equal(a.sourceQuote,attack);
});
test('count labels and underscore enum descriptions have correct readable grammar',()=>{
 assert.equal(countLabel(1,'document'),'1 document');
 assert.equal(countLabel(2,'document'),'2 documents');
 assert.equal(countLabel(0,'scene'),'0 scenes');
 assert.equal(readable('S47: human follow-up NEEDS_SOURCE'),'S47: human follow-up Needs original source');
});
test('overview distinguishes a clause-scoped action with accurate document plurality',()=>{
 const selected={version:1,workspace:{id:'case',title:'Test',documents:[{id:'P'}],callSheet:{scenes:[{id:'S47'}]}}};
 const m={...model,selected,dossier:{counts:{completedModelChecks:0,currentReviewedTasks:0}},actionQueue:{actions:[{sceneId:'S47',code:'MODEL_ONLY_NEEDS_DOCUMENTARY_SCOPE',subject:'S47: model-positive claim without human documentary basis',detail:'Original review needed',documentId:'P',unitId:'U002',category:'HUMAN'}]},overview:{...model.overview,scenes:[{id:'S47',activity:'wheeled dolly',start:'10:00',end:'10:25',location:'Archive'}],plannedCalls:1},sceneWorkbench:{tasks:[]}};
 const html=overviewView(m);
 assert.match(html,/1 document · 1 scene/);
 assert.match(html,/This clause only · not a scene-wide finding/);
 assert.doesNotMatch(html,/1 documents/);
});
test('production picker separates switching from creating and preserves existing controller targets',()=>{
 const html=picker({items:[{id:'p',title:'Example',sceneCount:1,documentCount:2}],evaluationMode:false});
 assert.match(html,/picker-columns/);
 assert.match(html,/1 scene · 2 documents/);
 for(const expected of ['design-production-search','project-id','project-title','project-create','data-project-open="p"'])assert(html.includes(expected));
});

test('new source-aware work module remains served by explicit CSP asset allowlist',async()=>{
 const {createAppServer}=await import('../server.mjs');
 const server=createAppServer({enabled:false});
 await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',err=>err?reject(err):resolve()));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const response=await fetch(base+'/workspace/action-presentation.mjs');
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),/javascript/);
  assert.match(response.headers.get('content-security-policy'),/default-src 'none'/);
  assert.match(await response.text(),/actionHeading/);
  assert.equal((await fetch(base+'/.env')).status,404);
 } finally {await new Promise(resolve=>server.close(resolve));}
});
