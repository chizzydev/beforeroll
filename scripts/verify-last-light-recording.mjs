/** No-network integrity and actual projector preflight. No workspace mutation. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {validateLastLightRecording,LAST_LIGHT_RECORDING_SHA256} from '../src/recorded-last-light.mjs';
import {createDiscoveryExecution} from '../src/discovery-execution.mjs';
import {projectDiscovery} from '../src/core-discovery.mjs';
const b=validateLastLightRecording(await fs.readFile(new URL('../fixtures/audit/LAST_LIGHT_COMPLETE_RECORDED_v1.json',import.meta.url)),createDiscoveryExecution({directory:path.resolve('.')}));
const p=projectDiscovery(b.workspace,b.jobs);console.log(JSON.stringify({recordingSha256:LAST_LIGHT_RECORDING_SHA256,prerequisites:p.candidates.filter(c=>!c.documentaryRecord).length,documentaryInvestigations:p.candidates.filter(c=>c.documentaryRecord).length,providerRequestsNow:0,notClearance:true}));
