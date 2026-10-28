/** Distribution entry: one local, temporary fictional sandbox per process; no credentials. */
import {createAppServer} from '../../server.mjs';
import {makeEvaluationRuntime} from '../../src/evaluation-mode.mjs';
const args=process.argv.slice(2);
if(args.some(a=>!/^--port=\d+$/.test(a)))throw Error('Use only --port=0..65535');
const port=Number(args[0]?.split('=')[1]??3000);
if(!Number.isSafeInteger(port)||port<0||port>65535)throw Error('Invalid port');
const runtime=await makeEvaluationRuntime({includeLastLight:true});let calls=0,closing=false;
const server=createAppServer({evaluationMode:true,evaluationRuntime:runtime,workspaceStore:runtime.store,executionStore:runtime.execution,sourceVault:runtime.vault,enabled:false,apiKey:null,operatorToken:null,fetchImpl:async()=>{calls++;throw Error('Evaluation forbids provider transport');}});
try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});}catch(e){await runtime.dispose();throw e;}
console.log('BEFOREROLL_EVALUATION=http://127.0.0.1:'+server.address().port);
console.log('Previously recorded genuine Clocked evidence. Fictional data. Zero new calls. Local sandbox only; not shared hosting.');
async function close(){if(closing)return;closing=true;await new Promise(r=>server.close(r));await runtime.dispose();console.log('EVALUATION_CLOSED providerCalls='+calls+' temporaryDataDisposed=true');process.exitCode=calls?1:0;process.stdin.pause();}
process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{if(s.trim()==='stop')void close();});process.once('SIGINT',close);process.once('SIGTERM',close);
