import { invariant, AppError, decimal, fromDecimal } from '../domain.mjs';

const BASE='https://api-m.sandbox.paypal.com';
export class PayPalSandbox {
  constructor(config) { this.config=config; }
  async token(form={grant_type:'client_credentials'}) {
    invariant(this.config.paypalClient && this.config.paypalSecret,'Configure PayPal Sandbox client ID and secret.',503,'setup_required');
    if (form.grant_type==='client_credentials' && this.access && this.expiry>Date.now()) return this.access;
    let response;
    try { response=await fetch(`${BASE}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${this.config.paypalClient}:${this.config.paypalSecret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(form),signal:AbortSignal.timeout(15000)}); }
    catch { throw new AppError('PayPal Sandbox authentication is unavailable.',503,'payment_unknown'); }
    invariant(response.ok,'PayPal Sandbox credentials or identity authorization were rejected.',503,'paypal_auth_failed');
    const data=await response.json();
    invariant(typeof data.access_token==='string','PayPal returned an invalid access token.',503,'paypal_auth_failed');
    if (form.grant_type==='client_credentials') { this.access=data.access_token; this.expiry=Date.now()+(Number(data.expires_in)-60)*1000; }
    return data.access_token;
  }
  async request(path, method='GET', body, requestId) {
    const token=await this.token();
    try {
      const response=await fetch(`${BASE}${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(requestId?{'PayPal-Request-Id':requestId}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
      return {ok:response.ok,status:response.status,data:await response.json()};
    } catch { throw new AppError('PayPal Sandbox response is uncertain. Funds remain reserved while the same operation is reconciled.',503,'payment_unknown'); }
  }
  async create(p) {
    invariant(this.config.fundingConfirmed,'Confirm Malaysian Sandbox sender funding and fee coverage in configuration.',503,'setup_required');
    invariant(Date.now()-Date.parse(p.created_at)<29*86400000,'Provider deduplication window is ending. Operator reconciliation is required; reservation remains held.',503,'reconciliation_required');
    const result=await this.request('/v1/payments/payouts','POST',{sender_batch_header:{sender_batch_id:p.id,email_subject:'Gantiin Sandbox reimbursement'},items:[{recipient_type:'PAYPAL_ID',receiver:p.recipient.id,amount:{currency:'MYR',value:decimal(p.amount_sen)},sender_item_id:p.id,note:'Synthetic receipt reimbursement, Sandbox only',recipient_wallet:'PAYPAL'}]},p.id);
    if (result.ok && result.data.batch_header?.payout_batch_id) return result.data.batch_header.payout_batch_id;
    // Duplicate create responses link to the original batch after a lost response.
    const links=[...(result.data.links||[]),...(result.data.details||[]).flatMap(d=>d.links||[])];
    const original=links.find(l=>{
      try { const u=new URL(l.href); return u.origin===BASE && /^\/v1\/payments\/payouts\/[A-Za-z0-9]+$/.test(u.pathname); } catch { return false; }
    });
    if (original && JSON.stringify(result.data).includes('DUPLICATE')) return new URL(original.href).pathname.split('/').pop();
    throw new AppError('PayPal has not confirmed payout submission. Check Sandbox permissions, MYR funds and account configuration. The payment identity and reservation are retained.',503,'payment_unknown');
  }
  async details(p) {
    invariant(/^[A-Za-z0-9]+$/.test(p.provider_batch),'Invalid provider batch identity.',503,'payment_unknown');
    const batch=await this.request(`/v1/payments/payouts/${p.provider_batch}?page_size=1000`);
    invariant(batch.ok && batch.data.batch_header?.payout_batch_id===p.provider_batch,'PayPal batch details are not available yet.',503,'payment_unknown');
    const entries=batch.data.items||[];
    invariant(entries.length===1 && entries[0].payout_item?.sender_item_id===p.id,'PayPal batch does not match the saved payment.',503,'payment_unknown');
    const id=entries[0].payout_item_id;
    invariant(typeof id==='string' && /^[A-Za-z0-9]+$/.test(id),'PayPal payout-item identity is missing.',503,'payment_unknown');
    const item=await this.request(`/v1/payments/payouts-item/${id}`);
    invariant(item.ok && item.data.payout_item_id===id && item.data.payout_batch_id===p.provider_batch,'PayPal item details do not match the batch.',503,'payment_unknown');
    return {batch:p.provider_batch,item:id,status:item.data.transaction_status,recipient:item.data.payout_item?.receiver,currency:item.data.payout_item?.amount?.currency,amount_sen:fromDecimal(item.data.payout_item?.amount?.value),sender_item_id:item.data.payout_item?.sender_item_id};
  }
  loginProvider(role='cmt') {
    invariant(['cmt','treasurer'].includes(role),'Unknown PayPal login role.',400);
    const {paypalTreasurerLoginClient:client,paypalTreasurerLoginSecret:secret}=this.config;
    if(role!=='treasurer'||(!client&&!secret))return this;
    invariant(client&&secret,'Complete both Treasurer PayPal login app credentials.',503,'setup_required');
    return new PayPalSandbox({...this.config,paypalClient:client,paypalSecret:secret});
  }
  authorizationUrl(state,role='cmt') {
    const login=this.loginProvider(role);
    const url=new URL('https://www.sandbox.paypal.com/signin/authorize');
    url.search=new URLSearchParams({client_id:login.config.paypalClient,response_type:'code',scope:'openid email profile https://uri.paypal.com/services/paypalattributes',redirect_uri:`${this.config.base}/api/paypal/callback`,state}).toString();
    return url.href;
  }
  async identity(code,role='cmt') {
    const access=await this.loginProvider(role).token({grant_type:'authorization_code',code,redirect_uri:`${this.config.base}/api/paypal/callback`});
    let result;
    try { const response=await fetch(`${BASE}/v1/identity/openidconnect/userinfo?schema=openid`,{headers:{Authorization:`Bearer ${access}`},signal:AbortSignal.timeout(15000)}); invariant(response.ok,'Identity was not confirmed.',403); result=await response.json(); }
    catch { throw new AppError('PayPal Sandbox identity could not be confirmed. Please try signing in again.',403,'identity_failed'); }
    invariant(typeof result.user_id==='string' && result.user_id.length<300,'PayPal identity is missing.',403,'identity_failed');
    return {sub:result.user_id,payer_id:result.payer_id,verified:result.verified_account===true||result.verified_account==='true'};
  }
}
