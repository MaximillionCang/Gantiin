import { defineConfig } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('.cache/reports/browser',{recursive:true});
export default defineConfig({
  outputDir:'.cache/reports/traces',
  testDir:'./tests/e2e',timeout:60000,workers:1,fullyParallel:false,
  use:{baseURL:'http://127.0.0.1:3100',headless:true,trace:'retain-on-failure'},
  reporter:[['list'],['html',{open:'never',outputFolder:'.cache/reports/playwright'}]]
});
