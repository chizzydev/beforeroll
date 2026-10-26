/** Cross-destination capability assertions replacing the former hidden-all-panels DOM.
 * Browser acceptance separately proves actual navigation/interaction. This helper
 * renders real views; it does not mock evidence or controller operations.
 */
import {productionView as view} from '../../public/workspace-desk.mjs';
export function productionView(model){
 if(model.authLocked||!model.selected)return view({...model,pickerOpen:true});
 const states=[['overview',{pickerOpen:true}],['work',{}],['sources',{}],['sources',{sourceMode:'import',intakeKind:'permit'}],['sources',{sourceMode:'import',intakeKind:'call'}],['sources',{sourceMode:'import',intakeKind:'reviewed'}],['sources',{sourceMode:'reader',focusDocumentId:model.overview?.documents?.[0]?.id}],['scope',{}],['operations',{}],['analysis',{}],['changes',{sourceMode:'revise'}],['evidence',{}],['history',{}],['review',{sceneView:'investigation'}],['review',{sceneView:'review'}],['review',{sceneView:'session'}]];
 return states.map(([workflowStage,extra])=>view({...model,workflowStage,...extra})).join('\n');
}
