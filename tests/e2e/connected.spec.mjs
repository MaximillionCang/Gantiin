import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startTestServer } from '../../scripts/e2e-server.mjs';

test.use({baseURL:'http://127.0.0.1:3102'});
let app;
test.beforeAll(async()=>{app=await startTestServer({port:3102,worker:false});});
test.afterAll(async()=>{await app?.close();});
async function login(page,role='committee') {
  await page.goto('/');await page.getByRole('tab',{name:role==='treasurer'?'Treasurer':'Committee',exact:true}).click();
  if(role==='committee')await page.getByLabel('Email',{exact:true}).fill('cmt.one@example.test');
  await page.getByLabel('Password',{exact:true}).fill('Synthetic-only-password42');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeAttached();
}
async function scan(page) {
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>v.id)).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
test('Treasurer saves only event name and description, retaining versioning without manual rules',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await login(page,'treasurer');
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('link',{name:'Event Policy',exact:true}).click();
  const original=app.store.setting('event');await expect(page.locator('[data-rule],#ambiguity,#currency')).toHaveCount(0);
  const name=page.getByLabel('Event name',{exact:true}),description=page.getByLabel('Event description',{exact:true});
  await expect(name).toHaveValue('');await expect(description).toHaveValue('');
  await expect(name).toHaveAttribute('placeholder','e.g. Campus Career Day 2026');await expect(description).toHaveAttribute('placeholder','Describe your event, its purpose, and the purchases needed.');
  await scan(page);await page.screenshot({path:'.cache/reports/browser/event-placeholders-desktop.png',fullPage:true});
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await scan(page);await page.screenshot({path:`.cache/reports/browser/event-placeholders-${width}.png`,fullPage:true});}
  await page.setViewportSize({width:1440,height:1000});
  for(const control of [name,description]){
    await control.focus();expect(await control.evaluate(el=>getComputedStyle(el,'::placeholder').opacity)).toBe('0');await expect(control).toHaveValue('');
    await page.keyboard.press('Tab');expect(await control.evaluate(el=>getComputedStyle(el,'::placeholder').opacity)).toBe('1');
  }
  await page.getByRole('button',{name:'Save event'}).click();await expect(name).toHaveAttribute('aria-invalid','true');await expect(description).toHaveAttribute('aria-invalid','true');await expect(page.locator('#toast')).toBeHidden();expect(app.store.setting('event')).toEqual(original);
  await page.getByLabel('Event name',{exact:true}).fill('One-Day Campus Seminar');await page.getByLabel('Event description',{exact:true}).fill('A campus career seminar for student registration, printed participant handouts and event signage. Personal purchases are not reimbursed.');expect(app.store.setting('event')).toEqual(original);
  await scan(page);await page.screenshot({path:'.cache/reports/browser/connected-policy-draft-desktop.png',fullPage:true});
  const saved=page.waitForRequest(request=>request.url().endsWith('/api/event')&&request.method()==='PUT');await page.getByRole('button',{name:'Save event'}).click();expect(Object.keys((await saved).postDataJSON()).sort()).toEqual(['description','expected_version','name']);await expect(page.getByText('Event saved.',{exact:true})).toBeVisible();expect(app.store.setting('event').name).toBe('One-Day Campus Seminar');expect(app.store.setting('event').policy_input).toBe('event_description');
  const toast=page.locator('#toast'),close=page.getByRole('button',{name:'Dismiss notification'}),save=page.getByRole('button',{name:'Save event'});
  await expect(toast.getByRole('status')).toHaveText('Event saved.');await expect(page.locator('[data-form="policy"] [data-message]')).toBeEmpty();
  expect(await toast.evaluate(el=>getComputedStyle(el).position)).toBe('fixed');expect(await toast.evaluate(el=>el.contains(document.activeElement))).toBe(false);
  const formPosition=await name.boundingBox();await close.focus();await scan(page);await page.screenshot({path:'.cache/reports/browser/event-toast-desktop.png',fullPage:true});
  await page.waitForTimeout(4100);await expect(toast).toBeVisible();await page.keyboard.press('Enter');await expect(toast).toBeHidden();await expect(save).toBeFocused();expect((await name.boundingBox()).y).toBe(formPosition.y);
  await save.click();await expect(toast).toBeVisible();
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await toast.hover();await expect(toast).toBeInViewport();await scan(page);await page.screenshot({path:`.cache/reports/browser/event-toast-${width}.png`,fullPage:true});}
  const mobilePosition=await name.boundingBox();await page.mouse.move(0,0);await expect(toast).toBeHidden({timeout:6000});expect((await name.boundingBox()).y).toBe(mobilePosition.y);
  await page.reload();await expect(name).toHaveValue('One-Day Campus Seminar');
  const savedDescription=app.store.setting('event').description;
  for(const control of [name,description]){const value=await control.inputValue();await control.click();await expect(control).toHaveValue(value);}
  await expect(description).toHaveValue(savedDescription);
  await page.setViewportSize({width:390,height:844});await scan(page);await page.screenshot({path:'.cache/reports/browser/connected-policy-mobile.png',fullPage:true});
});
test('real fixture path shows extraction, net RM72, confirmed payment, separate sync recovery and responsive evidence',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.setViewportSize({width:1440,height:1000});await login(page);
  await expect(page.getByText('One-Day Campus Seminar',{exact:true})).toBeVisible();await expect(page.getByText('Reimbursement rules',{exact:true})).toHaveCount(0);
  await page.getByLabel('Receipt image').setInputFiles('frontend/demo/net-cost.png');await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.getByRole('heading',{name:'Receipt result',exact:true})).toBeVisible();
  const ai=app.service.providers.ai;const original=ai.extract.bind(ai);let release;const held=new Promise(resolve=>release=resolve);ai.extract=async(...args)=>{await held;return original(...args);};
  app.service.providers.sheets.failSync=true;const processing=app.service.tick();
  try {await expect(page.getByText('Reading receipt',{exact:true})).toBeVisible({timeout:10000});}finally{release();await processing;ai.extract=original;}
  await expect(page.getByText('Sync pending',{exact:true})).toBeVisible({timeout:10000});await expect(page.locator('.receipt-total dd')).toHaveText('RM90.00');
  const why=page.getByRole('button',{name:'Why rejected',exact:true}),popup=page.locator('#rejection-dialog');await expect(why).toBeVisible();const tableWidth=(await page.locator('.result-items table').boundingBox()).width;await why.click();await expect(popup).toBeVisible();await expect(popup.locator('p')).toContainText('Personal headphones');expect((await page.locator('.result-items table').boundingBox()).width).toBe(tableWidth);await popup.getByRole('button',{name:'Close rejection reason'}).click();
  await expect(page.locator('.reimbursed-total dd')).toHaveText('RM72.00');await expect(page.getByRole('button',{name:'Retry sync'})).toBeVisible();
  const evidence=await (await page.request.get(`/api/claims/${page.url().split('/claim/')[1]}`)).json();expect(evidence.eligible_sen).toBe(7200);expect(evidence.receipt.adjustments[0].amount_sen).toBe(1000);expect(evidence.receipt.items[0].net_sen).toBe(7200);expect(evidence.models.ocr).toBe('synthetic-ocr-v2 (no AI service)');
  for(const removed of ['Decision details','Assessment and payment record','Assessed policy snapshot','Spreadsheet reference snapshot','Goods before discounts'])await expect(page.getByText(removed,{exact:true})).toHaveCount(0);
  await scan(page);await page.screenshot({path:'.cache/reports/browser/connected-net-sync-pending-desktop.png',fullPage:true});
  await page.getByText('Error details',{exact:true}).click();await why.click();const pending=app.store.payments()[0];pending.error.message='Synthetic Sheets write failure. Retained for recovery.';app.store.savePayment(pending);await expect(page.locator('.operation-error p')).toHaveText(pending.error.message,{timeout:10000});
  await expect(popup).toBeVisible();await popup.getByRole('button',{name:'Close rejection reason'}).click();await expect(why).toBeFocused();
  expect(app.service.providers.paypal.creates).toBe(1);app.service.providers.sheets.failSync=false;
  await page.getByRole('button',{name:'Retry sync'}).click();await app.service.tick();await expect(page.getByText('Sync pending',{exact:true})).toHaveCount(0,{timeout:10000});expect(app.store.payments()[0].sync).toBe('synced');
  expect(app.service.providers.paypal.creates).toBe(1);expect(app.store.setting('fixture_sheet').transactions.length).toBe(1);expect(app.store.setting('fixture_sheet').items.length).toBe(1);
  for(const width of [1440,1024,768,390,320]){await page.setViewportSize({width,height:900});await scan(page);await expect(page.locator('.receipt-totals dd')).toHaveCount(2);expect(await page.locator('.receipt-totals dd').evaluateAll(values=>values.every(el=>el.getBoundingClientRect().height<=parseFloat(getComputedStyle(el).lineHeight)+1))).toBe(true);if([1440,390,320].includes(width))await page.screenshot({path:`.cache/reports/browser/connected-net-result-${width}.png`,fullPage:true});}
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await scan(page);await page.evaluate(()=>document.documentElement.style.fontSize='');
  await page.setViewportSize({width:812,height:375});await scan(page);expect(errors).toEqual([]);
});

