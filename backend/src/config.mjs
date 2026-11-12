import { resolve } from 'node:path';
import { invariant } from './domain.mjs';

export function configuration(env = process.env) {
  const mode = env.INTEGRATION_MODE || 'fixture';
  invariant(['fixture','sandbox'].includes(mode), 'INTEGRATION_MODE must be fixture or sandbox.');
  const budgetSource=env.BUDGET_SOURCE||'google';
  invariant(['google','fixture'].includes(budgetSource)&&!(mode==='sandbox'&&budgetSource==='fixture'),'Sandbox requires the Google Sheets budget.');
  invariant(!env.PAYPAL_MODE || env.PAYPAL_MODE === 'sandbox', 'Only PayPal Sandbox is allowed.');
  invariant(env.ENABLE_LIVE_PAYOUTS !== 'true', 'Live payouts are prohibited.');
  const aiMinConfidence=Number(env.AI_MIN_CONFIDENCE??0.90);
  invariant(Number.isFinite(aiMinConfidence)&&aiMinConfidence>0&&aiMinConfidence<=1,'AI_MIN_CONFIDENCE must be greater than 0 and at most 1.');
  const base = env.APP_BASE_URL || 'http://localhost:3000';
  const url = new URL(base);
  invariant(url.protocol === 'https:' || ['localhost','127.0.0.1','[::1]'].includes(url.hostname), 'Use HTTPS outside loopback.');
  return { mode, budgetSource,base: url.origin, port: Number(env.PORT || url.port || 3000), host: env.HOST || '127.0.0.1', dbPath: resolve(env.DATABASE_PATH || 'data/runtime/gantiin.sqlite'),
    googleKey: env.GOOGLE_APPLICATION_CREDENTIALS || '', spreadsheet: env.GOOGLE_SPREADSHEET_ID || '',
    aiKey: env.GEMINI_API_KEY || '', aiModel: env.GEMINI_MODEL?.trim() || '', ocrModel: env.GEMINI_OCR_MODEL?.trim() || '', deciderModel: env.GEMINI_DECIDER_MODEL?.trim() || '', aiAuthorized: env.AI_USAGE_AUTHORIZED === 'true', aiMinConfidence,
    paypalClient: env.PAYPAL_CLIENT_ID || '', paypalSecret: env.PAYPAL_CLIENT_SECRET || '', paypalLogin: env.PAYPAL_LOGIN_ENABLED === 'true', paypalSenderId: env.PAYPAL_SENDER_ACCOUNT_ID || '',
    paypalTreasurerLoginClient: env.PAYPAL_TREASURER_LOGIN_CLIENT_ID || '', paypalTreasurerLoginSecret: env.PAYPAL_TREASURER_LOGIN_CLIENT_SECRET || '',
    demoPasswordReset: env.DEMO_PASSWORD_RESET_ENABLED !== 'false',
    fundingConfirmed: env.SANDBOX_MYR_FUNDING_CONFIRMED === 'true', workerInterval: Number(env.WORKER_INTERVAL_MS || 2500)};
}
