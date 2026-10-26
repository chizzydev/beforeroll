import {shell,unlock,evidenceNav,recoveryView} from './shell.mjs';
import {overviewView} from './overview-view.mjs';
import {sceneView} from './scene-view.mjs';
import {sourcesView} from './sources-view.mjs';
import {workView} from './work-view.mjs';
import {authorityView} from './authority-view.mjs';
import {operationsView} from './operations-view.mjs';
import {analysisView} from './analysis-view.mjs';
import {exportView} from './export-view.mjs';
import {historyView} from './history-view.mjs';
import {title,go} from './presentation.mjs';
export function productionView(model){
 if(model.authLocked)return unlock(model);
 let content;
 if(model.recoveryExpanded&&!model.evaluationMode&&model.recoveryView)content=recoveryView(model);
 else if(!model.selected||model.workflowStage==='overview')content=overviewView(model);
 else switch(model.workflowStage){
  case 'review':content=sceneView(model);break;
  case 'work':content=workView(model);break;
  case 'operations':content=`<section class="wide-content">${title('Production work','Dates and conditions.')}<div class="actions">${go('Back to work','work','text-button')}</div>${operationsView(model)}</section>`;break;
  case 'analysis':content=`<section class="wide-content">${title('Clocked source checks','Inspect scope before analysis.')}<div class="actions">${go('Back to scenes','review','text-button')}${go('Production work','work','text-button')}</div>${analysisView(model)}</section>`;break;
  case 'scope':content=`<section class="wide-content">${evidenceNav(model)}${title('Documentary scope','Original words. Explicit human claims.')}${authorityView(model)}</section>`;break;
  case 'history':content=`<section class="wide-content">${evidenceNav(model)}${title('Evidence history','What was recorded, and against what.')}${historyView(model)}</section>`;break;
  case 'evidence':content=`<section class="wide-content">${evidenceNav(model)}${title('Evidence exports','Keep the work and its evidence together.')}${exportView(model)}${model.evaluationMode?'':`<button type="button" data-design-action="recover" class="text-button">Recover a separate production ↗</button>`}<details><summary>Earlier research evidence and method</summary><p>Separate historical experiments remain available with their original contract and scope labels.</p><button type="button" data-tab="desk">Open historical research replay</button></details></section>`;break;
  default:content=`${evidenceNav(model)}${sourcesView(model)}`;
 }
 return shell(model,content);
}
