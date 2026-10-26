import path from 'node:path';
import {createWorkspaceStore} from '../src/workspace-store.mjs';
import {createSourceOriginalVault} from '../src/source-originals.mjs';
import {createProduction,applySourceImport} from '../src/production-workspace.mjs';
import {inspectImport} from '../src/source-intake.mjs';
const directory=path.resolve(import.meta.dirname,'../.beforeroll-data/design-acceptance'),store=createWorkspaceStore({directory}),vault=createSourceOriginalVault({directory});
if(!await store.load('design_long')){const w=createProduction({id:'design_long',title:'CONTROLLED — long exact quotation'});for(const f of [{kind:'permit',name:'long-exact-passage.txt',text:'Camera equipment must remain within the documented route; '+Array.from({length:18},(_,i)=>'condition '+(i+1)+' requires exact scene and load review before moving the camera platform; ').join('')+'no exception is established by an unsigned request.'},{kind:'callSheet',name:'long-test.csv',text:'scene,location,start,end,activity\n901,Fictional Quay,09:00,10:00,Move a camera platform through the passage\n902,Fictional Quay,10:00,11:00,Hand carry a camera'}]){const intake=inspectImport(f);applySourceImport(w,intake,{documentId:f.kind==='permit'?'LONG':null});await vault.storeImport(f,intake);}await store.persist(w,{expectedVersion:0});console.log('Generated long quotation fixture saved; no model evidence');}
