import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rgb=hex=>hex.replace('#','').match(/../g).map(v=>parseInt(v,16));
function luminance(hex){return rgb(hex).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
function contrast(a,b){const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(hi+.05)/(lo+.05);}
for(const theme of ['dark','light'])test(`Cyan/violet ${theme} palette: actual source tokens keep readable data and perceivable controls`,()=>{
  const css=readFileSync('frontend/style.css','utf8');
  const base=css.match(/:root\s*\{([^}]+)\}/)[1];
  const override=theme==='light'?css.match(/:root\[data-theme="light"\]\s*\{([^}]+)\}/)[1]:'';
  const tokens=Object.fromEntries([...(base+override).matchAll(/--([a-z-]+):\s*(#[a-f0-9]{6})/gi)].map(match=>[match[1],match[2]]));
  const token=name=>{assert.ok(tokens[name],`${name} exists`);return tokens[name];};
  for(const background of ['surface','canvas','soft','tertiary','mist'])for(const foreground of ['primary','muted'])assert.ok(contrast(token(foreground),token(background))>=4.5,`${foreground} on ${background}`);
  for(const background of ['action','action-hover'])assert.ok(contrast('#ffffff',token(background))>=4.5,`Action text on ${background}`);
  for(const background of ['surface','tertiary','mist'])assert.ok(contrast(token('secondary'),token(background))>=4.5,`Link on ${background}`);
  for(const background of ['surface','canvas','soft'])assert.ok(contrast(token('control-border'),token(background))>=3,`Control on ${background}`);
  for(const status of ['success','warning','danger'])assert.ok(contrast(token(status),token(`${status}-tint`))>=4.5,`${status} status`);
  for(const background of ['balance-start','balance-end'])for(const foreground of ['primary','muted'])assert.ok(contrast(token(foreground),token(background))>=4.5,`${foreground} on ${background}`);
  assert.ok(contrast(token('chart-bar'),token('surface'))>=3,'Meaningful chart bars');
  assert.ok(contrast(token('accent-cyan'),token('mist'))>=3,'Meaningful service icons');
});
