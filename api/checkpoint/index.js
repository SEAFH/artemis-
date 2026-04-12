// index.js — Vercel Serverless Function
// Vừa serve HTML checkpoint page, vừa xử lý API generate/verify key
// Deploy: đặt file này ở root project, thêm vercel.json bên dưới

import { MongoClient } from 'mongodb';

// ═══════════════════════════════════════════════════════════════════
// CONFIG (set trong Vercel Environment Variables)
// ═══════════════════════════════════════════════════════════════════
const MONGO_URI       = process.env.MONGODB_URI;
const GENERATE_SECRET = process.env.GENERATE_SECRET;
const ALLOWED_ORIGIN  = process.env.ALLOWED_ORIGIN || '*';
const DB_NAME         = 'artemis';
const COLLECTION      = 'keys';

// ═══════════════════════════════════════════════════════════════════
// MONGODB
// ═══════════════════════════════════════════════════════════════════
let client;
async function getCol() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client.db(DB_NAME).collection(COLLECTION);
}

// ═══════════════════════════════════════════════════════════════════
// KEY GENERATOR
// ═══════════════════════════════════════════════════════════════════
function seg(n) {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}
function generateKey() {
  return `ARTEMIS-${seg(7)}-${seg(7)}-${seg(7)}`;
}

// ═══════════════════════════════════════════════════════════════════
// HTML PAGE
// ═══════════════════════════════════════════════════════════════════
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>ARTEMIS — Key System</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@600;800&display=swap" rel="stylesheet"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0f; --surface: #13131c; --surface2: #1a1a28;
    --border: #252535; --border2: #2e2e45;
    --purple: #7c6fff; --purple2: #a78bfa; --green: #22c55e;
    --text: #e2e2f0; --muted: #6b6b8a; --dimmed: #3a3a5a;
  }
  html,body { min-height:100vh; background:var(--bg); font-family:'Syne',sans-serif; color:var(--text); }
  body::before {
    content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity:.4;
  }
  .page { position:relative; z-index:1; min-height:100vh; display:flex; flex-direction:column; align-items:center; padding:2.5rem 1rem 3rem; }
  .logo { display:flex; align-items:center; gap:11px; margin-bottom:2rem; animation:fadeDown .6s ease both; }
  .logo-icon { width:70px; height:70px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .logo-name { font-size:24px; font-weight:800; letter-spacing:2px; color:#fff; }
  .logo-name span { color:var(--purple2); }
  .card { width:100%; max-width:500px; background:var(--surface); border:1px solid var(--border); border-radius:18px; overflow:hidden; animation:fadeDown .6s .2s ease both; }
  .card-head { padding:1.5rem 1.75rem 1.2rem; background:linear-gradient(135deg,#14142a,#181830); border-bottom:1px solid var(--border); }
  .card-head h2 { font-size:17px; font-weight:800; color:var(--text); letter-spacing:.5px; margin-bottom:3px; }
  .card-head p  { font-size:12px; color:var(--muted); font-family:'Space Mono',monospace; }
  .card-body { padding:1.5rem 1.75rem; }
  .steps { display:flex; align-items:center; margin-bottom:1.5rem; }
  .step  { display:flex; flex-direction:column; align-items:center; flex:1; }
  .step-dot { width:33px; height:33px; border-radius:50%; background:#1e1e30; border:2px solid var(--border2); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:var(--dimmed); font-family:'Space Mono',monospace; transition:all .3s; }
  .step-dot.active { background:var(--purple); border-color:var(--purple); color:#fff; box-shadow:0 0 16px #7c6fff55; }
  .step-dot.done   { background:var(--green);  border-color:var(--green);  color:#fff; }
  .step-lbl { font-size:10px; color:var(--dimmed); margin-top:5px; font-family:'Space Mono',monospace; letter-spacing:.5px; transition:color .3s; }
  .step-lbl.active { color:var(--purple2); }
  .step-lbl.done   { color:var(--green); }
  .step-line { flex:1; height:1px; background:var(--border2); margin-bottom:18px; transition:background .3s; }
  .step-line.done { background:var(--green); }
  .task { background:var(--surface2); border:1px solid var(--border); border-radius:12px; padding:1rem 1.1rem; margin-bottom:.9rem; }
  .task-head { display:flex; align-items:center; gap:7px; margin-bottom:5px; }
  .task-head span { font-size:13px; font-weight:600; color:#c9c9e8; flex:1; }
  .pill { font-size:9px; padding:3px 9px; border-radius:20px; font-weight:700; font-family:'Space Mono',monospace; letter-spacing:.5px; }
  .pill-req  { background:#2d1a4a; color:var(--purple2); }
  .pill-done { background:#14281e; color:var(--green); }
  .task p { font-size:12px; color:var(--muted); line-height:1.6; }
  .alert { padding:10px 13px; border-radius:9px; font-size:12px; margin-top:.75rem; display:flex; gap:8px; align-items:flex-start; font-family:'Space Mono',monospace; line-height:1.5; }
  .alert-info { background:#0f1c30; border:1px solid #1e3a5f; color:#7ab3f0; }
  .alert-ok   { background:#0e2018; border:1px solid #1a4a2a; color:#4ade80; }
  .alert-err  { background:#200e0e; border:1px solid #4a1a1a; color:#f87171; }
  .a-dot { width:6px; height:6px; border-radius:50%; margin-top:5px; flex-shrink:0; }
  .a-dot-blue  { background:#3b82f6; }
  .a-dot-green { background:var(--green); }
  .a-dot-red   { background:#f87171; }
  .cd-wrap { background:#0f0f18; border:1px solid var(--border); border-radius:12px; padding:1rem 1.1rem; margin-top:.75rem; }
  .cd-row  { display:flex; justify-content:space-between; align-items:center; margin-bottom:9px; }
  .cd-label { font-size:11px; color:var(--muted); font-family:'Space Mono',monospace; }
  .cd-num   { font-size:26px; font-weight:800; color:var(--purple2); font-family:'Space Mono',monospace; }
  .prog-bg   { height:4px; background:#1e1e30; border-radius:2px; overflow:hidden; }
  .prog-fill { height:4px; border-radius:2px; background:linear-gradient(90deg,var(--purple),var(--purple2)); transition:width .9s linear; }
  .btn { width:100%; padding:.75rem; border-radius:11px; border:none; font-size:14px; font-weight:700; cursor:pointer; font-family:'Syne',sans-serif; letter-spacing:.3px; transition:all .2s; margin-top:.75rem; }
  .btn-main { background:linear-gradient(135deg,#6c63ff,#8b5cf6); color:#fff; }
  .btn-main:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); box-shadow:0 6px 20px #6c63ff40; }
  .btn-main:disabled { opacity:.35; cursor:not-allowed; }
  .btn-ghost { background:transparent; border:1px solid var(--border2); color:var(--muted); font-size:13px; }
  .btn-ghost:hover { border-color:var(--purple); color:var(--purple2); }
  .key-box  { background:#090912; border:1px dashed #30304a; border-radius:11px; padding:1rem 1.1rem; display:flex; align-items:center; gap:10px; margin-top:.9rem; }
  .key-val  { flex:1; font-family:'Space Mono',monospace; font-size:12px; color:var(--purple2); word-break:break-all; letter-spacing:.5px; }
  .copy-btn { padding:7px 15px; border-radius:8px; border:1px solid #3a2a6a; background:#22174a; color:var(--purple2); font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap; font-family:'Space Mono',monospace; transition:all .2s; }
  .copy-btn:hover { background:#2e1e5a; }
  .info-row { display:flex; justify-content:space-between; margin-top:8px; }
  .info-k { font-size:10px; color:var(--dimmed); font-family:'Space Mono',monospace; }
  .info-v { font-size:10px; color:var(--muted);  font-family:'Space Mono',monospace; }
  .footer { text-align:center; font-size:10px; color:var(--dimmed); margin-top:1.5rem; font-family:'Space Mono',monospace; letter-spacing:.5px; }
  .footer a { color:var(--purple); text-decoration:none; }
  .loading-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:var(--bg); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; transition:opacity .5s ease,visibility .5s ease; }
  .loading-overlay.hidden { opacity:0; visibility:hidden; pointer-events:none; }
  .loading-spinner { width:50px; height:50px; border:3px solid var(--border2); border-top-color:var(--purple); border-radius:50%; animation:spin 1s linear infinite; }
  .loading-text    { margin-top:20px; font-size:14px; color:var(--muted); font-family:'Space Mono',monospace; letter-spacing:1px; }
  .loading-percent { margin-top:10px; font-size:24px; color:var(--purple2); font-family:'Space Mono',monospace; font-weight:800; }
  .loading-progress { width:200px; height:4px; background:var(--border2); border-radius:2px; margin-top:15px; overflow:hidden; }
  .loading-progress-bar { height:100%; background:linear-gradient(90deg,var(--purple),var(--purple2)); border-radius:2px; transition:width .1s linear; }
  #container-d31afa2ed76d24087498b88a43746756 { position:fixed; bottom:20px; right:20px; z-index:1000; max-width:400px; max-height:350px; overflow:hidden; }
  .hidden { display:none !important; }
  .spin { display:inline-block; animation:spin 1s linear infinite; }
  @keyframes spin     { to { transform:rotate(360deg); } }
  @keyframes fadeDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:none; } }
</style>
</head>
<body>

<div class="loading-overlay" id="loadingOverlay">
  <div class="loading-spinner"></div>
  <div class="loading-text">LOADING...</div>
  <div class="loading-percent" id="loadingPercent">0%</div>
  <div class="loading-progress">
    <div class="loading-progress-bar" id="loadingBar" style="width:0%"></div>
  </div>
</div>

<div class="page">
  <div class="logo">
    <div class="logo-icon">
      <img src="https://i.ibb.co/CSqX3Sg/Logo-thi-t-k-h-nh-th-p-tinh-th.png" alt="ARTEMIS"
           style="width:100%;height:100%;object-fit:contain;border-radius:10px;">
    </div>
    <div class="logo-name">ARTE<span>MIS</span></div>
  </div>

  <div class="card">
    <div class="card-head">
      <h2>Key System</h2>
      <p>// complete tasks to receive access key</p>
    </div>
    <div class="card-body">

      <div class="steps">
        <div class="step"><div class="step-dot active" id="s1">1</div><div class="step-lbl active" id="sl1">Verify</div></div>
        <div class="step-line" id="line1"></div>
        <div class="step"><div class="step-dot" id="s2">2</div><div class="step-lbl" id="sl2">Wait</div></div>
        <div class="step-line" id="line2"></div>
        <div class="step"><div class="step-dot" id="s3">3</div><div class="step-lbl" id="sl3">Get Key</div></div>
      </div>

      <!-- STEP 1 -->
      <div id="step1">
        <div class="task">
          <div class="task-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Human Verification</span><div class="pill pill-req">Required</div>
          </div>
          <p>Prove you are not a bot by completing the verification checkpoint.</p>
        </div>
        <div class="alert alert-info">
          <div class="a-dot a-dot-blue"></div>
          Click below to open the verification page. Do not close it until it redirects back.
        </div>
        <button class="btn btn-main" id="verifyBtn" onclick="startVerify()">
          <span id="vbtn">Open Verification</span>
        </button>
      </div>

      <!-- STEP 2 -->
      <div id="step2" class="hidden">
        <div class="task">
          <div class="task-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Ad Wait</span><div class="pill pill-req">Required</div>
          </div>
          <p>Please wait while the sponsored content loads.</p>
        </div>
        <div class="cd-wrap">
          <div class="cd-row">
            <div class="cd-label">Please wait...</div>
            <div class="cd-num" id="cdNum">15</div>
          </div>
          <div class="prog-bg"><div class="prog-fill" id="cdBar" style="width:100%"></div></div>
        </div>
        <button class="btn btn-main" id="claimBtn" disabled onclick="requestKey()">
          <span id="claimTxt">Waiting... <span id="claimSec">15</span>s</span>
        </button>
      </div>

      <!-- STEP 3 -->
      <div id="step3" class="hidden">
        <div class="alert alert-ok" style="margin-bottom:1rem;">
          <div class="a-dot a-dot-green"></div>
          All tasks completed! Your key has been generated below.
        </div>
        <div class="task">
          <div class="task-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            <span>Your Access Key</span><div class="pill pill-done">Active</div>
          </div>
          <p>Copy this key and paste it in the executor. Expires in 24 hours.</p>
        </div>
        <div class="key-box">
          <div class="key-val" id="keyVal">—</div>
          <button class="copy-btn" onclick="copyKey()">Copy</button>
        </div>
        <div class="info-row"><div class="info-k">Expires in</div><div class="info-v">24 hours</div></div>
        <div class="info-row"><div class="info-k">Status</div><div class="info-v" style="color:#22c55e;">Active</div></div>
        <button class="btn btn-ghost" style="margin-top:1rem;" onclick="location.reload()">Get New Key</button>
      </div>

      <!-- ERROR -->
      <div id="stepErr" class="hidden">
        <div class="alert alert-err" style="margin-bottom:1rem;">
          <div class="a-dot a-dot-red"></div>
          <span id="errMsg">Something went wrong. Please try again.</span>
        </div>
        <button class="btn btn-ghost" onclick="location.reload()">Try Again</button>
      </div>

    </div>
  </div>
  <div class="footer">Protected by <a href="#">ARTEMIS</a> &nbsp;·&nbsp; Key System v2.0</div>
</div>

<script async data-cfasync="false" src="https://pl29123769.profitablecpmratenetwork.com/d31afa2ed76d24087498b88a43746756/invoke.js"></script>
<div id="container-d31afa2ed76d24087498b88a43746756"></div>
<script src="https://pl29121920.profitablecpmratenetwork.com/67/7f/58/677f58c2e2eaea18d4c0cdba7e915ed9.js"></script>
<script src="https://pl29123770.profitablecpmratenetwork.com/1a/6c/1f/1a6c1f3975a2b905883a347e76fb0cab.js"></script>

<script>
const AD_LINK = 'https://www.profitablecpmratenetwork.com/t7b0wzj7y?key=a6e32a183811bebaefc27c7333cdb32d';

// ── Loading screen ───────────────────────────────────────────────
(function(){
  let p=0;
  const pct=document.getElementById('loadingPercent'),bar=document.getElementById('loadingBar'),ov=document.getElementById('loadingOverlay');
  const iv=setInterval(()=>{ p+=100/(3000/30); if(p>=100){p=100;clearInterval(iv);} pct.textContent=Math.floor(p)+'%'; bar.style.width=p+'%'; },30);
  setTimeout(()=>ov.classList.add('hidden'),3000);
  setTimeout(()=>ov.classList.add('hidden'),5000);
})();

// ── Anti-adblock ─────────────────────────────────────────────────
(async function(){
  await new Promise(r=>setTimeout(r,500));
  const b=document.createElement('div');
  b.className='adsbox ad-unit'; b.style.cssText='position:absolute;top:-9999px;width:1px;height:1px;';
  document.body.appendChild(b);
  await new Promise(r=>setTimeout(r,100));
  const blocked=b.offsetParent===null||getComputedStyle(b).display==='none';
  document.body.removeChild(b);
  if(blocked){
    document.querySelector('.card-body').innerHTML=\`
      <div style="text-align:center;padding:30px 10px;animation:fadeDown .5s ease both">
        <div style="background:rgba(255,77,77,.1);width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 style="color:#ff4d4d;font-size:20px;font-weight:800;margin-bottom:12px;letter-spacing:1px">ADBLOCK DETECTED</h2>
        <p style="color:var(--muted);font-size:13px;line-height:1.6;margin-bottom:25px;font-family:'Space Mono',monospace">Please disable your ad blocker and refresh the page.</p>
        <button onclick="location.reload()" style="width:100%;padding:.75rem;border-radius:11px;border:none;font-size:14px;font-weight:700;cursor:pointer;font-family:'Syne',sans-serif;background:#ff4d4d;color:#fff">DISABLE &amp; REFRESH</button>
      </div>\`;
  }
})();

// ── Ad gate ──────────────────────────────────────────────────────
let adCount=0; const MAX_ADS=3;
document.body.style.pointerEvents='none';
document.addEventListener('click',function gate(e){
  if(adCount<MAX_ADS){
    e.preventDefault(); e.stopPropagation();
    window.open(AD_LINK,'_blank'); adCount++;
    if(adCount>=MAX_ADS){ document.removeEventListener('click',gate,true); setTimeout(()=>{document.body.style.pointerEvents='auto';},500); }
  }
},true);

// ── Step controller ──────────────────────────────────────────────
function setStep(n){
  [1,2,3].forEach(i=>{
    const d=document.getElementById('s'+i),l=document.getElementById('sl'+i);
    d.className='step-dot'; l.className='step-lbl';
    if(i<n){d.classList.add('done');l.classList.add('done');d.textContent='✓';}
    else if(i===n){d.classList.add('active');l.classList.add('active');d.textContent=i;}
    else{d.textContent=i;}
  });
  [1,2].forEach(i=>{ document.getElementById('line'+i).className='step-line'+(i+1<=n?' done':''); });
  ['step1','step2','step3','stepErr'].forEach(id=>document.getElementById(id).classList.add('hidden'));
  const t=document.getElementById('step'+n); if(t) t.classList.remove('hidden');
}
function showError(msg){
  ['step1','step2','step3'].forEach(id=>document.getElementById(id).classList.add('hidden'));
  document.getElementById('errMsg').textContent=msg;
  document.getElementById('stepErr').classList.remove('hidden');
}

// ── Step 1 ───────────────────────────────────────────────────────
function startVerify(){
  if(adCount<MAX_ADS){window.open(AD_LINK,'_blank');adCount++;}
  document.getElementById('vbtn').innerHTML='<span class="spin">⟳</span> Verifying...';
  document.getElementById('verifyBtn').disabled=true;
  setTimeout(()=>{ setStep(2); startCountdown(); },2200);
}

// ── Step 2 ───────────────────────────────────────────────────────
function startCountdown(){
  window.open(AD_LINK,'_blank');
  let t=15;
  const bar=document.getElementById('cdBar'),num=document.getElementById('cdNum'),sec=document.getElementById('claimSec');
  bar.style.width='100%';
  const iv=setInterval(()=>{
    t--; num.textContent=t; if(sec) sec.textContent=t;
    bar.style.width=(t/15*100)+'%';
    if(t<=0){ clearInterval(iv); num.textContent='0'; const btn=document.getElementById('claimBtn'); btn.disabled=false; document.getElementById('claimTxt').textContent='Claim Key →'; }
  },1000);
}

// ── Step 3: gọi API server generate key ─────────────────────────
async function requestKey(){
  const btn=document.getElementById('claimBtn');
  btn.disabled=true;
  document.getElementById('claimTxt').innerHTML='<span class="spin">⟳</span> Generating key...';
  try {
    const res=await fetch('/checkpoint?action=generate',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({__req:'artemis_internal'})
    });
    const data=await res.json();
    if(res.status===429){ showError('Rate limited: please wait 1 hour before requesting a new key.'); return; }
    if(!res.ok||!data.key){ showError(data.error||'Failed to generate key. Please try again.'); return; }
    document.getElementById('keyVal').textContent=data.key;
    setStep(3);
  } catch(err){
    showError('Network error. Please check your connection and try again.');
  }
}

// ── Copy ─────────────────────────────────────────────────────────
function copyKey(){
  const k=document.getElementById('keyVal').textContent;
  navigator.clipboard?.writeText(k).catch(()=>{
    const ta=document.createElement('textarea'); ta.value=k; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  });
  const btn=document.querySelector('.copy-btn');
  btn.textContent='Copied!'; btn.style.cssText='background:#0e2018;color:#22c55e;border-color:#1a4a2a;';
  setTimeout(()=>{ btn.textContent='Copy'; btn.style.cssText=''; },2000);
}
</script>
</body>
</html>`;

// ═══════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // ── POST /?action=generate — tạo key mới ──────────────────────
  if (req.method === 'POST' && action === 'generate') {
    // Xác thực internal request token
    if (req.body?.__req !== 'artemis_internal') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Xác thực secret (double check từ env)
    const secret = req.headers['x-artemis-secret'];
    if (GENERATE_SECRET && secret && secret !== GENERATE_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
      const col = await getCol();
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

      // Rate limit: 1 key / IP / giờ
      const recentKey = await col.findOne({
        ip,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
      });
      if (recentKey) {
        return res.status(429).json({ error: 'Rate limited. Wait before generating a new key.' });
      }

      const key = generateKey();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await col.insertOne({
        key,
        ip,
        createdAt: new Date(),
        expiresAt,
        deviceId: null
      });

      return res.status(200).json({ key, expiresAt });

    } catch (err) {
      console.error('[generate]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ── GET /?action=verify&key=...&device=... — verify từ Lua ─────
  if (req.method === 'GET' && action === 'verify') {
    const { key, device } = req.query;
    if (!key || !device) {
      return res.status(400).json({ valid: false, reason: 'Missing key or device' });
    }

    try {
      const col = await getCol();
      const doc = await col.findOne({ key });

      if (!doc) return res.status(200).json({ valid: false, reason: 'Key not found' });
      if (new Date() > new Date(doc.expiresAt)) return res.status(200).json({ valid: false, reason: 'Key expired' });

      // Bind device lần đầu
      if (!doc.deviceId) {
        await col.updateOne({ key }, { $set: { deviceId: device } });
        return res.status(200).json({ valid: true });
      }

      // Kiểm tra device khớp
      if (doc.deviceId !== device) {
        return res.status(200).json({ valid: false, reason: 'Device mismatch' });
      }

      return res.status(200).json({ valid: true });

    } catch (err) {
      console.error('[verify]', err);
      return res.status(500).json({ valid: false, reason: 'Server error' });
    }
  }

  // ── GET / — serve HTML page ────────────────────────────────────
  if (req.method === 'GET' && !action) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(HTML);
  }

  return res.status(404).json({ error: 'Not found' });
}
