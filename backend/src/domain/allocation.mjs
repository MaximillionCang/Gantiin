import { invariant } from './core.mjs';
import { money, sum } from './money.mjs';

export function proportional(total, weights) {
  money(total);
  const denominator=BigInt(sum(weights));
  invariant(denominator>0n || total===0, 'An adjustment has no positive allocation basis.',422,'extraction_failed');
  if(total===0)return weights.map(()=>0);
  const shares=weights.map((weight,index)=>{
    const numerator=BigInt(total)*BigInt(money(weight));
    return {index,amount:Number(numerator/denominator),remainder:numerator%denominator};
  });
  let remaining=total-shares.reduce((n,s)=>n+s.amount,0);
  const ranked=[...shares].sort((a,b)=>a.remainder===b.remainder?a.index-b.index:a.remainder>b.remainder?-1:1);
  for(const share of ranked)if(remaining-->0)share.amount++;
  return shares.map(s=>s.amount);
}

export function allocateAdjustments(items, adjustments, printedTotal) {
  const result=items.map(i=>({...i,allocated_tax_sen:0,allocated_discount_sen:0,allocations:[],net_sen:i.base_sen}));
  const known=new Set(result.map(i=>i.id));
  for(const a of adjustments) {
    invariant(['tax','discount'].includes(a.kind), 'Unsupported receipt charge requires an explicit approved treatment.',422,'extraction_failed');
    invariant(['receipt','items'].includes(a.scope) && Array.isArray(a.item_ids) && new Set(a.item_ids).size===a.item_ids.length && a.item_ids.every(id=>known.has(id)), 'Adjustment scope is ambiguous or references unknown items.',422,'extraction_failed');
    invariant(a.scope==='receipt'?a.item_ids.length===0:a.item_ids.length>0, 'Adjustment scope does not identify its relevant items.',422,'extraction_failed');
    money(a.amount_sen);
    invariant(a.treatment==='included' || a.kind==='tax'&&a.treatment==='add' || a.kind==='discount'&&a.treatment==='subtract', 'Adjustment treatment is ambiguous or unsupported.',422,'extraction_failed');
    if(a.treatment==='included')continue;
    const relevant=result.filter(i=>a.scope==='receipt'||a.item_ids.includes(i.id));
    const shares=proportional(a.amount_sen,relevant.map(i=>i.base_sen));
    relevant.forEach((item,index)=>{
      const share=shares[index];
      if(a.kind==='tax')item.allocated_tax_sen=money(item.allocated_tax_sen+share);
      else item.allocated_discount_sen=money(item.allocated_discount_sen+share);
      item.allocations.push({adjustment_id:a.id,kind:a.kind,amount_sen:share,treatment:a.treatment});
    });
  }
  for(const i of result)i.net_sen=money(i.base_sen+i.allocated_tax_sen-i.allocated_discount_sen,'Net item cost');
  invariant(sum(result.map(i=>i.net_sen))===money(printedTotal), 'Printed receipt total does not reconcile with item costs and scoped adjustments.',422,'extraction_failed');
  return result;
}

export function reimbursementItems(receipt, assessment, paidAmount) {
  const accepted=receipt.items.filter(i=>assessment.items.find(a=>a.item_id===i.id)?.decision==='accepted');
  const eligible=sum(accepted.map(i=>i.net_sen??i.line_sen));
  invariant(paidAmount<=eligible,'Payment exceeds accepted net cost.');
  const paid=proportional(paidAmount,accepted.map(i=>i.net_sen??i.line_sen));
  return accepted.map((i,n)=>{
    const a=assessment.items.find(a=>a.item_id===i.id);
    const net=i.net_sen??i.line_sen;
    return {item_id:i.id,description:i.description,quantity:i.quantity,unit_sen:i.unit_sen,gross_sen:i.gross_sen??i.line_sen,item_discount_sen:i.item_discount_sen??0,base_sen:i.base_sen??i.line_sen,allocated_tax_sen:i.allocated_tax_sen??0,allocated_discount_sen:i.allocated_discount_sen??0,net_sen:net,eligible_sen:net,paid_sen:paid[n],unpaid_sen:net-paid[n],policy_version:assessment.policy_version,category:a.category,rule_ids:a.rule_ids,reference_ids:a.reference_ids,allocations:i.allocations??[]};
  });
}
