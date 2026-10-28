import {open, mkdir, readFile, readdir, lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {randomBytes, createCipheriv, hkdfSync} from 'node:crypto';
import {fingerprint, sha256} from '../contract.mjs';

export async function durableBytes(path, bytes) {
  const handle = await open(path, 'wx', 0o600);
  try {await handle.writeFile(bytes); await handle.sync();} finally {await handle.close();}
}
export const durableJSON = (path, value) => durableBytes(path, JSON.stringify(value, null, 2) + '\n');
export async function exists(path) {
  try {await lstat(path); return true;} catch (e) {if (e.code === 'ENOENT') return false; throw e;}
}
export async function claimExecution(directory, initial) {
  // A lifetime one-shot fence, not an expiring lock. Never remove it, even before the first POST.
  try {await mkdir(directory, {mode: 0o700});} catch {throw Error('EXECUTION_ALREADY_EXISTS_OR_UNWRITABLE');}
  await durableJSON(join(directory, 'run.json'), initial);
  let sequence = 0, previousHash = null;
  return {async event(type, data) {
    const event = {sequence, previousHash, at: new Date().toISOString(), type, data};
    const hash = fingerprint(event);
    await durableJSON(join(directory, `${String(sequence).padStart(3, '0')}-event.json`), {...event, hash});
    sequence++; previousHash = hash; return hash;
  }};
}
export function secretEcho(bytes, credential) {
  const text = Buffer.from(bytes).toString('utf8');
  let normalized = '';
  try {normalized = JSON.stringify(JSON.parse(text));} catch {/* Non-JSON remains exact text. */}
  return [credential, JSON.stringify(credential).slice(1, -1), encodeURIComponent(credential),
    Buffer.from(credential).toString('base64')].some(value => value && (text.includes(value) || normalized.includes(value)));
}
// If a provider echoes the credential, preserve the exact response encrypted and halt.
// No credential or credential-derived decryption key is written to disk.
export async function preserveResponse(directory, headers, bytes, credential, complete) {
  const envelope = Buffer.from(JSON.stringify(headers));
  const sensitive = secretEcho(envelope, credential) || secretEcho(bytes, credential);
  const receipt = {complete, byteLength: bytes.length, rawBodyHash: sha256(bytes), sensitive};
  if (sensitive) {
    const salt = randomBytes(32), iv = randomBytes(12);
    const key = hkdfSync('sha256', credential, salt, 'BeforeRoll-P0B-credential-echo-custody-v1', 32);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const plaintext = Buffer.from(JSON.stringify({headers, bodyBase64: bytes.toString('base64')}));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    await durableJSON(join(directory, 'response.sealed.json'), {algorithm: 'aes-256-gcm',
      derivation: 'HKDF-SHA256; original runtime credential; BeforeRoll-P0B-credential-echo-custody-v1',
      salt: salt.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64')});
    receipt.rawFile = 'response.sealed.json';
  } else {
    await durableJSON(join(directory, 'response.headers.json'), headers);
    await durableBytes(join(directory, 'response.body.bin'), bytes);
    receipt.rawFile = 'response.body.bin';
  }
  return receipt;
}
export async function readEvents(directory) {
  const names = (await readdir(directory)).filter(n => /^\d{3}-event\.json$/.test(n)).sort();
  const events = []; let previousHash = null;
  for (const [sequence, name] of names.entries()) {
    const {hash, ...event} = JSON.parse(await readFile(join(directory, name), 'utf8'));
    if (event.sequence !== sequence || event.previousHash !== previousHash || fingerprint(event) !== hash) throw Error('EVENT_CHAIN_INVALID');
    events.push({...event, hash}); previousHash = hash;
  }
  return events;
}
