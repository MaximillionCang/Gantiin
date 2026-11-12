import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { now, invariant } from './domain.mjs';

export class Store {
  constructor(path = ':memory:') {
    this.path=path;
    if (path !== ':memory:') mkdirSync(dirname(path), {recursive: true});
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('cmt','treasurer')), event_id TEXT NOT NULL, name TEXT NOT NULL, recipient TEXT, paypal_sub TEXT UNIQUE);
      CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), csrf TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS claims (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), event_id TEXT NOT NULL, receipt_hash TEXT NOT NULL, request_key TEXT NOT NULL, payload_hash TEXT NOT NULL, created_at TEXT NOT NULL, data TEXT NOT NULL, receipt BLOB NOT NULL, UNIQUE(event_id,receipt_hash), UNIQUE(user_id,request_key));
      CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, claim_id TEXT UNIQUE REFERENCES claims(id), sheet_row INTEGER UNIQUE NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, at TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, resource TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS oauth (state TEXT PRIMARY KEY, cookie_hash TEXT NOT NULL, user_id TEXT, purpose TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS lease (id INTEGER PRIMARY KEY CHECK(id=1), owner TEXT NOT NULL, expires INTEGER NOT NULL);
      PRAGMA user_version=1;`);
    if (!this.setting('event')) this.set('event', {id:'event-1',name:'Event not configured',description:'',currency:'MYR',version:0,rules:[],configured:false,synthetic:false});
  }
  transaction(fn) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const value = fn(); this.db.exec('COMMIT'); return value; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  setting(key) { const r = this.db.prepare('SELECT value FROM settings WHERE key=?').get(key); return r ? JSON.parse(r.value) : null; }
  set(key, value) { this.db.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, JSON.stringify(value)); }
  user(id) { return this.db.prepare('SELECT * FROM users WHERE id=?').get(id); }
  users() { return this.db.prepare('SELECT * FROM users ORDER BY rowid').all(); }
  addUser(data) { this.db.prepare('INSERT INTO users(id,email,password,role,event_id,name,recipient) VALUES(?,?,?,?,?,?,?)').run(data.id,data.email,data.password,data.role,data.event_id,data.name,data.recipient ? JSON.stringify(data.recipient) : null); }
  claim(id) { const r = this.db.prepare('SELECT data FROM claims WHERE id=?').get(id); return r ? JSON.parse(r.data) : null; }
  claims() { return this.db.prepare('SELECT data FROM claims ORDER BY rowid').all().map(r => JSON.parse(r.data)); }
  saveClaim(c) { this.db.prepare('UPDATE claims SET data=? WHERE id=?').run(JSON.stringify(c), c.id); }
  payment(id) { const r = this.db.prepare('SELECT data FROM payments WHERE id=?').get(id); return r ? JSON.parse(r.data) : null; }
  payments() { return this.db.prepare('SELECT data FROM payments ORDER BY sheet_row').all().map(r => JSON.parse(r.data)); }
  savePayment(p) { this.db.prepare('UPDATE payments SET data=? WHERE id=?').run(JSON.stringify(p),p.id); }
  audit(actor, action, resource) { this.db.prepare('INSERT INTO audit VALUES(?,?,?,?,?)').run(randomUUID(),now(),actor,action,resource); }
  acquireLease() {
    const owner = randomUUID();
    this.transaction(() => {
      const lease = this.db.prepare('SELECT * FROM lease WHERE id=1').get();
      invariant(!lease || lease.expires < Date.now(), 'Another application process holds this database. Stop it or wait 20 seconds after a crash.', 409);
      this.db.prepare('INSERT INTO lease VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET owner=excluded.owner,expires=excluded.expires').run(owner, Date.now()+20000);
    });
    this.leaseId = owner;this.leaseLost=false;
    this.heartbeat = setInterval(() => this.renewLease(), 5000);
    this.heartbeat.unref();
  }
  assertLease() {
    if(!this.leaseId)return;
    const lease=this.db.prepare('SELECT owner,expires FROM lease WHERE id=1').get();
    invariant(!this.leaseLost&&lease?.owner===this.leaseId&&lease.expires>=Date.now(),'Database ownership was lost. This process must stop; restart only after the other writer has stopped.',409,'lease_lost');
  }
  renewLease() {
    if(!this.leaseId||this.leaseLost)return false;
    try {
      const time=Date.now();
      const result=this.db.prepare('UPDATE lease SET expires=? WHERE id=1 AND owner=? AND expires>=?').run(time+20000,this.leaseId,time);
      if(result.changes===1)return true;
    } catch {}
    this.leaseLost=true;clearInterval(this.heartbeat);return false;
  }
  close() { if (this.heartbeat) { clearInterval(this.heartbeat); this.db.prepare('DELETE FROM lease WHERE owner=?').run(this.leaseId); } this.db.close(); }
}
