import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
const base='677e02d';
const tracked=execFileSync('git',['ls-tree','-r',base,'--','_design_championship','fixtures'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const files=[];for(const row of tracked){const [,expected,file]=row.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/)??[];if(!file)throw Error('Unexpected tree entry');const bytes=await fs.readFile(file);const original=execFileSync('git',['cat-file','blob',expected],{maxBuffer:30*1024*1024});const raw=bytes.equals(original);const normalized=raw||bytes.toString('utf8').replaceAll('\r\n','\n')===original.toString('utf8');const exactRequired=file.startsWith('_design_championship/');if(!(exactRequired?raw:normalized))throw Error('Preservation mismatch: '+file);files.push({path:file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),comparison:raw?'byte-identical':'Git-normalized text identical'});}
const report={baseline:base,championshipFiles:files.filter(x=>x.path.startsWith('_design_championship/')).length,fixtureFiles:files.filter(x=>x.path.startsWith('fixtures/')).length,passed:true,files};await fs.writeFile('_design_implementation/evidence/preservation-manifest.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,files:undefined}));
