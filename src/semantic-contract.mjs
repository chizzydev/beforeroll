// Shared browser-and-server Clocked Decide request contract; no Node-only dependencies.
export function decideSemanticPayload(clause,scene){
 if(typeof clause!=='string'||clause.length<25||clause.length>1800)throw Error('Clause size out of bounds');
 if(typeof scene!=='string'||scene.length<15||scene.length>1000)throw Error('Scene size out of bounds');
 return {
  state:`SOURCE CLAUSE (one selected excerpt, not authenticated):\n${clause}\n\nPROPOSED SCENE (one exact source row):\n${scene}\n\nAssess only whether these two texts describe operationally related activities. Never decide official legal clearance.`,
  questions:{
   activity_link:{type:'noul',instructions:'Does the SCENE describe an activity governed by an operational restriction, written-approval prerequisite, or conditional permission actually stated in SOURCE CLAUSE? Make the semantic connection even if the scene and clause use different words. Do not infer permission or invent unstated facts. Answer on this clause and scene only.',criteria:{true:'The scene activity is materially covered by the operative activity category stated in this exact clause, including valid paraphrases.',false:'The scene is not covered by this clause, or there is too little evidence to establish a relationship. Generic matching location names alone is insufficient.'}},
   granted_for_scene:{type:'noul',instructions:'Does THIS SOURCE CLAUSE explicitly say issued/signed permission is GRANTED for this particular scene activity and scope (scene/location/date if stated), rather than just requested or conditioned on missing approval? Do not assume an artifact is genuine; only assess what this clause says.',criteria:{true:'The source clause directly states a grant for the specific scene/activity; scoped conditions may still require human verification.',false:'The clause prohibits it, requires approval without supplying it, mentions only pending requests, or does not establish a specific issued grant.'}}
  }
 };
}
