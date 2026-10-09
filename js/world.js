function govLabel(g) {
  if (g === "Republic") return "Democratic republic";
  return g || "Monarchy";
}
function govArticle(g) {
  if (g === "Republic") return "a democratic republic";
  if (g === "Oligarchy") return "an oligarchy";
  if (g === "Theocracy") return "a theocracy";
  if (g === "Dictatorship") return "a dictatorship";
  return "a monarchy";
}
function faithColor(i) { return FAITH_COLORS[i % FAITH_COLORS.length]; }
function rules(g) {
  return {
    Monarchy: { hold: 0.92, bully: 0.15, trade: 0.2, zeal: 0, military: 1, grow: 1, sea: 1.12, heart: 1.28, poor: 1 },
    Republic: { hold: 0.7, bully: 0.22, trade: 1, zeal: 0, military: 0.94, grow: 1.12, sea: 1.7, heart: 1.02, poor: 0.82 },
    Dictatorship: { hold: 0.48, bully: 1, trade: 0.25, zeal: 0, military: 1.24, grow: 0.84, sea: 1.05, heart: 1.05, poor: 1.12 },
    Oligarchy: { hold: 0.66, bully: 0.35, trade: 1.3, zeal: 0, military: 0.9, grow: 1.02, sea: 2.05, heart: 0.92, poor: 0.68 },
    Theocracy: { hold: 0.78, bully: 0.18, trade: 0.25, zeal: 1, military: 1.02, grow: 0.96, sea: 1.08, heart: 1.1, poor: 1 }
  }[g] || { hold: 0.9, bully: 0.2, trade: 0.2, zeal: 0, military: 1, grow: 1, sea: 1.1, heart: 1.1, poor: 1 };
}
function norm3(s) {
  const t = (s[0] + s[1] + s[2]) || 1;
  return [s[0] / t, s[1] / t, s[2] / t];
}
function topFaith(x, y) {
  const s = belief && belief[y] && belief[y][x];
  if (!s) return 0;
  return s[1] > s[0] ? (s[2] > s[1] ? 2 : 1) : (s[2] > s[0] ? 2 : 0);
}
function mixFaithColor(shares) {
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < 3; i++) {
    const n = parseInt(faithColor(i).slice(1), 16);
    const w = shares[i] || 0;
    r += ((n >> 16) & 255) * w;
    g += ((n >> 8) & 255) * w;
    b += (n & 255) * w;
  }
  return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
}

function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function ri(n) { return Math.floor(rnd() * n); }
function pick(a) { return a[ri(a.length)]; }
function nameRealm() { return pick(prefixes) + pick(suffixes); }
function nameCity() {
  for (let i = 0; i < 8; i++) {
    const n = pick(prefixes) + pick(citySuffixes);
    if (!cities.some(c => c.name === n)) return n;
  }
  return pick(prefixes) + pick(citySuffixes) + (nextCity || 1);
}
function hypot(x, y, c) {
  let dx = Math.abs(x - c.x);
  if (dx > COLS / 2) dx = COLS - dx;
  const dy = y - c.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function key(x, y) { return y * COLS + x; }

function resize() {
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(320, r.width);
  canvas.height = Math.max(240, r.height);
}
window.addEventListener("resize", resize);

function neighbors(x, y) {
  const n = [[(x + COLS - 1) % COLS, y], [(x + 1) % COLS, y]];
  if (y > 0) n.push([x, y - 1]);
  if (y < ROWS - 1) n.push([x, y + 1]);
  return n;
}

function faithName(i) { return (faithNames && faithNames[i]) || "Old Rite"; }

function stamp(cx, cy, rx, ry) {
  const y0 = Math.max(1, Math.floor(cy - ry - 1));
  const y1 = Math.min(ROWS - 2, Math.ceil(cy + ry + 1));
  const x0 = Math.max(1, Math.floor(cx - rx - 1));
  const x1 = Math.min(COLS - 2, Math.ceil(cx + rx + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry;
      if (nx * nx + ny * ny < 1 + (rnd() - 0.5) * 0.35) grid[y][x] = LAND;
    }
  }
}

function carve(x0, x1, y0, y1) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const rx = (x1 - x0) * 0.46, ry = (y1 - y0) * 0.4;
  stamp(cx, cy, rx, ry);
  stamp(cx - rx * 0.3, cy + (rnd() - 0.5) * ry * 0.35, rx * 0.48, ry * 0.5);
  stamp(cx + rx * 0.24, cy - ry * 0.15, rx * 0.4, ry * 0.42);
}

function drown() {
  for (const c of canals) {
    for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) {
      if (grid[y] && grid[y][x] != null) grid[y][x] = WATER;
    }
  }
}

function smoothLand() {
  const next = grid.map(row => row.slice());
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      let c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) c += grid[y + dy][x + dx] === LAND;
      if (c >= 6) next[y][x] = LAND;
      else if (c <= 3) next[y][x] = WATER;
    }
  }
  grid = next;
  drown();
}

