import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const files=[];
function walk(path){for(const entry of readdirSync(path,{withFileTypes:true})){const file=`${path}/${entry.name}`;if(entry.isDirectory())walk(file);else if(file.endsWith('.mjs'))files.push(file);}}
for(const dir of ['backend','frontend','scripts','tests'])walk(dir);
for(const file of files){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(r.status,0,`${file}: ${r.stderr}`);}
for(const file of ['frontend/app.mjs','frontend/index.html','frontend/style.css','DESIGN.md','docs/product/PRD.md'])assert.ok(!readFileSync(file,'utf8').includes('\u2014'),`${file} has an em dash`);
console.log(`PASS: syntax checked ${files.length} modules; authored UI/design/PRD copy contains no em dash.`);
