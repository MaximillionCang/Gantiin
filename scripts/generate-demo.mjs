import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(resolve('package.json'));
const {chromium}=require('@playwright/test');
const directory=resolve('demo/campus-career-day');
mkdirSync(join(directory,'receipts'),{recursive:true});
const name='Campus Career Day 2026';
const description=`Campus Career Day 2026 is a one-day, non-commercial career preparation event for 80 university students and 15 organising committee members. It takes place on 7 November 2026, from 9:00 AM to 4:30 PM, in the university's Student Activity Hall. The programme includes employer talks, CV clinics, an interview workshop and a small networking session. The committee manages registration, printed session materials, wayfinding, a simple refreshment break and room preparation.

Event expenses must have a clear connection to those activities. Relevant purchases include printed programmes and CV worksheets, name badge holders, basic lanyards, registration stationery, event signage, removable mounting tape and AA batteries used by the event microphones. Printing and registration materials are intended for the 80 registered students. Purchases made on 6 November for preparation or on 7 November for the event may qualify when receipt evidence identifies suitable event supplies.

The approved refreshment plan is one bottled water and one standard snack pack per registered student, distributed at the hall during the programme. Specialty coffees, milk teas, additional personal drinks and meals outside this refreshment plan are not event expenses. The committee's optional dinner after the event is a personal gathering, not part of the programme, and is not reimbursable.

The university supplies the venue, tables, chairs, projector, HDMI adapters and a working wireless presentation remote at no cost. Buying an additional HDMI adapter, presentation remote or other reusable audiovisual equipment is not covered for this event. Consumable microphone batteries and removable mounting tape remain eligible room-preparation supplies.

There is no souvenir or gift programme. Personal or gift drinkware, including premium stainless-steel thermal tumblers, is not included in the participant kit. The participant kit contains only the printed materials, a basic lanyard and a name badge holder. An item can be a normal, useful product and still be outside this event's scope.

Assess each receipt item independently. A receipt may mix eligible event supplies with non-reimbursable purchases; do not reject the whole receipt only because one item is unrelated. Use the receipt, this description and actual approved spreadsheet references to establish relevance. Do not invent a purchase purpose for an unclear item. For a rejected item, explain which part of this event's scope it does not meet. Available money and the amount paid are determined separately from the current Google Sheets budget; this description does not create or guarantee funds.`;
if(description.length>4000)throw new Error('Demo description exceeds the application limit.');
writeFileSync(join(directory,'EVENT.md'),`# Event name\n\n${name}\n\n# Event description\n\n${description}\n`);
writeFileSync(join(directory,'event.json'),JSON.stringify({name,description},null,2)+'\n');
const receipts=[
  {file:'01-printing-and-registration.png',merchant:'Campus Copy Counter',date:'6 November 2026, 14:20',number:'DEMO-CC-001',items:[['A4 programme printing',80,60,true,'Printed programmes support the career talks and workshops.'],['Name badge holder',80,70,true,'Badge holders are part of the registration kit.'],['Basic woven lanyard',80,120,true,'Basic lanyards are part of the participant kit.'],['Stainless thermal tumbler 450ml',1,3990,false,'Thermal drinkware is outside the participant kit; there is no gift programme.']]},
  {file:'02-refreshments.png',merchant:'Hall Refreshment Counter',date:'7 November 2026, 10:45',number:'DEMO-HR-002',items:[['Bottled water 500ml',80,150,true,'One bottled water per student is included in the refreshment plan.'],['Standard snack pack',80,400,true,'One standard snack pack per student is included in the refreshment plan.'],['Iced caramel latte',2,1250,false,'Specialty coffee is outside the approved water-and-snack refreshment plan.']]},
  {file:'03-room-preparation.png',merchant:'Campus Supplies Counter',date:'6 November 2026, 16:10',number:'DEMO-CS-003',items:[['AA batteries, 4-pack',4,850,true,'Consumable microphone batteries are permitted room-preparation supplies.'],['Removable mounting tape',2,600,true,'Removable tape supports event signs and room preparation.'],['USB-C to HDMI adapter',1,4900,false,'The university already provides HDMI adapters; buying another is outside scope.'],['Wireless presentation remote',1,8900,false,'The university provides a presentation remote; additional AV equipment is not covered.']]},
  {file:'04-committee-dinner.png',merchant:'Campus Food Court',date:'7 November 2026, 19:15',number:'DEMO-CF-004',items:[['Dinner rice set',15,1200,false,'The optional committee dinner after the programme is not an event expense.'],['Canned soft drink',15,250,false,'Dinner drinks are outside the event refreshment plan.']]}
];
const currency=value=>`RM${(value/100).toFixed(2)}`;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:640,height:900},deviceScaleFactor:1});
  for(const receipt of receipts){
    receipt.total_sen=receipt.items.reduce((sum,[,quantity,unit])=>sum+quantity*unit,0);
    receipt.expected_eligible_sen=receipt.items.reduce((sum,[,quantity,unit,accepted])=>sum+(accepted?quantity*unit:0),0);
    await page.setContent(`<html lang="en"><head><title>${escape(receipt.number)}</title><style>*{box-sizing:border-box}body{margin:0;padding:48px;background:#fff;color:#222;font:16px/1.55 Arial,sans-serif}header{text-align:center;padding-bottom:24px;border-bottom:2px solid #292536}h1{font-size:25px;margin:0 0 8px}p{margin:6px 0}small{font-size:13px}section{padding:20px 0}table{width:100%;border-collapse:collapse;font-size:15px}th,td{text-align:left;padding:15px 0;border-bottom:1px solid #dedde4;vertical-align:top}td:last-child,th:last-child{text-align:right;white-space:nowrap}td:first-child{padding-right:20px}strong{font-weight:600}.total{display:flex;justify-content:space-between;margin-top:22px;font-size:22px}.footer{border-top:1px solid #dedde4;margin-top:40px;padding-top:18px;text-align:center;color:#666}</style></head><body><header><h1>${escape(receipt.merchant)}</h1><small>DEMO STORE · MYR</small></header><section><p>Receipt: ${escape(receipt.number)}</p><p>${escape(receipt.date)}</p></section><table><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>${receipt.items.map(([item,quantity,unit])=>`<tr><td><strong>${escape(item)}</strong><br><small>${quantity} × ${currency(unit)}</small></td><td>${currency(quantity*unit)}</td></tr>`).join('')}</tbody></table><div class="total"><strong>Total</strong><strong>${currency(receipt.total_sen)}</strong></div><p>Payment method: Cash</p><div class="footer"><small>Demo receipt. Not a real purchase.<br>No extra tax, discount or service charge.</small></div></body></html>`);
    await page.screenshot({path:join(directory,'receipts',receipt.file),fullPage:true});
  }
}finally{await browser.close();}
const csv=value=>`"${String(value).replaceAll('"','""')}"`;
const rows=[['receipt','item','quantity','unit_sen','line_sen','expected_decision','expected_eligible_sen','reason']];
for(const r of receipts)for(const [item,quantity,unit,accepted,reason]of r.items)rows.push([r.file,item,quantity,unit,quantity*unit,accepted?'accepted':'rejected',accepted?quantity*unit:0,reason]);
writeFileSync(join(directory,'expected-results.csv'),rows.map(row=>row.map(csv).join(',')).join('\n')+'\n');
writeFileSync(join(directory,'README.md'),`# Campus Career Day demo\n\nCopy the name and description from EVENT.md into Event Policy, then save. Upload a PNG from receipts/. These are deliberately synthetic examples with fictional shops. expected-results.csv is a human-authored evaluation key, not an actual AI result.\n\n| Receipt | Total | Expected eligible |\n|---|---|---|\n${receipts.map(r=>`| ${r.file} | ${currency(r.total_sen)} | ${currency(r.expected_eligible_sen)} |`).join('\n')}\n\nActual paid amounts depend on the real spreadsheet balance. This package does not initialise or add funds to Google Sheets, change the active saved event, enable AI usage or trigger a payout. The receipt images target the real OCR/Decider path; the old fixed-fixture reader does not infer unseen images.\n`);
console.log(JSON.stringify({event:name,descriptionCharacters:description.length,receipts:receipts.length,directory}));
