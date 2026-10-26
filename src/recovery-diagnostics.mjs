/** Safe user-facing diagnostics. No credentials, filesystem paths or raw payloads. */
export function recoveryDiagnostic(error){
 const message=String(error?.message??'');
 let code='RECOVERY_NOT_COMPLETED',guidance='The production has not been reported as restored. Keep the backup unchanged. Inspect local storage and verify again; never retry Clocked to repair recovery.';
 if(/authentication failed|passphrase/i.test(message)){code='BACKUP_AUTHENTICATION_FAILED';guidance='Check the passphrase and select the original unmodified encrypted backup. A wrong passphrase and damaged ciphertext cannot be distinguished safely. No production was restored.';}
 else if(/JSON|envelope|encoding|checksum|identity|corrupt|integrity|mismatch|differ/i.test(message)){code='BACKUP_INTEGRITY_FAILED';guidance='Select the original complete encrypted backup, not an evidence export or an edited file. Retain the damaged copy for investigation. Nothing is approved or made retryable.';}
 else if(/lock|active|writer/i.test(message)){code='LOCAL_STORAGE_BUSY_OR_INTERRUPTED';guidance='Close other BeforeRoll writers. If a previous process crashed, preserve the lock and journals for inspection. Use separate-workspace recovery from a verified backup; do not delete a billing journal or retry an uncertain request.';}
 else if(/overwrite|existing/i.test(message)){code='RECOVERY_DESTINATION_EXISTS';guidance='Open the existing production or restore into a separate recovered workspace. Existing production and billing history are preserved.';}
 else if(/ENOENT|original|blob/i.test(message)){code='ORIGINAL_CUSTODY_FAILED';guidance='Keep the backup and exact original files. Reconnect only files matching the listed SHA-256. A missing original is not a verified copy; create a new backup after custody is repaired.';}
 return {code,recoveryGuidance:guidance,notRestored:true,automaticClockedRetry:false};
}
