import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// Called only after the explicit live gate; never changes process.env or the file.
export async function runtimeCredential(root, env = process.env) {
  let value = env.CLOCKED_API_KEY;
  if (!value) {
    let text;
    try {text = await readFile(resolve(root, '.env'), 'utf8');} catch {throw Error('CREDENTIAL_UNAVAILABLE');}
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => /^\s*(?:export\s+)?CLOCKED_API_KEY\s*=/.test(line));
    if (lines.length !== 1) throw Error('CREDENTIAL_UNAVAILABLE');
    value = lines[0].replace(/^\s*(?:export\s+)?CLOCKED_API_KEY\s*=\s*/, '').trim();
    if (value.startsWith('"') || value.startsWith("'")) {
      const quote = value[0], end = value.indexOf(quote, 1);
      if (end < 0 || !/^\s*(?:#.*)?$/.test(value.slice(end + 1))) throw Error('CREDENTIAL_UNAVAILABLE');
      value = value.slice(1, end);
    } else value = value.replace(/\s+#.*$/, '').trim();
  }
  // Header-safe printable ASCII only. Never include a rejected value in an exception.
  if (typeof value !== 'string' || !/^[\x21-\x7e]+$/.test(value) || value.length > 8192) throw Error('CREDENTIAL_UNAVAILABLE');
  return value;
}
