import {request as httpsRequest} from 'node:https';
export const ENDPOINT = 'https://clocked.rezolve.ai/clocked/decide';
export const DEADLINE_MS = 45000;
export const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

// Exactly one https.request. No redirects, SDK retries, authentication refresh or fallback.
// The injectable request function is used only by network-free transport tests.
export function createLiveTransport(requestImpl = httpsRequest) {
  return async ({body, credential, idempotencyKey, onHeaders, onChunk}) => {
    let request;
    const response = await new Promise((resolve, reject) => {
      request = requestImpl(ENDPOINT, {method: 'POST', agent: false,
        signal: AbortSignal.timeout(DEADLINE_MS), headers: {
          Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json', Accept: 'application/json',
          'Content-Length': Buffer.byteLength(body), 'Idempotency-Key': idempotencyKey,
          'User-Agent': 'BeforeRoll-P0B-Stage1-OneShot/1.0',
        }}, resolve);
      request.once('error', reject); request.end(body);
    }).catch(error => {request?.destroy(); throw error;});
    try {
      await onHeaders({status: response.statusCode, statusText: response.statusMessage,
        httpVersion: response.httpVersion, rawHeaders: response.rawHeaders});
      for await (const chunk of response) await onChunk(Buffer.from(chunk));
      if (!response.complete) throw Error('INCOMPLETE_HTTP_BODY');
    } finally {request.destroy(); response.destroy();}
  };
}
