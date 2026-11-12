import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startTestServer } from '../../scripts/e2e-server.mjs';

test.use({baseURL:'http://127.0.0.1:3107'});
let app;
test.beforeAll(async()=>{app=await startTestServer({port:3107,worker:false});});
test.afterAll(async()=>{await app?.close();});

async function login(page,role='Treasurer') {
  await page.goto('/');await page.getByRole('tab',{name:role,exact:true}).click();
  if(role==='Committee')await page.getByLabel('Email',{exact:true}).fill('cmt.one@example.test');
  await page.getByLabel('Password',{exact:true}).fill('Synthetic-only-password42');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('button',{name:'Sign out',exact:true,includeHidden:true})).toBeAttached();
}
async function preferences(page) {
  if(!await page.getByRole('link',{name:'Settings',exact:true}).isVisible())await page.getByRole('button',{name:'Menu',exact:true}).click();
  await page.getByRole('link',{name:'Settings',exact:true}).click();
  await expect(page.getByRole('form',{name:'Change password',exact:true})).toBeVisible();
  if(!await page.getByRole('navigation',{name:'Settings sections'}).isVisible())await page.getByRole('button',{name:'Menu',exact:true}).click();
  await page.getByRole('link',{name:'Personal preferences',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Personal preferences',exact:true})).toBeVisible();
}
async function scan(page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
}
async function logoPixels(page) {
  return page.locator('img[alt="Gantiin"]').evaluate(async image=>{
    await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);
    let symbolHash=2166136261,whiteWordPixels=0,blackWordPixels=0;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
      const n=(y*canvas.width+x)*4;
      if(y<canvas.height*.73)for(let channel=0;channel<4;channel++)symbolHash=Math.imul(symbolHash^data[n+channel],16777619)>>>0;
      if(y>canvas.height*.76&&data[n+3]>240){if(data[n]>220&&data[n+1]>220&&data[n+2]>220)whiteWordPixels++;if(data[n]<20&&data[n+1]<20&&data[n+2]<20)blackWordPixels++;}
    }
    return {symbolHash,whiteWordPixels,blackWordPixels,cornerAlpha:data[3]};
  });
}

test('appearance defaults to dark and persists a readable light theme, black wordmark and unchanged coloured symbol',async({page,context})=>{
  await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({colorScheme:'light'});
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  expect(await page.evaluate(()=>localStorage.getItem('gantiin.theme'))).toBeNull();
  await login(page);await preferences(page);
  const dark=page.getByRole('radio',{name:/^Dark/}),light=page.getByRole('radio',{name:'Light',exact:true});
  await expect(dark).toBeChecked();const original=await logoPixels(page);expect(original.whiteWordPixels).toBeGreaterThan(100);
  await light.check();await expect(light).toBeFocused();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content','#f5f6fb');
  await expect.poll(()=>page.locator('.sidebar img').evaluate(i=>i.currentSrc)).toContain('gantiin-logo-light.svg');
  const changed=await logoPixels(page);expect(changed.blackWordPixels).toBeGreaterThan(100);expect(changed.whiteWordPixels).toBe(0);expect(changed.symbolHash).toBe(original.symbolHash);expect(changed.cornerAlpha).toBe(0);
  expect(await page.evaluate(()=>localStorage.getItem('gantiin.theme'))).toBe('light');await scan(page);
  await page.screenshot({path:'.cache/reports/browser/preferences-light-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();await expect.poll(()=>page.locator('.sidebar img').evaluate(i=>i.currentSrc)).toContain('gantiin-symbol.svg');
  await page.getByRole('button',{name:'Expand sidebar',exact:true}).click();await expect.poll(()=>page.locator('.sidebar img').evaluate(i=>i.currentSrc)).toContain('gantiin-logo-light.svg');
  await page.reload();await expect(light).toBeChecked();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  const other=await context.newPage();await other.goto('http://127.0.0.1:3107/#/settings/preferences');
  await expect(other.getByRole('radio',{name:'Light',exact:true})).toBeChecked();await other.getByRole('radio',{name:/^Dark/}).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(dark).toBeChecked();await other.close();
  await light.check();await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.getByRole('tablist',{name:'Sign-in role'})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  expect((await logoPixels(page)).blackWordPixels).toBeGreaterThan(100);await scan(page);
  await page.screenshot({path:'.cache/reports/browser/login-light-desktop.png',fullPage:true});
  await login(page);await preferences(page);await dark.check();await scan(page);await page.reload();await expect(dark).toBeChecked();
  expect((await logoPixels(page)).whiteWordPixels).toBeGreaterThan(100);
});

test('Committee personal preferences support keyboard switching, mobile navigation and enlarged text',async({page})=>{
  await page.setViewportSize({width:375,height:844});await login(page,'Committee');await preferences(page);
  await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeHidden();
  await page.getByRole('radio',{name:/^Dark/}).focus();await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio',{name:'Light',exact:true})).toBeChecked();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  expect((await logoPixels(page)).blackWordPixels).toBeGreaterThan(100);
  for(const width of [375,320]){await page.setViewportSize({width,height:844});await scan(page);await page.screenshot({path:`.cache/reports/browser/preferences-light-${width}.png`,fullPage:true});}
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await scan(page);
});

test('blocked browser storage keeps dark as the default and allows an appearance change for this visit',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage blocked','SecurityError');}}));
  await login(page,'Committee');await preferences(page);await expect(page.getByRole('radio',{name:/^Dark/})).toBeChecked();
  await page.getByRole('radio',{name:'Light',exact:true}).check();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await expect(page.getByRole('status').filter({hasText:'Light mode applied for this visit.'})).toBeVisible();
  await page.reload();await expect(page.getByRole('radio',{name:/^Dark/})).toBeChecked();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');expect(errors).toEqual([]);
});
