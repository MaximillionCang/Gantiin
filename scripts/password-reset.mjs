import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { configuration } from '../apps/api/src/config.mjs';
import { issuePasswordReset } from '../apps/api/src/password-reset.mjs';

const args=process.argv.slice(2);
if(args.includes('--help')||!args.length){
  console.log('Usage: node --env-file=.env --env-file=.env.sandbox scripts/password-reset.mjs <website-email> [--base-url https://your-website]\nCreates a private, one-use reset link valid for 15 minutes. Verify the recipient before sharing it.');
} else {
  const config=configuration();
  const valid=args.length===1||args.length===3&&args[1]==='--base-url';
  if(!valid)throw new Error('Use one website email and optionally --base-url <website origin>.');
  if(!existsSync(config.dbPath))throw new Error('The configured database does not exist. No database was created.');
  // Only authentication metadata changes; the financial worker keeps its lease.
  const db=new DatabaseSync(config.dbPath);
  try {
    db.exec('PRAGMA busy_timeout=5000');
    const url=issuePasswordReset(db,args[0],args[2]||config.base);
    console.log(`Private reset link (one use, expires in 15 minutes):\n${url}\nShare only with the verified account owner. Do not commit or publish this link.`);
  } finally {db.close();}
}
