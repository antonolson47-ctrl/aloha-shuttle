// Aloha Shuttle — shared rules engine + solver (browser & node)
(function (root) {
  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const CAP = 3;
  const pop = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
  function cells(b) { const [dx, dy] = DIRS[b.d]; const r = []; for (let i = 0; i < b.len; i++) r.push([b.x - dx * i, b.y - dy * i]); return r; }
  function ocells(o) { const r = []; for (let j = 0; j < (o.h || 1); j++) for (let i = 0; i < (o.w || 1); i++) r.push([o.x + i, o.y + j]); return r; }
  // timed obstacles: critters leave after n buses exit; lava closes after n exits; waves block every other pair of exits
  function obsActive(o, ex) {
    switch (o.t) { case 'goose': case 'chicken': case 'surfer': return ex < o.n; case 'lava': return ex >= o.n; case 'wave': return (ex % 4) >= 2; default: return true; }
  }
  function exits(L, s) { return L.buses.length - pop(s.rem); }
  function grid(L, rem, ex) {
    const g = new Int16Array(L.W * L.H).fill(-1);
    L.buses.forEach((b, i) => { if (rem & (1 << i)) for (const [x, y] of cells(b)) g[y * L.W + x] = i; });
    for (const o of L.obs) if (obsActive(o, ex)) for (const [x, y] of ocells(o)) if (g[y * L.W + x] === -1) g[y * L.W + x] = -2;
    return g;
  }
  function canExit(L, g, i) {
    const b = L.buses[i], [dx, dy] = DIRS[b.d]; let x = b.x + dx, y = b.y + dy;
    while (x >= 0 && y >= 0 && x < L.W && y < L.H) { if (g[y * L.W + x] !== -1) return false; x += dx; y += dy; }
    return true;
  }
  function init(L, extra) { return { rem: (1 << L.buses.length) - 1, slots: [], qi: 0, ns: L.slots + (extra || 0) }; }
  function clone(s) { return { rem: s.rem, slots: s.slots.map(z => z.slice()), qi: s.qi, ns: s.ns }; }
  function boardAll(L, s, log) {
    while (s.qi < L.queue.length) {
      const p = L.queue[s.qi], k = s.slots.findIndex(z => z[0] === p && z[1] < CAP);
      if (k < 0) break;
      s.slots[k][1]++; s.qi++; if (log) log.push({ board: k, c: p });
      if (s.slots[k][1] === CAP) { if (log) log.push({ depart: k, c: p }); s.slots.splice(k, 1); }
    }
  }
  function movable(L, s) {
    if (s.slots.length >= s.ns) return [];
    const g = grid(L, s.rem, exits(L, s)), mv = [];
    for (let i = 0; i < L.buses.length; i++) if ((s.rem & (1 << i)) && canExit(L, g, i)) mv.push(i);
    return mv;
  }
  function apply(L, s, i, log) {
    const t = clone(s); t.rem &= ~(1 << i); t.slots.push([L.buses[i].c, 0]); boardAll(L, t, log); return t;
  }
  function status(L, s) { if (s.qi >= L.queue.length) return 'win'; return movable(L, s).length ? 'play' : 'lose'; }
  // DFS solver. returns array of bus indices, null if unsolvable, undefined if node limit hit
  function solve(L, s0, limit) {
    limit = limit || 400000; const seen = new Set(); let nodes = 0; const path = [];
    const key = s => s.rem + '|' + s.qi + '|' + s.ns + '|' + s.slots.map(z => z[0] * 4 + z[1]).sort().join(',');
    function dfs(s) {
      if (s.qi >= L.queue.length) return true;
      if (++nodes > limit) throw 0;
      const k = key(s); if (seen.has(k)) return false; seen.add(k);
      const mv = movable(L, s); const p = L.queue[s.qi];
      mv.sort((a, b) => (L.buses[b].c === p) - (L.buses[a].c === p));
      for (const i of mv) { path.push(i); if (dfs(apply(L, s, i))) return true; path.pop(); }
      return false;
    }
    try { const ok = dfs(clone(s0)); solve.nodes = nodes; return ok ? path.slice() : null; } catch (e) { solve.nodes = nodes; return undefined; }
  }
  root.AS = { DIRS, CAP, cells, ocells, obsActive, exits, grid, canExit, init, clone, apply, movable, status, solve, boardAll, pop };
  if (typeof module !== 'undefined') module.exports = root.AS;
})(typeof window !== 'undefined' ? window : globalThis);
