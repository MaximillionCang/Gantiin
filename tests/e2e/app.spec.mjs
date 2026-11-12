import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync,writeFileSync } from 'node:fs';

const password='Synthetic-only-password42';
const glassEvidence=[];
async function expectSyncedPayment(page) {await expect(page.locator('.result-status').getByText('Paid',{exact:true})).toBeVisible({timeout:15000});await expect.poll(async()=>{const claim=await (await page.request.get(`/api/claims/${page.url().split('/claim/')[1]}`)).json();return claim.payment?.sync;},{timeout:15000}).toBe('synced');}
test.afterAll(()=>writeFileSync('.cache/reports/browser/controls-contrast.json',JSON.stringify(glassEvidence,null,2)));
async function login(page,email='treasurer@example.test',pass=password) {
  await page.goto('/');
  await page.getByRole('tab',{name:email==='treasurer@example.test'?'Treasurer':'Committee',exact:true}).click();
  if(email!=='treasurer@example.test')await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill(pass);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('button',{name:'Sign out',exact:true,includeHidden:true})).toBeAttached();
}
async function openSettings(page,section='Account') {
  const settings=page.getByRole('button',{name:'Settings',exact:true});
  if(!await settings.isVisible())await page.getByRole('button',{name:'Menu',exact:true}).click();
  if(await settings.getAttribute('aria-expanded')!=='true')await settings.click();
  await page.getByRole('navigation',{name:'Settings sections'}).getByRole('link',{name:section,exact:true}).click();
}
async function noOverflow(page) {expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
async function dropReceipt(page,name) {
  const dataTransfer=await page.evaluateHandle(({name,bytes})=>{const data=new DataTransfer();data.items.add(new File([new Uint8Array(bytes)],name,{type:'image/png'}));return data;},{name,bytes:Array.from(readFileSync(`apps/web/demo/${name}`))});
  await page.locator('[data-dropzone]').dispatchEvent('dragenter',{dataTransfer});await expect(page.locator('[data-dropzone]')).toHaveClass(/is-dragging/);
  await page.locator('[data-dropzone]').dispatchEvent('drop',{dataTransfer});await dataTransfer.dispose();await expect(page.locator('.selected-file')).toContainText(name);await expect(page.locator('[data-dropzone]')).not.toHaveClass(/is-dragging/);
}
async function sidebarReview(page) {
  await expect(page.locator('.sidebar').getByRole('img',{name:'Gantiin',exact:true})).toBeVisible();
  await expect(page.locator('.sidebar .mode-chip')).toHaveCount(0);
  const items=page.getByRole('navigation',{name:'Main navigation'}).getByRole('link');
  await expect(items).toHaveCount(2);await expect(items.nth(1)).toHaveAccessibleName('History');await expect(page.getByRole('button',{name:'Settings',exact:true})).toBeVisible();
  if(await page.getByRole('button',{name:'Menu',exact:true}).isHidden())expect((await page.locator('.sidebar').boundingBox()).width).toBe(232);
  expect(await items.evaluateAll(links=>links.every(link=>{const label=link.querySelector('span').getBoundingClientRect(),row=link.getBoundingClientRect();return link.querySelector('svg')&&getComputedStyle(link).whiteSpace==='nowrap'&&label.right<=row.right-8;}))).toBe(true);
}
async function accessibility(page) {
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  await glassControls(page);
}
async function glassControls(page) {
  const controls=await page.locator('button, a.button, summary, .sidebar nav a, .settings-tabs a').evaluateAll(elements=>{
    const color=value=>{if(value.trim().startsWith('#')){const s=value.trim().slice(1);return [parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16),1];}const v=value.match(/[\d.]+/g)?.map(Number)||[0,0,0,0];return [...v.slice(0,3),v[3]??1];};
    const over=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3]));
    const luminance=a=>a.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const contrast=(a,b)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(hi+.05)/(lo+.05);};
    return elements.filter(el=>el.getClientRects().length&&!el.classList.contains('password-toggle')&&el.getAttribute('role')!=='tab').map(el=>{
      const css=getComputedStyle(el);let background=[255,255,255];const ancestors=[];
      for(let node=el.parentElement;node;node=node.parentElement)ancestors.unshift(node);
      for(const node of ancestors)background=over(color(getComputedStyle(node).backgroundColor),background);
      const base=over(color(css.backgroundColor),background);const foreground=color(css.color).slice(0,3);
      return {name:el.textContent.trim().slice(0,120),ratio:contrast(foreground,base),height:el.getBoundingClientRect().height,material:css.backdropFilter==='none'&&!css.backgroundImage.includes('conic-gradient'),disabled:el.disabled===true,loading:el.getAttribute('aria-busy')==='true',selected:el.getAttribute('aria-current')==='page'};
    });
  });
  expect(controls.filter(c=>!c.material||c.height<44||c.ratio<4.5)).toEqual([]);
  glassEvidence.push({route:page.url().split('#')[1]||'entry',controls});
}

