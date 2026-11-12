import { GoogleAuth } from 'google-auth-library';
import { invariant, money, sum, AppError } from '../domain.mjs';
import { TRANSACTION_HEADERS, ITEM_HEADERS, transactionValues, itemRecords, itemValues, parseItemRow } from './sheets-contract.mjs';

export const BUDGET_FORMULA = '=C2-SUM(Transactions!D2:D)';
export class GoogleSheets {
  constructor(config) { this.config=config; this.auth=new GoogleAuth({keyFile:config.googleKey,scopes:['https://www.googleapis.com/auth/spreadsheets']}); }
  async request(path, method='GET', body) {
    invariant(this.config.googleKey && this.config.spreadsheet, 'Configure Google service-account credentials and spreadsheet ID.', 503, 'setup_required');
    try {
      const client=await this.auth.getClient();
      const response=await client.request({url:`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(this.config.spreadsheet)}${path}`,method,data:body,timeout:15000,retry:false});
      return response.data;
    } catch { throw new AppError('Google Sheets is unavailable or the service account lacks access. Check the dedicated spreadsheet configuration.',503,'sheets_failed'); }
  }
  async read(event) {
    const [metadata,formula]=await Promise.all([
      this.request('?fields=sheets(properties,protectedRanges)'),
      this.request(`/values/${encodeURIComponent("'Event Budget'!D2")}?valueRenderOption=FORMULA`)
    ]);
    for(const title of ['Event Budget','Transactions','Reimbursed Items']) {
      const sheet=metadata.sheets?.find(s=>s.properties.title===title);
      invariant(sheet?.protectedRanges?.some(r=>r.warningOnly!==true && r.range?.sheetId===sheet.properties.sheetId && r.range.startRowIndex===undefined && r.range.endRowIndex===undefined && r.range.startColumnIndex===undefined && r.range.endColumnIndex===undefined),`Protect the entire ${title} tab before processing payouts.`,503,'sheet_conflict');
    }
    const transaction_capacity=metadata.sheets.find(s=>s.properties.title==='Transactions').properties.gridProperties.rowCount;
    const item_capacity=metadata.sheets.find(s=>s.properties.title==='Reimbursed Items').properties.gridProperties.rowCount;
    const ranges=["'Event Budget'!A2:E2","'Planned Items'!A2:F1001","'Approved History'!A2:H1001",`'Transactions'!A2:L${transaction_capacity}`,`'Reimbursed Items'!A2:U${item_capacity}`,"'Transactions'!A1:L1","'Reimbursed Items'!A1:U1"];
    const query=new URLSearchParams({valueRenderOption:'UNFORMATTED_VALUE'});
    ranges.forEach(r=>query.append('ranges',r));
    const data=await this.request(`/values:batchGet?${query}`);
    invariant(formula.values?.[0]?.[0]===BUDGET_FORMULA, 'Remaining-budget formula changed. Restore the protected formula before processing.',503,'sheet_conflict');
    const [budget,plans,history,ledger,itemRows,transactionHeader,itemHeader]=data.valueRanges.map(r=>r.values||[]);
    invariant(JSON.stringify(transactionHeader?.[0])===JSON.stringify(TRANSACTION_HEADERS)&&JSON.stringify(itemHeader?.[0])===JSON.stringify(ITEM_HEADERS),'Spreadsheet schema needs the documented payment/item recording upgrade. Do not initialize over existing data.',503,'sheet_conflict');
    const b=budget[0]||[];
    invariant(b[0]===event.id && b[1]==='MYR', 'Spreadsheet event or currency does not match.',503,'sheet_conflict');
    const funding_sen=money(b[2], 'Sheet funding');
    const remaining_sen=money(b[3], 'Sheet remaining budget');
    const transactions=ledger.map((r,i)=>{
      if (!r.length || r.every(v=>v==='')) return null;
      invariant(r.length>=8 && typeof r[0]==='string' && r[4]==='MYR' && typeof r[5]==='string' && typeof r[7]==='string', 'Invalid spreadsheet transaction row.',503,'sheet_conflict');
      return {id:r[0],claim_id:r[1],user_id:r[2],amount_sen:money(r[3]),currency:r[4],provider_id:r[5],confirmed_at:r[6],recipient:r[7],row:i+2,...(r[11]?{eligible_sen:money(r[8]),unpaid_sen:money(r[9]),policy_version:r[10],items_digest:r[11]}:{})};
    }).filter(Boolean);
    invariant(new Set(transactions.map(t=>t.id)).size===transactions.length && funding_sen-sum(transactions.map(t=>t.amount_sen))===remaining_sen,'Spreadsheet ledger and remaining budget do not reconcile.',503,'sheet_conflict');
    const planned=plans.map((r,i)=>({id:`planned:${r[0]}`,source:'Planned Items',row:i+2,description:r[1],category:r[2],context:r[3],approved:r[4]===true||r[4]==='TRUE',rule_id:r[5]}));
    const approved=history.map((r,i)=>({id:`history:${r[0]}`,source:'Approved History',row:i+2,description:r[1],category:r[2],context:r[3],approved:r[4]===true||r[4]==='TRUE',eligible_sen:r[5],paid_sen:r[6],policy_version:r[7]}));
    const references=[...planned,...approved].filter(r=>r.approved);
    for(const [rows,source] of [[plans,'Planned Items'],[history,'Approved History']])for(const r of rows)if(r[4]===true||r[4]==='TRUE')invariant(typeof r[0]==='string'&&r[0].trim().length>0||Number.isSafeInteger(r[0])&&r[0]>=0,`${source} contains an approved row without a real source ID.`,503,'sheet_conflict');
    invariant(references.every(r=>typeof r.description==='string' && r.description.length<=500 && typeof r.category==='string' && r.category.length<=80 && typeof r.context==='string' && r.context.length<=2000 && r.id.length<=100) && new Set(references.map(r=>r.id)).size===references.length,'Invalid or duplicate spreadsheet reference IDs.',503,'sheet_conflict');
    let items;
    try{items=(itemRows||[]).map((r,n)=>r.length&&r.some(v=>v!=='')?parseItemRow(r,n+2):null).filter(Boolean);}catch{throw new AppError('Malformed spreadsheet reimbursed-item evidence. Reconcile before continuing.',503,'sheet_conflict');}
    return {event_id:event.id,funding_sen,remaining_sen,transactions,items,references,transaction_capacity,item_capacity,synthetic:false};
  }
  async sync(p) {
    const meta=await this.request('?fields=sheets.properties');
    const sheet=meta.sheets.find(s=>s.properties.title==='Transactions');
    invariant(sheet && sheet.properties.gridProperties.rowCount>p.sheet_row-1,'Transactions sheet is missing or has insufficient rows.',503,'sync_pending');
    const cells=values=>values.map(value=>({userEnteredValue:typeof value==='number'?{numberValue:value}:{stringValue:value}}));
    const values=cells(transactionValues(p));
    const requests=[{updateCells:{range:{sheetId:sheet.properties.sheetId,startRowIndex:p.sheet_row-1,endRowIndex:p.sheet_row,startColumnIndex:0,endColumnIndex:values.length},rows:[{values}],fields:'userEnteredValue'}}];
    if(p.items){
      const itemSheet=meta.sheets.find(s=>s.properties.title==='Reimbursed Items');
      invariant(itemSheet&&itemSheet.properties.gridProperties.rowCount>=p.sheet_item_start+p.items.length-1,'Reimbursed Items tab is missing or has insufficient rows.',503,'sync_pending');
      requests.push({updateCells:{range:{sheetId:itemSheet.properties.sheetId,startRowIndex:p.sheet_item_start-1,endRowIndex:p.sheet_item_start-1+p.items.length,startColumnIndex:0,endColumnIndex:ITEM_HEADERS.length},rows:itemRecords(p).map(i=>({values:cells(itemValues(i))})),fields:'userEnteredValue'}});
    }
    await this.request(':batchUpdate','POST',{requests});
  }
}
