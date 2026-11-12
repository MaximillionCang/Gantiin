import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { configuration } from '../apps/api/src/config.mjs';
import { extractReceipt } from '../apps/api/src/ai/extraction.mjs';
import { assessItems } from '../apps/api/src/ai/decider.mjs';
import { validatePolicy, validateReceipt } from '../apps/api/src/domain.mjs';

if(!process.argv.includes('--allow-ai-usage')) {
  console.error('This check uses Gemini API quota. Run npm.cmd run ai:check -- --allow-ai-usage to test one sample receipt.');
  process.exitCode=1;
} else {
  process.env.LANGSMITH_TRACING='false';process.env.LANGCHAIN_TRACING_V2='false';
  const config={...configuration(),aiAuthorized:true};
  const report={scope:'One sample receipt, real Gemini OCR and Decider, no payments or spreadsheet writes',at:new Date().toISOString()};
  let stage='ocr';
  try {
    console.log('Reading sample receipt...');
    const bytes=readFileSync(new URL('../demo/campus-career-day/receipts/01-printing-and-registration.png',import.meta.url));
    const receipt=validateReceipt(await extractReceipt(config,bytes,'image/png'));
    report.receipt_total_sen=receipt.total_sen;report.item_count=receipt.items.length;
    console.log(`OCR passed: ${receipt.items.length} items, RM${(receipt.total_sen/100).toFixed(2)}.`);
    stage='decider';
    const event=JSON.parse(readFileSync(new URL('../demo/campus-career-day/event.json',import.meta.url),'utf8'));
    const assessment=await assessItems(config,receipt,validatePolicy(event,1),[]);
    report.items=assessment.items.map(decision=>({item:receipt.items.find(item=>item.id===decision.item_id).description,decision:decision.decision,confidence:decision.confidence,reason:decision.reason}));
    const ocr=receipt.extraction.confidence,decider_min=Math.min(...assessment.items.map(item=>item.confidence)),minimum=config.aiMinConfidence;
    report.confidence_gate={minimum,ocr,decider_min,passed:ocr>=minimum&&decider_min>=minimum};
    const accepted=new Set(assessment.items.filter(item=>item.decision==='accepted').map(item=>item.item_id));
    report.eligible_sen=receipt.items.filter(item=>accepted.has(item.id)).reduce((total,item)=>total+item.net_sen,0);report.status=report.confidence_gate.passed?'passed':'confidence_blocked';
    if(!report.confidence_gate.passed)process.exitCode=1;
    console.log(`Decider passed: RM${(report.eligible_sen/100).toFixed(2)} eligible. No payout sent.`);
    console.log(`Confidence: OCR ${ocr}, lowest decision ${decider_min}, minimum ${minimum}: ${report.confidence_gate.passed?'passed':'blocked'}.`);
  } catch(error) {
    report.status='failed';report.stage=stage;report.code=typeof error?.code==='string'&&/^[a-z_]+$/.test(error.code)?error.code:'ai_check_failed';process.exitCode=1;
    console.error(`${stage==='ocr'?'OCR':'Decider'} failed. Check Gemini access, model and quota. No payment or spreadsheet write was attempted.`);
  }
  mkdirSync('.cache/reports',{recursive:true});writeFileSync('.cache/reports/ai-check.json',JSON.stringify(report,null,2)+'\n');
  console.log('Report: .cache/reports/ai-check.json');
}
