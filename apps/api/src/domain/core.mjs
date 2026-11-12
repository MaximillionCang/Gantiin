import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export class AppError extends Error {
  constructor(message, status = 400, code = 'validation') { super(message); this.status = status; this.code = code; }
}
export const invariant = (ok, message, status = 400, code) => { if (!ok) throw new AppError(message, status, code); };
export const digest = value => createHash('sha256').update(value).digest('hex');
export const secret = () => randomBytes(32).toString('hex');
export const now = () => new Date().toISOString();
export function text(value, name, max = 4000, min = 1) {
  invariant(typeof value === 'string' && value.trim().length >= min && value.length <= max, `${name} must contain ${min}-${max} characters.`);
  return value.trim();
}
export function passwordHash(password, minimumLength=12) {
  text(password, 'Password', 128, minimumLength);
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function passwordMatches(password, stored) {
  if (typeof password !== 'string' || password.length > 128) return false;
  const [salt, hash] = stored.split(':');
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
}
export function email(value) {
  const result = text(value, 'Email', 180).toLowerCase();
  invariant(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result), 'Enter a valid email address.');
  return result;
}
export function validatePolicy(input, version) {
  invariant((input.currency??'MYR') === 'MYR', 'Only MYR is supported.');
  const descriptionOnly=input.rules===undefined||input.policy_input==='event_description';
  const insufficient_context=input.insufficient_context??'reject';
  invariant(['reject', 'require_clear_context'].includes(insufficient_context), 'Select an insufficient-context policy.');
  const suppliedRules=descriptionOnly?[
    {id:'EVENT-RELEVANCE',effect:'allow',category:'*',instruction:'Accept only items whose use is supported by the event name and description, receipt evidence and approved spreadsheet references. Explain the connection to this event. Honor any purchase restrictions explicitly stated in the event description.'},
    {id:'EVENT-UNRELATED',effect:'deny',category:'personal',instruction:'Reject personal-use or unrelated purchases and items with insufficient evidence of event relevance. Give a specific reason tied to the item and this event. Do not invent an event purpose.'}
  ]:input.rules;
  invariant(Array.isArray(suppliedRules) && suppliedRules.length > 0 && suppliedRules.length <= 30, 'Provide 1-30 policy rules.');
  const rules = suppliedRules.map(r => ({id: text(r.id, 'Rule ID', 30), effect: r.effect, category: text(r.category, 'Category', 80), instruction: text(r.instruction, 'Rule instruction', 1500)}));
  invariant(new Set(rules.map(r => r.id)).size === rules.length && rules.every(r => ['allow', 'deny'].includes(r.effect)), 'Rule IDs must be unique; effects are allow or deny.');
  invariant(rules.some(r => r.effect === 'allow'), 'Provide at least one allowed category.');
  return {name: text(input.name, 'Event name', 120), description: text(input.description, 'Event description', 4000, 10), currency: 'MYR', insufficient_context, rules, policy_input:descriptionOnly?'event_description':'rules',version, configured: true, synthetic: input.synthetic === true};
}