test('technical extraction failure retains readable charge evidence and retries the same claim without payout',async({page})=>{
  await login(page);const ai=app.service.providers.ai;const original=ai.extract.bind(ai);
  ai.extract=async(...args)=>{const result=await original(...args);return {...result,readable:true,currency_source_text:'MYR',total_source_text:'Total RM40.00',source_text:'Synthetic unsupported charge evidence',items:result.items.map((i,n)=>({...i,id:`item-${n+1}`,source_text:i.description,line_basis:'gross',discounts:[]})),adjustments:[{kind:'other',description:'Unsupported service charge',source_text:'Service charge RM1.00',amount_sen:100,treatment:'unknown',scope:'unknown',item_ids:[]}]};};
  try {
    await page.getByLabel('Receipt image').setInputFiles('frontend/demo/printing.png');await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.getByRole('heading',{name:'Receipt result',exact:true})).toBeVisible();const claimUrl=page.url();await app.service.tick();
    await expect(page.getByText('Processing failed',{exact:true})).toBeVisible({timeout:10000});await page.getByText('Error details',{exact:true}).focus();await page.keyboard.press('Enter');const retained=await (await page.request.get(`/api/claims/${page.url().split('/claim/')[1]}`)).json();expect(retained.extraction_evidence.adjustments[0].source_text).toBe('Service charge RM1.00');await scan(page);await page.screenshot({path:'.cache/reports/browser/connected-extraction-recovery.png',fullPage:true});
    const creates=app.service.providers.paypal.creates;await page.getByRole('button',{name:'Retry processing'}).click();await app.service.tick();await expect(page.getByText('Processing failed',{exact:true})).toBeVisible({timeout:10000});expect(page.url()).toBe(claimUrl);expect(app.service.providers.paypal.creates).toBe(creates);
  } finally {ai.extract=original;}
});

