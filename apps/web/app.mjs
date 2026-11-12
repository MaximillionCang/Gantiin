import { createApi } from './src/lib/api.mjs';
import { esc, money, date, label } from './src/lib/format.mjs';
import { status, reimbursementStatus } from './src/components/status.mjs';
import { detailPage as renderClaimDetail } from './src/pages/claim-detail.mjs';
import { overviewPage, spreadsheetAction } from './src/pages/overview.mjs';
const app=document.querySelector('#app');
const emailPreferenceKey='gantiin.committee-email';
function readEmailPreference() {
  try {const saved=JSON.parse(localStorage.getItem(emailPreferenceKey));const enabled=saved?.enabled!==false;return {enabled,email:enabled&&typeof saved?.email==='string'&&saved.email.length<=180?saved.email:''};}
  catch {return {enabled:true,email:''};}
}
const emailPreference=readEmailPreference();
function readDemoMode() {try{return sessionStorage.getItem('gantiin.demo')==='true';}catch{return false;}}
function readSidebarPreference() {try{return sessionStorage.getItem('gantiin.sidebar-collapsed')==='true';}catch{return false;}}
const state={session:null,event:null,demo:readDemoMode(),menu:false,sidebarCollapsed:readSidebarPreference(),settingsOpen:false,loginRole:null,rememberEmail:emailPreference.enabled,committeeEmail:emailPreference.email,routeToken:0,claimList:[],history:{user:null,query:'',status:'all',sort:'date-desc'},selected:null,preview:null,submissionKey:crypto.randomUUID()};
function setDemoMode(enabled) {state.demo=enabled;try{if(enabled)sessionStorage.setItem('gantiin.demo','true');else sessionStorage.removeItem('gantiin.demo');}catch{}}
const api=createApi(state,{onUnauthorized:()=>{setDemoMode(false);state.session=null;location.hash='/login';}});
function saveEmailPreference(email=state.committeeEmail) {
  state.committeeEmail=state.rememberEmail?email:'';
  try {localStorage.setItem(emailPreferenceKey,JSON.stringify({enabled:state.rememberEmail,email:state.committeeEmail}));}catch {}
}
function rememberCommitteeEmail(user) {if(!state.demo&&user?.role==='cmt'&&typeof user.email==='string')saveEmailPreference(user.email);}
const announce=message=>{document.querySelector('#announcement').textContent=message;};
const toast=document.querySelector('#toast');
let toastTimer,toastReturnFocus;
function hideToast() {
  clearTimeout(toastTimer);
  const restoreFocus=toast.contains(document.activeElement);
  toast.hidden=true;toast.querySelector('.toast-message').textContent='';
  if(restoreFocus&&toastReturnFocus?.isConnected)toastReturnFocus.focus({preventScroll:true});
}
function scheduleToast() {
  clearTimeout(toastTimer);
  if(!toast.hidden&&!toast.matches(':hover')&&!toast.contains(document.activeElement))toastTimer=setTimeout(hideToast,4000);
}
function showToast(message,returnFocus=document.activeElement) {
  toastReturnFocus=returnFocus;
  toast.querySelector('.toast-message').textContent=message;toast.hidden=false;scheduleToast();
}
toast.querySelector('button').addEventListener('click',hideToast);
toast.addEventListener('pointerenter',()=>clearTimeout(toastTimer));
toast.addEventListener('pointerleave',scheduleToast);
toast.addEventListener('focusin',()=>clearTimeout(toastTimer));
toast.addEventListener('focusout',scheduleToast);
window.addEventListener('hashchange',hideToast);
const rejectionDialog=document.querySelector('#rejection-dialog');
let rejectionOpener;
rejectionDialog.querySelector('.popup-close').addEventListener('click',()=>rejectionDialog.close());
rejectionDialog.addEventListener('click',event=>{if(event.target!==rejectionDialog)return;const box=rejectionDialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)rejectionDialog.close();});
rejectionDialog.addEventListener('close',()=>{if(rejectionOpener?.route!==route())return;const trigger=rejectionOpener.button.isConnected?rejectionOpener.button:[...document.querySelectorAll('[data-action="show-rejection"]')].find(button=>button.dataset.itemId===rejectionOpener.item);trigger?.focus({preventScroll:true});});
window.addEventListener('hashchange',()=>{if(rejectionDialog.open)rejectionDialog.close();});
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();const main=document.querySelector('#main');main.tabIndex=-1;main.focus();});
function passwordIcons() {return '<svg class="eye-open" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg><svg class="eye-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m3 3 18 18M10.6 5.1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3 3.7M6.5 6.5A19 19 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5.2-1.3M10 10a3 3 0 0 0 4 4"/></svg>';}
function field(id,name,type='text',extra='',hint='',compact=false) {
  const input=`<input id="${id}" name="${id}" type="${type}" ${extra}${hint?` aria-describedby="${id}-hint"`:''}>`;
  const control=type==='password'?`<div class="password-field">${input}<button type="button" class="password-toggle" data-action="toggle-password" data-input="${id}" aria-label="Show password" aria-pressed="false">${passwordIcons()}</button></div>`:input;
  return `<div class="field"><label for="${id}"${compact?' class="sr-only"':''}>${name}</label>${control}${hint?`<span class="small muted" id="${id}-hint">${hint}</span>`:''}</div>`;
}
const formMessage='<div class="form-message" data-message tabindex="-1"></div>';
function showFormError(form,message,invalid=[]) {
  form.querySelectorAll('[aria-invalid]').forEach(el=>{el.removeAttribute('aria-invalid');const describedBy=(el.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!==`${el.id}-error`).join(' ');if(describedBy)el.setAttribute('aria-describedby',describedBy);else el.removeAttribute('aria-describedby');});
  form.querySelectorAll('.field-error').forEach(el=>el.remove());
  for(const input of invalid) {input.setAttribute('aria-invalid','true');const p=document.createElement('p');p.className='field-error';p.id=`${input.id}-error`;p.textContent=input.validationMessage;input.insertAdjacentElement('afterend',p);input.setAttribute('aria-describedby',[`${input.id}-error`,input.getAttribute('aria-describedby')||''].join(' '));}
  const box=form.querySelector('[data-message]');
  box.innerHTML=`<h2>There is a problem</h2><p>${esc(message)}</p>${invalid.length?`<ul>${invalid.map(i=>`<li><a href="#${i.id}" data-field-focus="${i.id}">${esc(i.labels?.[0]?.textContent||i.name)}: ${esc(i.validationMessage)}</a></li>`).join('')}</ul>`:''}`;
  box.setAttribute('role','alert');box.focus();
}
async function submitForm(form,fn) {
  const invalid=[...form.elements].filter(el=>el.willValidate&&!el.checkValidity());
  if(invalid.length) {showFormError(form,'Check the highlighted fields.',invalid);return;}
  const button=form.querySelector('button[type="submit"]');const original=button.innerHTML;
  const loginForm=form.dataset.form==='login';
  const roleControls=loginForm?[...document.querySelectorAll('.role-switch [role="tab"]')]:[];
  roleControls.forEach(control=>control.disabled=true);
  const busyText=loginForm?'Signing in...':form.dataset.form==='recovery'?'Resetting...':form.dataset.form==='claim'?'Submitting...':'Saving...';
  button.disabled=true;const buttonLabel=button.querySelector('[data-button-label]');if(buttonLabel)buttonLabel.textContent=busyText;else button.textContent=busyText;button.setAttribute('aria-busy','true');form.setAttribute('aria-busy','true');
  const box=form.querySelector('[data-message]');box.textContent='';box.removeAttribute('role');
  try {await fn(new FormData(form));}
  catch(error) {showFormError(form,error.message);}
  finally {button.disabled=false;button.innerHTML=original;button.removeAttribute('aria-busy');roleControls.forEach(control=>control.disabled=false);form.removeAttribute('aria-busy');}
}
function success(form,message) {const box=form.querySelector('[data-message]');box.setAttribute('role','status');box.textContent=message;}
function route() {return (location.hash.slice(1)||'').split('?')[0];}
const menuItems=()=>state.session.user.role==='treasurer'?[['/budget','Overview'],['/history','History']]:[['/submit','Submit Receipt'],['/history','History']];
const settingsItems=()=>state.session.user.role==='treasurer'?[['/settings/account','Account'],['/settings/event','Event Policy'],['/settings/members','Committee Members'],['/settings/connections','Connections']]:[['/settings/account','Account']];
function navigationIcon(name) {
  const paths={budget:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18m-6 4h6m-3 3h.01"/>',history:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6m3-3v5l3 2"/>',settings:'<path d="m9 3-.7 2.2-2 .9-2.1-.5L2 9l1.5 1.7v2.6L2 15l2.2 3.4 2.1-.5 2 .9L9 21h4l.7-2.2 2-.9 2.1.5L20 15l-1.5-1.7v-2.6L20 9l-2.2-3.4-2.1.5-2-.9L13 3Z"/><circle cx="11" cy="12" r="3"/>',submit:'<path d="M6 3h9l4 4v14l-3-2-3 2-3-2-4 2V3Zm9 0v5h4M9 12h6m-6 4h4"/>',logout:'<path d="M10 4H4v16h6m4-12 4 4-4 4m-7-4h11"/>'};
  paths.overview='<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>';
  paths.person='<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>';
  paths.search='<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>';
  paths.send='<path d="m21 3-7 18-4-7-7-4 18-7ZM10 14 21 3"/>';
  paths.back='<path d="m12 5-7 7 7 7M5 12h15"/>';
  paths.view='<path d="m9 5 7 7-7 7"/>';
  paths.lock='<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>';
  paths.key='<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-3-3 3-3m-6 0 3-3"/>';
  paths.sheet='<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 9v12"/>';
  paths.event='<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-11 5 2 2 4-4"/>';
  paths.check='<path d="m5 12 4 4L19 6"/>';
  paths.chevron='<path d="m8 10 4 4 4-4"/>';
  paths.collapse='<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m7-11-3 3 3 3"/>';
  return `<svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
function brandLogo(className='brand-logo') {
  return `<img class="${className}" src="/assets/gantiin-logo.svg?v=32f9ba39d938" width="2172" height="724" alt="Gantiin" decoding="async">`;
}
function shell() {
  const {user}=state.session;
  const current=route();
  const greeting=user.role==='treasurer'?'Treasurer':esc(user.name);
  if(current.startsWith('/settings/'))state.settingsOpen=true;
  app.innerHTML=`<div class="workspace ${state.sidebarCollapsed?'sidebar-collapsed':''}"><aside class="sidebar">
    <header><div class="sidebar-brand">${brandLogo()}</div><button class="sidebar-toggle" data-action="sidebar-collapse" aria-label="${state.sidebarCollapsed?'Expand':'Collapse'} sidebar" title="${state.sidebarCollapsed?'Expand':'Collapse'} sidebar">${navigationIcon('collapse')}</button><button class="menu-toggle" data-action="menu" aria-controls="navigation" aria-expanded="${state.menu}">Menu</button></header>
    <div class="sidebar-navigation" id="navigation" ${!state.menu&&matchMedia('(max-width:800px)').matches?'hidden':''}><nav aria-label="Main navigation">${menuItems().map(([href,name])=>`<a href="#${href}" aria-label="${name}" title="${name}" ${current===href?'aria-current="page"':''}>${navigationIcon(href==='/budget'?'overview':href==='/history'?'history':'submit')}<span>${name}</span></a>`).join('')}<button class="settings-toggle${current.startsWith('/settings/')?' is-current':''}" data-action="settings-toggle" aria-label="Settings" title="Settings" aria-controls="settings-navigation" aria-expanded="${state.settingsOpen}">${navigationIcon('settings')}<span>Settings</span><span class="settings-chevron" aria-hidden="true">${navigationIcon('chevron')}</span></button></nav><nav class="settings-subnav" id="settings-navigation" aria-label="Settings sections" ${!state.settingsOpen?'hidden':''}>${settingsItems().map(([href,name])=>`<a href="#${href}" ${current===href?'aria-current="page"':''}>${name}</a>`).join('')}</nav></div>
    <footer><button data-action="logout" aria-label="${state.session.demo?'Exit demo':'Sign out'}" title="${state.session.demo?'Exit demo':'Sign out'}">${navigationIcon('logout')}<span>${state.session.demo?'Exit demo':'Sign out'}</span></button></footer>
    </aside><div class="workspace-body"><header class="workspace-topbar"><div class="welcome"><span class="welcome-avatar">${navigationIcon('person')}</span><p>Welcome, <strong>${greeting}</strong></p>${state.session.demo?'<span class="demo-label">Simulation</span>':''}</div></header><main id="main" class="workspace-main"><div class="page" id="page"><div class="loading" role="status">Loading your workspace...</div></div></main></div>${state.session.demo?demoResetDialog():''}</div>`;
}
function demoResetButton() {return state.session.demo?'<button type="button" class="destructive" data-action="open-demo-reset">Reset demo</button>':'';}
function demoResetDialog() {return `<dialog class="confirm-dialog" id="demo-reset-dialog" aria-labelledby="demo-reset-title"><form data-form="demo-reset" novalidate><h2 id="demo-reset-title">Reset demo?</h2><p>Delete all demo receipts and submissions.</p>${formMessage}<div class="actions"><button type="button" data-action="close-demo-reset" autofocus>Cancel</button><button type="submit" class="primary">Reset demo</button></div></form></dialog>`;}
function heading(title,description,action='') {const tag=route().startsWith('/settings/')?'h2':'h1';return `<div class="page-heading"><div><${tag} tabindex="-1">${title}</${tag}>${description?`<p class="page-description">${description}</p>`:''}</div>${action}</div>`;}
function settingsPage(content) {return `<header class="settings-heading"><h1 tabindex="-1">Settings</h1></header>${content}`;}
function authBackground() {return '<img class="login-background" src="/assets/login-finance-hd.png" width="1536" height="1024" alt="" decoding="async" fetchpriority="high">';}
function paypalMark() {return '<img src="/assets/paypal-mark.svg" width="24" height="24" alt="" aria-hidden="true">';}
function login() {
  state.loginRole||='committee';
  const role=state.loginRole;
  document.title=`${role==='treasurer'?'Treasurer':'Committee'} sign in | Gantiin`;
  const paypalFailed=location.hash.includes('paypal=failed');
  app.innerHTML=`<div class="login">${authBackground()}<main id="main" class="login-main">
    <header class="login-topbar">${brandLogo()}</header>
    <section class="login-card" aria-labelledby="login-title">
      <div class="login-visual" aria-hidden="true"><img src="/assets/login-finance-hd.png" width="1536" height="1024" alt="" decoding="async" fetchpriority="high"></div><div class="login-form">
      <header class="login-heading"><h1 id="login-title">Welcome</h1></header>
      <div class="role-switch" role="tablist" aria-label="Sign-in role" data-role="${role}">
        <span class="role-indicator" aria-hidden="true"></span>
        ${['treasurer','committee'].map(value=>`<button type="button" role="tab" id="role-${value}" aria-controls="login-panel" aria-selected="${role===value}" tabindex="${role===value?0:-1}" data-action="login-role" data-role="${value}">${value==='treasurer'?'Treasurer':'Committee'}</button>`).join('')}
      </div>
      ${!state.session?.initialized?'<p class="note" role="status">No accounts configured.</p>':''}
      ${paypalFailed?'<p class="note" role="alert">PayPal sign-in was not completed. Try again or use your password.</p>':''}
      <div id="login-panel" class="login-panel" role="tabpanel" aria-labelledby="role-${role}">${loginForm(role)}</div></div>
    </section>
  </main></div>`;
}
function loginForm(role) {
  const treasurer=role==='treasurer';
  const paypal=state.session?.paypal_login;
  return `<form data-form="login" data-flow="${role}" novalidate>${formMessage}
    <div class="login-fields">${treasurer?'':field('email','Email','email',`required autocomplete="username" maxlength="180" placeholder="Email" value="${esc(state.committeeEmail)}"`,'',true)}${field('password','Password','password','required autocomplete="current-password" maxlength="128" placeholder="Password"','',true)}</div>
    <div class="login-options">${treasurer?'':'<label class="remember-label" for="remember-email"><input id="remember-email" name="remember-email" type="checkbox" '+(state.rememberEmail?'checked':'')+'>Remember email</label>'}<a class="text-link" href="#/forgot-password">Forgot password?</a></div>
    <div class="login-actions"><button type="submit" class="primary">Sign in</button></div>
    <div class="login-alternative"><div class="login-divider" aria-hidden="true"><span>or</span></div>${paypal?`<a class="button paypal-button" data-paypal-login href="${paypalLoginUrl()}" aria-label="Continue with PayPal">${paypalMark()}PayPal</a>`:`<button type="button" class="paypal-button" disabled title="PayPal sign-in is not connected yet" aria-describedby="paypal-status">${paypalMark()}PayPal</button><span id="paypal-status" class="sr-only">PayPal sign-in is not connected yet.</span>`}</div>
  </form>`;
}
function paypalLoginUrl() {return `/api/paypal/login${state.loginRole==='treasurer'?'?role=treasurer':''}`;}
function recoveryPage() {
  const treasurer=state.loginRole==='treasurer',enabled=state.session?.recovery_mode==='local-demo';
  const token=new URLSearchParams(location.hash.split('?')[1]||'').get('token');
  document.title='Reset password | Gantiin';
  app.innerHTML=`<div class="login">${authBackground()}<main id="main" class="login-main"><header class="login-topbar">${brandLogo()}</header><section class="login-card recovery-card" aria-labelledby="recovery-title"><a class="recovery-back" href="#/login" aria-label="Back to sign in">${navigationIcon('back')}</a><header class="login-heading"><h1 id="recovery-title">Reset password</h1></header>${token||enabled?`<form data-form="recovery" novalidate>${formMessage}${token?'':treasurer?field('reset-id','ID','text','value="Treasurer" readonly'):field('reset-email','Email','email','required autocomplete="username" maxlength="180"')}${field('reset-password','New password','password','required maxlength="128" autocomplete="new-password"')}${field('reset-confirm','Confirm password','password','required maxlength="128" autocomplete="new-password"')}<button type="submit" class="primary">Reset password</button></form>`:'<p class="note" role="status">Ask your event operator for a reset link.</p>'}</section></main></div>`;
}
function setLoginRole(role) {
  if(!['treasurer','committee'].includes(role)||role===state.loginRole)return;
  state.loginRole=role;
  const tabs=document.querySelector('.role-switch');
  tabs.dataset.role=role;
  for(const tab of tabs.querySelectorAll('[role="tab"]')) {const selected=tab.dataset.role===role;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
  const panel=document.querySelector('#login-panel');panel.setAttribute('aria-labelledby',`role-${role}`);panel.innerHTML=loginForm(role);
  document.title=`${role==='treasurer'?'Treasurer':'Committee'} sign in | Gantiin`;
  announce(`${role==='treasurer'?'Treasurer: password only.':'Committee: email and password.'}`);
}
function selectedReceipt() {
  const file=state.selected;if(!file)return '';
  const size=file.size<1024?`${file.size} B`:file.size<1024*1024?`${(file.size/1024).toFixed(1)} KB`:`${(file.size/(1024*1024)).toFixed(1)} MB`;
  return `<div class="receipt-review"><a class="receipt-preview" href="${esc(state.preview)}" target="_blank" rel="noopener noreferrer" aria-label="Open selected receipt"><img class="receipt-thumbnail" src="${esc(state.preview)}" width="600" height="800" alt="Selected receipt preview"><span>Open receipt</span></a><div class="selected-file"><h2>${esc(file.name)}</h2><p class="small muted">${file.type==='image/png'?'PNG':'JPEG'} &middot; ${size}</p><div class="receipt-file-actions"><button type="button" data-action="browse-receipt">Change file</button><button type="button" data-action="remove-receipt">Remove file</button></div></div></div>`;
}
function receiptUpload() {return `<div class="receipt-dropzone${state.selected?' has-file':''}" data-dropzone><div class="dropzone-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h4l3 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg><p class="dropzone-title">Drag a file here</p><button type="button" data-action="browse-receipt">Browse files</button>${state.session.demo?'<button type="button" data-action="demo-sample">Use sample</button>':''}<p class="small muted" id="receipt-hint">PNG or JPEG, up to 5 MiB</p></div><label class="sr-only" for="receipt">Receipt image</label><input id="receipt" name="receipt" type="file" accept="image/png,image/jpeg" aria-describedby="receipt-hint" hidden><div id="selected-receipt">${selectedReceipt()}</div></div>`;}
function submitPage() {
  return `${heading('Submit a receipt',state.event.configured?esc(state.event.name):'Event not configured')}<section class="receipt-submission"><form data-form="claim" novalidate>${formMessage}${receiptUpload()}<div class="receipt-actions"><button type="submit" class="primary receipt-submit" ${!state.event.configured?'disabled':''}><span data-button-label>Submit</span>${navigationIcon('send')}</button></div></form></section>`;
}
function historyTable(claims) {
  if(!claims.length) return '<div class="empty"><h2>No reimbursements yet</h2></div>';
  const reimbursed=claims.reduce((total,claim)=>total+(Number.isSafeInteger(claim.paid_sen)?claim.paid_sen:0),0);
  return `<div class="history-total"><span>Total reimbursed</span><strong class="money">${money(reimbursed)}</strong></div><table class="data-table history-table"><caption class="sr-only">${state.session.user.role==='cmt'?'Your reimbursements':'Event reimbursements'}</caption><thead><tr><th scope="col">Submission</th><th scope="col">Reimbursed</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Receipt details</span></th></tr></thead><tbody>${claims.map(c=>`<tr><td data-label="Submission"><div><strong>${esc(c.claimant)}</strong><p class="small muted">${esc(date(c.created_at))}</p></div></td><td data-label="Reimbursed"><div class="money">${money(c.paid_sen)}</div></td><td data-label="Status">${reimbursementStatus(c)}</td><td class="history-action"><a class="button view-receipt" href="#/claim/${esc(c.id)}" aria-label="View receipt from ${esc(c.claimant)}, ${esc(date(c.created_at))}"><span>View</span>${navigationIcon('view')}</a></td></tr>`).join('')}</tbody></table>`;
}
function historyPage(claims) {
  state.claimList=claims;
  if(state.history.user!==state.session.user.id)state.history={user:state.session.user.id,query:'',status:'all',sort:'date-desc'};
  const options=(values,selected)=>values.map(([value,name])=>`<option value="${value}" ${value===selected?'selected':''}>${name}</option>`).join('');
  const sorts=[['date-desc','Date: newest first'],['date-asc','Date: oldest first'],['name-asc','Name: A-Z'],['name-desc','Name: Z-A'],['amount-desc','Amount: high to low'],['amount-asc','Amount: low to high']];
  return `${heading(state.session.user.role==='cmt'?'My reimbursements':'Reimbursement history','',`<div class="actions"><button data-action="refresh">Refresh history</button>${demoResetButton()}</div>`)}<section class="panel history-panel"><div class="toolbar history-toolbar"><div class="field history-search"><label class="sr-only" for="history-search">Find a submission</label><div class="search-control">${navigationIcon('search')}<input id="history-search" type="search" value="${esc(state.history.query)}" placeholder="Search name or submission ID" autocomplete="off"></div></div><div class="history-controls"><div class="field"><label for="history-sort">Sort by</label><select id="history-sort" title="Amount sorting uses the requested receipt total">${options(sorts,state.history.sort)}</select></div><div class="field"><label for="history-filter">Payment status</label><select id="history-filter">${options([['all','All submissions'],['succeeded','Paid'],['pending','Awaiting confirmation'],['processing_failed','Processing failed'],['unpaid','With unpaid difference']],state.history.status)}</select></div></div></div><div id="history-results">${historyResults()}</div><p id="history-announcement" class="sr-only" role="status"></p></section>`;
}
function budgetPage(budget,integrations,claims) {
  return overviewPage(budget,claims,state.event,{heading,icon:navigationIcon});
}
function budgetSetupPage(integrations) {
  return `${heading('Overview','',spreadsheetAction(integrations.spreadsheet_url,navigationIcon))}<section class="panel"><h2>Integration not configured</h2><a class="button" href="#/settings/connections">Open connections</a></section>`;
}
function membersPage(members) {
  return `${heading('Committee members','')}<div class="columns"><section class="panel"><h2>Registered members</h2>${members.length?`<table class="data-table"><thead><tr><th scope="col">Member</th><th scope="col">Sandbox recipient</th></tr></thead><tbody>${members.map(m=>`<tr><td data-label="Member"><div><strong>${esc(m.name)}</strong><p class="small">${esc(m.email)}</p></div></td><td data-label="Recipient"><div>${m.recipient?.verified?'Verified '+(m.recipient.mode==='fixture'?'demo account':'Malaysian Sandbox account'):'Setup required'}<p class="small muted">${m.paypal_linked?'PayPal linked':'PayPal not linked'}</p></div></td></tr>`).join('')}</tbody></table>`:'<p>No committee members yet.</p>'}</section><aside class="panel"><h2>Create a CMT account</h2><form data-form="member" novalidate>${formMessage}${field('member-name','Member name','text','required maxlength="100" autocomplete="name"')}${field('member-email','Email','email','required maxlength="180" autocomplete="off"')}${field('member-password','Initial password','password','required maxlength="128" autocomplete="new-password"')}<button type="submit" class="primary glass">Create CMT account</button></form></aside></div>`;
}
function policyPage() {
  const e=state.event;
  const seededExample=e.synthetic&&e.name==='Synthetic test event'&&e.description==='Synthetic policy for reimbursement acceptance tests. This is not the selected real event.';
  const editable=e.configured&&!seededExample;
  return `${heading('Event policy','')}<section class="panel policy-content">
    <form data-form="policy" novalidate>${formMessage}<div class="event-name-section"><span class="section-icon rose-icon">${navigationIcon('event')}</span>${field('event-name','Event name','text',`required maxlength="120" placeholder="e.g. Campus Career Day 2026" value="${editable?esc(e.name):''}"`)}</div>
      <div class="field event-description-field"><label for="event-description">Event description</label><textarea id="event-description" required minlength="10" maxlength="4000" placeholder="Describe your event, its purpose, and the purchases needed.">${editable?esc(e.description):''}</textarea></div>
      <div class="actions event-save"><button type="submit" class="primary">${navigationIcon('check')}<span>Save event</span></button></div>
    </form></section>`;
}
function accountPage() {
  const u=state.session.user;
  if(state.session.demo)return `${heading('Account','')}<section class="panel"><dl class="detail-list"><dt>Name</dt><dd>${esc(u.name)}</dd><dt>Event</dt><dd>${esc(state.event.name)}</dd></dl><div class="actions">${demoResetButton()}</div></section>`;
  const passwordPanel=`<section class="panel password-panel"><div class="section-heading"><span class="section-icon rose-icon">${navigationIcon('lock')}</span><h2 id="account-password-title">Change password</h2></div><form data-form="password" aria-labelledby="account-password-title" novalidate>${formMessage}<div class="password-inputs">${field('current-password','Current password','password','required autocomplete="current-password"')}${field('new-password','New password','password','required maxlength="128" autocomplete="new-password"')}</div><div class="password-actions"><button type="submit" class="primary">Change password</button></div></form></section>`;
  if(u.role==='treasurer')return `${heading('Account','')}<div class="account-treasurer">${passwordPanel}</div>`;
  const linkReady=state.session.paypal_login&&(u.role==='cmt'||state.session.paypal_sender_configured);
  const linkForm=`<form class="paypal-link-form" data-form="paypal" novalidate>${formMessage}${field('link-password','Website password','password','required autocomplete="current-password"')}<button type="submit">${navigationIcon('key')}<span>Link PayPal</span></button></form>`;
  return `${heading('Account','')}<div class="account-grid"><section class="panel account-profile" aria-label="Account details"><header class="profile-heading"><span class="profile-avatar">${navigationIcon('person')}</span><div><h2>${u.role==='treasurer'?'Treasurer':esc(u.name)}</h2>${u.role==='cmt'?`<p class="small muted">${esc(u.email)}</p>`:'<p class="small muted">Shared account</p>'}</div></header>
    <div class="account-paypal"><div class="service-heading"><span class="section-icon mist-icon">${navigationIcon('key')}</span><h3>PayPal sign-in</h3><span class="connection-status ${u.paypal_linked?'is-ready':'is-missing'}"><span aria-hidden="true"></span>${u.paypal_linked?'Linked':'Not linked'}</span></div>
    ${linkReady?(u.paypal_linked?`<details class="relink-account"><summary>Change linked account</summary>${linkForm}</details>`:linkForm):'<button disabled title="PayPal sign-in is not configured">Link PayPal</button>'}
    ${u.role==='cmt'?`<div class="recipient-state"><span>Reimbursement account</span><span class="connection-status ${u.recipient?.verified?'is-ready':'is-missing'}"><span aria-hidden="true"></span>${u.recipient?.verified?'Ready':'Setup required'}</span></div>`:''}
    ${location.hash.includes('paypal=linked')?'<p role="status" class="linked-notice">PayPal linked.</p>':''}</div></section>
    ${passwordPanel}</div>`;
}
function connectionsPage(integrations) {
  const demo=state.session.mode==='fixture';
  const services=[
    {name:'Google Sheets',icon:'sheet',kind:'sheets',simulated:demo&&integrations.budget_source==='fixture',ready:integrations.google},
    {name:'Receipt AI',icon:'submit',kind:'ai',simulated:demo,ready:integrations.ai},
    {name:'PayPal payouts',icon:'budget',kind:'payouts',simulated:demo,ready:integrations.paypal},
    {name:'PayPal sign-in',icon:'key',kind:'identity',ready:integrations.paypal_login}
  ];
  return `${heading('Connections','')}<section class="panel connections-panel" aria-label="Service configuration"><ul class="service-list">${services.map(service=>`<li class="service-row"><span class="service-icon service-${service.kind}">${navigationIcon(service.icon)}</span><h3>${service.name}</h3><span class="connection-status ${service.simulated?'is-simulated':service.ready?'is-ready':'is-missing'}"><span aria-hidden="true"></span>${service.simulated?'Simulated':service.ready?'Configured':'Not configured'}</span></li>`).join('')}</ul></section>`;
}
async function render() {
  const token=++state.routeToken;
  try {
    if(!state.session) {
      const session=await api('/session');
      if(token!==state.routeToken)return;
      state.session=session;
      if(state.demo&&!session.user){setDemoMode(false);state.session=await api('/session');}
      rememberCommitteeEmail(session.user);
    }
    if(route()==='/forgot-password'){recoveryPage();return;}
    if(!state.session.user){login();return;}
    const current=route();
    const legacy={'/account':'/settings/account','/members':'/settings/members','/policy':'/settings/event','/settings':'/settings/account'};
    if(legacy[current]) {location.hash=legacy[current]+(location.hash.includes('?')?'?'+location.hash.split('?')[1]:'');return;}
    const allowed=[...menuItems().map(i=>i[0]),...settingsItems().map(i=>i[0])];
    if(!allowed.includes(current)&&!current.startsWith('/claim/')) {location.hash=state.session.user.role==='treasurer'?'/budget':'/submit';return;}
    shell();const page=document.querySelector('#page');let html;
    let dataRequest=Promise.resolve(null);
    const needsSetup=current==='/budget'&&state.session.mode==='sandbox'&&!state.session.integrations?.sheets;
    if(current==='/history')dataRequest=api('/claims');
    else if(current==='/budget')dataRequest=needsSetup?api('/integrations'):Promise.all([api('/budget'),api('/claims')]);
    else if(current==='/settings/members')dataRequest=api('/members');
    else if(current==='/settings/connections')dataRequest=api('/integrations');
    else if(current.startsWith('/claim/'))dataRequest=api(`/claims/${current.split('/')[2]}`);
    const [event,data]=await Promise.all([api('/event'),dataRequest]);
    if(token!==state.routeToken)return;
    state.event=event;state.event.insufficient_context??='reject';
    if(current==='/submit') html=submitPage();
    else if(current==='/history') html=historyPage(data);
    else if(current==='/budget') html=needsSetup?budgetSetupPage(data):budgetPage(data[0],null,data[1]);
    else if(current==='/settings/members') html=settingsPage(membersPage(data));
    else if(current==='/settings/event') html=settingsPage(policyPage());
    else if(current==='/settings/account') html=settingsPage(accountPage());
    else if(current==='/settings/connections') html=settingsPage(connectionsPage(data));
    else if(current.startsWith('/claim/')) {state.detailSignature=JSON.stringify(data);html=renderClaimDetail(data,{heading,icon:navigationIcon,apiPrefix:state.demo?'/api/demo-cmt':'/api'});}
    if(token!==state.routeToken)return;
    page.innerHTML=html;
    if(current==='/submit'&&!Object.values(state.session.integrations||{}).every(Boolean)) {
      const notice=document.createElement('div');notice.id='integration-notice';notice.className='note';notice.setAttribute('role','status');notice.innerHTML='<strong>Integration not configured</strong>';
      const form=page.querySelector('form');form.prepend(notice);const button=form.querySelector('button[type="submit"]');button.disabled=true;button.setAttribute('aria-describedby',notice.id);
    }
    if(current==='/settings/account'&&location.hash.includes('paypal=failed')){const notice=document.createElement('p');notice.className='note';notice.setAttribute('role','alert');notice.textContent='PayPal identity did not match the configured account. Try linking again.';page.querySelector('.page-heading').insertAdjacentElement('afterend',notice);}
    const h=page.querySelector('h1');document.title=`${h?.textContent||'Workspace'} | Gantiin`;
    h?.focus({preventScroll:true});
  } catch(error) {
    if(token!==state.routeToken)return;
    const page=document.querySelector('#page')||app;
    page.innerHTML=`${heading('Workspace unavailable','')}<div class="error" role="alert"><p>${esc(error.message)}</p><button data-action="refresh">Retry loading</button></div>`;
  }
}
function historyRows() {
  const {query,status:filter,sort}=state.history;
  const needle=query.trim().toLowerCase();
  const rows=state.claimList.filter(c=>`${c.claimant} ${c.id}`.toLowerCase().includes(needle)).filter(c=>filter==='all'||filter==='succeeded'&&c.payment?.status==='succeeded'||filter==='pending'&&['pending','unknown','reserved'].includes(c.payment?.status)||filter==='processing_failed'&&c.processing==='processing_failed'||filter==='unpaid'&&c.unpaid_sen>0);
  const direction=sort.endsWith('-asc')?1:-1;
  rows.sort((a,b)=>{
    let result=0;
    if(sort.startsWith('name-'))result=String(a.claimant).localeCompare(String(b.claimant),'en',{sensitivity:'base',numeric:true})*direction;
    else if(sort.startsWith('amount-')){const knownA=Number.isSafeInteger(a.requested_sen),knownB=Number.isSafeInteger(b.requested_sen);if(knownA!==knownB)return knownA?-1:1;if(knownA)result=(a.requested_sen-b.requested_sen)*direction;}
    else result=(Date.parse(a.created_at)-Date.parse(b.created_at))*direction;
    return result||Date.parse(b.created_at)-Date.parse(a.created_at)||String(a.id).localeCompare(String(b.id));
  });
  return rows;
}
function historyResults() {const rows=historyRows();return rows.length||!state.claimList.length?historyTable(rows):'<p class="empty">No submissions match these filters.</p>';}
function filterHistory() {
  state.history.query=document.querySelector('#history-search').value;state.history.status=document.querySelector('#history-filter').value;state.history.sort=document.querySelector('#history-sort').value;
  document.querySelector('#history-results').innerHTML=historyResults();
  const option=document.querySelector('#history-sort').selectedOptions[0].textContent;
  document.querySelector('#history-announcement').textContent=`${historyRows().length} reimbursements shown. Sorted by ${option}.`;
}
async function refreshHistory(button) {
  const token=state.routeToken;
  const original=button.innerHTML;
  button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='Refreshing...';
  document.querySelector('#history-refresh-error')?.remove();
  try {
    const records=await api('/claims');
    if(token!==state.routeToken)return;
    state.claimList=records;
    document.querySelector('#history-results').innerHTML=historyResults();
    document.querySelector('#history-announcement').textContent=`History updated. ${historyRows().length} reimbursements shown.`;
  } catch(error) {
    if(token!==state.routeToken)return;
    const message=document.createElement('p');message.id='history-refresh-error';message.className='note';message.setAttribute('role','alert');message.textContent=error.message;
    document.querySelector('.history-panel').prepend(message);
  } finally {
    button.innerHTML=original;button.disabled=false;button.removeAttribute('aria-busy');
  }
}
async function selectFile(file) {
  if(!file)return;
  if(file.size>5*1024*1024||!['image/png','image/jpeg'].includes(file.type))throw new Error('Select a PNG or JPEG up to 5 MiB.');
  state.selected=file;state.submissionKey=crypto.randomUUID();if(state.preview)URL.revokeObjectURL(state.preview);state.preview=URL.createObjectURL(file);
  const message=document.querySelector('[data-form="claim"] [data-message]');message?.replaceChildren();message?.removeAttribute('role');
  document.querySelector('#selected-receipt').innerHTML=selectedReceipt();
  document.querySelector('[data-dropzone]').classList.add('has-file');
  document.querySelector('#selected-receipt [data-action="browse-receipt"]')?.focus({preventScroll:true});
  announce(`Selected ${file.name}`);
}
app.addEventListener('submit',event=>{
  event.preventDefault();const form=event.target;
  if(state.demoOpening)return;
  submitForm(form,async data=>{
    switch(form.dataset.form) {
      case 'login': {
        const treasurer=form.dataset.flow==='treasurer';
        const result=await api(treasurer?'/login/treasurer':'/login',{method:'POST',data:treasurer?{password:data.get('password')}:{email:data.get('email'),password:data.get('password')}});
        rememberCommitteeEmail(result.user);
        state.session={...state.session,...result};state.loginRole=null;
        const destination=result.user.role==='treasurer'?'/budget':'/submit';
        if(location.hash===`#${destination}`)await render();else location.hash=destination;
        break;
      }
      case 'claim': {
        if(!state.selected)throw new Error('Select a receipt image.');
        const receipt_base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(new Error('Could not read this file.'));reader.readAsDataURL(state.selected);});
        const claim=await api('/claims',{method:'POST',key:state.submissionKey,data:{receipt_base64}});
        state.selected=null;state.submissionKey=crypto.randomUUID();location.hash=`/claim/${claim.id}`;announce('Receipt submitted. Assessment and payment processing have started.');break;
      }
      case 'member': {await api('/members',{method:'POST',data:{name:data.get('member-name'),email:data.get('member-email'),password:data.get('member-password')}});await render();const f=document.querySelector('[data-form="member"]');success(f,'CMT account created. Share the credentials privately.');break;}
      case 'policy': {await api('/event',{method:'PUT',data:{name:data.get('event-name'),description:document.querySelector('#event-description').value,expected_version:state.event.version}});await render();showToast('Event saved.',document.querySelector('[data-form="policy"] button[type="submit"]'));break;}
      case 'demo-reset': {await api('/reset-demo',{method:'POST',data:{confirm:true}});state.selected=null;if(state.preview)URL.revokeObjectURL(state.preview);state.preview=null;state.submissionKey=crypto.randomUUID();state.history={user:null,query:'',status:'all',sort:'date-desc'};state.claimList=[];state.menu=false;history.replaceState(null,'','#/history');scrollTo(0,0);await render();showToast('Demo reset.',document.querySelector('[data-action="open-demo-reset"]'));break;}
      case 'password': {await api('/password',{method:'POST',data:{current_password:data.get('current-password'),new_password:data.get('new-password')}});form.reset();success(form,'Password changed. Other website sessions have been signed out.');break;}
      case 'paypal': {const result=await api('/paypal/link',{method:'POST',data:{password:data.get('link-password')}});location.assign(result.url);break;}
      case 'recovery': {
        if(data.get('reset-password')!==data.get('reset-confirm'))throw new Error('Passwords do not match.');
        const token=new URLSearchParams(location.hash.split('?')[1]||'').get('token');
        if(token){await api('/password/reset',{method:'POST',demo:false,data:{token,password:data.get('reset-password')}});setDemoMode(false);state.session=null;history.replaceState(null,'','#/login');await render();showToast('Password updated. Sign in.',document.querySelector('[name="password"]'));break;}
        const result=await api('/demo/reset-password',{method:'POST',data:{role:state.loginRole==='treasurer'?'treasurer':'committee',...(state.loginRole==='treasurer'?{}:{email:data.get('reset-email')}),password:data.get('reset-password')}});
        form.reset();success(form,result.message);announce('Local demo password reset completed.');break;
      }
    }
  });
});
app.addEventListener('click',async event=>{
  if(state.demoOpening){event.preventDefault();return;}
  const focusLink=event.target.closest('[data-field-focus]');if(focusLink){event.preventDefault();document.getElementById(focusLink.dataset.fieldFocus)?.focus();return;}
  const button=event.target.closest('[data-action]');if(!button)return;
  try {
    switch(button.dataset.action) {
      case 'login-role': {setLoginRole(button.dataset.role);break;}
      case 'toggle-password': {const input=document.getElementById(button.dataset.input);const show=input.type==='password';input.type=show?'text':'password';button.setAttribute('aria-label',show?'Hide password':'Show password');button.setAttribute('aria-pressed',String(show));break;}
      case 'menu': {state.menu=!state.menu;button.setAttribute('aria-expanded',String(state.menu));document.querySelector('#navigation').hidden=!state.menu;break;}
      case 'sidebar-collapse': {state.sidebarCollapsed=!state.sidebarCollapsed;try{sessionStorage.setItem('gantiin.sidebar-collapsed',String(state.sidebarCollapsed));}catch{}document.querySelector('.workspace').classList.toggle('sidebar-collapsed',state.sidebarCollapsed);button.setAttribute('aria-label',`${state.sidebarCollapsed?'Expand':'Collapse'} sidebar`);button.title=button.getAttribute('aria-label');break;}
      case 'settings-toggle': {if(state.sidebarCollapsed){state.sidebarCollapsed=false;try{sessionStorage.setItem('gantiin.sidebar-collapsed','false');}catch{}document.querySelector('.workspace').classList.remove('sidebar-collapsed');const collapse=document.querySelector('.sidebar-toggle');collapse.setAttribute('aria-label','Collapse sidebar');collapse.title='Collapse sidebar';}state.settingsOpen=!state.settingsOpen;document.querySelector('#settings-navigation').hidden=!state.settingsOpen;button.setAttribute('aria-expanded',String(state.settingsOpen));break;}
      case 'logout': {await api('/logout',{method:'POST'});setDemoMode(false);state.session=null;state.selected=null;state.menu=false;state.loginRole=null;location.hash='/login';await render();break;}
      case 'demo-sample': {button.disabled=true;const response=await fetch('/api/demo-cmt/sample-receipt',{credentials:'same-origin'});if(!response.ok)throw new Error('The sample receipt is unavailable. Try again.');await selectFile(new File([await response.blob()],'01-printing-and-registration.png',{type:'image/png'}));break;}
      case 'open-demo-reset': {document.querySelector('#demo-reset-dialog').showModal();break;}
      case 'close-demo-reset': {document.querySelector('#demo-reset-dialog').close();break;}
      case 'show-rejection': {rejectionOpener={button,item:button.dataset.itemId,route:route()};rejectionDialog.querySelector('#rejection-title').textContent=button.dataset.item;rejectionDialog.querySelector('#rejection-reason').textContent=button.dataset.reason;rejectionDialog.showModal();break;}
      case 'refresh': if(route()==='/history'&&document.querySelector('#history-search'))await refreshHistory(button);else await render();break;
      case 'browse-receipt': {const input=document.querySelector('#receipt');input.value='';input.click();break;}
      case 'remove-receipt': {state.selected=null;if(state.preview)URL.revokeObjectURL(state.preview);state.preview=null;state.submissionKey=crypto.randomUUID();document.querySelector('#receipt').value='';document.querySelector('#selected-receipt').innerHTML='';document.querySelector('[data-dropzone]').classList.remove('has-file');document.querySelector('[data-action="browse-receipt"]').focus();announce('Receipt file removed.');break;}
      case 'retry-claim': {button.disabled=true;await api(`/claims/${button.dataset.id}/retry`,{method:'POST'});await render();announce('Technical recovery requested for the same recorded operation.');break;}
    }
  } catch(error) {const form=button.closest('form');if(form)showFormError(form,error.message);else{const message=document.createElement('div');message.className='note';message.setAttribute('role','alert');message.textContent=error.message;button.insertAdjacentElement('afterend',message);}}
  finally {button.disabled=false;}
});
app.addEventListener('change',event=>{if(event.target.id==='receipt')selectFile(event.target.files[0]).catch(error=>showFormError(event.target.form,error.message));if(['history-filter','history-sort'].includes(event.target.id))filterHistory();if(event.target.id==='remember-email'){state.rememberEmail=event.target.checked;saveEmailPreference();}});
for(const type of ['dragenter','dragover'])app.addEventListener(type,event=>{if(!event.dataTransfer?.types.includes('Files'))return;event.preventDefault();const zone=event.target.closest('[data-dropzone]');if(zone){zone.classList.add('is-dragging');event.dataTransfer.dropEffect='copy';}});
app.addEventListener('dragleave',event=>{const zone=event.target.closest('[data-dropzone]');if(zone&&!zone.contains(event.relatedTarget))zone.classList.remove('is-dragging');});
app.addEventListener('drop',event=>{if(!event.dataTransfer?.types.includes('Files'))return;event.preventDefault();const zone=event.target.closest('[data-dropzone]');document.querySelectorAll('.is-dragging').forEach(el=>el.classList.remove('is-dragging'));if(!zone)return;const files=event.dataTransfer.files;if(files.length!==1){showFormError(zone.closest('form'),'Choose one receipt at a time.');return;}selectFile(files[0]).catch(error=>showFormError(zone.closest('form'),error.message));});
app.addEventListener('input',event=>{
  if(event.target.id==='history-search')filterHistory();
  const input=event.target;
  if(input.getAttribute('aria-invalid')==='true'&&input.checkValidity()){
    input.removeAttribute('aria-invalid');document.getElementById(`${input.id}-error`)?.remove();
    const describedBy=(input.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!==`${input.id}-error`).join(' ');if(describedBy)input.setAttribute('aria-describedby',describedBy);else input.removeAttribute('aria-describedby');
    const form=input.form;
    if(form&&!form.querySelector('[aria-invalid="true"]')){const message=form.querySelector('[data-message]');if(message?.textContent.includes('Check the highlighted fields.'))message.textContent='';}
  }
});
app.addEventListener('keydown',event=>{
  const tab=event.target.closest('.role-switch [role="tab"]');
  if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
    event.preventDefault();if(tab.disabled)return;
    const next=event.key==='Home'?'treasurer':event.key==='End'?'committee':tab.dataset.role==='committee'?'treasurer':'committee';
    setLoginRole(next);document.querySelector(`#role-${next}`).focus();return;
  }
  if(event.key==='Escape'&&state.menu){state.menu=false;document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');document.querySelector('#navigation').hidden=true;document.querySelector('.menu-toggle')?.focus();}
});
addEventListener('hashchange',()=>{state.menu=false;if(route().startsWith('/settings/')&&state.sidebarCollapsed){state.sidebarCollapsed=false;try{sessionStorage.setItem('gantiin.sidebar-collapsed','false');}catch{}}scrollTo(0,0);render();});
matchMedia('(max-width:800px)').addEventListener('change',()=>{const mobile=matchMedia('(max-width:800px)').matches;const nav=document.querySelector('#navigation');if(nav)nav.hidden=mobile&&!state.menu;});
setInterval(async()=>{
  if(document.hidden||!state.session?.user||!route().startsWith('/claim/'))return;
  try {
    const current=route();const c=await api(`/claims/${current.split('/')[2]}`);const signature=JSON.stringify(c);
    if(current!==route()||signature===state.detailSignature)return;
    const page=document.querySelector('#page');if(!page)return;
    const open=[...page.querySelectorAll('details[open]')].map(el=>el.dataset.detailKey||el.querySelector('summary').textContent);
    const active=page.contains(document.activeElement)?document.activeElement:null;
    const focus=active?{tag:active.tagName,action:active.dataset.action,href:active.getAttribute('href'),text:active.textContent,detailKey:active.closest('details')?.dataset.detailKey}:null;
    page.innerHTML=renderClaimDetail(c,{heading,icon:navigationIcon,apiPrefix:state.demo?'/api/demo-cmt':'/api'});state.detailSignature=signature;
    for(const detail of page.querySelectorAll('details'))if(open.includes(detail.dataset.detailKey||detail.querySelector('summary').textContent))detail.open=true;
    if(focus){const target=[...page.querySelectorAll('h1,button,a,summary')].find(el=>el.tagName===focus.tag&&(focus.detailKey?el.closest('details')?.dataset.detailKey===focus.detailKey:focus.action?el.dataset.action===focus.action:focus.href?el.getAttribute('href')===focus.href:el.textContent===focus.text));target?.focus({preventScroll:true});}
    announce(`${label(c.processing)}. ${money(c.paid_sen)} confirmed paid. ${label(c.payment?.sync||'not_required')}.`);
  }catch{}
},2500);
await render();
