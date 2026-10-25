import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {parseLocalEnv,loadLocalEnv} from '../src/local-env.mjs';
test('local .env supports ordinary keys, whitespace, BOM, and optional quoted values',()=>{
 const obj=parseLocalEnv('\ufeff# confidential\r\nBEFOREROLL_LIVE_ENABLED=true\r\n CLOCKED_API_KEY = "test#secret"\nBEFOREROLL_OPERATOR_TOKEN=abcdef');
 assert.deepEqual(Object.keys(obj),['BEFOREROLL_LIVE_ENABLED','CLOCKED_API_KEY','BEFOREROLL_OPERATOR_TOKEN']);
 assert.equal(obj.CLOCKED_API_KEY,'test#secret');
 assert.equal(obj.BEFOREROLL_LIVE_ENABLED,'true');
});
test('local .env rejects unknown keys, duplicate entries, malformed input and control characters',()=>{
 for(const content of ['NODE_OPTIONS=--require attacker','CLOCKED_API_KEY=1\nCLOCKED_API_KEY=2','CLOCKED_API_KEY=ok\nstray','CLOCKED_API_KEY="unterminated','CLOCKED_API_KEY=bad\u0000']){
  assert.throws(()=>parseLocalEnv(content));
 }
});
test('environment variables take precedence over local .env and no secret values returned',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'br-s31-local-env-'));
 try{
  await fs.writeFile(path.join(dir,'.env'),'CLOCKED_API_KEY=local-secret\nBEFOREROLL_LIVE_ENABLED=true\nBEFOREROLL_OWNER_TOKEN=local-owner-secret');
  const env={CLOCKED_API_KEY:'outer-secret',PORT:'59000'};
  const result=loadLocalEnv({directory:dir,env});
  assert.equal(result.found,true);assert.equal(env.CLOCKED_API_KEY,'outer-secret');
  assert.equal(env.BEFOREROLL_LIVE_ENABLED,'true');assert.equal(env.BEFOREROLL_OWNER_TOKEN,'local-owner-secret');
  assert.deepEqual(result.applied,['BEFOREROLL_LIVE_ENABLED','BEFOREROLL_OWNER_TOKEN']);
  assert(!JSON.stringify(result).includes('secret'));
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('missing .env remains safe and works without a key',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'br-s31-no-file-'));
 try{assert.deepEqual(loadLocalEnv({directory:dir,env:{}}),{found:false,applied:[]});}
 finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('private local mode requires explicit billable flag and protected owner+operator tokens',async()=>{
 const root=new URL('../',import.meta.url);
 const files=await Promise.all(['server.mjs','scripts/Launch-Private.ps1','scripts/Launch-Evaluation.ps1','public/workspace-desk.mjs','.gitignore'].map(f=>fs.readFile(new URL(f,root),'utf8')));
 assert.match(files[0],/if\(IS_ENTRY&&!IS_EVALUATION\)loadLocalEnv/);
 assert.match(files[0],/BEFOREROLL_LIVE_ENABLED==='true'/);
 assert.match(files[1],/Start-Process \$Address/);
 assert.match(files[2],/--evaluate/);
 assert.match(files[3],/EVALUATION WORKSPACE \/ FICTIONAL DATA/);
 assert.match(files[4],/^\.env$/m);
});
