import { configuration } from '../apps/api/src/config.mjs';
import { GoogleSheets, BUDGET_FORMULA } from '../apps/api/src/adapters/google.mjs';
import { invariant, money } from '../apps/api/src/domain.mjs';
import { TRANSACTION_HEADERS, ITEM_HEADERS } from '../apps/api/src/adapters/sheets-contract.mjs';

const config=configuration();
invariant(config.mode==='sandbox'&&process.argv.includes('--initialize-empty'),'Use Sandbox and --initialize-empty for a dedicated EMPTY test spreadsheet. This writes five tabs and protects financial tabs.');
const initial=Number(process.env.SHEETS_INITIAL_FUNDING_SEN);
money(initial,'SHEETS_INITIAL_FUNDING_SEN');
const client=new GoogleSheets(config);
const meta=await client.request('?fields=sheets.properties');
for(const s of meta.sheets){const values=await client.request(`/values/${encodeURIComponent(`'${s.properties.title.replaceAll("'","''")}'!A1:Z1000`)}`);invariant(!values.values?.length,'Spreadsheet contains data. Setup refuses to overwrite it.');}
const titles=['Event Budget','Planned Items','Approved History','Transactions','Reimbursed Items'];
const ids=[101,102,103,104,105];
invariant(!meta.sheets.some(s=>ids.includes(s.properties.sheetId)),'Reserved sheet IDs are already used. Choose a new empty spreadsheet.');
const headers=[['event_id','currency','funding_sen','remaining_sen','revision'],['id','description','category','purpose','approved','rule_id'],['id','description','category','context','approved','eligible_sen','paid_sen','policy_version'],TRANSACTION_HEADERS,ITEM_HEADERS];
const requests=titles.map((title,i)=>({addSheet:{properties:{sheetId:ids[i],title,gridProperties:{rowCount:i>=3?10001:1001,columnCount:Math.max(10,headers[i].length),frozenRowCount:1}}}}));
headers.forEach((row,i)=>requests.push({updateCells:{start:{sheetId:ids[i],rowIndex:0,columnIndex:0},rows:[{values:row.map(stringValue=>({userEnteredValue:{stringValue}}))}],fields:'userEnteredValue'}}));
requests.push({updateCells:{start:{sheetId:101,rowIndex:1,columnIndex:0},rows:[{values:[{userEnteredValue:{stringValue:'event-1'}},{userEnteredValue:{stringValue:'MYR'}},{userEnteredValue:{numberValue:initial}},{userEnteredValue:{formulaValue:BUDGET_FORMULA}},{userEnteredValue:{stringValue:'initial-1'}}]}],fields:'userEnteredValue'}});
const auth=await client.auth.getClient();
const serviceEmail=auth.email;
invariant(serviceEmail,'A service-account credential with an email is required.');
for(const id of [101,104,105]) requests.push({addProtectedRange:{protectedRange:{range:{sheetId:id},description:'Gantiin application-owned financial range. Do not edit while processing or while funds are reserved.',warningOnly:false,editors:{users:[serviceEmail]}}}});
await client.request(':batchUpdate','POST',{requests});
console.log('Initialized dedicated test tabs with integer-sen formula and protected financial ranges. No payout was sent. Add explicitly approved Planned Items / Approved History rows; stop processing and reconcile all reservations before changing funding.');
