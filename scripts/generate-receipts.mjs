import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';

// These deliberately labeled data fixtures are receipts, not product artwork.
const requested=process.argv[process.argv.indexOf('--file')+1];
const fixtures=JSON.parse(readFileSync('data/examples/receipts.json','utf8')).filter(f=>!process.argv.includes('--file')||f.file===requested);
mkdirSync('frontend/demo',{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:600,height:800},deviceScaleFactor:1});
  for(const fixture of fixtures) {
    await page.setContent(`<html lang="en"><head><title>Synthetic receipt</title><style>body{margin:0;padding:48px;background:white;color:#222;font:20px/1.6 Arial}h1{font-size:28px}table{width:100%;border-collapse:collapse}td{padding:12px 0;border-bottom:1px solid #ddd}td:last-child{text-align:right}p{margin:24px 0}small{font-size:16px}</style></head><body><h1>SYNTHETIC TEST RECEIPT</h1><p>Not a real purchase<br>${fixture.label}<br>Currency: MYR</p><table>${fixture.receipt.items.map(i=>`<tr><td>${i.description}<br><small>${i.quantity} x RM${(i.unit_sen/100).toFixed(2)}</small></td><td>RM${(i.line_sen/100).toFixed(2)}</td></tr>`).join('')}</table><p><strong>Total: RM${(fixture.receipt.total_sen/100).toFixed(2)}</strong></p><small>No shared tax, discount or shipping.<br>Created only for Gantiin acceptance tests.</small></body></html>`);
    if(fixture.receipt.adjustments?.length)await page.locator('body > small').evaluate((el,adjustments)=>{el.innerHTML=adjustments.map(a=>`${a.description}: ${a.treatment==='subtract'?'-':'+'}RM${(a.amount_sen/100).toFixed(2)} (whole receipt)`).join('<br>')+'<br>Created only for Gantiin acceptance tests.';},fixture.receipt.adjustments);
    await page.screenshot({path:`frontend/demo/${fixture.file}`,fullPage:true});
  }
} finally {await browser.close();}
