/** Portable application scope. Protected archive test remains unchanged in development. */
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const files=(await fs.readdir(new URL('../../tests/',import.meta.url))).filter(f=>f.endsWith('.test.mjs')&&f!=='protected-archive.test.mjs').sort().map(f=>'tests/'+f);
console.log('PUBLIC APPLICATION SCOPE: all native application tests; excludes only the separately preserved protected-archive.test.mjs.');
const result=spawnSync(process.execPath,['--test',...files],{stdio:'inherit'});process.exitCode=result.status??1;
