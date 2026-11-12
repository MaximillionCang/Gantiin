import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rgb=hex=>hex.replace('#','').match(/../g).map(v=>parseInt(v,16));
function luminance(hex){return rgb(hex).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
function contrast(a,b){const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(hi+.05)/(lo+.05);}
test('Blue finance palette: actual source tokens keep readable data and perceivable controls',()=>{
  const css=readFileSync('apps/web/style.css','utf8');
  const token=name=>{const match=css.match(new RegExp(`--${name}:\\s*(#[a-f0-9]{6})`,'i'));assert.ok(match,`${name} exists`);return match[1];};
  for(const background of ['surface','canvas','soft','tertiary','mist'])for(const foreground of ['primary','muted'])assert.ok(contrast(token(foreground),token(background))>=4.5,`${foreground} on ${background}`);
  assert.ok(contrast('#ffffff',token('primary'))>=4.5);assert.ok(contrast(token('secondary'),token('surface'))>=4.5);
  for(const background of ['surface','canvas','soft'])assert.ok(contrast(token('control-border'),token(background))>=3,`Control on ${background}`);
  assert.ok(contrast('#345b46','#eff4f0')>=4.5);assert.ok(contrast(token('danger'),token('danger-tint'))>=4.5);
  assert.ok(contrast(token('muted'),'#dcebf5')>=4.5,'Muted text on the darkest balance gradient');
  assert.ok(contrast(token('chart-bar'),token('surface'))>=3,'Meaningful chart bars');
});