test('sliding role tabs: compact centered forms, password-only Treasurer, errors/loading and mobile keyboard viewport',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');
  await expect(page.getByRole('tab',{name:'Committee',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(page.locator('form')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'PayPal',exact:true})).toBeDisabled();
  await expect(page.locator('.login-backdrop')).toHaveCount(0);
  const card=await page.locator('.login-card').boundingBox();
  expect((await page.getByRole('heading',{name:'Welcome',exact:true}).boundingBox()).y).toBeLessThan((await page.getByRole('tablist',{name:'Sign-in role'}).boundingBox()).y);
  await expect(page.getByPlaceholder('Email',{exact:true})).toBeVisible();await expect(page.getByPlaceholder('Password',{exact:true})).toBeVisible();
  expect(Math.abs(card.x+card.width/2-720)).toBeLessThan(2);expect(Math.abs(card.y+card.height/2-500)).toBeLessThan(2);
  await glassControls(page);await accessibility(page);
  await page.getByRole('tab',{name:'Committee',exact:true}).focus();await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab',{name:'Treasurer',exact:true})).toBeFocused();
  const treasurerCard=await page.locator('.login-card').boundingBox();expect(treasurerCard.height).toBeLessThan(card.height);expect(treasurerCard.width).toBe(card.width);
  await expect(page.locator('input')).toHaveCount(1);await expect(page.getByLabel('Email',{exact:true})).toHaveCount(0);await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByText('ID: Treasurer',{exact:true})).toHaveCount(0);await expect(page.getByLabel('ID',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'There is a problem'})).toBeVisible();
  await page.getByLabel('Password',{exact:true}).fill('Incorrect-treasurer-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByText('Password is incorrect.',{exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Committee',exact:true}).hover();await glassControls(page);
  await page.getByRole('tab',{name:'Committee',exact:true}).click();await expect(page.getByLabel('Email',{exact:true})).toBeVisible();await expect(page.getByLabel('Password',{exact:true})).toHaveValue('');
  expect(await page.locator('.login-card').boundingBox()).toEqual(card);
  await accessibility(page);await glassControls(page);
  await page.setViewportSize({width:375,height:812});await page.screenshot({path:'.cache/reports/browser/role-selection-mobile.png',fullPage:true});await noOverflow(page);
  await page.screenshot({path:'.cache/reports/browser/committee-login-mobile.png',fullPage:true});await accessibility(page);await noOverflow(page);
  await page.getByRole('tab',{name:'Treasurer',exact:true}).click();await expect.poll(()=>page.locator('.role-indicator').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41)).toBe(0);await page.screenshot({path:'.cache/reports/browser/treasurer-login-mobile.png',fullPage:true});
  await page.setViewportSize({width:375,height:400});await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeInViewport();await page.getByRole('button',{name:'Sign in',exact:true}).hover();await glassControls(page);await noOverflow(page);
  let release;const held=new Promise(resolve=>release=resolve);
  await page.route('**/api/login/treasurer',async route=>{expect(route.request().postDataJSON()).toEqual({password});await held;await route.continue();});
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('button',{name:'Signing in...',exact:true})).toBeDisabled();await expect(page.getByRole('tab',{name:'Committee',exact:true})).toBeDisabled();await glassControls(page);
  release();await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();await page.unroute('**/api/login/treasurer');
});

