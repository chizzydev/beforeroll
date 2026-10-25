/** Stable per-user local project storage across extracted app releases. */
import path from 'node:path';
import os from 'node:os';
export function workspaceDirectory(env=process.env,platform=process.platform){
 if(env.BEFOREROLL_DATA_DIR){
  if(!path.isAbsolute(env.BEFOREROLL_DATA_DIR))throw Error('BEFOREROLL_DATA_DIR must be an absolute path');
  return path.resolve(env.BEFOREROLL_DATA_DIR);
 }
 if(platform==='win32')return path.resolve(env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'BeforeRoll','Workspaces');
 return path.resolve(env.XDG_DATA_HOME||path.join(os.homedir(),'.local','share'),'beforeroll','workspaces');
}