test('overview uses backend balances and history refresh preserves the search being edited',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await login(page,'treasurer');
  await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
  const budget=await (await page.request.get('/api/budget')).json();
  const claims=await (await page.request.get('/api/claims')).json();
  const money=value=>new Intl.NumberFormat('en-MY',{style:'currency',currency:'MYR',useGrouping:false}).format(value/100).replace(/\s/g,'');
  await expect(page.locator('.balance .amount')).toHaveText(money(budget.available_sen));
  await expect(page.locator('.outcome-panel .amount').last()).toHaveText(money(claims.reduce((sum,c)=>sum+c.paid_sen,0)));
  await expect(page.locator('.recent-panel')).toHaveCount(0);await expect(page.getByRole('link',{name:'View history',exact:true})).toHaveCount(0);
  await expect(page.locator('.activity-total strong')).toHaveText(String(claims.length));
  expect(await page.evaluate(()=>{const labels=[...document.querySelectorAll('.chart-days > span')];return [...document.querySelectorAll('.chart-bar')].every((bar,i)=>{const b=bar.getBoundingClientRect(),l=labels[i].getBoundingClientRect();return Math.abs(b.x+b.width/2-l.x-l.width/2)<2;});})).toBe(true);
  await scan(page);await page.screenshot({path:'.cache/reports/browser/healthy-overview-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await scan(page);await page.screenshot({path:'.cache/reports/browser/healthy-overview-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1000});await expect(page.getByRole('link',{name:'Search reimbursements',exact:true})).toHaveCount(0);await page.getByRole('link',{name:'History',exact:true}).click();
  const search=page.getByRole('searchbox',{name:'Find a submission'});await search.focus();
  let release;const held=new Promise(resolve=>release=resolve);let started;const requested=new Promise(resolve=>started=resolve);
  await page.route('**/api/claims',async route=>{const response=await route.fetch();started();await held;await route.fulfill({response});},{times:1});
  await page.getByRole('button',{name:'Refresh history',exact:true}).click();await requested;
  try {await search.fill(claims[0].id);await expect(search).toBeFocused();await expect(page.getByRole('button',{name:'Refreshing...',exact:true})).toBeDisabled();}finally{release();}
  await expect(page.getByRole('button',{name:'Refresh history',exact:true})).toBeEnabled();await expect(search).toHaveValue(claims[0].id);await expect(search).toBeFocused();
  await expect(page.locator('#history-results tbody tr')).toHaveCount(1);await expect(page.locator('#history-results tbody a').first()).toHaveAttribute('href',`#/claim/${claims[0].id}`);
  await page.route('**/api/claims',route=>route.fulfill({status:503,json:{error:'History temporarily unavailable. Try again.'}}),{times:1});
  await page.getByRole('button',{name:'Refresh history',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('History temporarily unavailable. Try again.');await expect(search).toHaveValue(claims[0].id);await expect(page.locator('#history-results tbody tr')).toHaveCount(1);
  await search.focus();await expect(search).toBeFocused();
  await page.getByRole('button',{name:'Refresh history',exact:true}).click();await expect(page.getByRole('button',{name:'Refresh history',exact:true})).toBeEnabled();await expect(page.locator('#history-refresh-error')).toHaveCount(0);await scan(page);
});

test('Treasurer opens the configured spreadsheet in a new tab and a missing Google budget never shows demo money',async({page,context})=>{
  const config=app.service.config,previous={spreadsheet:config.spreadsheet,budgetSource:config.budgetSource,googleKey:config.googleKey};
  config.spreadsheet='configured_demo_sheet_123';
  try {
    await page.setViewportSize({width:1440,height:1000});await login(page,'treasurer');
    const shortcut=page.getByRole('link',{name:'Open spreadsheet',exact:true});await expect(shortcut).toHaveAttribute('href','https://docs.google.com/spreadsheets/d/configured_demo_sheet_123/edit');await expect(shortcut).toHaveAttribute('rel','noopener noreferrer');
    await context.route('https://docs.google.com/spreadsheets/d/configured_demo_sheet_123/edit',route=>route.fulfill({contentType:'text/html',body:'<html lang="en"><title>Spreadsheet destination</title><h1>Spreadsheet destination</h1></html>'}));
    const opened=context.waitForEvent('page');await shortcut.click();const sheet=await opened;await expect(sheet.getByRole('heading',{name:'Spreadsheet destination'})).toBeVisible();await sheet.close();
    config.budgetSource='google';config.googleKey='fixture-unreadable-file';await page.reload();await expect(page.locator('.balance .amount')).toHaveText('Unavailable');await expect(page.locator('.balance')).not.toContainText('RM100.00');await scan(page);await page.screenshot({path:'.cache/reports/browser/google-budget-unavailable-desktop.png',fullPage:true});
    await page.setViewportSize({width:320,height:844});await scan(page);await expect(shortcut).toBeVisible();await page.screenshot({path:'.cache/reports/browser/google-budget-unavailable-mobile.png',fullPage:true});
    await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('link',{name:'Connections',exact:true}).click();await expect(page.locator('.service-row').filter({hasText:'Google Sheets'})).toContainText('Configured');
  }finally{Object.assign(config,previous);}
});
