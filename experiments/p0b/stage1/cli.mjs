import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {verifyFrozen, verifyRunner} from './freeze.mjs';
import {runtimeCredential} from './credential.mjs';
import {executeStage1, OWNER_DIRECTORY} from './runner.mjs';
import {inspectExecution} from './report.mjs';
import {exists} from './store.mjs';
import {createLiveTransport} from './transport.mjs';

export async function main(args = process.argv.slice(2)) {
  const command = args.join(' ');
  if (!['', '--verify', '--report', '--live --acknowledge-four-one-shot-requests'].includes(command)) throw Error('COMMAND_REJECTED');
  if (command === '--report') {
    console.log(JSON.stringify(await inspectExecution(OWNER_DIRECTORY), null, 2)); return;
  }
  const runner = await verifyRunner(), verified = await verifyFrozen();
  if (!command || command === '--verify') {
    console.log(JSON.stringify({status: 'VERIFIED_NOT_DISPATCHED', probes: 4, lane: 'C_ONLY',
      stage0: verified.manifest.requestContractFingerprint, runner: runner.sourceFingerprint,
      permanentFencePresent: await exists(OWNER_DIRECTORY), credentialsRead: false, requests: 0}, null, 2)); return;
  }
  if (await exists(OWNER_DIRECTORY)) throw Error('EXECUTION_ALREADY_EXISTS_OR_UNWRITABLE');
  const credential = await runtimeCredential(verified.root);
  const result = await executeStage1({verified, credential, transport: createLiveTransport(),
    origin: 'OWNER_EXECUTED_LIVE_CLOCKED_STAGE1', runnerFingerprint: runner.sourceFingerprint});
  // Never print raw provider data, request headers, credentials, or exception stacks.
  console.log(JSON.stringify({status: result.status, intents: result.intentCount,
    accepted: result.acceptedCount, package: OWNER_DIRECTORY, retryAllowed: false}, null, 2));
  if (result.acceptedCount !== 4) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    const known = new Set(['COMMAND_REJECTED', 'CREDENTIAL_UNAVAILABLE', 'EXECUTION_ALREADY_EXISTS_OR_UNWRITABLE',
      'FROZEN_ARTIFACT_MISMATCH', 'FROZEN_SOURCE_MISMATCH', 'FROZEN_IDENTITY_MISMATCH', 'RUNNER_SOURCE_MISMATCH',
      'RUNNER_MANIFEST_MISMATCH', 'EVENT_CHAIN_INVALID', 'RESPONSE_INTEGRITY_FAILURE', 'OUTCOME_INTEGRITY_FAILURE',
      'INTENT_INTEGRITY_FAILURE', 'FINAL_REPORT_INTEGRITY_FAILURE', 'PACKAGE_INTEGRITY_FAILURE']);
    console.error(known.has(error.message) ? error.message : 'STAGE1_STOPPED_STORAGE_OR_INTEGRITY_UNCERTAIN');
    console.error('No automatic retry. If the execution fence exists, preserve it and use --report; do not delete, move or reset it.');
    process.exitCode = 1;
  });
}
