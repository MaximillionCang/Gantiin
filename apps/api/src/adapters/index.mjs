import { FixtureAI, FixturePayPal, FixtureSheets } from './fixtures.mjs';
import { Gemini } from './gemini.mjs';
import { PayPalSandbox } from './paypal.mjs';
import { GoogleSheets } from './google.mjs';

export function adapters(store,config) {
  return config.mode==='fixture' ? {ai:new FixtureAI(),paypal:new FixturePayPal(store),sheets:new FixtureSheets(store)} : {ai:new Gemini(config),paypal:new PayPalSandbox(config),sheets:new GoogleSheets(config)};
}
