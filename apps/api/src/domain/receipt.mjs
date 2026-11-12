import { invariant, text, digest, AppError } from './core.mjs';
import { money, sum } from './money.mjs';
import { allocateAdjustments } from './allocation.mjs';

export function validateReceipt(result) {
  try { return normalizeReceipt(result); }
  catch(error) {throw new AppError(error instanceof AppError?error.message:'Receipt extraction is malformed.',422,'extraction_failed');}
}
function normalizeReceipt(result) {
  invariant(result?.currency==='MYR','Receipt must visibly use MYR.');
  const modern=result.readable!==undefined;
  if(modern)invariant(result.readable && result.currency_source_text?.trim() && result.total_source_text?.trim(),'Essential receipt evidence is unreadable.');
  else invariant(result.adjustments_sen===0 && result.shared_adjustments_present!==true,'Legacy shared adjustments have no supported scope.');
  invariant(Array.isArray(result.items)&&result.items.length>0&&result.items.length<=60,'Receipt must contain 1-60 readable items.');
  const items=result.items.map((item,index)=>{
    const id='item-'+(index+1);
    invariant(!modern||item.id===id,'Receipt item IDs must follow printed order without duplicates.');
    const quantity=item.quantity;
    invariant(quantity===null || typeof quantity==='number'&&Number.isFinite(quantity)&&quantity>0&&quantity<=10000&&/^\d+(?:\.\d{1,3})?$/.test(String(quantity)),'Receipt quantity is unreadable or unsupported.');
    const unit_sen=item.unit_sen===null?null:money(item.unit_sen,'Unit price');
    const line_sen=money(item.line_sen,'Printed item line');
    const discounts=modern?item.discounts:[];
    invariant(Array.isArray(discounts),'Item discounts must be separately identified.');
    for(const d of discounts){text(d.source_text,'Discount evidence',2000);text(d.description,'Discount description',2000);money(d.amount_sen);}
    const item_discount_sen=sum(discounts.map(d=>d.amount_sen));
    const line_basis=modern?item.line_basis:'gross';
    invariant(['gross','net'].includes(line_basis),'Item line discount basis is ambiguous.');
    const gross_sen=money(line_basis==='net'?line_sen+item_discount_sen:line_sen);
    const base_sen=money(gross_sen-item_discount_sen,'Item cost after its discounts');
    if(quantity!==null&&unit_sen!==null){
      const [whole,fraction='']=String(quantity).split('.');
      const scale=10n**BigInt(fraction.length);
      const units=BigInt(whole)*scale+BigInt(fraction||'0');
      const expected=Number((BigInt(unit_sen)*units+scale/2n)/scale);
      invariant(expected===gross_sen,'Receipt quantity, unit price and printed line do not reconcile.');
    }
    return {id,description:text(item.description,'Item description',500),source_text:modern?text(item.source_text,'Item evidence',2000):null,quantity,unit_sen,line_sen,line_basis,discounts,gross_sen,item_discount_sen,base_sen};
  });
  const adjustments=(modern?result.adjustments:[]).map((a,n)=>({...a,id:'adjustment-'+(n+1),source_text:text(a.source_text,'Adjustment evidence',2000),description:text(a.description,'Adjustment description',2000)}));
  invariant(adjustments.length<=30,'Too many receipt adjustments.');
  const allocated=allocateAdjustments(items,adjustments,result.total_sen);
  return {schema_version:2,currency:'MYR',merchant:result.merchant??null,date_text:result.date_text??null,source_text:result.source_text??null,currency_source_text:result.currency_source_text??null,total_source_text:result.total_source_text??null,total_sen:result.total_sen,adjustments_sen:result.total_sen-sum(items.map(i=>i.base_sen)),adjustments,allocation_method:'post-item-discount basis; largest remainder; printed-order ties',items:allocated,extraction:structuredClone(result)};
}

export function receiptBytes(input) {
  const encoded = text(input.receipt_base64, 'Receipt', 7_000_000);
  invariant(/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) && encoded.length % 4 === 0, 'Invalid receipt encoding.');
  const bytes = Buffer.from(encoded, 'base64');
  invariant(bytes.length > 16 && bytes.length <= 5 * 1024 * 1024, 'Upload a PNG or JPEG up to 5 MiB.');
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  invariant(png || jpg, 'Only PNG and JPEG receipts are supported.');
  return {bytes, mime: png ? 'image/png' : 'image/jpeg', hash: digest(bytes)};
}