function landMasses(min) {
  const seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const masses = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (seen[y][x] || grid[y][x] !== LAND) continue;
    const q = [[x, y]];
    const blob = [];
    seen[y][x] = true;
    while (q.length) {
      const [cx, cy] = q.shift();
      blob.push([cx, cy]);
      for (const [nx, ny] of neighbors(cx, cy)) {
        if (!seen[ny][nx] && grid[ny][nx] === LAND) { seen[ny][nx] = true; q.push([nx, ny]); }
      }
    }
    if (blob.length >= min) masses.push(blob);
  }
  masses.sort((a, b) => b.length - a.length);
  return masses;
}

function hash2(ix, iy) {
  let n = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ (seed | 0);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0), b = hash2(x0 + 1, y0), c = hash2(x0, y0 + 1), d = hash2(x0 + 1, y0 + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm(x, y) {
  let v = 0, a = 0.55, f = 1, s = 0;
  for (let i = 0; i < 5; i++) { v += vnoise(x * f, y * f) * a; s += a; a *= 0.5; f *= 2.08; }
  return v / s;
}

function layContinents() {
  canals = [];
  elev = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const count = rnd() < 0.45 ? 3 : 2;
  const centers = [];
  for (let i = 0; i < count; i++) {
    centers.push({
      x: Math.floor((i + 0.28 + rnd() * 0.44) * COLS / count) % COLS,
      y: 16 + ri(Math.max(8, ROWS - 32)),
      r: 15 + ri(11)
    });
  }
  const pole = 5;
  for (let y = 0; y < ROWS; y++) {
    const lat = (y / (ROWS - 1) - 0.5) * 2;
    for (let x = 0; x < COLS; x++) {
      const ang = (x / COLS) * Math.PI * 2;
      const wx = Math.cos(ang) * 2.1;
      const wy = Math.sin(ang) * 2.1;
      let dome = 0;
      for (const c of centers) {
        let dx = Math.abs(x - c.x);
        if (dx > COLS / 2) dx = COLS - dx;
        const d = Math.hypot(dx, y - c.y) / c.r;
        dome = Math.max(dome, Math.max(0, 1 - d * d));
      }
      const warp = fbm(wx + y * 0.01, wy + 4);
      const n = fbm(wx * 1.4 + (warp - 0.5) * 0.8, wy * 1.4 + y * 0.07);
      const ridge = 1 - Math.abs(fbm(wx * 0.7 + 3, wy * 0.7 + y * 0.04) - 0.5) * 2;
      const h = dome * 0.62 + (n - 0.5) * 0.85 + (ridge - 0.5) * 0.22 - lat * lat * 1.05;
      elev[y][x] = h;
      grid[y][x] = y < pole || y >= ROWS - pole || h <= 0.12 ? WATER : LAND;
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    const next = grid.map(row => row.slice());
    for (let y = pole; y < ROWS - pole; y++) for (let x = 0; x < COLS; x++) {
      let c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy;
        if (yy < 0 || yy >= ROWS) continue;
        const xx = (x + dx + COLS) % COLS;
        if (grid[yy][xx] === LAND) c++;
      }
      if (grid[y][x] === LAND && c <= 2) next[y][x] = WATER;
      else if (grid[y][x] !== LAND && c >= 8) next[y][x] = LAND;
    }
    grid = next;
  }
  for (let y = 0; y < pole; y++) for (let x = 0; x < COLS; x++) { grid[y][x] = WATER; grid[ROWS - 1 - y][x] = WATER; }
  separateCenters(centers);
  for (const blob of landMasses(0)) if (blob.length < 55) for (const [x, y] of blob) grid[y][x] = WATER;
  traceRivers();
  continents = landMasses(80).length;
}

function separateCenters(centers) {
  const masses = landMasses(1);
  const at = (c) => {
    let best = null, bd = 1e9;
    for (const blob of masses) for (const [x, y] of blob) {
      const d = Math.hypot(x - c.x, y - c.y);
      if (d < bd) { bd = d; best = blob; }
    }
    return best;
  };
  for (let i = 0; i < centers.length; i++) for (let j = i + 1; j < centers.length; j++) {
    const A = centers[i], B = centers[j];
    if (at(A) !== at(B)) continue;
    const span = Math.hypot(Math.min(Math.abs(A.x - B.x), COLS - Math.abs(A.x - B.x)), A.y - B.y);
    for (let y = 1; y < ROWS - 1; y++) for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== LAND) continue;
      let dax = Math.abs(x - A.x), dbx = Math.abs(x - B.x);
      if (dax > COLS / 2) dax = COLS - dax;
      if (dbx > COLS / 2) dbx = COLS - dbx;
      const da = Math.hypot(dax, y - A.y), db = Math.hypot(dbx, y - B.y);
      if (Math.abs(da - db) < 3.2 && da + db < span + 10 && elev[y][x] < 0.48) grid[y][x] = WATER;
    }
  }
}

