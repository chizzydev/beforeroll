/** BeforeRoll preflight engine v0.1.
 * All flags describe documentary mismatches / review questions, never legal clearance.
 * Clocked fields are untrusted suggestions until source offsets and status are checked.
 */
export const CLOCKED_STANDARD_FIELDS = {
  permit_number: 'Identifier of ISSUED location authorization, not an application identifier',
  issued_filming_location: 'Precisely named filming location allowed by the issued permit',
  issued_filming_date: 'Actual filming date covered by the issued permit',
  load_in_start: 'Time at which crew load-in begins, NOT when filming may begin',
  principal_filming_start: 'When principal photography is permitted to start',
  principal_filming_end: 'When principal photography MUST stop under the issued permit, not application request',
  amplified_sound_cutoff: 'Latest time for amplified playback in issued permit',
  equipment_clear_by: 'Final equipment removal time, NOT filming end time',
  drone_authorization_clause: 'Verbatim clause about drone permission, including negatives'
};
export const CLOCKED_VARIATION_FIELDS = {
  permit_number: 'Original issued film permit identifier',
  signed_variation_id: 'Identifier of signed and stamped authorized variation',
  variation_applicable_location: 'Location eligible for signed authorized variation',
  variation_applicable_date: 'Date that signed variation covers',
  effective_filming_end_north: 'Authorized amended filming end time for variation location, not requested email time',
  pending_request_end_south: 'Requested filming end time from pending email, not an issued authorization',
  authorized_22_south_reference: 'Identifier of an issued approval granting the pending location and time; null unless source explicitly establishes one'
};
export const EXTRACTION_INSTRUCTIONS = 'Only copy verbatim source spans with accurate offsets. Do not promote applications, draft requests or pending emails into issued authorization. Missing permissions must be null. Keep amendment location/date/time scoped to the signed variation paragraph; never infer scope from an earlier permit paragraph. No global permission judgment.';
export function extractPayload(source, profile='standard') {
  if (typeof source !== 'string' || !source.trim()) throw Error('Permit text required');
  if (!['standard','variation'].includes(profile)) throw Error('Invalid permit profile');
  return {text:source,fields:profile==='variation'?CLOCKED_VARIATION_FIELDS:CLOCKED_STANDARD_FIELDS,instructions:EXTRACTION_INSTRUCTIONS};
}
export function clockToMinutes(value) {
  if (typeof value !== 'string') return null;
  const m=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return m ? Number(m[1])*60+Number(m[2]) : null;
}
export function toTime(minutes) {
  if (!Number.isInteger(minutes)||minutes<0||minutes>=24*60) return '--:--';
  return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
}
export function normalizeLocation(s) {return typeof s === 'string'?s.trim().replace(/\s+/g,' ').toUpperCase():'';}
export function sourcePointSlice(source,start,end) {
  return Array.from(source).slice(start,end).join('');
}
const pointIndex=(source,utf16Index)=>Array.from(source.slice(0,utf16Index)).length;
export function validSpan(source, field) {
  if (!field || typeof field.value !== 'string' || !Number.isInteger(field.start) || !Number.isInteger(field.end)) return false;
  return field.start>=0 && field.end>field.start && field.end<=Array.from(source).length && sourcePointSlice(source,field.start,field.end)===field.value;
}
export function dateKey(value) {
  if (!value || typeof value!=='string') return null;
  const m=value.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
  if (!m) return null;
  const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
  const mon=String(months.indexOf(m[2].toLowerCase())+1).padStart(2,'0');
  return `${m[3]}-${mon}-${String(Number(m[1])).padStart(2,'0')}`;
}
export function parseCallSheet(source) {
  if (typeof source !== 'string') throw Error('Call sheet must be text');
  const scenes=[], unsupported=[];
  for (const m of source.matchAll(/^\s*Scene\s+([^|\r\n]+)\|\s*([^|\r\n]+)\|\s*([^|\r\n]+)\|\s*([^\r\n]*)$/gm)) {
    const row=m[0],rowStart=m.index;
    const scene=m[1].trim(),location=m[2].trim(),window=m[3].trim(),activity=m[4].trim();
    const times=/^([01]\d|2[0-3]):[0-5]\d\s*[-–]\s*([01]\d|2[0-3]):[0-5]\d$/.exec(window);
    // Compute offsets only within the own row, rather than guessing globally.
    const bounds=(value,from=0)=>{const at=row.indexOf(value,from);return at<0?null:{start:pointIndex(source,rowStart+at),end:pointIndex(source,rowStart+at+value.length)};};
    const spans={scene:bounds(scene,0),location:bounds(location,row.indexOf('|')),window:bounds(window,row.indexOf('|',row.indexOf('|')+1)),activity:bounds(activity,row.lastIndexOf('|'))};
    const bad=!times||!activity||!scene;
    scenes.push({id:`S${scene}`,number:scene,location,start:times?window.slice(0,5):'',end:times?window.slice(-5):'',activity,
      rawWindow:window,source:{start:pointIndex(source,rowStart),end:pointIndex(source,rowStart+row.length),fields:spans},edited:false,needsReview:bad});
  }
  const lines=source.split(/\r?\n/);let offset=0;
  for (const line of lines){
    if (/^\s*Scene\b/i.test(line)&&!scenes.some(s=>s.source.start>=offset && s.source.start < offset+line.length+1)){
      unsupported.push({line:line.trim(),start:pointIndex(source,offset),end:pointIndex(source,offset+line.length)});
    }
    offset+=line.length+1;
  }
  return {scenes,unsupported,format:'Explicit pipe-delimited rows only',found:scenes.length};
}
function evidence(source, field, kind='permit') {
  return {doc:kind,start:field?.start??null,end:field?.end??null,quote:field?.value??null};
}
function fieldFrom(source, fields, name, {within=null,excludeAttachment=false}={}) {
  const f=fields?.[name],hasValue=typeof f?.value==='string' && f.value.trim()!=='';
  const substringOK=hasValue&&validSpan(source,f);
  const attachmentUtf16=source.search(/^ATTACHMENT\s*-/im);
  const attachmentIndex=attachmentUtf16<0?-1:pointIndex(source,attachmentUtf16);
  const attached=excludeAttachment && attachmentIndex>=0 && f?.start >= attachmentIndex;
  const inside=within===null || (substringOK && f.start>=within.start && f.end<=within.end);
  return {value:hasValue?f.value:null,valid:Boolean(substringOK&&!attached&&inside),reason:!hasValue?'missing':!substringOK?'offset mismatch':attached?'application annex':!inside?'wrong authority paragraph':null,span:substringOK?evidence(source,f):null};
}
function firstParagraph(source, match) {
  const lines=source.split(/\r?\n/);let start=0;
  for(const line of lines) {if(match.test(line))return {start,end:start+Array.from(line).length,text:line};start+=Array.from(line).length+1;}
  return null;
}
export function permitInterpretation(source, fields, profile='standard') {
  if (profile==='variation'){
    const variationLine=firstParagraph(source,/^AUTHORIZED VARIATION\b/i);
    const get=(name,opts={})=>fieldFrom(source,fields,name,opts);
    const base=firstParagraph(source,/^Base permit\b/i);
    const baseStop=base?.text.match(/\bstop by\s+([01]\d|2[0-3]):[0-5]\d\b/i);
    const baseLoc=base?.text.match(/\bfilming at\s+(.+?)\s+on\s+\d/i);
    const baseDate=base?.text.match(/\bon\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})\b/i);
    return {profile,permitId:get('permit_number'),location:{value:baseLoc?.[1]??null,valid:Boolean(baseLoc),reason:baseLoc?'deterministic base-permit quote':'missing',span:baseLoc&&base?{doc:'permit',start:base.start+pointIndex(base.text,base.text.indexOf(baseLoc[1])),end:base.start+pointIndex(base.text,base.text.indexOf(baseLoc[1]))+baseLoc[1].length,quote:baseLoc[1]}:null},
      date:{value:baseDate?.[1]??null,valid:Boolean(baseDate),span:baseDate&&base?{doc:'permit',start:base.start+pointIndex(base.text,base.text.indexOf(baseDate[1])),end:base.start+pointIndex(base.text,base.text.indexOf(baseDate[1]))+baseDate[1].length,quote:baseDate[1]}:null},
      start:{value:null,valid:false,reason:'not extracted'},end:{value:baseStop?.[0]?.match(/\d\d:\d\d/)?.[0]??null,valid:Boolean(baseStop),reason:baseStop?'deterministic base-permit quote':'missing',span:baseStop&&base?{doc:'permit',start:base.start+pointIndex(base.text,base.text.indexOf(baseStop[1])),end:base.start+pointIndex(base.text,base.text.indexOf(baseStop[1]))+5,quote:baseStop[1]}:null},
      sound:{value:null,valid:false,reason:'not stated'},drone:{value:null,valid:false,reason:'not stated'},equipment:{value:null,valid:false,reason:'not extracted'},
      variation:{id:get('signed_variation_id',{within:variationLine}),location:get('variation_applicable_location',{within:variationLine}),date:get('variation_applicable_date',{within:variationLine}),end:get('effective_filming_end_north',{within:variationLine}),pendingSouth:get('pending_request_end_south'),southAuthorization:get('authorized_22_south_reference')},
      variationParagraph:variationLine,
      label:'Amended packet — scope requires review if citations are unlinked'};
  }
  const get=name=>fieldFrom(source,fields,name,{excludeAttachment:true});
  return {profile,permitId:get('permit_number'),location:get('issued_filming_location'),date:get('issued_filming_date'),start:get('principal_filming_start'),end:get('principal_filming_end'),sound:get('amplified_sound_cutoff'),drone:get('drone_authorization_clause'),equipment:get('equipment_clear_by'),variation:null,label:'Issued-terms reading'};
}
function buildFinding(scene,code,severity,title,detail,permitSpan,sceneField='window'){
  return {id:`${scene.id}:${code}`,sceneId:scene.id,code,severity,title,detail,evidence:{permit:permitSpan??null,scene:scene.source?.fields?.[sceneField] ? {...scene.source.fields[sceneField],doc:'call sheet',quote:null}: {doc:'call sheet',start:scene.source?.start??null,end:scene.source?.end??null}},reviewed:false};
}
function isAmplified(activity) {
  const a=String(activity??'');
  return /\bamplified\b|\bPA\s+playback\b|\bloudspeaker\b/i.test(a) && !/\bno\s+(?:amplified\s+)?playback\b|\bno\s+amplified\b|\bwithout\s+amplification\b/i.test(a);
}
function hasMusicUncertain(activity){
  const a=String(activity??'');
  return /\bmusic\b|\bplayback\b/i.test(a) && !/\bno\s+(?:amplified\s+)?playback\b|\bno\s+music\b|\bwithout\s+music\b/i.test(a) && !isAmplified(a);
}
export function evaluatePreflight({permitText,callSheetText,fields,profile='standard',scenes:overrideScenes=null,manualFields={}}) {
  const parsed=parseCallSheet(callSheetText);
  const scenes=overrideScenes??parsed.scenes;
  const terms=permitInterpretation(permitText,fields,profile);
  const reviewedTerms={...terms};
  for (const [k,v] of Object.entries(manualFields)) if(['location','date','start','end','sound','drone'].includes(k)) {
    // Explicit manual inputs have no source proof; always flagged for independent review.
    reviewedTerms[k]={value:v,valid:typeof v==='string'&&v.trim()!=='',reason:'human-entered — no source citation',span:null,manual:true};
  }
  const findings=[];
  const dateMismatch=reviewedTerms.date.valid && dateKey(reviewedTerms.date.value)&&dateKey(reviewedTerms.date.value)!==dateKey(callSheetText);
  const callSheetDate=dateKey(callSheetText);
  const scopeDateTrusted=Boolean(callSheetDate && reviewedTerms.date.valid && !reviewedTerms.date.manual && dateKey(reviewedTerms.date.value)===callSheetDate);
  const permitCorrectionsPresent=Object.keys(manualFields).length>0;
  for (const scene of scenes){
    const add=(code,severity,title,detail,p=null,field='window')=>{
      const conditional=severity==='issue'&&(!scopeDateTrusted||permitCorrectionsPresent);
      return findings.push(buildFinding(scene,code,conditional?'review':severity,
        conditional?'Conditional: '+title:title,
        conditional?'Date/authority scope or manually edited permit terms require confirmation. '+detail:detail,p,field));
    };
    const start=clockToMinutes(scene.start),end=clockToMinutes(scene.end);
    if (scene.needsReview||start===null||end===null||end<=start||!normalizeLocation(scene.location))add('SCENE_INCOMPLETE','review','Scene row needs correction','Scene values must be complete, within a single row, and use 24-hour local times.');
    if(scene.edited)add('MANUAL_ROW','review','Corrected scene needs sign-off','A crew member edited this row. The original source remains available, but corrected values are not source quotations.');
    if(Object.keys(manualFields).length) add('MANUAL_TERM','review','Manual permit reading must be confirmed','One or more permit facts were manually changed; these values lack verified issued-source citations.');
    if(/(?:coordinator\s+(?:sign-off|review)|production\s+approval)\s*:\s*PENDING/i.test(callSheetText)) add('SIGNOFF_PENDING','review','Call-sheet coordinator sign-off is pending','The source document records pending production sign-off. This is not film-office permit approval.');
    if(dateMismatch)add('DATE_SCOPE','review','Filming date differs from issued record',`Day sheet (${callSheetDate??'unknown'}) differs from extracted permit date (${dateKey(reviewedTerms.date.value)}).`,reviewedTerms.date.span,'scene');
    else if(!callSheetDate||!reviewedTerms.date.valid)add('DATE_UNKNOWN','review','Date authority not established','Confirm that the issued conditions apply to this shoot date.',reviewedTerms.date.span,'scene');
    const loc=normalizeLocation(scene.location),allowed=normalizeLocation(reviewedTerms.location.value);
    if(loc&&allowed && reviewedTerms.location.valid && loc!==allowed){
      const explicitlyExcluded=permitText.toUpperCase().includes(`${loc} IS EXCLUDED`) || new RegExp(`\\b${loc.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s+IS\\s+EXCLUDED\\b`,'i').test(permitText);
      add('LOCATION',explicitlyExcluded?'issue':'review','Location outside stated scope',`Scene uses ${scene.location}; documented base permit scope is ${reviewedTerms.location.value}. ${explicitlyExcluded?'Location is explicitly excluded.':'Permission for this location is not established in the supplied terms.'}`,reviewedTerms.location.span,'location');
    } else if(!reviewedTerms.location.valid) add('LOCATION_UNKNOWN','review','Location scope requires source review','No trustworthy issued location reading is available.',reviewedTerms.location.span,'location');
    let effectiveEnd=reviewedTerms.end;
    let variationUncertain=false;
    let candidateEnd=null;
    let candidateMinutes=null;
    // Never apply a base-permit time to a location outside the stated base scope.
    const baseLocationMatches=loc&&reviewedTerms.location.valid&&loc===allowed;
    if(terms.variation&&baseLocationMatches){
      const v=terms.variation;
      const candidateLocationMatches=normalizeLocation(v.location.value)===loc;
      const candidateDateMatches=dateKey(v.date.value)===callSheetDate;
      if(candidateLocationMatches && candidateDateMatches && v.end.value){
        if(v.location.valid&&v.date.valid&&v.end.valid) effectiveEnd=v.end;
        else {
          variationUncertain=true;
          candidateEnd=v.end;
          candidateMinutes=clockToMinutes(v.end.value);
          add('VARIATION_SCOPE','review','Variation cannot be applied automatically','A signed extension is described, but its scope citations point outside the signed-variation paragraph. Confirm authority before scheduling beyond the base deadline.',v.end.span,'scene');
        }
      }
    }
    const endLimit=clockToMinutes(effectiveEnd.value),startLimit=clockToMinutes(reviewedTerms.start.value);
    if(baseLocationMatches && end!==null && endLimit!==null && effectiveEnd.valid && end>endLimit){
      if(variationUncertain && candidateMinutes!==null && end<=candidateMinutes){
        // The apparent overrun would disappear if the candidate signed variation is indeed applicable.
        // Keep it an unresolved authority question rather than a documentary violation.
      } else if(variationUncertain && candidateMinutes!==null && end>candidateMinutes){
        add('OVER_VARIATION','issue',`Scene exceeds even the proposed ${candidateEnd.value} variation limit`,`Scene ends at ${scene.end}, later than the recorded variation's ${candidateEnd.value} endpoint. Variation authority still requires review.`,candidateEnd.span);
      } else {
        add('OVER_TIME','issue',`Filming exceeds documented ${effectiveEnd.value} cutoff`,`${scene.number} finishes at ${scene.end}, ${end-endLimit} minutes after the stated filming cutoff.`,effectiveEnd.span);
      }
    } else if((baseLocationMatches || !reviewedTerms.location.valid) && end!==null && (!effectiveEnd.valid || endLimit===null))add('END_UNKNOWN','review','Filming deadline not source-backed','No trusted time-limit evidence is available; do not interpret this as unrestricted filming.',effectiveEnd.span);
    if(baseLocationMatches&&start!==null&&startLimit!==null&&reviewedTerms.start.valid&&start<startLimit)add('EARLY','issue','Photography begins before documented window',`Scene begins at ${scene.start}; issued start is ${reviewedTerms.start.value}.`,reviewedTerms.start.span);
    const soundLimit=clockToMinutes(reviewedTerms.sound.value);
    if(isAmplified(scene.activity) && end!==null){
      if (reviewedTerms.sound.valid && soundLimit !== null) {
        // A verified cutoff exists: an in-window scene is NOT an unknown-authorization case.
        if (end > soundLimit) add('SOUND','issue',`Amplified playback crosses ${reviewedTerms.sound.value}`,`Scene has amplified playback through ${scene.end}; source says playback must cease by ${reviewedTerms.sound.value}.`,reviewedTerms.sound.span,'activity');
      } else {
        add('SOUND_UNKNOWN','review','Amplified playback authorization unknown','No trustworthy amplified sound cutoff appears in the extracted terms.',reviewedTerms.sound.span,'activity');
      }
    }else if(hasMusicUncertain(scene.activity))add('SOUND_CLASSIFY','review','Clarify whether sound is amplified','Music or playback is mentioned without sufficient detail to apply the amplified-playback rule.',reviewedTerms.sound.span,'activity');
    if(/\bdrone\b/i.test(scene.activity)){
      if(reviewedTerms.drone.valid&&/\bnot\s+authori[sz]ed\b|\bprohibited\b|\bno\s+drone\b/i.test(reviewedTerms.drone.value))add('DRONE','issue','Drone activity explicitly not authorized','Scene proposes a drone shot; the issued text expressly says it is not authorized.',reviewedTerms.drone.span,'activity');
      else add('DRONE_UNKNOWN','review','Drone authorization must be verified','Supplied issued terms do not establish a verified drone permission.',reviewedTerms.drone.span,'activity');
    }
  }
  return {scenes,terms:reviewedTerms,findings,unsupported:parsed.unsupported,summary:{issues:findings.filter(x=>x.severity==='issue').length,reviews:findings.filter(x=>x.severity==='review').length,scenes:scenes.length,sourceRows:parsed.found,unsupportedRows:parsed.unsupported.length},note:'Documentary preflight only: never use as legal authorization or clearance.'};
}
