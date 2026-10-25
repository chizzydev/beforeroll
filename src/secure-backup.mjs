/** Passphrase-encrypted portable owner backup. No third-party crypto dependencies.
 * AEAD authenticates the entire original lifecycle payload before recovery.
 */
import {randomBytes,scrypt as scryptCallback,createCipheriv,createDecipheriv} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback),COST=16384;
const shaPattern=/^[A-Za-z0-9+/]*(?:==|=)?$/;
export async function encryptOwnerBackup(backup,passphrase){
 if(typeof passphrase!=='string'||passphrase.length<14||Buffer.byteLength(passphrase)>1024)throw Error('Owner backup passphrase must be at least 14 characters (max 1024 bytes)');
 if(backup?.schema!=='beforeroll-owner-lifecycle-backup-v1'||backup.secretsIncluded!==false)throw Error('Only verified-format owner backups may be encrypted');
 const salt=randomBytes(16),iv=randomBytes(12),key=await scrypt(passphrase,salt,32,{N:COST,r:8,p:1,maxmem:32*1024*1024});
 const cipher=createCipheriv('aes-256-gcm',key,iv);const plaintext=Buffer.from(JSON.stringify(backup),'utf8');
 const encrypted=Buffer.concat([cipher.update(plaintext),cipher.final()]);const tag=cipher.getAuthTag();key.fill(0);
 return {schema:'beforeroll-encrypted-owner-backup-v1',kdf:{name:'scrypt',N:COST,r:8,p:1,salt:salt.toString('base64')},encryption:{name:'aes-256-gcm',iv:iv.toString('base64'),authTag:tag.toString('base64')},ciphertextBase64:encrypted.toString('base64'),workspaceId:backup.workspaceId,containsSensitiveDocuments:true,notClearance:true};
}
function exactBase64(s,length){return typeof s==='string'&&shaPattern.test(s)&&Buffer.from(s,'base64').length===length&&Buffer.from(s,'base64').toString('base64')===s;}
export async function decryptOwnerBackup(bundle,passphrase){
 if(bundle?.schema!=='beforeroll-encrypted-owner-backup-v1'||bundle.kdf?.name!=='scrypt'||bundle.kdf.N!==COST||bundle.kdf.r!==8||bundle.kdf.p!==1||bundle.encryption?.name!=='aes-256-gcm'||!exactBase64(bundle.kdf.salt,16)||!exactBase64(bundle.encryption.iv,12)||!exactBase64(bundle.encryption.authTag,16)||typeof bundle.ciphertextBase64!=='string'||bundle.ciphertextBase64.length>96*1024*1024)throw Error('Encrypted owner backup envelope invalid');
 if(typeof passphrase!=='string')throw Error('Backup passphrase required');
 const payload=Buffer.from(bundle.ciphertextBase64,'base64');if(payload.toString('base64')!==bundle.ciphertextBase64)throw Error('Invalid encrypted backup encoding');
 const key=await scrypt(passphrase,Buffer.from(bundle.kdf.salt,'base64'),32,{N:COST,r:8,p:1,maxmem:32*1024*1024});
 try{const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(bundle.encryption.iv,'base64'));decipher.setAuthTag(Buffer.from(bundle.encryption.authTag,'base64'));
  const clear=Buffer.concat([decipher.update(payload),decipher.final()]);const backup=JSON.parse(clear.toString('utf8'));
  if(backup.workspaceId!==bundle.workspaceId||backup.schema!=='beforeroll-owner-lifecycle-backup-v1')throw Error('Decrypted owner backup identity mismatch');return backup;
 }catch{throw Error('Wrong passphrase or modified owner backup (authentication failed)');}finally{key.fill(0);}
}
