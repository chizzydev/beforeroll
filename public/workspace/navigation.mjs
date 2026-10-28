/** URL holds reading position only: no documents, credentials, decisions or shadow workspace. */
const stages=new Set(['overview','review','work','sources','scope','analysis','operations','changes','evidence','history']);
// In-page jumps must not replace #br reading state and break subsequent refresh.
export function followWorkspaceAnchor(event,root){
 const anchor=event.target?.closest?.('a[href^="#"]');
 if(anchor?.tagName!=='A')return false;
 const href=anchor.getAttribute('href');if(!href?.startsWith('#')||href.startsWith('#br?'))return false;
 event.preventDefault();const target=root.getElementById(href.slice(1));
 if(!target)return 'MISSING';
 for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
 target.tabIndex=-1;target.focus?.({preventScroll:true});target.scrollIntoView?.({block:'start'});return true;
}
export function workspaceLocation(m){
 if(!m.selected)return '';
 const task=m.sceneWorkbench?.tasks?.find(t=>t.id===m.selectedTask);
 const sourceReading=['sources','changes','scope'].includes(m.workflowStage);
 const params=new URLSearchParams({p:m.selected.workspace.id,stage:m.workflowStage,s:m.activeSceneId??'',
  doc:(sourceReading?m.focusDocumentId:task?.documentId)??'',unit:(sourceReading?m.focusUnitId:task?.unitId)??'',
  view:m.sceneView??'investigation',mode:m.sourceMode??'register',fromScene:m.sourceReturnSceneId?'1':'0'});
 if(m.recoverySpace)params.set('space',m.recoverySpace);
 return '#br?'+params.toString();
}
export async function restoreWorkspaceLocation(controller,hash){
 if(!hash?.startsWith('#br?')||hash.length>1800)return false;
 const p=new URLSearchParams(hash.slice(4)),m=controller.model;
 const id=p.get('p'),space=p.get('space')??'';
 if(!/^[\w-]{1,80}$/.test(id??'')||!stages.has(p.get('stage'))||space&&!/^[a-f0-9]{64}$/.test(space))throw Error('Invalid saved reading position');
 controller.captureDrafts();
 if(m.selected?.workspace.id!==id||m.recoverySpace!==space){
  if(controller.hasUncommittedWork())throw Error('Commit or remove uncommitted work before changing productions');
  if(!m.items.some(i=>i.id===id&&(i.recoverySpace??'')===space))throw Error('Saved production is not available in this session');
  m.recoverySpace=space;
  await controller.click({dataset:{projectOpen:id,projectSpace:space}});
 }
 if(!m.selected)throw Error('Open the production before restoring its reading position');
 m.workflowStage=p.get('stage');m.sceneView=['investigation','comparison','review','session'].includes(p.get('view'))?p.get('view'):'investigation';
 m.sourceMode=['reader','register','import','revise'].includes(p.get('mode'))?p.get('mode'):'register';
 const scene=m.selected.workspace.callSheet?.scenes.find(s=>s.id===p.get('s'));
 if(p.get('s')&&!scene)m.notice='The saved scene is no longer available. Showing a current scene; inspect its identity before reviewing.';
 m.activeSceneId=scene?.id??m.selected.workspace.callSheet?.scenes[0]?.id??null;
 const doc=m.selected.workspace.documents.find(d=>d.id===p.get('doc'));
 m.focusDocumentId=doc?.id??null;m.focusUnitId=doc?.units.find(u=>u.id===p.get('unit'))?.id??null;
 if(p.get('doc')&&!doc||p.get('unit')&&!m.focusUnitId){m.notice='The saved source passage is no longer available. Select a current original before reviewing.';m.sceneView='investigation';}
 m.sourceReturnSceneId=p.get('fromScene')==='1'?m.activeSceneId:null;
 m.sceneTaskOffset=0;m.sceneActionOffset=0;m.selectedTask=null;
 if(doc&&m.focusUnitId){
  const index=m.selected.workspace.documents.slice(0,m.selected.workspace.documents.indexOf(doc)).reduce((n,d)=>n+d.units.length,0)+doc.units.findIndex(u=>u.id===m.focusUnitId);
  m.sceneTaskOffset=Math.floor(index/40)*40;
 }
 await controller.load();if(m.error)throw Error(m.error);
 m.selectedTask=m.sceneWorkbench?.tasks.find(t=>t.documentId===m.focusDocumentId&&t.unitId===m.focusUnitId)?.id??null;
 return true;
}
