/** Human-curated, source-anchored documentary relationships.
 * A model score, a graph edge or a human note never establishes legal authority.
 * Every link is audited against the ORIGINAL immutable codepoint quotation.
 */
import {createHash} from 'node:crypto';
import {assertWorkspaceSources,guard} from './production-workspace.mjs';
import {sourceFingerprint} from './permit-intelligence.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const cp=s=>Array.from(s);
const nonempty=(value,max=150)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const roles=new Set(['PERMIT','AMENDMENT','REQUEST','POLICY','CONDITION','OTHER']);
const linkKinds=new Set(['AMENDS','SUPERSEDES','REFERENCES','REQUESTS_VARIATION','CONFLICTS_WITH']);
const certifiedDate=x=>x===null||(typeof x==='string'&&/^\d{4}-\d\d-\d\d$/.test(x)&&!Number.isNaN(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().startsWith(x));
export function annotateAuthorityDocument(workspace,{documentId,role,reference,issuer,issuedOn=null,reviewer,reason}){
 guard(workspace);
 const d=workspace.documents.find(x=>x.id===documentId);
 if(!d)throw Error('Authority document does not belong to the production');
 if(!roles.has(role)||!nonempty(reference,200)||!nonempty(issuer,200)||!certifiedDate(issuedOn)||!nonempty(reviewer)||!nonempty(reason,2000))throw Error('Document authority metadata requires role, reference, issuer, valid issued date, reviewer and reason');
 d.authority={role,reference,issuer,issuedOn,reviewer,reason,sourceHash:d.sourceHash,reviewedAtRevision:d.revision,meaning:'HUMAN_RECORDED_METADATA_NOT_AUTHENTICATION',notClearance:true};
 workspace.revision++;return workspace;
}
const validSpan=(d,start,end,quote)=>Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&end>start&&end<=cp(d.text).length&&cp(d.text).slice(start,end).join('')===quote&&nonempty(quote,2000);
export function recordAuthorityLink(workspace,{fromId,toId,kind,start,end,quote,reviewer,reason}){
 guard(workspace);
 const from=workspace.documents.find(x=>x.id===fromId),to=workspace.documents.find(x=>x.id===toId);
 if(!from||!to||from.id===to.id)throw Error('Authority link must connect two different production documents');
 if(!linkKinds.has(kind)||!nonempty(reviewer)||!nonempty(reason,2000)||!validSpan(from,start,end,quote))throw Error('Authority link needs supported kind and exact source-linked quotation');
 const links=workspace.authorityLinks??=[];
 if(links.length>=1000)throw Error('Document relationship cap reached; divide this project safely');
 const identity=sha({fromId,toId,kind,sourceHash:from.sourceHash,targetHash:to.sourceHash,start,end,quote});
 if(links.some(e=>e.id===identity))throw Error('Duplicate documentary link for the same original source');
 if(['AMENDS','SUPERSEDES'].includes(kind)){
  // Cannot prove chronology or precedence, but block impossible owner-entered cycles.
  const adjacency=new Map();
  for(const e of links.filter(x=>['AMENDS','SUPERSEDES'].includes(x.kind)&&x.fromHash===workspace.documents.find(d=>d.id===x.fromId)?.sourceHash&&x.toHash===workspace.documents.find(d=>d.id===x.toId)?.sourceHash)){
   const arr=adjacency.get(e.fromId)??[];arr.push(e.toId);adjacency.set(e.fromId,arr);
  }
  const stack=[toId],seen=new Set();
  while(stack.length){const id=stack.pop();if(id===fromId)throw Error('Circular amendment/supersession relationship');if(seen.has(id))continue;seen.add(id);stack.push(...(adjacency.get(id)??[]));}
 }
 links.push({id:identity,fromId,toId,kind,start,end,quote,fromHash:from.sourceHash,toHash:to.sourceHash,
  reviewer,reason,declaredAtRevision:workspace.revision+1,state:'HUMAN_ASSERTED_UNVERIFIED',notClearance:true});
 workspace.revision++;return workspace;
}
export function assertAuthorityIntegrity(workspace){
 guard(workspace);
 const ids=new Set(),docs=new Map(workspace.documents.map(d=>[d.id,d]));
 for(const d of workspace.documents){
  const meta=d.authority;
  if(!meta)continue;
  if(!roles.has(meta.role)||!nonempty(meta.reference,200)||!nonempty(meta.issuer,200)||!certifiedDate(meta.issuedOn)||!nonempty(meta.reviewer)||!nonempty(meta.reason,2000)||meta.notClearance!==true||meta.sourceHash!==d.sourceHash||meta.reviewedAtRevision!==d.revision)throw Error('Document authority metadata stale or malformed');
 }
 for(const link of workspace.authorityLinks??[]){
  const from=docs.get(link.fromId),to=docs.get(link.toId);
  if(!from||!to||from.id===to.id||!linkKinds.has(link.kind)||!nonempty(link.reviewer)||!nonempty(link.reason,2000)||link.notClearance!==true||link.state!=='HUMAN_ASSERTED_UNVERIFIED'||(!validSpan(from,link.start,link.end,link.quote)&&link.fromHash===from.sourceHash))throw Error('Document relationship integrity failure');
  if(link.id!==sha({fromId:link.fromId,toId:link.toId,kind:link.kind,sourceHash:link.fromHash,targetHash:link.toHash,start:link.start,end:link.end,quote:link.quote})||ids.has(link.id))throw Error('Document relationship identity or duplicate failure');ids.add(link.id);
 }
 return true;
}
function current(link,docs){const a=docs.get(link.fromId),b=docs.get(link.toId);return Boolean(a&&b&&a.sourceHash===link.fromHash&&b.sourceHash===link.toHash&&validSpan(a,link.start,link.end,link.quote));}
export function projectAuthorityGraph(workspace,{offset=0,limit=60}={}){
 assertWorkspaceSources(workspace);assertAuthorityIntegrity(workspace);
 if(!Number.isSafeInteger(offset)||offset<0||offset>10000||!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('Authority graph pagination out of range');
 const docs=new Map(workspace.documents.map(d=>[d.id,d]));
 const all=(workspace.authorityLinks??[]).map(e=>({id:e.id,fromId:e.fromId,toId:e.toId,kind:e.kind,quote:e.quote,sourceRange:[e.start,e.end],
   status:current(e,docs)?'HUMAN_ASSERTED_UNVERIFIED':'STALE_ORIGINAL_SOURCE',reviewer:e.reviewer,reason:e.reason,notClearance:true}));
 const links=all.slice(offset,offset+limit);
 const active=all.filter(e=>e.status==='HUMAN_ASSERTED_UNVERIFIED');
 const warningDocuments=workspace.documents.filter(d=>!d.authority).map(d=>d.id);
 const conflicts=active.filter(e=>e.kind==='CONFLICTS_WITH');
 const amendments=active.filter(e=>e.kind==='AMENDS'||e.kind==='SUPERSEDES');
 const scenes=(workspace.callSheet?.scenes??[]).map(scene=>({sceneId:scene.id,location:scene.location,
  authorityState:'DOCUMENT_RELATIONSHIPS_REQUIRE_HUMAN_REVIEW',documentsToCheck:workspace.documents.map(d=>d.id),
  unresolvedConflicts:conflicts.length,unverifiedAmendments:amendments.length,
  note:'Do not apply one document as a scene-specific grant without verified activity, scene, date, prerequisites and operative precedence.',notClearance:true}));
 return {schema:'beforeroll-document-authority-graph-v1',workspaceId:workspace.id,workspaceRevision:workspace.revision,
  documents:workspace.documents.map(d=>({id:d.id,name:d.name,sourceHash:d.sourceHash,revision:d.revision,metadata:d.authority??null,metadataStatus:d.authority?'HUMAN_RECORDED_UNVERIFIED':'NOT_REVIEWED',notClearance:true})),
  links,scenes,summary:{links:all.length,currentLinks:active.length,staleLinks:all.length-active.length,unreviewedDocuments:warningDocuments,unverifiedAmendments:amendments.length,unresolvedConflicts:conflicts.length},
  pagination:{offset,limit,hasMore:offset+links.length<all.length},notClearance:true,
  warning:'Human-entered documentary graph, NOT legal precedence, signature authentication, grant validation, or proof that all permits have been supplied.'};
}
