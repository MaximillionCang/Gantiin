import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startTestServer } from '../../scripts/e2e-server.mjs';

test.use({baseURL:'http://127.0.0.1:3103'});
let app;
async function expectSyncedPayment(page) {await expect(page.locator('.result-status').getByText('Paid',{exact:true})).toBeVisible({timeout:15000});await expect.poll(async()=>{const claim=await (await page.request.get(`/api/demo-cmt/claims/${page.url().split('/claim/')[1]}`)).json();return claim.payment?.sync;},{timeout:15000}).toBe('synced');}
test.beforeAll(async()=>{app=await startTestServer({port:3103});});
test.afterAll(async()=>{await app?.close();});
async function scan(page) {
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(value=>value.id)).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
async function enterDemo(page) {
  await page.goto('/');
  const response=await page.request.post('/api/demo-cmt/login',{headers:{Origin:'http://127.0.0.1:3103'},data:{}});expect(response.ok()).toBe(true);
  await page.evaluate(()=>sessionStorage.setItem('gantiin.demo','true'));await page.goto('/#/submit');await page.reload();await expect(page.getByRole('heading',{name:'Submit a receipt',exact:true})).toBeVisible();
}

test('Committee-only demo entry, sample receipt, reset confirmation and repeat submission stay isolated',async({page,context})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');
  const primary=JSON.stringify({users:app.store.users(),claims:app.store.claims(),sheet:app.store.setting('fixture_sheet'),event:app.store.setting('event')});
  await page.getByRole('tab',{name:'Treasurer',exact:true}).click();await expect(page.getByRole('button',{name:'Try demo',exact:true})).toHaveCount(0);
  await page.getByRole('tab',{name:'Committee',exact:true}).click();await expect(page.getByRole('button',{name:'Try demo',exact:true})).toHaveCount(0);await scan(page);
  await enterDemo(page);await expect(page.getByText('Simulation',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>sessionStorage.getItem('gantiin.demo'))).toBe('true');expect(await page.evaluate(()=>localStorage.getItem('gantiin.committee-email'))).toBeNull();
  await page.getByRole('button',{name:'Use sample',exact:true}).click();await expect(page.locator('.selected-file')).toContainText('01-printing-and-registration.png');await scan(page);await page.screenshot({path:'.cache/reports/browser/demo-receipt-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Submit',exact:true}).click();await expectSyncedPayment(page);await expect(page.locator('.reimbursed-total dd')).toHaveText('RM200.00');await expect(page.locator('.receipt-total dd')).toHaveText('RM239.90');await expect(page.locator('.receipt-totals dl')).toHaveCount(2);
  for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});const why=page.getByRole('button',{name:'Why rejected',exact:true}),popup=page.getByRole('dialog',{name:'Stainless thermal tumbler 450ml',exact:true});await expect(page.locator('#rejection-dialog')).toBeHidden();await scan(page);await page.screenshot({path:`.cache/reports/browser/concise-demo-result-${width}.png`,fullPage:true});const before=(await page.locator('.result-items table').boundingBox()).width;await why.click();await expect(popup).toBeVisible();await expect(popup.locator('p')).toContainText('Thermal drinkware');expect((await page.locator('.result-items table').boundingBox()).width).toBe(before);await scan(page);await page.screenshot({path:`.cache/reports/browser/rejection-popup-${width}.png`,fullPage:true});if(width===1440)await page.keyboard.press('Escape');else if(width===390)await popup.getByRole('button',{name:'Close rejection reason'}).click();else await page.mouse.click(2,2);await expect(popup).toBeHidden();await expect(why).toBeFocused();}await page.setViewportSize({width:1440,height:1000});
  const receiptLink=page.getByRole('link',{name:'Open receipt image',exact:true}),oldReceipt=await receiptLink.getAttribute('href');expect(oldReceipt).toMatch(/^\/api\/demo-cmt\/claims\//);
  const opened=context.waitForEvent('page');await receiptLink.click();const image=await opened;await image.waitForLoadState();expect(image.url()).toContain('/api/demo-cmt/claims/');await image.close();
  await page.reload();await expectSyncedPayment(page);await page.getByRole('link',{name:'History',exact:true}).click();await expect(page.locator('#history-results tbody tr')).toHaveCount(1);await expect(page.locator('.history-total strong')).toHaveText('RM200.00');await expect(page.locator('.history-panel thead th')).toHaveCount(4);await scan(page);await page.screenshot({path:'.cache/reports/browser/concise-demo-history.png',fullPage:true});
  const reset=page.getByRole('button',{name:'Reset demo',exact:true});await reset.click();const dialog=page.getByRole('dialog',{name:'Reset demo?',exact:true});await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(reset).toBeFocused();
  await reset.click();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('#history-results tbody tr')).toHaveCount(1);
  await reset.click();await scan(page);await page.screenshot({path:'.cache/reports/browser/demo-reset-desktop.png',fullPage:true});await dialog.getByRole('button',{name:'Reset demo',exact:true}).click();await expect(page.getByText('Demo reset.',{exact:true})).toBeVisible();await expect(page.getByText('No reimbursements yet',{exact:true})).toBeVisible();expect((await page.request.get(oldReceipt)).status()).toBe(404);
  expect(JSON.stringify({users:app.store.users(),claims:app.store.claims(),sheet:app.store.setting('fixture_sheet'),event:app.store.setting('event')})).toBe(primary);expect(app.demo.store.users().filter(user=>user.role==='treasurer')).toHaveLength(0);
  await page.getByRole('link',{name:'Submit Receipt',exact:true}).click();await page.getByRole('button',{name:'Use sample',exact:true}).click();await page.getByRole('button',{name:'Submit',exact:true}).click();await expectSyncedPayment(page);
  await page.getByRole('button',{name:'Exit demo',exact:true}).click();await expect(page.getByRole('heading',{name:'Welcome',exact:true})).toBeVisible();
  await page.getByLabel('Email',{exact:true}).fill('cmt.one@example.test');await page.getByLabel('Password',{exact:true}).fill('Synthetic-only-password42');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('button',{name:'Use sample',exact:true})).toHaveCount(0);await page.getByRole('link',{name:'History',exact:true}).click();await expect(page.getByRole('button',{name:'Reset demo',exact:true})).toHaveCount(0);await expect(page.getByText('No reimbursements yet',{exact:true})).toBeVisible();
});

test('demo login and Settings reset work at narrow widths, with keyboard focus and enlarged text',async({page})=>{
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.goto('/');await scan(page);await page.screenshot({path:`.cache/reports/browser/demo-login-${width}.png`,fullPage:true});}
  await enterDemo(page);await scan(page);await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('link',{name:'Account',exact:true}).click();await expect(page.getByRole('heading',{name:'Account',exact:true})).toBeVisible();await expect(page.getByLabel('Current password',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Reset demo',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Reset demo?',exact:true});await scan(page);await page.screenshot({path:'.cache/reports/browser/demo-reset-320.png',fullPage:true});
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await scan(page);await page.evaluate(()=>document.documentElement.style.fontSize='');
  await dialog.getByRole('button',{name:'Reset demo',exact:true}).click();await expect(page.getByText('Demo reset.',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'My reimbursements',exact:true})).toBeVisible();await scan(page);
});
