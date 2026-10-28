// No dispatch command exists. No .env, SDK, server, owner store or recorded-response reader.
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {prepareDevelopment} from './development.mjs';
import {CONTRACT, CONTRACT_FINGERPRINT, sha256, fingerprint} from './contract.mjs';
import {BASELINE, BASELINE_FINGERPRINT} from './baseline.mjs';
import {renderPreparation} from './view.mjs';
if (process.argv.length !== 2) throw Error('Stage 0 accepts no arguments, inputs, credentials or dispatch flags');
const root = new URL('./', import.meta.url);
const names = (await readdir(root)).filter(n => n.endsWith('.mjs')).sort();
const dependencies = ['src/intelligence-workflow.mjs', 'src/permit-intelligence.mjs', 'src/engine.mjs'];
const files = {};
for (const name of names) files[`experiments/p0b/${name}`] = sha256(await readFile(new URL(name, root), 'utf8'));
for (const name of dependencies) files[name] = sha256(await readFile(new URL(`../../${name}`, root), 'utf8'));
const preparation = await prepareDevelopment();
const manifest = {stage: 0, status: 'FROZEN_PREPARED_NOT_DISPATCHED',
  requestContractFingerprint: CONTRACT_FINGERPRINT, baselineConfigurationFingerprint: BASELINE_FINGERPRINT,
  baselineImplementationFingerprint: files['experiments/p0b/baseline.mjs'],
  sourceFiles: files, harnessSourceFingerprint: fingerprint(files),
  preparationFingerprint: fingerprint(preparation),
  probes: preparation.tasks.map(t => ({taskId: t.taskId, sceneId: t.binding.sceneId,
    unitId: t.binding.unitId, requestHashes: t.requestHashes})),
  calls: 0, credits: 0, providerSchemaAcceptance: 'UNVERIFIED',
  policy: 'No live execution or blind evaluation authorized. Source edits change fingerprints; no silent refresh of freeze.'};
const output = new URL('prepared/', root);
await mkdir(output, {recursive: true});
const artifacts = {'contract.json': CONTRACT, 'baseline.json': BASELINE, 'development-probes.json': preparation, 'manifest.json': manifest};
// Idempotent only: never overwrite an existing differing freeze/evidence file.
for (const [name, value] of Object.entries(artifacts)) {
  const bytes = JSON.stringify(value, null, 2) + '\n', target = new URL(name, output);
  let previous; try {previous = await readFile(target, 'utf8');} catch (e) {if (e.code !== 'ENOENT') throw e;}
  if (previous !== undefined && previous !== bytes) throw Error(`Existing frozen ${name} differs; refusing overwrite`);
  if (previous === undefined) await writeFile(target, bytes, {flag: 'wx'});
}
const html = renderPreparation(preparation), htmlPath = new URL('index.html', output);
let previous; try {previous = await readFile(htmlPath, 'utf8');} catch (e) {if (e.code !== 'ENOENT') throw e;}
if (previous !== undefined && previous !== html) throw Error('Existing frozen view differs; refusing overwrite');
if (previous === undefined) await writeFile(htmlPath, html, {flag: 'wx'});
console.log(JSON.stringify(manifest, null, 2));
