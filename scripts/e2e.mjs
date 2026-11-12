import { spawn } from 'node:child_process';
import { startTestServer } from './e2e-server.mjs';

// Owning the server here avoids shell process-tree termination on Windows.
const app=await startTestServer();
try {
  const child=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test',...process.argv.slice(2)],{stdio:'inherit',windowsHide:true});
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>resolve(code??1));});
  process.exitCode=code;
} finally {await app.close();}
