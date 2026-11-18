import config from './config.js';
const keyName = 'petcare-session-v1';
let session;
try { session = JSON.parse(localStorage.getItem(keyName) || 'null'); } catch { session = null; }
let refreshing;
function save(value) { session = value; if (value) localStorage.setItem(keyName, JSON.stringify(value)); else localStorage.removeItem(keyName); }
async function raw(path, options = {}, token) {
 const response = await fetch(config.url + path, { ...options, cache:'no-store', headers: {
  apikey:config.key, ...(token ? {Authorization:`Bearer ${token}`} : {}),
  'Content-Type':'application/json', ...options.headers
 }});
 const text = await response.text();
 let data; try { data = text ? JSON.parse(text) : null; } catch { data = null; }
 if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || data?.error || `Error ${response.status}`);
 return data;
}
async function token() {
 if (!session) throw new Error('Inicia sessió per continuar.');
 if (session.expires_at < Date.now()/1000 + 60) {
  refreshing ||= raw('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})})
   .then(data=>{save({...data,expires_at:Date.now()/1000+data.expires_in});return session.access_token;})
   .catch(error=>{save(null);window.dispatchEvent(new Event('petcare-signout'));throw error;}).finally(()=>{refreshing=null;});
  return refreshing;
 }
 return session.access_token;
}
export const api = {
 get session() { return session; },
 async login(email,password) { const data=await raw('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});save({...data,expires_at:Date.now()/1000+data.expires_in}); },
 async logout() { try { if(session) await raw('/auth/v1/logout',{method:'POST'},await token()); } finally {save(null);} },
 async recover(email) { return raw('/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+'/'),{method:'POST',body:JSON.stringify({email})}); },
 acceptRecovery() {const h=new URLSearchParams(location.hash.slice(1));if(h.get('type')==='recovery'&&h.get('access_token')&&h.get('refresh_token')){save({access_token:h.get('access_token'),refresh_token:h.get('refresh_token'),expires_at:Date.now()/1000+Number(h.get('expires_in')||3600)});history.replaceState(null,'',location.pathname);return true;}return false;},
 async password(password) {return raw('/auth/v1/user',{method:'PUT',body:JSON.stringify({password})},await token());},
 async data(table,query='',method='GET',body) {return raw('/rest/v1/'+table+query,{method,headers:{Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})},await token());},
 async rpc(name,body) {return raw('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(body)},await token());},
 async upload(path,file) {return raw('/storage/v1/object/petcare-documents/'+path,{method:'POST',headers:{'Content-Type':file.type,'x-upsert':'false'},body:file},await token());},
 async remove(path) {return raw('/storage/v1/object/petcare-documents',{method:'DELETE',body:JSON.stringify({prefixes:[path]})},await token());},
 async signed(path) {const data=await raw('/storage/v1/object/sign/petcare-documents/'+path,{method:'POST',body:JSON.stringify({expiresIn:60})},await token());return config.url+'/storage/v1'+data.signedURL;}
};
window.addEventListener('storage',e=>{if(e.key===keyName){try{session=JSON.parse(e.newValue||'null');}catch{session=null;}window.dispatchEvent(new Event('petcare-session'));}});
