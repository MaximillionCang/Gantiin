// Read the saved appearance before the stylesheet paints. No account data is stored.
(() => {
  let theme='dark';
  try {if(localStorage.getItem('gantiin.theme')==='light')theme='light';} catch {}
  document.documentElement.dataset.theme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='light'?'#f5f6fb':'#090b14');
})();
