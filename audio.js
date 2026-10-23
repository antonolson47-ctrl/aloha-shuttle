// Original procedurally generated ukulele-style music + sfx (WebAudio). No samples, no recordings.
const Sound = (() => {
  let ctx = null, master, musicBus, sfxBus, on = true, timer = null, step = 0, nextT = 0, island = 0, noiseBuf;
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  // per-island progressions (MIDI chords, re-entrant ukulele voicing G4 C4 E4 A4 flavour) and tempo
  const PROG = [
    { bpm: 96, key: 60, ch: [[0, 4, 7], [9, 0, 4], [5, 9, 0], [7, 11, 2]] },     // I vi IV V
    { bpm: 92, key: 62, ch: [[0, 4, 7], [5, 9, 0], [0, 4, 7], [7, 11, 2]] },     // I IV I V
    { bpm: 88, key: 57, ch: [[0, 4, 7], [7, 11, 2], [9, 0, 4], [5, 9, 0]] },     // I V vi IV
    { bpm: 80, key: 65, ch: [[0, 4, 7], [2, 5, 9], [5, 9, 0], [7, 11, 2]] },     // I ii IV V (Hāna, slower)
    { bpm: 84, key: 55, ch: [[9, 0, 4], [5, 9, 0], [0, 4, 7], [7, 11, 2]] },     // vi IV I V (volcano, lower)
  ];
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? 0.8 : 0; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.35; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function pluck(f, t, vol, dur, bus, bright) {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o1.type = 'triangle'; o2.type = 'sawtooth'; o1.frequency.value = f; o2.frequency.value = f * 1.003;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(bright || 3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + dur * 0.6);
    const g2 = ctx.createGain(); g2.gain.value = 0.35; o2.connect(g2); g2.connect(lp); o1.connect(lp); lp.connect(g); g.connect(bus || sfxBus);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function shaker(t, vol) { const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; hp.type = 'highpass'; hp.frequency.value = 6000; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); s.connect(hp); hp.connect(g); g.connect(musicBus); s.start(t); s.stop(t + 0.08); }
  function bass(f, t, dur) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05); }
  function slide(f, t) { // soft steel-guitar style glide
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * 0.94, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.18);
    const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = 5.5; vg.gain.value = f * 0.01; v.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4); o.connect(g); g.connect(musicBus); o.start(t); v.start(t); o.stop(t + 1.5); v.stop(t + 1.5);
  }
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function tick() {
    const P = PROG[island], e8 = 60 / P.bpm / 2;
    while (nextT < ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % 4, s8 = step % 8, ch = P.ch[bar], t = nextT;
      // strum pattern D . D U . U D U
      const pat = [1, 0, 1, 2, 0, 2, 1, 2];
      if (pat[s8]) { const notes = [7, ...ch.map(c => c), 12].map(c => P.key + (c % 12)); const ord = pat[s8] === 2 ? notes.slice().reverse() : notes; ord.forEach((n, k) => pluck(N(n), t + k * 0.012, pat[s8] === 2 ? 0.05 : 0.08, 0.5, musicBus, 2600)); }
      if (s8 === 0 || s8 === 4) bass(N(P.key - 24 + ch[0] % 12), t, e8 * 3);
      shaker(t, s8 % 2 ? 0.05 : 0.09);
      if (s8 % 2 === 0 && rnd() < 0.45) pluck(N(P.key + 12 + PENTA[Math.floor(rnd() * PENTA.length)]), t + e8 * 0.02, 0.11, 0.7, musicBus, 4200);
      if (step % 32 === 28 && island % 2 === 0) slide(N(P.key + 12 + ch[0] % 12), t);
      step++; nextT += e8;
    }
  }
  function music(isl) { ensure(); if (!ctx) return; island = isl % PROG.length; seed = 7 + isl * 31; if (!timer) { nextT = ctx.currentTime + 0.1; timer = setInterval(tick, 80); } }
  function stopMusic() { if (timer) { clearInterval(timer); timer = null; } }
  const sfx = {
    tap() { if (!ctx) return; const t = ctx.currentTime; pluck(N(76), t, 0.2, 0.35); pluck(N(83), t + 0.05, 0.15, 0.35); },
    bump() { if (!ctx) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.15); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.2); },
    board(k) { if (!ctx) return; pluck(N(72 + [0, 4, 7, 12][k % 4]), ctx.currentTime, 0.12, 0.25); },
    depart() { if (!ctx) return; const t = ctx.currentTime; [0, 0.16].forEach(d => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 520; g.gain.setValueAtTime(0.06, t + d); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.12); o.connect(g); g.connect(sfxBus); o.start(t + d); o.stop(t + d + 0.14); }); },
    win() { if (!ctx) return; const t = ctx.currentTime; [60, 64, 67, 72, 76, 79, 84].forEach((n, k) => pluck(N(n), t + k * 0.07, 0.18, 1.2)); },
    lose() { if (!ctx) return; const t = ctx.currentTime; [67, 64, 60, 55].forEach((n, k) => pluck(N(n), t + k * 0.16, 0.16, 0.6)); },
  };
  return { ensure, music, stopMusic, sfx, setOn(v) { on = v; if (master) master.gain.value = v ? 0.8 : 0; }, get on() { return on; }, suspend() { if (ctx) ctx.suspend(); }, resume() { if (ctx) ctx.resume(); } };
})();
