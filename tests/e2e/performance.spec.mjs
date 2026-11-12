import {test,expect} from '@playwright/test';
import {startTestServer} from '../../scripts/e2e-server.mjs';

test.use({baseURL:'http://127.0.0.1:3112'});
let app;
test.beforeAll(async()=>{app=await startTestServer({port:3112,worker:false});});
test.afterAll(async()=>{await app?.close();});

test('login fetches each page resource once and Settings expands without navigating',async({page})=>{
  let release;const held=new Promise(resolve=>{release=resolve;});
  const requests={event:0,budget:0,claims:0};
  await page.route('**/api/event',async route=>{requests.event++;await held;await route.continue();});
  page.on('request',request=>{const path=new URL(request.url()).pathname;if(path==='/api/budget')requests.budget++;if(path==='/api/claims')requests.claims++;});
  await page.goto('/');await page.getByRole('tab',{name:'Treasurer',exact:true}).click();
  await page.getByLabel('Password',{exact:true}).fill('Synthetic-only-password42');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  try{
    await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeVisible();
    await expect.poll(()=>requests).toEqual({event:1,budget:1,claims:1});
  }finally{release();}
  await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
  expect(requests).toEqual({event:1,budget:1,claims:1});
  const before=page.url(),settings=page.getByRole('button',{name:'Settings',exact:true});
  await settings.click();await expect(settings).toHaveAttribute('aria-expanded','true');expect(page.url()).toBe(before);
  await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
  await page.screenshot({path:'.cache/reports/browser/unified-settings-desktop.png',fullPage:true});
  await settings.focus();await page.keyboard.press('Enter');await expect(settings).toHaveAttribute('aria-expanded','false');expect(page.url()).toBe(before);
  await settings.click();await page.getByRole('link',{name:'Account',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Change password',exact:true})).toBeVisible();
  await expect(page.getByLabel('New password',{exact:true})).not.toHaveAttribute('minlength');
  await page.getByLabel('Current password',{exact:true}).fill('Synthetic-only-password42');await page.getByLabel('New password',{exact:true}).fill('A');
  await page.getByRole('form',{name:'Change password'}).getByRole('button',{name:'Change password',exact:true}).click();await expect(page.getByText('Password changed. Other website sessions have been signed out.',{exact:true})).toBeVisible();
  await page.setViewportSize({width:375,height:812});await page.getByRole('button',{name:'Menu',exact:true}).click();
  await settings.click();await expect(settings).toHaveAttribute('aria-expanded','false');
  await settings.click();await page.screenshot({path:'.cache/reports/browser/unified-settings-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