test('desktop: login validation, every treasurer destination, account creation, versioned policy, password and sign out',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');
  const initialUrl=page.url();await page.getByRole('link',{name:'Skip to main content'}).focus();await page.keyboard.press('Enter');await expect(page.locator('#main')).toBeFocused();expect(page.url()).toBe(initialUrl);
  await accessibility(page);await page.screenshot({path:'.cache/reports/browser/role-selection-desktop.png',fullPage:true});
  await page.getByRole('tab',{name:'Committee',exact:true}).click();
  await page.screenshot({path:'.cache/reports/browser/committee-login-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('heading',{name:'There is a problem'})).toBeVisible();
  await page.getByRole('link',{name:/Email: /}).click();await expect(page.getByLabel('Email',{exact:true})).toBeFocused();
  await page.getByLabel('Email',{exact:true}).fill('treasurer@example.test');
  await page.keyboard.press('Tab');await expect(page.getByLabel('Password',{exact:true})).toBeFocused();
  expect(await page.getByLabel('Password',{exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('none');
  await expect(page.locator('.login-card > .login-footer')).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');await expect(page.getByLabel('Email',{exact:true})).toBeFocused();
  await page.getByRole('tab',{name:'Treasurer',exact:true}).click();
  await expect(page.getByLabel('Email',{exact:true})).toHaveCount(0);
  await page.screenshot({path:'.cache/reports/browser/treasurer-login-desktop.png',fullPage:true});
  await page.getByLabel('Password',{exact:true}).focus();
  await expect(page.getByLabel('Password',{exact:true})).toBeFocused();await page.keyboard.type(password);await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();await expect(page.getByText('Welcome, Treasurer',{exact:true})).toBeVisible();
  await expect(page.getByText('RM100.00',{exact:true}).first()).toBeVisible();
  const workspace=await page.locator('.workspace').boundingBox();expect(workspace.x).toBe(0);expect(workspace.width).toBe(1440);
  await expect(page.locator('.topline,.event-name,.role-label')).toHaveCount(0);
  await sidebarReview(page);
  await expect(page.getByRole('button',{name:'Refresh budget'})).toHaveCount(0);await expect(page.getByRole('heading',{name:'Latest payment outcomes'})).toHaveCount(0);await expect(page.getByRole('heading',{name:'Spreadsheet references'})).toHaveCount(0);
  await accessibility(page);await noOverflow(page);await page.screenshot({path:'.cache/reports/browser/budget-desktop.png',fullPage:true});
  await page.getByRole('link',{name:'History',exact:true}).click();
  await expect(page.getByRole('heading',{name:'No reimbursements yet'})).toBeVisible();
  await sidebarReview(page);
  await page.getByRole('button',{name:'Refresh history'}).click();
  await openSettings(page,'Committee Members');
  await expect(page.getByRole('heading',{name:'Committee members',exact:true})).toBeVisible();
  expect(await page.locator('.settings-tabs a').evaluateAll(links=>links.every(link=>getComputedStyle(link).backdropFilter==='none'&&Number(getComputedStyle(link).fontWeight)<=600))).toBe(true);
  await page.getByLabel('Member name').fill('Synthetic CMT Three');await page.getByLabel('Email',{exact:true}).fill('three@example.test');await page.getByLabel('Initial password').fill(password);
  await page.getByRole('button',{name:'Create CMT account'}).click();await expect(page.getByText('CMT account created.',{exact:false})).toBeVisible();await expect(page.getByText('three@example.test',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Event Policy',exact:true}).click();
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeInViewport();
  expect((await page.locator('.sidebar').boundingBox()).y).toBe(0);
  await expect(page.getByRole('heading',{name:'How decisions work',exact:true})).toHaveCount(0);
  await expect(page.locator('[data-form="policy"] input')).toHaveCount(1);await expect(page.locator('[data-form="policy"] textarea')).toHaveCount(1);await expect(page.getByRole('button',{name:'Add rule',exact:true})).toHaveCount(0);
  await page.getByLabel('Event name',{exact:true}).fill('Campus Career Day 2026');
  await page.getByLabel('Event description').fill('A campus career event with student registration, printed handouts and event signage.');
  await page.getByRole('button',{name:'Save event'}).click();await expect(page.getByText('Event saved.',{exact:true})).toBeVisible();
  await accessibility(page);
  await page.getByRole('link',{name:'Account',exact:true}).click();await page.getByLabel('Current password',{exact:true}).fill(password);await page.getByLabel('New password',{exact:true}).fill('Changed-synthetic-password42');await page.getByRole('button',{name:'Change password',exact:true}).click();await expect(page.getByText('Password changed.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByRole('tablist',{name:'Sign-in role'})).toBeVisible();
  await login(page,'treasurer@example.test','Changed-synthetic-password42');await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('CMT: synthetic selection, upload, mixed decisions, paid/synced, history search/filter, image, own-only view',async({page,context})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:1000});await login(page,'cmt.one@example.test');
  await expect(page.getByRole('heading',{name:'Submit a receipt',exact:true})).toBeVisible();
  await sidebarReview(page);
  await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.getByRole('heading',{name:'There is a problem'})).toBeVisible();await expect(page.getByRole('button',{name:'Submit',exact:true}).locator('svg')).toHaveCount(1);
  await expect(page.getByRole('heading',{name:'Your reimbursement totals',exact:true})).toHaveCount(0);await expect(page.getByRole('heading',{name:'Event policy',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Use synthetic receipt'})).toHaveCount(0);
  const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Browse files',exact:true}).click();await (await chooser).setFiles('apps/web/demo/mixed.png');await expect(page.locator('.selected-file')).toContainText('mixed.png');
  await expect(page.locator('.receipt-dropzone')).toHaveClass(/has-file/);await expect(page.locator('.dropzone-empty')).toBeHidden();await expect(page.locator('.selected-file')).toContainText(/PNG.*KB/);await expect(page.getByRole('button',{name:'Change file',exact:true})).toBeFocused();
  const originalPreview=context.waitForEvent('page');await page.getByRole('link',{name:'Open selected receipt',exact:true}).click();const previewPage=await originalPreview;await previewPage.waitForLoadState();expect(previewPage.url()).toContain('blob:');await previewPage.close();
  const replacement=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Change file',exact:true}).click();await (await replacement).setFiles('apps/web/demo/printing.png');await expect(page.locator('.selected-file')).toContainText('printing.png');await dropReceipt(page,'mixed.png');
  await page.getByLabel('Receipt image').setInputFiles({name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('not a receipt')});await expect(page.getByText('Select a PNG or JPEG up to 5 MiB.',{exact:true})).toBeVisible();await expect(page.locator('.selected-file')).toContainText('mixed.png');
  await page.getByRole('button',{name:'Remove file',exact:true}).click();await expect(page.locator('.selected-file')).toHaveCount(0);await dropReceipt(page,'mixed.png');
  expect((await page.locator('.receipt-review').boundingBox()).height).toBeLessThan(640);
  const picture=await page.locator('.receipt-preview').boundingBox(),actions=await page.locator('.receipt-file-actions').boundingBox();expect(actions.y).toBeGreaterThanOrEqual(picture.y+picture.height);
  await page.screenshot({path:'.cache/reports/browser/receipt-review-desktop.png',fullPage:true});
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await noOverflow(page);await accessibility(page);await page.screenshot({path:`.cache/reports/browser/receipt-review-${width}.png`,fullPage:true});}
  await page.setViewportSize({width:1440,height:1000});
  await expect(page.getByLabel('Purchase context')).toHaveCount(0);
  await accessibility(page);await page.screenshot({path:'.cache/reports/browser/submit-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.getByRole('heading',{name:'Receipt result',exact:true})).toBeVisible();
  await expectSyncedPayment(page);
  await expect(page.locator('.reimbursed-total dd')).toHaveText('RM40.00');await expect(page.locator('.receipt-total dd')).toHaveText('RM95.00');await expect(page.locator('.receipt-totals dl')).toHaveCount(2);
  await expect(page.locator('.result-items').getByText('Accepted',{exact:true})).toHaveCount(1);await expect(page.locator('.result-items').getByText('Rejected',{exact:true})).toHaveCount(2);
  await expect(page.getByRole('heading',{name:'Purchase context',exact:true})).toHaveCount(0);await expect(page.locator('.page-description')).toContainText('Synthetic CMT One');
  expect(await page.locator('.data-table td:nth-child(2) .money').evaluateAll(cells=>cells.every(el=>el.getBoundingClientRect().height<=parseFloat(getComputedStyle(el).lineHeight)+1))).toBe(true);
  const recorded=await (await page.request.get(`/api/claims/${page.url().split('/claim/')[1]}`)).json();expect(recorded.payment.provider_batch).toContain('fixture-batch-');expect(recorded.references.some(reference=>reference.id==='planned:print-1')).toBe(true);
  await expect(page.getByText('Assessment and payment record',{exact:true})).toHaveCount(0);await expect(page.getByText('Spreadsheet reference snapshot',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Refresh result',exact:true}).click();await expectSyncedPayment(page);
  const popup=context.waitForEvent('page');await page.getByRole('link',{name:'Open receipt image'}).click();const image=await popup;await image.waitForLoadState();expect(image.url()).toContain('/receipt');await image.close();
  await accessibility(page);await noOverflow(page);await page.screenshot({path:'.cache/reports/browser/result-desktop.png',fullPage:true});
  await page.getByRole('link',{name:'Back to history'}).click();await page.getByLabel('Find a submission').fill('nonexistent');await expect(page.getByText('No submissions match these filters.')).toBeVisible();await page.getByLabel('Find a submission').fill('');await page.getByLabel('Payment status').selectOption('succeeded');await expect(page.getByRole('table')).toBeVisible();await page.getByLabel('Payment status').selectOption('unpaid');await expect(page.getByText('No submissions match these filters.')).toBeVisible();await page.getByLabel('Payment status').selectOption('all');
  const view=page.getByRole('link',{name:/View receipt from Synthetic CMT One/});await expect(view).toContainText('View');const claimUrl=await view.getAttribute('href');await view.click();await expect(page.getByRole('link',{name:'Back to history',exact:true})).toBeVisible();await page.getByRole('link',{name:'Back to history',exact:true}).click();await expect(page.getByLabel('Payment status')).toHaveValue('all');
  await page.getByRole('link',{name:'Submit Receipt',exact:true}).click();await page.getByLabel('Receipt image').setInputFiles('apps/web/demo/printing.png');await expect(page.locator('.selected-file')).toContainText('printing.png');await page.getByRole('button',{name:'Submit',exact:true}).click();await expectSyncedPayment(page);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await login(page,'cmt.two@example.test');await page.getByRole('link',{name:'History',exact:true}).click();await expect(page.getByRole('heading',{name:'No reimbursements yet'})).toBeVisible();
  await page.goto(`/${claimUrl}`);await expect(page.getByText('Claim not found.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await login(page,'treasurer@example.test','Changed-synthetic-password42');await expect(page.locator('.outcome-panel').getByText('RM80.00',{exact:true})).toHaveCount(2);await accessibility(page);await page.screenshot({path:'.cache/reports/browser/treasurer-workspace-desktop.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('mobile/responsive: menu, Escape/focus, all layouts, reduced motion, error/loading recovery and technical retry',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:375,height:812});await page.emulateMedia({reducedMotion:'reduce'});await login(page,'cmt.two@example.test');
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeInViewport();
  expect((await page.locator('.sidebar').boundingBox()).y).toBe(0);
  await expect(page.getByRole('button',{name:'Menu',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Menu',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('link',{name:'History',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Menu',exact:true})).toBeFocused();await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeHidden();
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('link',{name:'History',exact:true}).click();await expect(page.getByRole('heading',{name:'My reimbursements',exact:true})).toBeVisible();
  await accessibility(page);await noOverflow(page);
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('link',{name:'Submit Receipt',exact:true}).click();
  await dropReceipt(page,'personal.png');
  for(const size of [{width:320,height:812},{width:375,height:812},{width:768,height:1024},{width:1024,height:768},{width:1440,height:900},{width:812,height:375}]){await page.setViewportSize(size);await noOverflow(page);}
  await page.setViewportSize({width:375,height:812});await page.screenshot({path:'.cache/reports/browser/submit-mobile.png',fullPage:true});
  expect((await page.getByRole('button',{name:'Submit',exact:true}).evaluate(el=>getComputedStyle(el).transitionDuration)).split(',').every(value=>value.trim()==='0s')).toBe(true);
  await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.locator('.result-status').getByText('Rejected',{exact:true})).toBeVisible({timeout:15000});await expect(page.locator('.reimbursed-total dd')).toHaveText('RM0.00');await expect(page.getByText('All receipt items were rejected.')).toHaveCount(0);await accessibility(page);await noOverflow(page);await page.screenshot({path:'.cache/reports/browser/result-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('link',{name:'Submit Receipt',exact:true}).click();
  const unknown=await page.screenshot();await page.getByLabel('Receipt image').setInputFiles({name:'synthetic-unknown.png',mimeType:'image/png',buffer:unknown});await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.getByText('Processing failed',{exact:true})).toBeVisible({timeout:15000});await page.getByRole('button',{name:'Retry processing'}).click();await expect(page.getByRole('button',{name:'Retry processing'})).toBeVisible({timeout:15000});
  await openSettings(page,'Account');await accessibility(page);await noOverflow(page);
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await login(page,'treasurer@example.test','Changed-synthetic-password42');
  await page.route('**/api/budget',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Synthetic network failure'})}));
  await page.reload();await expect(page.getByText('Synthetic network failure',{exact:true})).toBeVisible();await page.unroute('**/api/budget');
  let release;const held=new Promise(r=>release=r);await page.route('**/api/budget',async route=>{await held;await route.continue();});await page.getByRole('button',{name:'Retry loading'}).click();await expect(page.getByText('Loading your workspace...')).toBeVisible();release();await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();await page.unroute('**/api/budget');
  for(const destination of ['History','Committee Members','Event Policy','Connections','Account']){if(destination==='History'){await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('link',{name:destination,exact:true}).click();}else await openSettings(page,destination);await noOverflow(page);await accessibility(page);}
  await page.screenshot({path:'.cache/reports/browser/account-mobile.png',fullPage:true});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');await noOverflow(page);await page.evaluate(()=>document.documentElement.style.fontSize='');
  expect(errors).toEqual([]);
});

test('unconfigured integration UI disables dependent actions and leaves account/policy/member screens usable',async({page})=>{
  const missing={sheets:false,ai:false,paypal:false,recipient:false};
  for(const path of ['session','login','login/treasurer'])await page.route(`**/api/${path}`,async route=>{const response=await route.fetch();const data=await response.json();await route.fulfill({response,json:{...data,mode:'sandbox',integrations:missing,paypal_login:false}});});
  await login(page,'cmt.one@example.test');await expect(page.getByText('Integration not configured',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Submit',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Browse files',exact:true})).toBeEnabled();
  await openSettings(page,'Account');await expect(page.getByRole('button',{name:'Change password',exact:true})).toBeEnabled();await accessibility(page);await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await login(page,'treasurer@example.test','Changed-synthetic-password42');await expect(page.getByRole('heading',{name:'Integration not configured',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Refresh budget'})).toHaveCount(0);
  await openSettings(page,'Event Policy');await expect(page.getByRole('button',{name:'Save event'})).toBeEnabled();await page.getByRole('link',{name:'Committee Members',exact:true}).click();await expect(page.getByRole('button',{name:'Create CMT account'})).toBeEnabled();await accessibility(page);
});

test('PayPal login binds each role without turning Remember email into a persistent session',async({page})=>{
  await page.route('**/api/session',async route=>{const response=await route.fetch();await route.fulfill({response,json:{...await response.json(),paypal_login:true}});});
  await page.goto('/');await expect(page.getByRole('link',{name:'Continue with PayPal'})).toHaveAttribute('href','/api/paypal/login');
  await page.getByRole('tab',{name:'Treasurer',exact:true}).click();await expect(page.getByRole('link',{name:'Continue with PayPal'})).toHaveAttribute('href','/api/paypal/login?role=treasurer');
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('tab',{name:'Committee',exact:true}).click();await page.getByLabel('Remember email',{exact:true}).uncheck();await expect(page.getByRole('link',{name:'Continue with PayPal'})).toHaveAttribute('href','/api/paypal/login');await page.getByLabel('Remember email',{exact:true}).check();await expect(page.getByRole('link',{name:'Continue with PayPal'})).toHaveAttribute('href','/api/paypal/login');await accessibility(page);
});

test('Committee login failure retains editable values and recovers without changing role',async({page})=>{
  await page.goto('/');await page.getByRole('tab',{name:'Committee',exact:true}).click();await page.getByLabel('Email',{exact:true}).fill('cmt.one@example.test');await page.getByLabel('Password',{exact:true}).fill(password);
  await page.route('**/api/login',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Synthetic authentication service unavailable.'})}));
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByText('Synthetic authentication service unavailable.',{exact:true})).toBeVisible();await expect(page.getByLabel('Email',{exact:true})).toHaveValue('cmt.one@example.test');await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeEnabled();await accessibility(page);
  await page.unroute('**/api/login');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Submit a receipt',exact:true})).toBeVisible();
});

test('glass login, email-only preference, visibility toggle and direct local-demo reset to A',async({page,context})=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Welcome',exact:true})).toBeVisible();
  await expect(page.locator('.login-topbar').getByRole('img',{name:'Gantiin',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Show password',exact:true}).click();await expect(page.getByLabel('Password',{exact:true})).toHaveAttribute('type','text');await page.getByRole('button',{name:'Hide password',exact:true}).click();
  await page.getByLabel('Remember email',{exact:true}).check();await page.getByLabel('Email',{exact:true}).fill('cmt.one@example.test');await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Submit a receipt',exact:true})).toBeVisible();
  expect((await context.cookies()).find(cookie=>cookie.name==='gantiin_session').expires).toBe(-1);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('link',{name:'Forgot password?',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Reset password',exact:true})).toBeVisible();await expect(page.locator('.recovery-mark,.recovery-intro,.recovery-card .login-footer')).toHaveCount(0);const back=page.getByRole('link',{name:'Back to sign in',exact:true});await expect(back.locator('svg')).toHaveCount(1);expect(await back.textContent()).toBe('');expect((await back.boundingBox()).width).toBeGreaterThanOrEqual(44);const resetCard=await page.locator('.recovery-card').boundingBox(),backBox=await back.boundingBox();expect(backBox.x-resetCard.x).toBeLessThan(24);expect(backBox.y-resetCard.y).toBeLessThan(24);
  await page.getByLabel('Email',{exact:true}).fill('cmt.one@example.test');await page.getByLabel('New password',{exact:true}).fill('A');await page.getByLabel('Confirm password',{exact:true}).fill('B');await page.getByRole('button',{name:'Reset password',exact:true}).click();await expect(page.getByText('Passwords do not match.',{exact:true})).toBeVisible();
  await page.getByLabel('Confirm password',{exact:true}).fill('A');await page.getByRole('button',{name:'Reset password',exact:true}).click();await expect(page.getByText('If a matching demo account exists, its password has been updated.',{exact:true})).toBeVisible();await accessibility(page);await page.screenshot({path:'.cache/reports/browser/demo-reset-success.png',fullPage:true});
  await page.getByRole('link',{name:'Back to sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Welcome',exact:true})).toBeVisible();await page.getByLabel('Email',{exact:true}).fill('cmt.one@example.test');await page.getByLabel('Password',{exact:true}).fill('A');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Submit a receipt',exact:true})).toBeVisible();
});

test('ordinary recovery requests an operator link instead of offering an unauthenticated reset',async({page})=>{
  await page.route('**/api/session',async route=>{const response=await route.fetch();await route.fulfill({response,json:{...await response.json(),mode:'sandbox',recovery_mode:'unconfigured'}});});
  await page.goto('/#/forgot-password');await expect(page.getByText('Ask your event operator for a reset link.',{exact:true})).toBeVisible();await expect(page.getByLabel('New password',{exact:true})).toHaveCount(0);await expect(page.getByRole('link',{name:'Back to sign in',exact:true})).toBeVisible();await accessibility(page);
});

test('history search and numeric/date/name sorting combine, persist after refresh and stay account scoped',async({page})=>{
  const aligned=()=>page.locator('.history-controls select').evaluateAll(controls=>controls.length===2&&controls.every(el=>{const s=getComputedStyle(el),arrow=getComputedStyle(el.parentElement,'::after');return s.textAlign==='left'&&s.textAlignLast==='left'&&s.paddingLeft==='14px'&&s.paddingRight==='44px'&&arrow.right==='18px';}));
  const record=(id,name,date,amount,payment='succeeded')=>({id,claimant:name,created_at:date,requested_sen:amount,eligible_sen:amount,paid_sen:payment==='succeeded'?amount:0,unpaid_sen:payment==='succeeded'?0:amount,coverage:payment==='succeeded'?'full':'none',processing:amount===undefined?'received':'assessed',payment:payment?{status:payment,sync:'synced'}:null});
  const rows=[record('claim-two','Synthetic CMT Two','2026-11-05T10:00:00Z',1200),record('claim-one','Synthetic CMT One','2026-11-04T10:00:00Z',10000),record('claim-three','Synthetic CMT Three','2026-11-06T10:00:00Z',9500),record('claim-unknown','Synthetic CMT Four','2026-11-03T10:00:00Z',undefined,null)];
  await login(page,'treasurer@example.test','Changed-synthetic-password42');
  await page.route('**/api/claims',route=>route.fulfill({json:rows}));await page.getByRole('link',{name:'History',exact:true}).click();await expect(page.getByRole('heading',{name:'Reimbursement history',exact:true})).toBeVisible();await expect(page.locator('.record-summary')).toHaveCount(0);
  expect(await aligned()).toBe(true);await expect(page.locator('.history-total strong')).toHaveText('RM207.00');await expect(page.locator('.history-panel thead th')).toHaveCount(4);await page.screenshot({path:'.cache/reports/browser/history-controls-treasurer.png',fullPage:true});
  const ids=()=>page.locator('#history-results tbody .view-receipt').evaluateAll(links=>links.map(link=>link.getAttribute('href').split('/').pop()));
  expect(await ids()).toEqual(['claim-three','claim-two','claim-one','claim-unknown']);
  await page.getByLabel('Sort by',{exact:true}).selectOption('name-asc');expect(await ids()).toEqual(['claim-unknown','claim-one','claim-three','claim-two']);
  await page.getByLabel('Sort by',{exact:true}).selectOption('name-desc');expect(await ids()).toEqual(['claim-two','claim-three','claim-one','claim-unknown']);
  await page.getByLabel('Sort by',{exact:true}).selectOption('date-asc');expect(await ids()).toEqual(['claim-unknown','claim-one','claim-two','claim-three']);
  await page.getByLabel('Sort by',{exact:true}).selectOption('amount-desc');expect(await ids()).toEqual(['claim-one','claim-three','claim-two','claim-unknown']);
  await page.getByLabel('Sort by',{exact:true}).selectOption('amount-asc');expect(await ids()).toEqual(['claim-two','claim-three','claim-one','claim-unknown']);
  await page.getByLabel('Find a submission').fill('  cmt ONE ');expect(await ids()).toEqual(['claim-one']);await page.getByLabel('Payment status').selectOption('succeeded');await page.getByRole('button',{name:'Refresh history',exact:true}).click();await expect(page.getByLabel('Find a submission')).toHaveValue('  cmt ONE ');await expect(page.getByLabel('Sort by')).toHaveValue('amount-asc');await expect.poll(ids).toEqual(['claim-one']);
  await page.getByLabel('Find a submission').fill('claim-three');expect(await ids()).toEqual(['claim-three']);await page.getByLabel('Find a submission').fill('');await page.getByLabel('Payment status').selectOption('pending');await expect(page.getByText('No submissions match these filters.')).toBeVisible();await page.getByLabel('Payment status').selectOption('all');await accessibility(page);await page.screenshot({path:'.cache/reports/browser/history-sorting-desktop.png',fullPage:true});
  await page.unroute('**/api/claims');await page.getByRole('button',{name:'Sign out',exact:true}).click();await login(page,'cmt.two@example.test');
  const own=[record('own-low','Synthetic CMT Two','2026-11-04T10:00:00Z',1200),record('own-high','Synthetic CMT Two','2026-11-05T10:00:00Z',10000)];
  await page.route('**/api/claims',route=>route.fulfill({json:own}));await page.getByRole('link',{name:'History',exact:true}).click();await expect(page.getByRole('heading',{name:'My reimbursements',exact:true})).toBeVisible();await expect(page.getByLabel('Find a submission')).toHaveValue('');await expect(page.getByLabel('Sort by')).toHaveValue('date-desc');await expect(page.locator('.record-summary')).toHaveCount(0);await page.getByLabel('Sort by').selectOption('amount-desc');expect(await ids()).toEqual(['own-high','own-low']);await page.getByLabel('Find a submission').fill('CMT One');await expect(page.getByText('No submissions match these filters.')).toBeVisible();await page.getByLabel('Find a submission').fill('');
  await page.setViewportSize({width:390,height:844});await noOverflow(page);await accessibility(page);await page.screenshot({path:'.cache/reports/browser/history-sorting-mobile.png',fullPage:true});
  expect(await aligned()).toBe(true);await expect(page.locator('.history-total strong')).toHaveText('RM112.00');
});

test('Healthy flat surfaces keep clear states, event context and generous upload size',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');const card=await page.locator('.login-card').evaluate(el=>({background:getComputedStyle(el).backgroundColor,blur:getComputedStyle(el).backdropFilter}));expect(card.background).toBe('rgb(255, 255, 255)');expect(card.blur).toBe('none');
  await login(page,'cmt.two@example.test');await expect(page.getByRole('heading',{name:'Submit a receipt',exact:true})).toBeVisible();expect((await page.locator('[data-dropzone]').boundingBox()).height).toBeGreaterThanOrEqual(360);expect(await page.locator('[data-dropzone]').evaluate(el=>getComputedStyle(el).borderStyle)).toBe('dashed');
  const upload=await page.locator('.receipt-submission').boundingBox(),zone=await page.locator('[data-dropzone]').boundingBox();expect(zone.x).toBe(upload.x);expect(zone.width).toBe(upload.width);expect(await page.locator('[data-dropzone]').evaluate(el=>getComputedStyle(el).backdropFilter)).toBe('none');
  expect(await page.locator('.sidebar').evaluate(el=>getComputedStyle(el).backdropFilter)).toBe('none');const event=await (await page.request.get('/api/event')).json();await expect(page.locator('.page-description')).toHaveText(event.name);await expect(page.locator('.submit-context')).toHaveCount(0);expect(zone.width).toBeCloseTo((await page.locator('.page').boundingBox()).width,0);const submit=page.getByRole('button',{name:'Submit',exact:true});await expect(submit.locator('svg')).toHaveCount(1);
  await page.getByRole('heading',{name:'Submit a receipt',exact:true}).click();const normal=await submit.evaluate(el=>getComputedStyle(el).backgroundColor);await submit.hover();await expect.poll(()=>submit.evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe(normal);await glassControls(page);await page.screenshot({path:'.cache/reports/browser/submit-flat-hover.png',fullPage:true});
  await submit.click();await expect(page.getByText('Select a receipt image.',{exact:true})).toBeVisible();await expect(submit.locator('svg')).toHaveCount(1);await page.setViewportSize({width:320,height:812});await noOverflow(page);await accessibility(page);
});

test('role choices stay frameless and password eyes have no button surface',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Welcome',exact:true})).toBeVisible();expect(await page.locator('.role-switch').evaluate(el=>getComputedStyle(el).borderWidth)).toBe('0px');expect(await page.locator('.role-indicator').evaluate(el=>getComputedStyle(el).borderWidth)).toBe('0px');expect(await page.locator('.role-indicator').evaluate(el=>getComputedStyle(el).boxShadow)).not.toBe('none');
  const tab=page.getByRole('tab',{name:'Treasurer',exact:true});expect(await tab.evaluate(el=>getComputedStyle(el).borderWidth)).toBe('0px');await tab.hover();expect(await tab.evaluate(el=>getComputedStyle(el).borderWidth)).toBe('0px');await tab.click();await expect(tab).toHaveAttribute('aria-selected','true');expect(await tab.evaluate(el=>getComputedStyle(el).borderWidth)).toBe('0px');await page.getByRole('heading',{name:'Welcome',exact:true}).click();await expect.poll(()=>page.locator('.role-indicator').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41)).toBe(0);await page.screenshot({path:'.cache/reports/browser/login-raised-role.png',fullPage:true});
  const eye=page.locator('[data-action="toggle-password"]');await eye.hover();expect(await eye.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');expect(await eye.evaluate(el=>getComputedStyle(el).boxShadow)).toBe('none');expect((await eye.boundingBox()).width).toBeGreaterThanOrEqual(44);await expect(eye.locator('.eye-open')).toBeVisible();await expect(eye.locator('.eye-off')).toBeHidden();await eye.click();await expect(page.getByLabel('Password',{exact:true})).toHaveAttribute('type','text');await expect(eye.locator('.eye-off')).toBeVisible();await expect(eye.locator('.eye-open')).toBeHidden();await page.getByRole('button',{name:'Hide password',exact:true}).click();await expect(page.getByLabel('Password',{exact:true})).toHaveAttribute('type','password');await accessibility(page);
});

test('Committee remembers only the last successful email, supports opt-out and tolerates blocked storage',async({page,context})=>{
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gantiin.committee-email')));
  await login(page,'cmt.two@example.test');expect(await saved()).toEqual({enabled:true,email:'cmt.two@example.test'});
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.reload();await expect(page.getByLabel('Email',{exact:true})).toHaveValue('cmt.two@example.test');await expect(page.getByLabel('Password',{exact:true})).toHaveValue('');
  await page.getByLabel('Email',{exact:true}).fill('unknown@example.test');await page.getByLabel('Password',{exact:true}).fill('Wrong-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'There is a problem'})).toBeVisible();expect(await saved()).toEqual({enabled:true,email:'cmt.two@example.test'});
  await page.getByLabel('Email',{exact:true}).fill('cmt.one@example.test');await page.getByLabel('Password',{exact:true}).fill('A');const request=page.waitForRequest(r=>r.url().endsWith('/api/login')&&r.method()==='POST');await page.getByRole('button',{name:'Sign in',exact:true}).click();expect((await request).postDataJSON()).toEqual({email:'cmt.one@example.test',password:'A'});await expect(page.getByRole('heading',{name:'Submit a receipt',exact:true})).toBeVisible();expect(await saved()).toEqual({enabled:true,email:'cmt.one@example.test'});expect((await context.cookies()).find(cookie=>cookie.name==='gantiin_session').expires).toBe(-1);
  expect(await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}))).toEqual({local:{'gantiin.committee-email':JSON.stringify({enabled:true,email:'cmt.one@example.test'})},session:{}});
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByLabel('Password',{exact:true})).toHaveValue('');await page.getByLabel('Remember email',{exact:true}).uncheck();expect(await saved()).toEqual({enabled:false,email:''});await page.reload();await expect(page.getByLabel('Email',{exact:true})).toHaveValue('');await expect(page.getByLabel('Remember email',{exact:true})).not.toBeChecked();
  await login(page,'cmt.two@example.test');expect(await saved()).toEqual({enabled:false,email:''});await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.addInitScript(()=>{Object.defineProperty(Storage.prototype,'getItem',{value(){throw new DOMException('Blocked','SecurityError');}});Object.defineProperty(Storage.prototype,'setItem',{value(){throw new DOMException('Blocked','SecurityError');}});});await login(page,'cmt.two@example.test');await expect(page.getByRole('heading',{name:'Submit a receipt',exact:true})).toBeVisible();await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByLabel('Password',{exact:true})).toHaveValue('');
});

test('QC: aligned Settings, readable tablet history, narrow screens and repeated form errors',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('cmt.two@example.test');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  expect(await page.locator('input[aria-describedby]').evaluateAll(inputs=>inputs.every(input=>input.getAttribute('aria-describedby').trim().split(/\s+/).every(id=>document.getElementById(id))))).toBe(true);
  await login(page,'treasurer@example.test','Changed-synthetic-password42');
  await openSettings(page);
  await expect(page.getByRole('form',{name:'Change password',exact:true})).toBeVisible();
  await expect(page.locator('.account-profile')).toHaveCount(0);expect((await page.locator('.account-treasurer').boundingBox()).width).toBeGreaterThan(800);
  await page.screenshot({path:'.cache/reports/browser/qc-settings-desktop.png',fullPage:true});
  await page.route('**/api/claims',route=>route.fulfill({json:[{id:'qc-synthetic-record',claimant:'Synthetic CMT One',created_at:'2026-11-06T04:00:00Z',requested_sen:9500,eligible_sen:4000,paid_sen:4000,unpaid_sen:0,coverage:'full',processing:'assessed',payment:{status:'succeeded',sync:'synced'}}]}));
  for(const width of [1440,1024,820,768,390,320]) {
    await page.setViewportSize({width,height:width<800?844:1000});
    await page.goto('/#/history');await expect(page.locator('#history-results')).toBeVisible();
    await noOverflow(page);await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
    if(width<=1100){expect(await page.locator('.data-table thead').evaluateAll(elements=>elements.every(el=>getComputedStyle(el).display==='none'))).toBe(true);await expect(page.locator('.data-table caption')).toHaveClass('sr-only');expect(await page.locator('.data-table td').evaluateAll(cells=>cells.every(cell=>getComputedStyle(cell,'::before').display==='none'))).toBe(true);}
    if(width<800)expect(Math.abs((await page.locator('.page-heading h1').boundingBox()).x-(await page.locator('.history-panel').boundingBox()).x)).toBeLessThan(1);
    await accessibility(page);
    await page.screenshot({path:`.cache/reports/browser/qc-history-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:812,height:375});await page.goto('/#/settings/event');await expect(page.getByRole('button',{name:'Save event',exact:true})).toBeVisible();await page.getByRole('button',{name:'Save event',exact:true}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeInViewport();await noOverflow(page);
  await page.emulateMedia({reducedMotion:'reduce'});expect(await page.getByRole('button',{name:'Sign out',exact:true}).evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
  await page.setViewportSize({width:390,height:844});await page.goto('/#/settings/account');await expect(page.getByRole('form',{name:'Change password',exact:true})).toBeVisible();await page.evaluate(()=>document.documentElement.style.fontSize='200%');await noOverflow(page);await page.screenshot({path:'.cache/reports/browser/qc-settings-text-200.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('QC: actual rendered flat authentication text contrast across roles and widths',async({page})=>{
  const evidence=[];
  const selector='.login-card h1,.role-switch button,.remember-label,.text-link,.login-actions button,.paypal-button,.login-divider span';
  for(const width of [1440,390,320]) {
    await page.setViewportSize({width,height:900});await page.goto('/');await expect(page.getByRole('heading',{name:'Welcome',exact:true})).toBeVisible();
    for(const role of ['Committee','Treasurer']) {
      await page.getByRole('tab',{name:role,exact:true}).click();await page.waitForTimeout(250);
      const regions=await page.locator(selector).evaluateAll(elements=>elements.flatMap(el=>{
        const css=getComputedStyle(el),rgb=css.color.match(/[\d.]+/g).slice(0,3).map(Number),nodes=[];
        const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
        while(walker.nextNode()){const node=walker.currentNode;if(!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);const rect=range.getBoundingClientRect();if(rect.width&&rect.height)nodes.push({name:node.textContent.trim(),rgb,x:rect.x,y:rect.y,w:rect.width,h:rect.height});}
        return nodes;
      }));
      await page.locator(selector).evaluateAll(elements=>elements.forEach(el=>{el.dataset.qcStyle=el.style.cssText;el.style.setProperty('color','transparent','important');el.style.setProperty('-webkit-text-fill-color','transparent','important');el.style.setProperty('text-shadow','none','important');}));
      const background=(await page.screenshot()).toString('base64');await page.locator(selector).evaluateAll(elements=>elements.forEach(el=>{el.style.cssText=el.dataset.qcStyle;delete el.dataset.qcStyle;}));
      const ratios=await page.evaluate(async({background,regions})=>{
        const img=new Image(),url=URL.createObjectURL(new Blob([Uint8Array.from(atob(background),c=>c.charCodeAt(0))],{type:'image/png'}));img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);URL.revokeObjectURL(url);const data=ctx.getImageData(0,0,img.width,img.height).data;
        const lum=rgb=>rgb.map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
        return regions.map(region=>{let min=Infinity;for(let y=Math.max(0,Math.ceil(region.y+2));y<Math.min(img.height,region.y+region.h-2);y+=2)for(let x=Math.max(0,Math.ceil(region.x+2));x<Math.min(img.width,region.x+region.w-2);x+=2){const i=(y*img.width+x)*4,a=lum(region.rgb),b=lum([data[i],data[i+1],data[i+2]]);min=Math.min(min,(Math.max(a,b)+.05)/(Math.min(a,b)+.05));}return {name:region.name,ratio:min};});
      },{background,regions});
      evidence.push({width,role,ratios});expect(ratios.filter(item=>!Number.isFinite(item.ratio)||item.ratio<4.5)).toEqual([]);
    }
  }
  writeFileSync('.cache/reports/browser/pixel-contrast.json',JSON.stringify(evidence,null,2));
});
