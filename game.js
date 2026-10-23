(() => {
const $ = id => document.getElementById(id);
const COL = ['#e8453c', '#f6c234', '#2f7de1', '#3bb54a', '#f26ba8', '#8e5bd6'];
const COLD = ['#a82a23', '#b8891a', '#1c5aa8', '#257a30', '#b8437a', '#5e3a96'];
const META = [
  { sub: 'Tourists are landing! Clear the lot and get everyone to the beach.', twist: 'New: luggage carts block lanes.', fact: 'Hawaiʻi is about 2,400 miles from the U.S. mainland, one of the most remote island chains on Earth.', bg: '#9fd8a0', lot: '#6f7b86' },
  { sub: 'Hotels, surf racks and sunset crowds.', twist: 'New: surfers and chickens wander off after a few buses leave.', fact: 'Waikīkī means “spouting waters,” named for the springs and streams that once fed the area.', bg: '#f3dfa8', lot: '#7d8890' },
  { sub: 'Big waves, shrimp trucks and sea turtles.', twist: 'New: waves wash over some lanes every other pair of buses.', fact: 'North Shore winter waves can top 30 feet, yet in summer the same beaches are often calm enough to snorkel.', bg: '#e9d9a0', lot: '#76838c' },
  { sub: 'Hilo rain, black sand and a smoking volcano.', twist: 'New: lava closes lanes after a few buses. Steam hides bus colors.', fact: 'Kīlauea is one of the most active volcanoes on Earth, and the Big Island is still growing.', bg: '#5a4a44', lot: '#4a4e55' },
  { sub: 'The Garden Isle: wild chickens rule the road!', twist: 'Finale: chickens everywhere, the Tree Tunnel, Hanalei rain and canyon mist.', fact: 'Kauaʻi is the oldest of the main Hawaiian islands, and its famous wild chickens roam nearly everywhere. Mahalo for driving with Aloha Shuttle Co.!', bg: '#7cc46e', lot: '#6a7680' },
];
const STORY = [
  '<h1>Aloha, Auntie!</h1><p>Welcome to <b>Aloha Shuttle Co.</b> You’re our new head dispatcher, and the lots are jammed with visitors!</p>',
  '<h3>How to play</h3><p>Tap a shuttle to drive it out. It only goes if the road ahead is clear.</p><p>It parks in a <b>tiki waiting slot</b>. Visitors in matching aloha shirts hop on. Three aboard and it heads to the beach!</p>',
  '<h3>Careful</h3><p>There are only 5 slots. If they all fill with the wrong colors, the lot jams. Use <b>Shaka Undo</b> anytime. There’s no timer, so take it easy. 🌺</p>',
];
// ---------- save ----------
const SK = 'alohaShuttle.v1';
let S = { best: {}, sound: true, story: false, cards: {} };
try { Object.assign(S, JSON.parse(localStorage.getItem(SK) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) {} };
const unlocked = i => i === 0 || !!S.best[i]; // level i (0-based) unlocked if previous done
Sound.setOn(S.sound);
// ---------- screens ----------
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); if (id === 'game') layout(); }
function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => e.classList.remove('on'), 1600); }
function overlay(html, btns) { $('ovBody').innerHTML = html; const b = $('ovBtns'); b.innerHTML = ''; btns.forEach(([t, f, alt]) => { const x = document.createElement('button'); x.textContent = t; if (alt) x.className = 'alt'; x.onclick = () => { Sound.sfx.tap(); f(); }; b.appendChild(x); }); $('ov').classList.add('on'); }
const closeOv = () => $('ov').classList.remove('on');
document.querySelectorAll('.snd').forEach(b => b.onclick = () => { S.sound = !S.sound; save(); Sound.setOn(S.sound); syncSnd(); if (S.sound) Sound.ensure(); });
function syncSnd() { document.querySelectorAll('.snd').forEach(b => b.classList.toggle('off', !S.sound)); }
syncSnd();
function story(k, done) { if (k >= STORY.length) { S.story = true; save(); closeOv(); done(); return; } overlay(STORY[k], [[k < STORY.length - 1 ? 'Next' : 'Let’s drive!', () => story(k + 1, done)]]); }
$('play').onclick = () => { Sound.ensure(); Sound.music(0); Sound.sfx.tap(); buildMap(); show('map'); if (!S.story) story(0, () => {}); };
$('mapHome').onclick = () => show('title');
$('toMap').onclick = () => { closeOv(); buildMap(); show('map'); };
function buildMap() {
  const box = $('islands'); box.innerHTML = '';
  let cur = LEVELS.findIndex((L, i) => !S.best[i + 1]); if (cur < 0) cur = LEVELS.length;
  ISLANDS.forEach((I, k) => {
    const lv = LEVELS.map((L, i) => [L, i]).filter(([L]) => L.island === k);
    const d = document.createElement('div'); d.className = 'isl' + (unlocked(lv[0][1]) ? '' : ' lock');
    d.innerHTML = `<h2>${k + 1}. ${I.name}</h2><p>${META[k].sub}</p><div class="lv"></div>`;
    const g = d.querySelector('.lv');
    lv.forEach(([L, i]) => { const b = document.createElement('button'); const st = S.best[L.id] || 0; b.innerHTML = `${L.id}<span class="st">${'★'.repeat(st)}</span>`; b.title = L.name; if (st) b.className = 'done'; if (i === cur) b.classList.add('cur'); b.disabled = !unlocked(i) && !st; if (!S.best[i] && i > 0 && !st) b.disabled = true; b.onclick = () => { Sound.sfx.tap(); start(i); }; g.appendChild(b); });
    if (lv.every(([L]) => S.best[L.id])) { const p = document.createElement('button'); p.className = 'pc'; p.textContent = '📮 Island postcard'; p.onclick = () => postcard(k, closeOv); d.appendChild(p); }
    box.appendChild(d);
  });
  requestAnimationFrame(() => { const c = box.querySelector('.cur'); if (c) c.scrollIntoView({ block: 'center' }); });
}
function postcard(k, after) { overlay(`<h3>📮 Postcard from ${ISLANDS[k].name}</h3><div class="postcard">${META[k].fact}</div>`, [['Mahalo!', after]]); }
// ---------- game state ----------
let L = null, idx = 0, st = null, hist = [], used = 0, boosts = {}, anims = [], blink = null, over = false, deco = [];
function start(i) {
  idx = i; L = LEVELS[i]; st = AS.init(L); hist = []; used = 0; over = false; anims = []; blink = null;
  boosts = { undo: 5, hint: 3, slot: 1 };
  $('gIsl').textContent = ISLANDS[L.island].name; $('gName').textContent = `${L.id}. ${L.name}`;
  closeOv(); show('game'); Sound.music(L.island); syncBoost(); makeDeco();
  if (L.id === 1 || LEVELS[i - 1] && LEVELS[i - 1].island !== L.island) toast(META[L.island].twist.replace('New: ', '').replace('Finale: ', ''));
}
function syncBoost() { $('nUndo').textContent = boosts.undo; $('nHint').textContent = boosts.hint; $('nSlot').textContent = boosts.slot || ''; $('bUndo').disabled = !hist.length || !boosts.undo; $('bHint').disabled = !boosts.hint || over; $('bSlot').disabled = !boosts.slot || over; }
function tapBus(i) {
  if (over || !(st.rem & (1 << i))) return false;
  const g = AS.grid(L, st.rem, AS.exits(L, st));
  if (!AS.canExit(L, g, i)) { Sound.sfx.bump(); anims.push({ k: 'bump', i, t: 0 }); return false; }
  if (st.slots.length >= st.ns) { Sound.sfx.bump(); toast('Waiting slots are full!'); return false; }
  hist.push(AS.clone(st)); const log = [];
  const slotIdx = st.slots.length; st = AS.apply(L, st, i, log);
  Sound.sfx.tap(); anims.push({ k: 'exit', i, t: 0, slot: slotIdx });
  let delay = 0.45; log.forEach(e => { if (e.board !== undefined) { const k = delay; setTimeout(() => Sound.sfx.board(Math.round(k * 10)), k * 1000); delay += 0.09; } else { setTimeout(() => Sound.sfx.depart(), delay * 1000 + 100); anims.push({ k: 'depart', c: e.c, t: -delay, slot: e.depart }); } });
  qShift = Math.min(8, log.filter(e => e.board !== undefined).length);
  blink = null; syncBoost(); setTimeout(check, delay * 1000 + 250); return true;
}
let qShift = 0;
function check() {
  if (over) return; const s = AS.status(L, st);
  if (s === 'win') { over = true; const stars = Math.max(1, 3 - used); const prev = S.best[L.id] || 0; S.best[L.id] = Math.max(prev, stars); save(); Sound.sfx.win(); syncBoost();
    const last = idx === LEVELS.length - 1, islDone = last || LEVELS[idx + 1].island !== L.island;
    const next = () => { if (last) { buildMap(); show('map'); } else start(idx + 1); };
    setTimeout(() => overlay(`<h1>Mahalo, Auntie!</h1><div class="stars">${'★'.repeat(stars)}<span class="no">${'★'.repeat(3 - stars)}</span></div><p>Everyone made it from <b>${L.name}</b>.</p>${stars < 3 ? '<p style="font-size:13px">Tip: finish without boosters for 3 stars.</p>' : ''}`,
      [['Map', () => { closeOv(); buildMap(); show('map'); }, 1], [last ? 'Finish' : 'Next ▶', () => islDone && !S.cards[L.island] ? (S.cards[L.island] = 1, save(), postcard(L.island, next)) : next()]]), 500);
  } else if (s === 'lose') { over = true; Sound.sfx.lose(); syncBoost();
    overlay(`<h1>Lot’s jammed!</h1><p>${st.slots.length >= st.ns ? 'All the tiki slots are full and nobody waiting matches.' : 'No shuttle can get out right now.'}</p><p>No worries, try a Shaka Undo.</p>`,
      [['Restart', () => start(idx), 1], ['↶ Undo', () => { closeOv(); undo(true); }]]);
  }
}
function undo(free) { if (!hist.length) return; if (!free) { if (!boosts.undo) return; boosts.undo--; used = Math.max(used, 1); } else used = Math.max(used, 1); st = hist.pop(); over = false; anims = []; syncBoost(); Sound.sfx.tap(); }
$('bUndo').onclick = () => undo(false);
$('bRetry').onclick = () => { Sound.sfx.tap(); start(idx); };
$('bSlot').onclick = () => { if (!boosts.slot || over) return; boosts.slot--; used++; st.ns++; hist.forEach(h => h.ns++); syncBoost(); Sound.sfx.board(3); toast('Extra tiki slot opened!'); };
$('bHint').onclick = () => { if (!boosts.hint || over) return; const sol = AS.solve(L, st, 60000); if (sol && sol.length) { boosts.hint--; used++; blink = { i: sol[0], t: 0 }; toast('Try the glowing shuttle 🥥'); } else toast(sol === null ? 'Hmm, this lot is stuck. Try Undo!' : 'Try a shuttle that matches the front of the line'); syncBoost(); };
// ---------- canvas ----------
const cv = $('cv'), cx = cv.getContext('2d'); let Wc = 0, Hc = 0, dpr = 1, G = {};
function layout() {
  const r = cv.getBoundingClientRect(); dpr = Math.min(3, window.devicePixelRatio || 1); Wc = r.width; Hc = r.height; if (!Wc || !Hc) return;
  cv.width = Math.round(Wc * dpr); cv.height = Math.round(Hc * dpr);
  if (!L) return;
  const qH = Math.max(56, Math.min(80, Hc * 0.11)), sH = Math.max(60, Math.min(86, Hc * 0.12)), pad = 14;
  const bh = Hc - qH - sH - pad * 2, cell = Math.floor(Math.min((Wc - pad * 2 - 16) / L.W, (bh - 16) / L.H));
  G = { qH, sH, cell, ox: (Wc - cell * L.W) / 2, oy: qH + sH + pad + (bh - cell * L.H) / 2 };
}
addEventListener('resize', () => setTimeout(layout, 50)); addEventListener('orientationchange', () => setTimeout(layout, 300));
document.addEventListener('visibilitychange', () => document.hidden ? Sound.suspend() : Sound.resume());
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); Sound.ensure(); if (!L || over) return;
  const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
  const gx = Math.floor((px - G.ox) / G.cell), gy = Math.floor((py - G.oy) / G.cell);
  let hit = -1;
  L.buses.forEach((b, i) => { if (st.rem & (1 << i) && AS.cells(b).some(([x, y]) => x === gx && y === gy)) hit = i; });
  if (hit < 0) { // forgiving touch: nearest bus within 0.6 cell
    let bd = 0.6 * G.cell; L.buses.forEach((b, i) => { if (!(st.rem & (1 << i))) return; AS.cells(b).forEach(([x, y]) => { const d = Math.hypot(px - (G.ox + (x + .5) * G.cell), py - (G.oy + (y + .5) * G.cell)); if (d < bd) { bd = d; hit = i; } }); });
  }
  if (hit >= 0) tapBus(hit);
}, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault()); document.addEventListener('dblclick', e => e.preventDefault());
function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
function makeDeco() { deco = []; let s = L.id * 99; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let k = 0; k < 10; k++) deco.push({ side: k % 2, f: r(), t: r() < 0.6 ? 'palm' : 'flower', s: 0.7 + r() * 0.5 }); }
function palm(x, y, s) { cx.strokeStyle = '#8a5a2b'; cx.lineWidth = 4 * s; cx.beginPath(); cx.moveTo(x, y); cx.quadraticCurveTo(x + 6 * s, y - 18 * s, x + 2 * s, y - 34 * s); cx.stroke(); cx.fillStyle = '#2f9e44'; for (let a = 0; a < 5; a++) { cx.save(); cx.translate(x + 2 * s, y - 34 * s); cx.rotate(a * 1.25 + 0.3); cx.beginPath(); cx.ellipse(10 * s, 0, 12 * s, 4 * s, 0, 0, 7); cx.fill(); cx.restore(); } }
function flower(x, y, s) { cx.fillStyle = '#f2557a'; for (let a = 0; a < 5; a++) { cx.beginPath(); cx.arc(x + Math.cos(a * 1.257) * 5 * s, y + Math.sin(a * 1.257) * 5 * s, 4.5 * s, 0, 7); cx.fill(); } cx.fillStyle = '#ffd84a'; cx.beginPath(); cx.arc(x, y, 2.5 * s, 0, 7); cx.fill(); }
function drawBus(b, X, Y, ang, color, dark, hidden, scale, glow) {
  const c = G.cell * (scale || 1), len = b.len * c - 6, w = c * 0.74;
  cx.save(); cx.translate(X, Y); cx.rotate(ang);
  if (glow) { cx.shadowColor = '#fff36b'; cx.shadowBlur = 18; }
  cx.fillStyle = 'rgba(0,0,0,.25)'; rr(-w / 2 + 3, -len / 2 + 4, w, len, w * .3); cx.fill(); cx.shadowBlur = 0;
  cx.fillStyle = hidden ? '#b9c3c9' : color; rr(-w / 2, -len / 2, w, len, w * .3); cx.fill();
  cx.strokeStyle = hidden ? '#7f8b92' : dark; cx.lineWidth = 2; cx.stroke();
  cx.fillStyle = 'rgba(255,255,255,.28)'; rr(-w / 2 + w * .16, -len / 2 + c * .42, w * .68, len - c * .62, w * .2); cx.fill();
  cx.fillStyle = '#20384a'; rr(-w / 2 + w * .12, -len / 2 + c * .08, w * .76, c * .24, 4); cx.fill(); // windshield
  cx.fillStyle = '#9fe3ff'; const n = Math.max(2, Math.round(len / (c * .42))); for (let k = 0; k < n; k++) { const yy = -len / 2 + c * .45 + k * (len - c * .6) / n; cx.fillRect(-w / 2 + 1, yy, 3, (len - c * .6) / n - 3); cx.fillRect(w / 2 - 4, yy, 3, (len - c * .6) / n - 3); }
  cx.fillStyle = '#fff6c8'; cx.beginPath(); cx.arc(-w * .3, -len / 2 + 2, 2.5, 0, 7); cx.arc(w * .3, -len / 2 + 2, 2.5, 0, 7); cx.fill();
  if (hidden) { cx.fillStyle = '#fff'; cx.font = `900 ${c * .45}px sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('?', 0, c * .1); }
  else { cx.fillStyle = '#fff'; cx.beginPath(); const ay = c * .05; cx.moveTo(0, ay - c * .2); cx.lineTo(c * .17, ay + c * .02); cx.lineTo(c * .06, ay + c * .02); cx.lineTo(c * .06, ay + c * .2); cx.lineTo(-c * .06, ay + c * .2); cx.lineTo(-c * .06, ay + c * .02); cx.lineTo(-c * .17, ay + c * .02); cx.closePath(); cx.fill(); }
  cx.restore();
}
const ANG = { U: 0, R: Math.PI / 2, D: Math.PI, L: -Math.PI / 2 };
function busCenter(b) { const cs = AS.cells(b); let x = 0, y = 0; cs.forEach(([a, c]) => { x += a; y += c; }); return [G.ox + (x / cs.length + .5) * G.cell, G.oy + (y / cs.length + .5) * G.cell]; }
function person(x, y, c, s, k) { const skin = ['#f1c9a5', '#d9a27a', '#a8714f', '#7a4e33', '#e8b48c'][k % 5]; cx.fillStyle = COL[c]; rr(x - 7 * s, y - 2 * s, 14 * s, 16 * s, 5 * s); cx.fill(); cx.fillStyle = 'rgba(255,255,255,.75)'; cx.beginPath(); cx.arc(x - 3 * s, y + 4 * s, 1.6 * s, 0, 7); cx.arc(x + 3 * s, y + 9 * s, 1.6 * s, 0, 7); cx.fill(); cx.fillStyle = skin; cx.beginPath(); cx.arc(x, y - 8 * s, 6 * s, 0, 7); cx.fill(); cx.fillStyle = ['#3a2412', '#f0d27a', '#7a4a24', '#222'][k % 4]; cx.beginPath(); cx.arc(x, y - 10 * s, 6 * s, Math.PI, 0); cx.fill(); }
function obstacle(o, ex) {
  const c = G.cell, x = G.ox + o.x * c, y = G.oy + o.y * c, w = (o.w || 1) * c, h = (o.h || 1) * c, mx = x + w / 2, my = y + h / 2, act = AS.obsActive(o, ex);
  if (o.t === 'cart') { cx.fillStyle = '#8b98a3'; rr(x + c * .15, y + c * .3, c * .7, c * .5, 5); cx.fill(); ['#e8453c', '#2f7de1', '#f6c234'].forEach((k, j) => { cx.fillStyle = k; rr(x + c * (.2 + j * .2), y + c * (.12 + (j % 2) * .06), c * .18, c * .32, 3); cx.fill(); }); }
  else if (o.t === 'rock') { cx.fillStyle = '#5a5550'; cx.beginPath(); cx.ellipse(mx, my, c * .38, c * .3, 0, 0, 7); cx.fill(); cx.fillStyle = '#7a746d'; cx.beginPath(); cx.ellipse(mx - c * .08, my - c * .08, c * .18, c * .12, 0, 0, 7); cx.fill(); }
  else if (o.t === 'tree') { cx.fillStyle = '#6b4a2a'; cx.fillRect(mx - 4, my - h * .2, 8, h * .4); for (let k = 0; k < (o.h || 1) * 2; k++) { cx.fillStyle = k % 2 ? '#2f8a3c' : '#3fae4c'; cx.beginPath(); cx.arc(mx + (k % 2 ? 6 : -6), y + (k + .6) * h / ((o.h || 1) * 2 + .2), c * .42, 0, 7); cx.fill(); } }
  else if (o.t === 'wave') { if (act) { cx.fillStyle = 'rgba(70,170,230,.85)'; rr(x + 2, y + 2, w - 4, h - 4, 8); cx.fill(); cx.strokeStyle = '#fff'; cx.lineWidth = 2.5; for (let k = 0; k < 2; k++) { cx.beginPath(); for (let t = 0; t <= 1; t += .1) cx.lineTo(x + 6 + t * (w - 12), y + h * (.38 + k * .28) + Math.sin(t * 12 + performance.now() / 300) * 3); cx.stroke(); } } else { cx.fillStyle = 'rgba(70,170,230,.22)'; rr(x + 4, y + 4, w - 8, h - 8, 8); cx.fill(); } }
  else if (o.t === 'lava') { if (act) { cx.fillStyle = '#2a1a14'; rr(x + 2, y + 2, w - 4, h - 4, 6); cx.fill(); cx.strokeStyle = '#ff7a1a'; cx.lineWidth = 3; cx.shadowColor = '#ff5a00'; cx.shadowBlur = 10; cx.beginPath(); cx.moveTo(x + 6, y + h * .3); cx.lineTo(mx, my); cx.lineTo(x + w - 6, y + h * .7); cx.moveTo(mx, my); cx.lineTo(mx - 4, y + h - 6); cx.stroke(); cx.shadowBlur = 0; } else { cx.strokeStyle = 'rgba(255,120,30,.6)'; cx.setLineDash([4, 4]); cx.lineWidth = 2; rr(x + 4, y + 4, w - 8, h - 8, 6); cx.stroke(); cx.setLineDash([]); badge(mx, my, o.n - ex, '#ff7a1a'); } }
  else if (act) { // critters
    const bob = Math.sin(performance.now() / 250 + o.x) * 2;
    if (o.t === 'chicken') { cx.fillStyle = '#fff'; cx.beginPath(); cx.ellipse(mx, my + bob, c * .22, c * .18, 0, 0, 7); cx.fill(); cx.beginPath(); cx.arc(mx + c * .16, my - c * .12 + bob, c * .1, 0, 7); cx.fill(); cx.fillStyle = '#e8453c'; cx.beginPath(); cx.arc(mx + c * .16, my - c * .23 + bob, c * .05, 0, 7); cx.fill(); cx.fillStyle = '#f6a623'; cx.beginPath(); cx.moveTo(mx + c * .25, my - c * .13 + bob); cx.lineTo(mx + c * .33, my - c * .1 + bob); cx.lineTo(mx + c * .25, my - c * .07 + bob); cx.fill(); cx.fillStyle = '#c0582b'; cx.beginPath(); cx.ellipse(mx - c * .18, my - c * .05 + bob, c * .09, c * .14, -.5, 0, 7); cx.fill(); }
    else if (o.t === 'goose') { cx.fillStyle = '#b08a62'; cx.beginPath(); cx.ellipse(mx, my + bob, c * .25, c * .17, 0, 0, 7); cx.fill(); cx.fillStyle = '#e9dcc7'; cx.fillRect(mx + c * .1, my - c * .25 + bob, c * .07, c * .2); cx.fillStyle = '#1d1d1d'; cx.beginPath(); cx.arc(mx + c * .14, my - c * .27 + bob, c * .08, 0, 7); cx.fill(); }
    else if (o.t === 'surfer') { cx.fillStyle = '#ffd84a'; cx.save(); cx.translate(mx, my); cx.rotate(.5); rr(-c * .1, -c * .4, c * .2, c * .8, c * .1); cx.fill(); cx.restore(); person(mx + c * .12, my + c * .05 + bob, 2, c / 40, 1); }
    else if (o.t === 'boat') { cx.fillStyle = '#fff'; cx.beginPath(); cx.ellipse(mx, my, c * .4, c * .2, 0, 0, 7); cx.fill(); cx.fillStyle = '#2f7de1'; cx.fillRect(mx - c * .3, my - c * .02, c * .6, c * .05); }
    if (o.t !== 'boat') badge(x + w - c * .14, y + c * .14, o.n - ex, '#2fb3c2');
  }
}
function badge(x, y, n, col) { if (n <= 0) return; cx.fillStyle = col; cx.beginPath(); cx.arc(x, y, G.cell * .14, 0, 7); cx.fill(); cx.fillStyle = '#fff'; cx.font = `900 ${G.cell * .18}px sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(n, x, y + 1); }
function slotRect(k) { const n = st.ns, gap = 6, sw = Math.min(70, (Wc - 20 - gap * (n - 1)) / n), tot = n * sw + (n - 1) * gap, x = (Wc - tot) / 2 + k * (sw + gap); return [x, G.qH + 6, sw, G.sH - 12]; }
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; requestAnimationFrame(frame);
  if (!document.getElementById('game').classList.contains('on') || !L) return;
  if (!G.cell || cv.width !== Math.round(cv.getBoundingClientRect().width * dpr)) layout(); if (!G.cell) return;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0); const M = META[L.island], ex = AS.exits(L, st);
  cx.fillStyle = M.bg; cx.fillRect(0, 0, Wc, Hc);
  // queue strip: thatched bus stop
  cx.fillStyle = '#d9a75a'; cx.fillRect(0, 0, Wc, G.qH); cx.fillStyle = '#b8823a'; for (let x = 0; x < Wc; x += 8) cx.fillRect(x, G.qH - 8, 4, 8);
  qShift = Math.max(0, qShift - dt * 10);
  const ps = Math.min(1.25, G.qH / 62), spacing = 24 * ps, vis = Math.floor((Wc - 70) / spacing);
  for (let k = Math.min(vis, L.queue.length - st.qi) - 1; k >= 0; k--) person(26 + (k + qShift) * spacing, G.qH * .55, L.queue[st.qi + k], k === 0 ? ps * 1.15 : ps, st.qi + k);
  cx.fillStyle = '#5b3417'; cx.font = `800 ${13}px sans-serif`; cx.textAlign = 'right'; cx.textBaseline = 'middle'; cx.fillText(`${L.queue.length - st.qi} 👤`, Wc - 8, G.qH * .5);
  // tiki slots
  cx.fillStyle = '#8a5527'; cx.fillRect(0, G.qH, Wc, G.sH);
  for (let k = 0; k < st.ns; k++) { const [x, y, w, h] = slotRect(k); cx.fillStyle = '#c98a4b'; rr(x, y, w, h, 10); cx.fill(); cx.strokeStyle = '#5b3417'; cx.lineWidth = 2; cx.stroke(); cx.fillStyle = '#7a4a24'; cx.fillRect(x + 5, y + 4, 4, h - 8); cx.fillRect(x + w - 9, y + 4, 4, h - 8);
    const z = st.slots[k]; if (z && !anims.some(a => a.k === 'exit' && a.slot === k && a.t < .55)) { const fake = { len: 2 }; const sc = Math.min(w / (G.cell * 2.1), h / (G.cell * .9)); cx.save(); drawBus(fake, x + w / 2, y + h * .42, Math.PI / 2, COL[z[0]], COLD[z[0]], false, sc); cx.restore(); for (let j = 0; j < 3; j++) { cx.fillStyle = j < z[1] ? '#fff' : 'rgba(0,0,0,.3)'; cx.beginPath(); cx.arc(x + w / 2 + (j - 1) * 11, y + h - 9, 4, 0, 7); cx.fill(); } } }
  // lot
  cx.fillStyle = M.lot; rr(G.ox - 8, G.oy - 8, G.cell * L.W + 16, G.cell * L.H + 16, 14); cx.fill();
  cx.strokeStyle = 'rgba(255,255,255,.18)'; cx.lineWidth = 1; for (let x = 1; x < L.W; x++) { cx.beginPath(); cx.moveTo(G.ox + x * G.cell, G.oy); cx.lineTo(G.ox + x * G.cell, G.oy + L.H * G.cell); cx.stroke(); } for (let y = 1; y < L.H; y++) { cx.beginPath(); cx.moveTo(G.ox, G.oy + y * G.cell); cx.lineTo(G.ox + L.W * G.cell, G.oy + y * G.cell); cx.stroke(); }
  deco.forEach((d, k) => { const x = d.side ? Math.min(Wc - 12, G.ox + L.W * G.cell + 18) : Math.max(12, G.ox - 18), y = G.oy + 20 + d.f * (L.H * G.cell - 20); if (G.ox > 22) (d.t === 'palm' ? palm(x, y, d.s * .8) : flower(x, y, d.s)); });
  L.obs.forEach(o => obstacle(o, ex));
  anims.forEach(a => a.t += dt); anims = anims.filter(a => a.t < (a.k === 'bump' ? .3 : a.k === 'exit' ? .75 : 1.2));
  const g = AS.grid(L, st.rem, ex);
  L.buses.forEach((b, i) => { if (!(st.rem & (1 << i))) return; let [X, Y] = busCenter(b); const bm = anims.find(a => a.k === 'bump' && a.i === i); if (bm) { const [dx, dy] = AS.DIRS[b.d], o = Math.sin(bm.t / .3 * Math.PI) * 5; X += dx * o; Y += dy * o; } const hid = b.h && !AS.canExit(L, g, i); const gl = blink && blink.i === i && Math.floor(now / 300) % 2 === 0; drawBus(b, X, Y, ANG[b.d], COL[b.c], COLD[b.c], hid, 1, gl); });
  anims.forEach(a => { if (a.k === 'exit') { const b = L.buses[a.i], [dx, dy] = AS.DIRS[b.d]; let [X, Y] = busCenter(b); if (a.t < .35) { const d = (a.t / .35) ** 2 * Math.max(L.W, L.H) * G.cell; drawBus(b, X + dx * d, Y + dy * d, ANG[b.d], COL[b.c], COLD[b.c], false, 1); } else if (a.t < .55) { const [sx, sy, sw, sh] = slotRect(Math.min(a.slot, st.ns - 1)); const p = (a.t - .35) / .2; drawBus({ len: 2 }, sx + sw / 2, sy - 30 + p * (sh * .42 + 30), Math.PI / 2, COL[b.c], COLD[b.c], false, .6); } }
    if (a.k === 'depart' && a.t > 0) { const [sx, sy, sw, sh] = slotRect(Math.min(a.slot, st.ns - 1)); drawBus({ len: 2 }, sx + sw / 2 + a.t * Wc, sy + sh * .42, Math.PI / 2, COL[a.c], COLD[a.c], false, .6); } });
}
requestAnimationFrame(frame);
window.__AS = { start, tapBus, get st() { return st; }, get L() { return L; }, S, buildMap, show, solve: () => AS.solve(L, st), check };
})();
