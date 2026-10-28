import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256, fingerprint, freeze, CONTRACT_FINGERPRINT, CONTRACT} from '../contract.mjs';
import {BASELINE, BASELINE_FINGERPRINT} from '../baseline.mjs';
import {assertTask} from '../tasks.mjs';

export const REPOSITORY = fileURLToPath(new URL('../../../', import.meta.url));
// Raw-file trust anchors from the accepted Stage 0, not recomputed from mutable manifests.
export const ANCHORS = freeze({
  'manifest.json': '8a5d80f0835ddfada064063ee92cb165cd396d1080acdce98d719c31279226da',
  'contract.json': '8550e9de1373af94812bdab273a05fe04bba93c7d847a9be9a2ab4b03791f0b4',
  'baseline.json': '4c8b3859f64ebf068d92819d8d69323e6286692ae77f34b505410db0a0320b87',
  'development-probes.json': '9d0ce7354a7ffa77cb0d6d4e715967e6305fb7abf195404ac8b1757fb023603f',
  'index.html': 'bb8a4e2512bf2f148434b174bbfbebb5e07e1d68f8ed5eced58f33df088c69ed',
});
const verifiedPackages = new WeakSet();
export async function verifyFrozen(root = REPOSITORY) {
  const artifacts = {};
  for (const [name, hash] of Object.entries(ANCHORS)) {
    const bytes = await readFile(resolve(root, 'experiments/p0b/prepared', name));
    if (sha256(bytes) !== hash) throw Error('FROZEN_ARTIFACT_MISMATCH');
    if (name.endsWith('.json')) artifacts[name] = JSON.parse(bytes.toString('utf8'));
  }
  const manifest = artifacts['manifest.json'], preparation = artifacts['development-probes.json'];
  for (const [name, hash] of Object.entries(manifest.sourceFiles)) {
    if (sha256(await readFile(resolve(root, name))) !== hash) throw Error('FROZEN_SOURCE_MISMATCH');
  }
  if (fingerprint(manifest.sourceFiles) !== manifest.harnessSourceFingerprint ||
      fingerprint(preparation) !== manifest.preparationFingerprint ||
      fingerprint(artifacts['contract.json']) !== CONTRACT_FINGERPRINT ||
      fingerprint(CONTRACT) !== manifest.requestContractFingerprint ||
      fingerprint(artifacts['baseline.json']) !== BASELINE_FINGERPRINT ||
      fingerprint(BASELINE) !== manifest.baselineConfigurationFingerprint) throw Error('FROZEN_IDENTITY_MISMATCH');
  if (preparation.tasks.length !== 4 || manifest.probes.length !== 4) throw Error('FOUR_PROBES_REQUIRED');
  for (const [i, task] of preparation.tasks.entries()) {
    assertTask(task);
    const identity = {taskId: task.taskId, sceneId: task.binding.sceneId,
      unitId: task.binding.unitId, requestHashes: task.requestHashes};
    if (fingerprint(identity) !== fingerprint(manifest.probes[i]) ||
        sha256(JSON.stringify(task.requests.C)) !== task.requestHashes.C ||
        sha256(JSON.stringify(task.requests.B)) !== task.requestHashes.B) throw Error('FROZEN_REQUEST_MISMATCH');
  }
  const verified = freeze({root: resolve(root), manifest, preparation});
  verifiedPackages.add(verified); return verified;
}
export function assertVerified(value) {
  if (!verifiedPackages.has(value)) throw Error('VERIFIED_PACKAGE_REQUIRED');
}
export async function verifyRunner() {
  const manifest = JSON.parse(await readFile(new URL('./runner-manifest.json', import.meta.url), 'utf8'));
  if (fingerprint(manifest.files) !== manifest.sourceFingerprint) throw Error('RUNNER_MANIFEST_MISMATCH');
  for (const [name, hash] of Object.entries(manifest.files)) {
    if (!/^[\w.-]+$/.test(name) || sha256(await readFile(new URL(name, import.meta.url))) !== hash) throw Error('RUNNER_SOURCE_MISMATCH');
  }
  return manifest;
}
