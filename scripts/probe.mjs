import { readFileSync } from 'node:fs';
import { configuration } from '../backend/src/config.mjs';
import { Store } from '../backend/src/db.mjs';
import { adapters } from '../backend/src/adapters/index.mjs';
import { aiReady } from '../backend/src/ai/config.mjs';
import { validateReceipt, validateAssessment } from '../backend/src/domain.mjs';

const config=configuration();
if(config.mode!=='sandbox') {console.log('NOT RUN: INTEGRATION_MODE is fixture. No external service connectivity is asserted.');process.exit(2);}
const checks={Google:!!(config.googleKey&&config.spreadsheet),PayPal:!!(config.paypalClient&&config.paypalSecret),AI:aiReady(config)};
for(const [name,ready] of Object.entries(checks)) console.log(`${name}: ${ready?'configuration present':'BLOCKED, missing credentials or usage authorization'}`);
if(Object.values(checks).some(v=>!v))process.exit(2);
const store=new Store(config.dbPath);store.acquireLease();
try {
  const event=store.setting('event');
  if(!event.configured)throw new Error('Configure an explicit event policy through the website before probing.');
  const p=adapters(store,config);
  const sheet=await p.sheets.read(event);console.log('Google Sheets read/schema/formula: PASS. This probe has not written a payment row.');
  await p.paypal.token();console.log('PayPal Sandbox authentication: PASS. Payout permissions/MYR success are NOT proven by token acquisition.');
  const bytes=readFileSync('frontend/demo/mixed.png');
  const receipt=validateReceipt(await p.ai.extract(bytes,'image/png'));
  validateAssessment(await p.ai.assess(receipt,event,sheet.references,'Synthetic test printing and registration for the configured event. Personal headphones are not an event purchase.'),receipt,event,sheet.references);
  console.log('Gemini extraction and assessment schema: PASS for one synthetic image. This is not an accuracy benchmark.');
  console.log('Next: submit one synthetic claim in the application to exercise the authorized automatic Sandbox payout and fixed-row Sheets write. Verify payout-item SUCCESS, matching MYR amount/recipient and exactly one ledger row. Record evidence privately.');
} catch(error) {console.error(`PROBE INCOMPLETE: ${error.code||'setup/validation error'}. Check local setup; no integration completion is asserted.`);process.exitCode=1;}
finally{store.close();}