function traceRivers() {
  river = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  riverSys = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  flowToX = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  flowToY = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  const h = elev.map(row => row.slice());
  const seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const heap = [];
  function push(x, y, hh) {
    heap.push({ x, y, h: hh });
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p].h <= heap[i].h) break;
      const t = heap[p]; heap[p] = heap[i]; heap[i] = t;
      i = p;
    }
  }
  function pop() {
    if (!heap.length) return null;
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let s = i, l = i * 2 + 1, r = l + 1;
        if (l < heap.length && heap[l].h < heap[s].h) s = l;
        if (r < heap.length && heap[r].h < heap[s].h) s = r;
        if (s === i) break;
        const t = heap[s]; heap[s] = heap[i]; heap[i] = t;
        i = s;
      }
    }
    return top;
  }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] !== LAND) continue;
    const sea = neighbors(x, y).find(([nx, ny]) => grid[ny][nx] !== LAND);
    if (!sea) continue;
    seen[y][x] = true;
    flowToX[y][x] = sea[0];
    flowToY[y][x] = sea[1];
    push(x, y, h[y][x]);
  }
  while (heap.length) {
    const c = pop();
    for (const [nx, ny] of neighbors(c.x, c.y)) {
      if (grid[ny][nx] !== LAND || seen[ny][nx]) continue;
      seen[ny][nx] = true;
      flowToX[ny][nx] = c.x;
      flowToY[ny][nx] = c.y;
      if (h[ny][nx] <= h[c.y][c.x]) h[ny][nx] = h[c.y][c.x] + 0.0001;
      push(nx, ny, h[ny][nx]);
    }
  }
  const acc = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const order = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === LAND) {
    acc[y][x] = 1;
    order.push([x, y]);
  }
  order.sort((a, b) => h[b[1]][b[0]] - h[a[1]][a[0]]);
  for (const [x, y] of order) {
    const nx = flowToX[y][x], ny = flowToY[y][x];
    if (nx >= 0 && grid[ny][nx] === LAND) acc[ny][nx] += acc[y][x];
  }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (acc[y][x] >= 12) river[y][x] = acc[y][x];
  let sid = 1;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (river[y][x] < 12 || riverSys[y][x]) continue;
    const q = [[x, y]];
    riverSys[y][x] = sid;
    while (q.length) {
      const [cx, cy] = q.shift();
      for (const [nx, ny] of neighbors(cx, cy)) {
        if (river[ny][nx] >= 12 && !riverSys[ny][nx]) { riverSys[ny][nx] = sid; q.push([nx, ny]); }
      }
    }
    sid++;
  }
  basin = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] !== LAND) continue;
    let cx = x, cy = y;
    for (let s = 0; s < 48 && grid[cy][cx] === LAND; s++) {
      if (riverSys[cy][cx]) { basin[y][x] = riverSys[cy][cx]; break; }
      const nx = flowToX[cy][cx], ny = flowToY[cy][cx];
      if (nx < 0 || grid[ny][nx] !== LAND) break;
      cx = nx; cy = ny;
    }
  }
}

function pickGov(x, y) {
  const shore = coast && coast[y] && coast[y][x];
  const r = rnd();
  if (r < 0.06) return "Theocracy";
  if (r < 0.22) return "Dictatorship";
  if (shore && r < 0.46) return "Oligarchy";
  if (shore && r < 0.76) return "Republic";
  if (!shore && r < 0.4) return "Republic";
  if (!shore && r < 0.52) return "Oligarchy";
  return "Monarchy";
}

function seedFaith() {
  const pool = FAITH_POOL.slice();
  faithNames = [];
  while (faithNames.length < 3 && pool.length) faithNames.push(pool.splice(ri(pool.length), 1)[0]);
  const spots = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === LAND) spots.push([x, y]);
  const seeds = [];
  for (let i = 0; i < 3 && spots.length; i++) {
    let best = spots[0], bestD = -1;
    const tries = Math.min(80, spots.length);
    for (let t = 0; t < tries; t++) {
      const p = spots[ri(spots.length)];
      let d = 999;
      for (const s of seeds) d = Math.min(d, Math.hypot(p[0] - s[0], p[1] - s[1]));
      if (!seeds.length) d = 50;
      if (d > bestD) { bestD = d; best = p; }
    }
    seeds.push(best);
  }
  belief = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (const [x, y] of spots) {
    const raw = norm3(seeds.map(s => 1 / Math.pow(Math.hypot(x - s[0], y - s[1]) + 14, 1.35)));
    belief[y][x] = norm3(raw.map(v => v + 0.2));
  }
}

function placeResources() {
  resource = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] !== LAND) continue;
    const e = elev[y][x] || 0;
    const blob = hash2(x >> 2, y >> 2);
    const fine = hash2(x + 19, y + 7);
    if (e > 0.52 && blob > 0.52 && fine > 0.38) resource[y][x] = 2;
    else if (e > 0.26 && e < 0.6 && !(coast && coast[y][x]) && blob > 0.58 && fine > 0.42) resource[y][x] = 1;
  }
}

