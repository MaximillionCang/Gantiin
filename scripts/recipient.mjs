import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { Store } from '../backend/src/db.mjs';
import { configuration } from '../backend/src/config.mjs';
import { email, invariant, text, now } from '../backend/src/domain.mjs';

const config=configuration();
invariant(config.mode==='sandbox','Recipient setup is only for real Sandbox accounts. Demo recipients are seeded separately.');
const store=new Store(config.dbPath);store.acquireLease();
const rl=createInterface({input:stdin,output:stdout});
try {
  const address=email(await rl.question('Existing CMT website email: '));
  const user=store.db.prepare('SELECT * FROM users WHERE email=? AND role=?').get(address,'cmt');
  invariant(user,'Registered CMT not found.');
  invariant(!store.payments().some(p=>p.user_id===user.id&&!['succeeded','failed'].includes(p.status)),'Reconcile pending payments before changing a recipient.');
  const id=text(await rl.question('PayPal Sandbox account ID (payer ID, not email): '),'Sandbox account ID',30);
  invariant(/^[A-Z0-9]{10,20}$/.test(id),'Invalid PayPal account ID.');
  const confirmation=await rl.question('Confirm you inspected this Malaysian account in the PayPal Sandbox dashboard and verified ownership, MYR receiving configuration, and membership. Type VERIFIED-MY-SANDBOX: ');
  invariant(confirmation==='VERIFIED-MY-SANDBOX','Verification confirmation is required.');
  const reference=text(await rl.question('Private verification reference (no secret): '),'Verification reference',200);
  const recipient={id,country:'MY',mode:'sandbox',verified:true,verified_at:now(),verification_reference:reference};
  store.db.prepare('UPDATE users SET recipient=?,paypal_sub=NULL WHERE id=?').run(JSON.stringify(recipient),user.id);
  store.audit('local-operator','sandbox_recipient_verified',user.id);
  console.log('Recipient bound. Existing payment snapshots were not changed. Restart the server.');
} finally {rl.close();store.close();}
