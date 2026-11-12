import { invariant } from './core.mjs';

export function money(value, name = 'Amount') {
  invariant(Number.isSafeInteger(value) && value >= 0 && value <= 100_000_000, `${name} must be integer MYR sen between 0 and 100000000.`);
  return value;
}
export const sum = values => money(values.reduce((a, b) => a + money(b), 0), 'Total');
export const decimal = sen => (money(sen) / 100).toFixed(2);
export function fromDecimal(value) {
  invariant(typeof value === 'string' && /^\d{1,7}\.\d{2}$/.test(value), 'Provider returned an invalid MYR amount.');
  const [whole, part] = value.split('.');
  return money(Number(whole) * 100 + Number(part));
}
