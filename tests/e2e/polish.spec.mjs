import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startTestServer } from '../../scripts/e2e-server.mjs';

let app;
test.use({baseURL:'http://127.0.0.1:3106'});
test.beforeAll(async()=>{app=await startTestServer({port:3106});});
test.afterAll(async()=>{await app.close();});
async function login(page,role='Committee') {
  await page.goto('/');await page.getByRole('tab',{name:role,exact:true}).click();
  if(role==='Committee')await page.getByLabel('Email',{exact:true}).fill('cmt.one@example.test');
  await page.getByLabel('Password',{exact:true}).fill('Synthetic-only-password42');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeVisible();
}
async function scan(page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
}
test('View and the upper-left Back arrow preserve CMT filters and lead to the actual receipt',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await login(page);
  await page.getByLabel('Receipt image').setInputFiles('apps/web/demo/printing.png');await page.getByRole('button',{name:'Submit',exact:true}).click();
  await expect(page.locator('.result-status')).toContainText('Paid',{timeout:15000});
  await page.getByRole('link',{name:'Back to history',exact:true}).click();
  await page.getByLabel('Find a submission').fill('CMT One');await page.getByLabel('Sort by').selectOption('amount-asc');await page.getByLabel('Payment status').selectOption('succeeded');
  const view=page.getByRole('link',{name:/View receipt from Synthetic CMT One/});await expect(view).toContainText('View');await view.focus();await page.keyboard.press('Enter');
  const back=page.getByRole('link',{name:'Back to history',exact:true});await expect(back).toBeVisible();
  expect((await back.boundingBox()).y).toBeLessThan((await page.getByRole('heading',{name:'Receipt result',exact:true}).boundingBox()).y);
  await scan(page);await page.screenshot({path:'.cache/reports/browser/polish-receipt-desktop.png',fullPage:true});await back.click();
  await expect(page.getByLabel('Find a submission')).toHaveValue('CMT One');await expect(page.getByLabel('Sort by')).toHaveValue('amount-asc');await expect(page.getByLabel('Payment status')).toHaveValue('succeeded');
  for(const width of [1440,768,375,320]) {await page.setViewportSize({width,height:900});await scan(page);await expect(view).toBeVisible();const box=await view.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);await page.screenshot({path:`.cache/reports/browser/polish-history-${width}.png`,fullPage:true});}
});
test('Treasurer settings show concise and truthful configuration, persist event input and adapt at narrow widths',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await login(page,'Treasurer');
  await expect(page.locator('.recent-panel')).toHaveCount(0);await expect(page.getByRole('link',{name:'View history',exact:true})).toHaveCount(0);
  await page.getByRole('link',{name:'Settings',exact:true}).click();await expect(page.locator('.account-profile')).toHaveCount(0);await expect(page.getByRole('form',{name:'Change password',exact:true})).toBeVisible();expect((await page.locator('.account-password').boundingBox()).width).toBeGreaterThan(800);
  for(const width of [1440,768,375,320]) {await page.setViewportSize({width,height:900});await scan(page);await page.screenshot({path:`.cache/reports/browser/polish-account-${width}.png`,fullPage:true});}
  await page.setViewportSize({width:1440,height:1000});await page.getByRole('link',{name:'Connections',exact:true}).click();await expect(page.locator('.service-row')).toHaveCount(4);await expect(page.locator('.service-row').filter({hasText:'Google Sheets'})).toContainText('Simulated');await expect(page.locator('.service-row').filter({hasText:'PayPal sign-in'})).toContainText('Not configured');await expect(page.getByText('Recovery',{exact:true})).toHaveCount(0);
  await page.route('**/api/integrations',route=>route.fulfill({json:{budget_source:'google',google:true,ai:false,paypal:true,paypal_login:true}}));
  await page.route('**/api/session',async route=>{const response=await route.fetch();await route.fulfill({json:{...await response.json(),mode:'sandbox'}});});await page.reload();
  await expect(page.locator('.service-row').filter({hasText:'Google Sheets'})).toContainText('Configured');await expect(page.locator('.service-row').filter({hasText:'Receipt AI'})).toContainText('Not configured');
  for(const width of [1440,768,375,320]) {await page.setViewportSize({width,height:900});await scan(page);await page.screenshot({path:`.cache/reports/browser/polish-connections-${width}.png`,fullPage:true});}
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('link',{name:'Event Policy',exact:true}).click();await page.getByLabel('Event name',{exact:true}).fill('Campus Career Day');await page.getByLabel('Event description',{exact:true}).fill('Career workshops for students, with printed programmes and registration supplies.');await page.getByRole('button',{name:'Save event',exact:true}).click();await expect(page.getByText('Event saved.',{exact:true})).toBeVisible();
  await page.reload();await expect(page.getByLabel('Event name',{exact:true})).toHaveValue('Campus Career Day');
  await page.getByLabel('Event description',{exact:true}).focus();await expect(page.getByLabel('Event description',{exact:true})).toHaveValue('Career workshops for students, with printed programmes and registration supplies.');
  for(const width of [1440,768,375,320]) {await page.setViewportSize({width,height:900});await scan(page);await page.screenshot({path:`.cache/reports/browser/polish-event-${width}.png`,fullPage:true});}
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await scan(page);
});
test('PayPal linking shows the required input only when needed, preserves errors and discloses linked-account changes',async({page})=>{
  let linked=false;
  await page.route('**/api/session',async route=>{const response=await route.fetch(),session=await response.json();await route.fulfill({json:{...session,paypal_login:true,paypal_sender_configured:true,...(session.user?{user:{...session.user,paypal_linked:linked}}:{})}});});
  await login(page,'Committee');await page.getByRole('link',{name:'Settings',exact:true}).click();await expect(page.getByRole('form',{name:'Change password',exact:true})).toBeVisible();await page.getByRole('navigation',{name:'Account sections'}).getByRole('link',{name:'Email',exact:true}).click();
  const form=page.locator('[data-form="paypal"]');await expect(form).toBeVisible();await expect(page.getByLabel('Website password',{exact:true})).toHaveValue('');
  await page.route('**/api/paypal/link',route=>route.fulfill({status:503,json:{error:'PayPal sign-in is temporarily unavailable.'}}));
  await page.getByLabel('Website password',{exact:true}).fill('Synthetic-only-password42');await form.getByRole('button',{name:'Link PayPal',exact:true}).click();await expect(form.getByRole('alert')).toContainText('PayPal sign-in is temporarily unavailable.');await expect(page.getByLabel('Website password',{exact:true})).toHaveValue('Synthetic-only-password42');await scan(page);
  linked=true;await page.reload();await expect(form).toBeHidden();await expect(page.locator('.account-paypal .connection-status').first()).toHaveText('Linked');
  const disclosure=page.locator('.relink-account summary');await disclosure.focus();await page.keyboard.press('Enter');await expect(form).toBeVisible();await form.getByRole('button',{name:'Show password',exact:true}).click();await expect(page.getByLabel('Website password',{exact:true})).toHaveAttribute('type','text');await scan(page);
  for(const width of [1440,768,375,320]) {await page.setViewportSize({width,height:900});await scan(page);await page.screenshot({path:`.cache/reports/browser/polish-committee-account-${width}.png`,fullPage:true});}
  await page.setViewportSize({width:375,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await scan(page);
});
