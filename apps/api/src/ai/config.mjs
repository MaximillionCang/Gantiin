import { invariant } from '../domain/core.mjs';

export const validModel = value => typeof value === 'string' && !/^(?:AIza|AQ\.)/.test(value) && /^[A-Za-z0-9][A-Za-z0-9._-]{0,149}$/.test(value);
export function roleModels(config) {
  return {ocr: config.ocrModel || config.aiModel || '', decider: config.deciderModel || config.aiModel || ''};
}
export function aiReady(config) {
  return !!config.aiKey && config.aiAuthorized === true && Object.values(roleModels(config)).every(validModel);
}
export function requireAI(config, role) {
  invariant(config.aiAuthorized, 'AI usage is not authorized. Configure approved models and authorize usage locally.', 503, 'setup_required');
  const model = roleModels(config)[role];
  invariant(config.aiKey && validModel(model), `Integration not configured. Set GEMINI_API_KEY and GEMINI_${role === 'ocr' ? 'OCR' : 'DECIDER'}_MODEL or GEMINI_MODEL to an explicitly supported model identifier.`, 503, 'setup_required');
  return model;
}
