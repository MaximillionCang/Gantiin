import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startTestServer } from '../../scripts/e2e-server.mjs';

test.use({baseURL:'http://127.0.0.1:3108'});
let app;
test.beforeAll(async()=>{app=await startTestServer({port:3108,worker:false});});
test.afterAll(async()=>{await app?.close();});

async function login(page,role) {
  await page.goto('/');await page.getByRole('tab',{name:role,exact:true}).click();
  if(role==='Committee')await page.getByLabel('Email',{exact:true}).fill('cmt.one@example.test');
  await page.getByLabel('Password',{exact:true}).fill('Synthetic-only-password42');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('button',{name:'Sign out',exact:true,includeHidden:true})).toBeAttached();
}
async function scan(page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
}

for(const role of ['Treasurer','Committee'])test(`${role} Account separates password changes from the existing read-only email`,async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await login(page,role);
  const session=await (await page.request.get('/api/session')).json();
  const originalEmails=app.store.users().map(user=>({id:user.id,email:user.email}));
  const mutations=[];page.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method()))mutations.push(r.url());});
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('link',{name:'Account',exact:true}).click();
  await expect(page).toHaveURL(/#\/settings\/account\/password$/);
  await expect(page.getByRole('heading',{name:'Change password',exact:true})).toBeVisible();
  await expect(page.getByRole('form',{name:'Change password',exact:true})).toBeVisible();
  await expect(page.getByLabel('Current password',{exact:true})).toBeEditable();
  await expect(page.getByLabel('New password',{exact:true})).toBeEditable();
  await expect(page.getByLabel('Current email',{exact:true})).toHaveCount(0);
  const sections=page.getByRole('navigation',{name:'Account sections'});
  await expect(sections.getByRole('link')).toHaveCount(2);
  const toggle=page.getByRole('button',{name:'Toggle account sections',exact:true});
  await toggle.focus();await page.keyboard.press('Space');await expect(sections).toBeHidden();await expect(toggle).toBeFocused();
  await page.keyboard.press('Space');await expect(sections).toBeVisible();
  for(const theme of ['dark','light']) {
    if(theme==='light'){await page.getByRole('link',{name:'Personal preferences',exact:true}).click();await page.getByRole('radio',{name:'Light',exact:true}).check();await page.getByRole('link',{name:'Account',exact:true}).click();await expect(page.getByRole('form',{name:'Change password',exact:true})).toBeVisible();}
    await scan(page);await sections.getByRole('link',{name:'Email',exact:true}).click();
    await expect(page).toHaveURL(/#\/settings\/account\/email$/);
    await expect(page.getByRole('heading',{name:'Email',exact:true})).toBeVisible();
    const email=page.getByLabel('Current email',{exact:true});await expect(email).toHaveValue(session.user.email);await expect(email).not.toBeEditable();
    await expect(page.getByRole('form',{name:'Change password',exact:true})).toHaveCount(0);
    await expect(page.getByRole('button',{name:/save email|change email|update email/i})).toHaveCount(0);
    await scan(page);await page.screenshot({path:`.cache/reports/browser/account-email-${role.toLowerCase()}-${theme}.png`,fullPage:true});
    await page.reload();await expect(email).toHaveValue(session.user.email);await expect(email).not.toBeEditable();
    await expect(sections.getByRole('link',{name:'Email',exact:true})).toHaveAttribute('aria-current','page');
    await sections.getByRole('link',{name:'Change password',exact:true}).click();await expect(page.getByRole('form',{name:'Change password',exact:true})).toBeVisible();
  }
  await page.goto('/#/account');await expect(page).toHaveURL(/#\/settings\/account\/password$/);
  if(role==='Committee'){await page.goto('/#/account?paypal=failed');await expect(page).toHaveURL(/#\/settings\/account\/email\?paypal=failed$/);await expect(page.getByRole('alert')).toContainText('PayPal identity did not match');}
  expect(app.store.users().map(user=>({id:user.id,email:user.email}))).toEqual(originalEmails);expect(mutations).toEqual([]);
});

test('mobile Account submenu supports keyboard, route refresh and readable current email at enlarged text',async({page})=>{
  await page.setViewportSize({width:375,height:844});await login(page,'Committee');
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('link',{name:'Account',exact:true}).click();
  await expect(page.getByRole('form',{name:'Change password',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  const toggle=page.getByRole('button',{name:'Toggle account sections',exact:true});await toggle.focus();await page.keyboard.press('Space');await expect(toggle).toHaveAttribute('aria-expanded','false');await page.keyboard.press('Space');
  await page.getByRole('navigation',{name:'Account sections'}).getByRole('link',{name:'Email',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Email',exact:true})).toBeVisible();await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeHidden();
  await expect(page.getByLabel('Current email',{exact:true})).toHaveValue('cmt.one@example.test');
  await page.reload();await expect(page.getByLabel('Current email',{exact:true})).not.toBeEditable();
  for(const width of [375,320]){await page.setViewportSize({width,height:844});await scan(page);await page.screenshot({path:`.cache/reports/browser/account-email-mobile-${width}.png`,fullPage:true});}
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.getByRole('button',{name:'Menu',exact:true}).click();await scan(page);
});
