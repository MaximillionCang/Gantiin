export function createApi(state,{fetcher=globalThis.fetch,onUnauthorized=()=>{state.session=null;location.hash='/login';}}={}) {
  return async function api(path,{method='GET',data,key,demo=state.demo===true}={}) {
    let response;
    try {
      response=await fetcher(`${demo?'/api/demo-cmt':'/api'}${path}`,{method,credentials:'same-origin',headers:{Accept:'application/json',...(data?{'Content-Type':'application/json'}:{}),...(method!=='GET'?{'X-CSRF-Token':state.session?.csrf||''}:{}),...(key?{'Idempotency-Key':key}:{})},body:data?JSON.stringify(data):undefined});
    }catch {throw new Error('Connection lost. Your saved operations remain recorded. Reconnect and try again.');}
    if(response.status===401&&!['/login','/login/treasurer'].includes(path))onUnauthorized();
    let result;
    try {result=await response.json();}
    catch {throw new Error('The server returned an unreadable response. Please try again.');}
    if(!response.ok)throw new Error(typeof result?.error==='string'?result.error:'The request failed. Please try again.');
    if(result===null||typeof result!=='object')throw new Error('The server returned an invalid response. Please try again.');
    return result;
  };
}
