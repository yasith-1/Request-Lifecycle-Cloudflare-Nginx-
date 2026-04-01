const G = id => document.getElementById(id);
let running = false, autoMode = false, autoTimer = null, curType = 'API';
let isPaused = false, pausePromise = null, pauseResolver = null;
let tot = 0, ok = 0, lats = [], rn = 0;
const cnt = { u: 0, c: 0, n: 0, s: 0, d: 0 };
document.querySelectorAll('.rb').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('.rb').forEach(x => x.classList.remove('a'));
        b.classList.add('a'); curType = b.dataset.t;
    });
});
const prof = { API: { a: 8, b: 12, c: 7, d: 32, e: 35 }, CACHED: { a: 8, b: 12, c: 18, d: 0, e: 0 }, STATIC: { a: 8, b: 12, c: 20, d: 0, e: 0 }, UNAUTH: { a: 8, b: 12, c: 5, d: 8, e: 0 } };
const paths = { API: '/api/resource', CACHED: '/api/data', STATIC: '/assets/app.js', UNAUTH: '/api/admin/settings' };
const statuses = { API: '200 OK', CACHED: '200 OK (HIT)', STATIC: '200 OK (MISS)', UNAUTH: '401 Unauthorized' };
const apiMethods = ['GET', 'POST', 'PUT', 'DELETE'];
const apiPaths = { GET: '/api/data', POST: '/api/users', PUT: '/api/users/42', DELETE: '/api/users/42' };
const apiStatuses = { GET: '200 OK', POST: '201 Created', PUT: '200 OK', DELETE: '204 No Content' };
const apiSQL = { GET: 'SELECT * FROM data', POST: 'INSERT INTO data', PUT: 'UPDATE data SET ...', DELETE: 'DELETE FROM data WHERE id=42' };
let lastApiMethod = 'GET';
function pickApiMethod() { lastApiMethod = apiMethods[Math.floor(Math.random() * apiMethods.length)]; return lastApiMethod; }
function ts() { const n = new Date(); return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}.${String(n.getMilliseconds()).padStart(3, '0')}` }
function lg(h, m, c) { const p = G('lp'), d = document.createElement('div'); d.className = 'le'; d.innerHTML = `<span class="lt">${ts()}</span><span class="lh ${c}">[${h}]</span><span class="lm">${m}</span>`; p.appendChild(d); p.scrollTop = p.scrollHeight }
async function checkPause() { if (isPaused && pausePromise) await pausePromise; }
const sl = async ms => { const st = Math.ceil(ms / 50); for (let i = 0; i < st; i++) { await checkPause(); await new Promise(r => setTimeout(r, 50)); } await checkPause(); };
function setSt(s, h, m, l) { G('ss').textContent = s; G('ss').style.color = s === 'FAIL' ? 'var(--red)' : s === 'SUCCESS' ? 'var(--green)' : 'var(--blue)'; G('sh').textContent = h || '&#8212;'; G('sm').textContent = m || '&#8212;'; G('sl2').textContent = l ? l + 'ms' : '&#8212;' }
async function an(pk, ln, dir, col) { await checkPause(); const p = G(pk), isFwd = dir === 'f', l = G(ln + (isFwd ? '-f' : '-b')); p.className = `pkt ${col}`; l.className = `cline ${isFwd ? 'req lit' : 'res litr'}`; p.style.animation = 'none'; p.style.animationPlayState = isPaused ? 'paused' : 'running'; p.offsetHeight; p.className = `pkt ${col} ${isFwd ? 'pf' : 'pb'}`; await sl(800); l.className = `cline ${isFwd ? 'req' : 'res'}`; }
function fl(id) { const e = G(id); e.classList.remove('flash'); e.offsetHeight; e.classList.add('flash'); setTimeout(() => e.classList.remove('flash'), 500) }
function bump(id, bdg) { cnt[id]++; const b = G(bdg); b.textContent = cnt[id]; b.classList.add('show') }
function utim(p) { const sum = p.a + p.b + p.c + p.d + p.e || 1; const pct = v => Math.round(v / sum * 100) + '%'; G('tw').style.display = 'block'; G('t1').style.width = pct(p.a); G('t2').style.width = pct(p.b); G('t3').style.width = pct(p.c); G('t3').textContent = (curType === 'CACHED' || curType === 'UNAUTH') ? 'Edge' : 'Proxy'; G('t4').style.width = pct(p.d); G('t5').style.width = pct(p.e) }
async function run() {
    if (running) return; running = true; G('sndbtn').disabled = true; G('sd').style.background = '#ff6b2b'; G('pausebtn').disabled = false;
    const t = curType, p = prof[t], n = ++rn, t0 = Date.now();
    const apiM = t === 'API' ? pickApiMethod() : null;
    const displayPath = t === 'API' ? apiPaths[apiM] : paths[t];
    const displayStatus = t === 'API' ? apiStatuses[apiM] : statuses[t];
    lg('SYS', `--- Request #${n}: ${t === 'API' ? apiM : t} ${displayPath} ---`, 'hx');
    setSt('ACTIVE', 'USER > CF', t, null);
    fl('iu'); bump('u', 'bu'); lg('USER', `Sending ${t === 'API' ? apiM : t} ${displayPath} | DNS resolve`, 'hu'); await sl(200);
    await an('p1', 'l1', 'f', 'pr'); fl('ic'); bump('c', 'bc'); setSt('ACTIVE', 'CLOUDFLARE', t, null);
    lg('CF', 'WAF check PASS | SSL termination | Edge routing', 'hc'); await sl(280);
    if (t === 'CACHED') {
        lg('CF', 'CACHE HIT - serving from edge, skipping origin', 'hc'); setSt('ACTIVE', 'CF > USER', t, null);
        await an('p1', 'l1', 'b', 'pg'); fl('iu');
        const lat = Date.now() - t0; lg('USER', `${statuses[t]} | ${lat}ms (cache hit)`, 'hu'); setSt('SUCCESS', 'COMPLETE', t, lat); utim(p); done(lat); return;
    }
    if (t === 'STATIC') {
        lg('CF', 'Static asset request | Forwarding to Nginx origin', 'hc'); setSt('ACTIVE', 'CF > NGINX', t, null);
        await an('p2', 'l2', 'f', 'ptl'); fl('in'); bump('n', 'bn'); setSt('ACTIVE', 'NGINX', t, null);
        lg('NGINX', 'Serving static file /assets/app.js | Cache-Control: max-age=31536000', 'ht'); await sl(220);
        lg('NGINX', 'File found | Content-Type: application/javascript | gzip encoded', 'ht');
        await an('p2', 'l2', 'b', 'ptl'); fl('ic'); setSt('ACTIVE', 'NGINX > CF', t, null);
        lg('CF', 'Response received | CDN caching asset for future requests', 'hc'); await sl(180);
        await an('p1', 'l1', 'b', 'ptl'); fl('iu');
        const lat = Date.now() - t0; lg('USER', `${statuses[t]} | ${lat}ms | Static asset delivered`, 'ht'); setSt('SUCCESS', 'COMPLETE', t, lat); utim(p); done(lat); return;
    }
    if (t === 'UNAUTH') {
        lg('CF', 'Edge Auth: Missing or invalid JWT detected', 'hr'); await sl(200);
        lg('CF', 'EDGE BLOCK — 401 Unauthorized | Request rejected, no origin forwarding', 'hr');
        setSt('FAIL', 'CLOUDFLARE', t, null);
        await an('p1', 'l1', 'b', 'prd'); fl('iu');
        const lat = Date.now() - t0; lg('USER', `${statuses[t]} | ${lat}ms | Blocked by Cloudflare WAF`, 'hr'); setSt('FAIL', 'COMPLETE', t, lat); utim(p); doneErr(lat); return;
    }
    await an('p2', 'l2', 'f', 'pr'); fl('in'); bump('n', 'bn'); setSt('ACTIVE', 'NGINX', t, null);
    lg('NGINX', 'Load balance | Header injection | Route to app', 'hn'); await sl(240);
    await an('p3', 'l3', 'f', 'po'); fl('is'); bump('s', 'bs'); setSt('ACTIVE', 'BACKEND', t, null);
    lg('APP', `Processing ${t === 'API' ? apiM : t} | JWT auth | Business logic`, 'hs'); await sl(320);
    await an('p4', 'l4', 'f', 'pp'); fl('id2'); bump('d', 'bd'); setSt('ACTIVE', 'DATABASE', t, null);
    const dbSQL = t === 'API' ? apiSQL[apiM] : 'SELECT * FROM data';
    lg('DB', `SQL: ${dbSQL} | Index scan | Fetching rows`, 'hd'); await sl(300);
    lg('DB', 'Query complete | Connection released', 'hd');
    await an('p4', 'l4', 'b', 'py'); fl('is'); lg('APP', 'DB result received | Serialize JSON', 'hs'); await sl(200);
    await an('p3', 'l3', 'b', 'pp'); fl('in'); lg('NGINX', 'Response | gzip | Cache headers', 'hn'); await sl(160);
    await an('p2', 'l2', 'b', 'po'); fl('ic'); lg('CF', 'Response | CDN cache | Deliver to client', 'hc'); await sl(180);
    await an('p1', 'l1', 'b', 'pg'); fl('iu');
    const lat = Date.now() - t0; lg('USER', `${displayStatus} | Total: ${lat}ms`, 'hu'); setSt('SUCCESS', 'COMPLETE', t === 'API' ? apiM : t, lat); utim(p); done(lat);
}
function done(lat) { tot++; ok++; lats.push(lat); const avg = Math.round(lats.reduce((a, b) => a + b, 0) / lats.length); G('vR').textContent = tot; G('vO').textContent = ok; G('vL').textContent = avg + 'ms'; G('vT').textContent = curType === 'API' ? lastApiMethod : curType; G('sd').style.background = 'var(--green)'; const c = G('cR'); c.classList.add('hl'); setTimeout(() => c.classList.remove('hl'), 700); running = false; G('sndbtn').disabled = false; G('pausebtn').disabled = true; }
function doneErr(lat) { tot++; lats.push(lat); const avg = Math.round(lats.reduce((a, b) => a + b, 0) / lats.length); G('vR').textContent = tot; G('vL').textContent = avg + 'ms'; G('vT').textContent = curType; G('sd').style.background = 'var(--red)'; const c = G('cR'); c.classList.add('hl'); setTimeout(() => c.classList.remove('hl'), 700); running = false; G('sndbtn').disabled = false; G('pausebtn').disabled = true; }
G('sndbtn').addEventListener('click', run);
G('autobtn').addEventListener('click', () => {
    if (autoMode) { clearInterval(autoTimer); autoMode = false; G('autobtn').innerHTML = '&#9201; AUTO'; G('autobtn').classList.remove('on') }
    else {
        autoMode = true; G('autobtn').innerHTML = '&#9209; STOP'; G('autobtn').classList.add('on');
        const seq = ['API', 'API', 'CACHED', 'STATIC', 'API', 'API', 'UNAUTH', 'CACHED', 'API']; let i = 0;
        autoTimer = setInterval(() => { if (!running) { const t = seq[i % seq.length]; document.querySelectorAll('.rb').forEach(b => b.classList.remove('a')); document.querySelector(`[data-t="${t}"]`).classList.add('a'); curType = t; run(); i++ } }, 2500)
    }
});
G('pausebtn').addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        G('pausebtn').innerHTML = '&#9654; RESUME'; G('pausebtn').classList.add('on');
        document.querySelectorAll('.pkt').forEach(p => p.style.animationPlayState = 'paused');
        pausePromise = new Promise(r => pauseResolver = r);
    } else {
        G('pausebtn').innerHTML = '&#9208; PAUSE'; G('pausebtn').classList.remove('on');
        document.querySelectorAll('.pkt').forEach(p => p.style.animationPlayState = 'running');
        if (pauseResolver) pauseResolver();
    }
});

G('clrbtn').addEventListener('click', () => {
    G('lp').innerHTML = '';
    G('tw').style.display = 'none';
    Object.keys(cnt).forEach(k => cnt[k] = 0);
    ['bu', 'bc', 'bn', 'bs', 'bd'].forEach(id => { G(id).textContent = 0; G(id).classList.remove('show') });
    setSt('IDLE', '--', '--', null);
    G('sd').style.background = 'var(--green)';
    tot = 0; ok = 0; lats = []; rn = 0;
    G('vR').textContent = 0; G('vO').textContent = 0; G('vL').textContent = '—'; G('vT').textContent = '—';
    lg('SYS', 'Cleared. Ready.', 'hx');
});
lg('SYS', 'System ready. Click SEND REQUEST or enable AUTO mode.', 'hx');