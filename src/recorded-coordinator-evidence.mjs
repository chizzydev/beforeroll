import {readFile} from 'node:fs/promises';
import {validateRecordedLiteralBundle} from './coordinator-tasks.mjs';
/** Fictional public recordings only. No Downloads lookup, owner store, env or provider access. */
export async function recordedCoordinatorEvidence(){
 try{
  const [bytes,decide]=await Promise.all([
   readFile(new URL('../fixtures/audit/U01_MATCHED_EXTRACT_OWNER_RECORDED_v1.json',import.meta.url)),
   readFile(new URL('../fixtures/audit/M3S6_U01_OWNER_LIVE_EVIDENCE.json',import.meta.url))]);
  return {evidence:validateRecordedLiteralBundle(bytes,decide)};
 }catch{return {evidence:null,problem:'Recorded Extract evidence unavailable or failed integrity checks. Continue original source review; no trusted suggestions are shown.'};}
}
