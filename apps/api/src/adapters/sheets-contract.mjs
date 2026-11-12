export const TRANSACTION_HEADERS=['payment_id','claim_id','cmt_id','paid_sen','currency','paypal_item_id','confirmed_at','recipient_id','eligible_sen','unpaid_sen','policy_version','items_digest'];
export const ITEM_HEADERS=['record_id','payment_id','claim_id','item_id','description','quantity','unit_sen','gross_sen','item_discount_sen','base_sen','allocated_tax_sen','allocated_discount_sen','net_sen','eligible_sen','paid_sen','unpaid_sen','policy_version','category','rule_ids','reference_ids','allocations'];
const jsonFields=new Set(['rule_ids','reference_ids','allocations']);
export function transactionValues(p) {
  return [p.id,p.claim_id,p.user_id,p.amount_sen,'MYR',p.provider_item,p.confirmed_at,p.recipient.id,...(p.items?[p.eligible_sen,p.eligible_sen-p.amount_sen,p.policy_version,p.items_digest]:[])];
}
export function itemRecords(p) {
  return (p.items||[]).map((item,n)=>({...item,record_id:`${p.id}:${item.item_id}`,payment_id:p.id,claim_id:p.claim_id,row:p.sheet_item_start+n}));
}
export function itemValues(item) {
  return ITEM_HEADERS.map(key=>jsonFields.has(key)?JSON.stringify(item[key]):item[key]??'');
}
export function parseItemRow(values,row) {
  return {...Object.fromEntries(ITEM_HEADERS.map((key,n)=>[key,jsonFields.has(key)?JSON.parse(values[n]):['quantity','unit_sen'].includes(key)&&values[n]===''?null:values[n]])),row};
}
export function sameItem(actual,expected) {
  return Object.entries(expected).every(([key,value])=>JSON.stringify(actual[key])===JSON.stringify(value));
}
export function paymentReflected(p,sheet) {
  return sheet.transactions.some(t=>t.id===p.id) && itemRecords(p).every(expected=>(sheet.items||[]).some(i=>i.record_id===expected.record_id&&sameItem(i,expected)));
}
