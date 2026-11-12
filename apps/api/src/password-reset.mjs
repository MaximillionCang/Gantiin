import { randomUUID } from 'node:crypto';
import { digest, email, invariant, passwordHash, secret } from './domain/core.mjs';

const prefix='password_reset:';
const atomic=(db,operation)=>{
  db.exec('BEGIN IMMEDIATE');
  try {const result=operation();db.exec('COMMIT');return result;}
  catch(error){db.exec('ROLLBACK');throw error;}
};
function clearGrants(db,userId,now) {
  const rows=db.prepare('SELECT key,value FROM settings WHERE key LIKE ?').all(`${prefix}%`);
  for(const row of rows){const grant=JSON.parse(row.value);if(grant.user_id===userId||grant.expires<=now)db.prepare('DELETE FROM settings WHERE key=?').run(row.key);}
}
export function issuePasswordReset(db,address,base,{now=Date.now()}={}) {
  const origin=new URL(base);
  invariant(origin.protocol==='https:'||['localhost','127.0.0.1','[::1]'].includes(origin.hostname),'Reset links require HTTPS outside localhost.');
  invariant(!origin.username&&!origin.password,'Use the website origin without credentials.');
  const account=email(address),token=secret();
  return atomic(db,()=>{
    const user=db.prepare('SELECT id,password FROM users WHERE email=?').get(account);
    invariant(user,'No existing website account matches this email.');
    clearGrants(db,user.id,now);
    db.prepare('INSERT INTO settings VALUES(?,?)').run(prefix+digest(token),JSON.stringify({user_id:user.id,expires:now+15*60000,password_version:digest(user.password)}));
    db.prepare('INSERT INTO audit VALUES(?,?,?,?,?)').run(randomUUID(),new Date(now).toISOString(),'operator','password_reset_issued',user.id);
    return `${origin.origin}/#/forgot-password?token=${token}`;
  });
}
export function redeemPasswordReset(db,token,password,{now=Date.now()}={}) {
  invariant(typeof token==='string'&&/^[a-f0-9]{64}$/.test(token),'This reset link is invalid or has expired.',400,'reset_invalid');
  const key=prefix+digest(token);
  return atomic(db,()=>{
    const row=db.prepare('SELECT value FROM settings WHERE key=?').get(key);
    const grant=row?JSON.parse(row.value):null;
    const user=grant?db.prepare('SELECT id,password FROM users WHERE id=?').get(grant.user_id):null;
    invariant(user&&grant.expires>now&&grant.password_version===digest(user.password),'This reset link is invalid or has expired.',400,'reset_invalid');
    const hash=passwordHash(password);
    db.prepare('UPDATE users SET password=? WHERE id=?').run(hash,user.id);
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
    db.prepare('DELETE FROM oauth WHERE user_id=?').run(user.id);
    clearGrants(db,user.id,now);
    db.prepare('INSERT INTO audit VALUES(?,?,?,?,?)').run(randomUUID(),new Date(now).toISOString(),user.id,'password_reset_completed',user.id);
    return user.id;
  });
}
