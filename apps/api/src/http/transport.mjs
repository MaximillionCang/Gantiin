import { invariant, AppError } from '../domain/core.mjs';

export function cookies(req) { return Object.fromEntries((req.headers.cookie||'').split(';').filter(s=>s.includes('=')).map(s=>{const i=s.indexOf('=');return [s.slice(0,i).trim(),s.slice(i+1).trim()];})); }
export async function body(req) {
  invariant(req.headers['content-type']?.startsWith('application/json'),'Send application/json.');
  let size=0;const chunks=[];
  for await(const chunk of req) {size+=chunk.length;invariant(size<=7_100_000,'Request exceeds the upload limit.',413);chunks.push(chunk);}
  try {const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));invariant(result&&typeof result==='object'&&!Array.isArray(result),'JSON object required.');return result;}
  catch(error) {if(error instanceof AppError) throw error;throw new AppError('Invalid JSON body.');}
}
