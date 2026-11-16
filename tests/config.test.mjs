import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicConfig } from '../scripts/config.mjs';
const base={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'};
test('accepta configuració pública',()=>assert.equal(publicConfig(base).url,base.SUPABASE_URL));
test('atura build sense configuració',()=>assert.throws(()=>publicConfig({})));
test('rebutja secrets sense revelar-los',()=>{for(const key of ['sb_secret_hidden','password',`a.${Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')}.b`]){assert.throws(()=>publicConfig({...base,SUPABASE_PUBLISHABLE_KEY:key}),e=>!e.message.includes(key));}});
test('rebutja URL amb credencials o sense HTTPS',()=>{for(const url of ['http://example.com','https://user:password@example.com','https://example.com/path'])assert.throws(()=>publicConfig({...base,SUPABASE_URL:url}));});
test('permet la clau anon antiga',()=>assert.ok(publicConfig({...base,SUPABASE_PUBLISHABLE_KEY:`a.${Buffer.from(JSON.stringify({role:'anon'})).toString('base64url')}.b`}).key));
