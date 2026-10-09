function generate() {
  seed = (Date.now() % 2000000000) + 1;
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(WATER));
  owner = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  prev = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  occupy = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  occYear = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  layContinents();
  markCoast();
  placeClimate();
  placeResources();
  seedFaith();
  seedPop();
  nations = [];
  nextId = 1;
  nextCity = 1;
  cities = [];
  units = [];
  pendingFood = null;
  nextUnit = 1;
  dry = {};
  year = 800 + ri(400);
  season = 0;
  logLines = [];
  const spots = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === LAND) spots.push([x, y]);
  const start = 5 + ri(3);
  const chosen = [];
  for (let i = 0; i < start && spots.length; i++) {
    let best = 0, bestScore = -1;
    const tries = Math.min(60, spots.length);
    for (let t = 0; t < tries; t++) {
      const j = ri(spots.length);
      const [x, y] = spots[j];
      let score = 999;
      for (const c of chosen) score = Math.min(score, Math.hypot(x - c.x, y - c.y));
      if (score > bestScore) { bestScore = score; best = j; }
    }
    const [x, y] = spots.splice(best, 1)[0];
    if (chosen.some(c => Math.hypot(x - c.x, y - c.y) < 12)) continue;
    chosen.push({ x, y });
    const name = nameRealm();
    const n = found(x, y, name, colors[i % colors.length]);
    claimDisk(n, 3);
  }
  selected = nations[0] ? nations[0].id : null;
  logLines.push(year + ": A new age begins. " + continents + " continents. People carry the faiths. States do not.");
  acc = 0;
  recount();
  render();
  drawUI();
}

function found(x, y, name, color, why, gov, faithId, parent) {
  const id = nextId++;
  const f = faithId == null ? topFaith(x, y) : faithId;
  const g = gov || pickGov(x, y);
  const n = {
    id, name, color, born: year || 1000, stability: 70, legitimacy: 68, pops: 1,
    capital: { x, y }, label: { x, y }, atWar: new Set(), peace: {}, wars: {}, quietUntil: (year || 1000) + 80,
    bearing: rnd() * Math.PI * 2, drive: 0.35 + rnd() * 0.5, bold: 0.4 + rnd() * 0.6,
    faith: f, gov: g, grievance: {}, gnote: {}, unrest: 0, pact: {},
    sea: coast && coast[y] && coast[y][x] ? 0.14 : 0,
    treasury: 220, timber: 0, ore: 0, oil: 0, silicon: 0,
    age: 0, learn: 0, taxTake: 0, spent: 0, lastTrade: "", history: [],
    nextVote: g === "Republic" ? (year || 1000) + 28 : 0
  };
  seatLeader(n);
  nations.push(n);
  const seat = placeCity(x, y, nameCity(), "city");
  n.seat = seat.id;
  n.capital = { x, y };
  if (grid[y] && grid[y][x] === LAND) claim(x, y, id);
  const crown = name + " is founded as " + govArticle(g) + (g === "Theocracy" ? ". The cult is " + faithName(f) + ", which the capital's people already follow." : ".");
  chronicle(year || 1000, why || crown);
  return n;
}

function claim(x, y, id) {
  if (!prev) prev = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  if (owner[y][x] !== id) {
    if (owner[y][x] >= 0 && id >= 0 && pop && pop[y][x]) {
      const city = cities.find(c => c.x === x && c.y === y);
      const tier = city ? tierAt(city.rank) : 0;
      const keeps = [0.9, 0.8, 0.66, 0.56, 0.48];
      const seat = city && nations.some(n => n.seat === city.id && n.capital && n.capital.x === x && n.capital.y === y);
      const keep = !city ? 0.93 : seat ? Math.min(0.52, keeps[tier]) : keeps[tier];
      pop[y][x] = Math.max(160, Math.round(pop[y][x] * keep));
    }
    prev[y][x] = owner[y][x];
  }
  owner[y][x] = id;
}

function claimDisk(n, r) {
  const c = n.capital;
  for (let dy = -r; dy <= r; dy++) {
    const y = c.y + dy;
    if (y < 0 || y >= ROWS) continue;
    for (let dx = -r; dx <= r; dx++) {
      const x = (c.x + dx + COLS) % COLS;
      if (grid[y][x] !== LAND || owner[y][x] >= 0) continue;
      if (hypot(x, y, c) <= r) claim(x, y, n.id);
    }
  }
}

function chronicle(y, text) {
  if (!logLines) logLines = [];
  const when = SEASONS[season] ? y + " " + SEASONS[season] : String(y);
  const line = when + ": " + text;
  logLines.unshift(line);
  logLines = logLines.slice(0, 28);
  if (!nations) return;
  for (const n of nations) {
    if (!text.includes(n.name)) continue;
    if (!n.history) n.history = [];
    n.history.unshift(line);
    n.history = n.history.slice(0, 36);
  }
}

let nationMap = new Map();
function reindex() {
  nationMap = new Map();
  if (!nations) return;
  for (const n of nations) nationMap.set(n.id, n);
}
function byId(id) {
  if (nationMap && nationMap.has(id)) return nationMap.get(id);
  return nations ? nations.find(n => n.id === id) : null;
}
function atPeace(n, id) { return (n.peace[id] || 0) > year; }

function makePeace(a, b, years) {
  settleOccupied(a, b);
  a.atWar.delete(b.id);
  b.atWar.delete(a.id);
  delete a.wars[b.id];
  delete b.wars[a.id];
  const until = year + years;
  a.peace[b.id] = until;
  b.peace[a.id] = until;
  if (a.grievance) a.grievance[b.id] = 15;
  if (b.grievance) b.grievance[a.id] = 15;
  disbandHosts(a.id);
  disbandHosts(b.id);
}

function seatLeader(n) {
  n.leader = { name: GIVEN[ri(GIVEN.length)], born: (year || 1000) - 24 - ri(32), took: year || 1000 };
}

function holdLand(x, y, id) {
  if (!occupy) {
    occupy = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
    occYear = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }
  if (grid[y][x] !== LAND || owner[y][x] < 0 || owner[y][x] === id) return;
  if (occupy[y][x] !== id) occYear[y][x] = year;
  occupy[y][x] = id;
}

function annexYears(n, x, y) {
  if (!n) return 12;
  if (n.gov === "Dictatorship") return 4;
  if (n.gov === "Theocracy") return belief && belief[y][x] && belief[y][x][n.faith] > 0.5 ? 4 : 9;
  if (n.gov === "Oligarchy") return 7;
  if (n.gov === "Republic") return (n.legitimacy || 0) > 46 ? 11 : 18;
  return 8;
}

function digestOccupation() {
  if (!occupy) return;
  const batch = new Map();
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const id = occupy[y][x];
    if (id < 0) continue;
    const sovId = owner[y][x];
    if (sovId < 0 || sovId === id) { occupy[y][x] = -1; continue; }
    const occ = byId(id), sov = byId(sovId);
    if (!occ || !sov || !occ.atWar.has(sov.id)) { occupy[y][x] = -1; continue; }
    if (year - (occYear[y][x] || year) < annexYears(occ, x, y)) continue;
    claim(x, y, id);
    occupy[y][x] = -1;
    const k = id + ":" + sovId;
    batch.set(k, (batch.get(k) || 0) + 1);
  }
  for (const [k, count] of batch) {
    const [a, b] = k.split(":");
    const occ = byId(+a), sov = byId(+b);
    if (occ && sov) chronicle(year, occ.name + " annexes " + count + " occupied " + (count === 1 ? "province" : "provinces") + " of " + sov.name + ".");
  }
}

function settleOccupied(a, b) {
  if (!occupy || !a || !b) return;
  let tookA = 0, tookB = 0, back = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const id = occupy[y][x];
    const own = owner[y][x];
    if (id < 0) continue;
    if (!((id === a.id && own === b.id) || (id === b.id && own === a.id))) continue;
    const holder = byId(id);
    const held = year - (occYear[y][x] || year);
    const keep = holder && (holder.gov === "Dictatorship" || (holder.gov === "Republic" ? held >= 8 && (holder.legitimacy || 0) > 42 : held >= 3));
    if (keep) {
      claim(x, y, id);
      if (id === a.id) tookA++; else tookB++;
    } else back++;
    occupy[y][x] = -1;
  }
  if (tookA) chronicle(year, a.name + " annexes " + tookA + " occupied " + (tookA === 1 ? "province" : "provinces") + " of " + b.name + " at the peace.");
  if (tookB) chronicle(year, b.name + " annexes " + tookB + " occupied " + (tookB === 1 ? "province" : "provinces") + " of " + a.name + " at the peace.");
  if (back && !tookA && !tookB) chronicle(year, "Occupied ground between " + a.name + " and " + b.name + " is handed back.");
}

function court(n) {
  if (!n.leader) seatLeader(n);
  const age = year - n.leader.born;
  if (n.gov === "Dictatorship" && (n.unrest || 0) > 34 && (n.id + year) % 7 === 0 && !n.atWar.size) {
    const prev = n.leader.name;
    seatLeader(n);
    n.legitimacy = Math.max(8, (n.legitimacy || 40) - 8);
    chronicle(year, "The dictatorship of " + n.name + " changes hands. " + prev + " is out. " + n.leader.name + " holds it.");
    return;
  }
  if (age < 66 || rnd() > (age - 62) * 0.025) return;
  const prev = n.leader.name;
  seatLeader(n);
  const line = n.gov === "Monarchy" ? prev + " dies. " + n.leader.name + " takes the crown of " + n.name + "."
    : n.gov === "Theocracy" ? prev + " dies. " + n.leader.name + " is raised over the cult in " + n.name + "."
    : n.gov === "Oligarchy" ? "The ports of " + n.name + " replace " + prev + " with " + n.leader.name + "."
    : n.gov === "Republic" ? prev + " leaves office in " + n.name + ". " + n.leader.name + " follows."
    : prev + " dies. " + n.leader.name + " takes the dictatorship of " + n.name + ".";
  n.legitimacy = Math.max(12, (n.legitimacy || 40) - (n.gov === "Monarchy" || n.gov === "Dictatorship" ? 5 : 2));
  chronicle(year, line);
}

function intrigue(n) {
  if (!n || n.pops < 8 || (n.id + year) % 4 !== 0) return;
  const price = n.gov === "Dictatorship" ? 34 : n.gov === "Republic" ? 86 : n.gov === "Theocracy" ? 52 : n.gov === "Oligarchy" ? 70 : 58;
  if ((n.treasury || 0) < price + 50) return;
  if (n.gov === "Republic" && !n.atWar.size && (n.legitimacy || 0) > 55) return;
  if (n.gov === "Oligarchy" && !n.atWar.size) return;
  let foe = null, heat = -1;
  if (n.atWar.size) foe = byId([...n.atWar][0]);
  else if (n.grievance) for (const id of Object.keys(n.grievance)) {
    if ((n.grievance[id] || 0) > heat) { heat = n.grievance[id]; foe = byId(+id); }
  }
  if (!foe || foe.id === n.id || heat < 20 && !n.atWar.size) return;
  if (n.gov === "Theocracy" && n.creed === foe.creed && !n.atWar.size) return;
  n.treasury -= price;
  const caught = rnd() < (n.gov === "Dictatorship" ? 0.16 : n.gov === "Republic" ? 0.4 : 0.28);
  if (caught) {
    if (!foe.grievance) foe.grievance = {};
    foe.grievance[n.id] = (foe.grievance[n.id] || 0) + 18;
    if (n.gov === "Republic") n.legitimacy = Math.max(8, (n.legitimacy || 40) - 7);
    chronicle(year, "A spy of " + n.name + " is taken in " + foe.name + ".");
    return;
  }
  const knife = rnd() < (n.gov === "Dictatorship" ? 0.34 : n.gov === "Theocracy" ? 0.14 : 0.07);
  if (knife) {
    if (!foe.leader) seatLeader(foe);
    const dead = foe.leader.name;
    seatLeader(foe);
    foe.legitimacy = Math.max(8, (foe.legitimacy || 40) - (foe.gov === "Dictatorship" ? 12 : 6));
    foe.unrest = (foe.unrest || 0) + (foe.gov === "Dictatorship" ? 14 : 6);
    if (foe.gov === "Republic") foe.nextVote = year;
    const turn = foe.gov === "Dictatorship" ? " The dictatorship changes hands." : foe.gov === "Republic" ? " An election is forced." : "";
    chronicle(year, dead + " of " + foe.name + " is assassinated. " + foe.leader.name + " follows." + turn);
    return;
  }
  const skim = Math.min(foe.treasury || 0, 40 + ri(50));
  foe.treasury = Math.max(0, (foe.treasury || 0) - skim);
  n.treasury = Math.min(12000, (n.treasury || 0) + Math.round(skim * 0.6));
  if ((foe.grain || 0) > 300) foe.grain *= 0.92;
  chronicle(year, n.name + " steals from the treasury of " + foe.name + ".");
}

function pactOn(n, id) { return !!(n.pact && n.pact[id] > year); }

function declareWar(n, foe, why) {
  if (!foe || n.atWar.size || foe.atWar.size || atPeace(n, foe.id)) return false;
  n.atWar.add(foe.id);
  foe.atWar.add(n.id);
  n.wars[foe.id] = { year, pops: n.pops };
  foe.wars[n.id] = { year, pops: foe.pops };
  for (const other of nations) {
    if (other.id === n.id || other.id === foe.id || !pactOn(other, foe.id)) continue;
    if (!other.grievance) other.grievance = {};
    if (!other.gnote) other.gnote = {};
    other.grievance[n.id] = (other.grievance[n.id] || 0) + 55;
    other.gnote[n.id] = "because the river trade with " + foe.name + " is cut";
  }
  chronicle(year, why);
  raiseHosts(n);
  raiseHosts(foe);
  return true;
}

function agePrice(n, next) {
  const base = [0, 420, 760, 1200, 1900][next] || 0;
  const g = n.gov;
  let mult = 1;
  if (g === "Republic") mult = 0.7;
  else if (g === "Oligarchy") mult = next === 1 || next === 3 ? 0.75 : 1.2;
  else if (g === "Dictatorship") mult = next >= 2 ? 0.85 : 1.3;
  else if (g === "Theocracy") mult = next >= 3 ? 1.5 : 1.15;
  return Math.round(base * mult);
}

function holdsKind(n, kind) {
  if (!resource) return false;
  for (const [x, y] of cellsOf(n.id)) if (resource[y][x] === kind) return true;
  return false;
}

function study(n) {
  const age = n.age || 0;
  if (age >= 4) return;
  const next = age + 1;
  const kind = [0, 1, 2, 3, 4][next];
  n.learnPrice = 0;
  if (!holdsKind(n, kind)) return;
  const price = agePrice(n, next);
  n.learnPrice = price;
  const reserve = n.atWar.size ? 180 : 60;
  if ((n.hungry || 0) > 0.12 || (n.treasury || 0) < price + reserve) return;
  n.treasury -= price;
  n.age = next;
  const line = [
    "",
    "pays " + price + " coin and learns to cut timber.",
    "pays " + price + " coin and learns to smelt ore.",
    "pays " + price + " coin and learns to draw oil.",
    "pays " + price + " coin and learns to work silicon."
  ][next];
  chronicle(year, n.name + " " + line);
}

function skirmish(n) {
  const borders = borderCounts(n);
  let foe = null, heat = 0, fid = -1;
  for (const idStr of Object.keys(borders)) {
    const id = +idStr;
    if ((borders[id] || 0) < 4) continue;
    const other = byId(id);
    if (!other || other.atWar.size || atPeace(n, id)) continue;
    const g = (n.grievance && n.grievance[id]) || 0;
    if (g >= 22 && g > heat) { heat = g; foe = other; fid = id; }
  }
  if (!foe) return;
  let cell = null, theirs = null;
  for (let y = 0; y < ROWS && !cell; y++) for (let x = 0; x < COLS; x++) {
    if (owner[y][x] !== n.id) continue;
    const hit = neighbors(x, y).find(([nx, ny]) => owner[ny][nx] === fid);
    if (hit) { cell = [x, y]; theirs = hit; }
  }
  if (!cell) return;
  const c = coldAt(cell[0], cell[1]);
  const bitter = season === 3 && c > 0.42;
  const loss = bitter ? 0.05 : 0.022;
  pop[cell[1]][cell[0]] = Math.max(120, Math.round((pop[cell[1]][cell[0]] || 0) * (1 - loss)));
  if (theirs) pop[theirs[1]][theirs[0]] = Math.max(120, Math.round((pop[theirs[1]][theirs[0]] || 0) * (1 - loss)));
  if ((foe.grain || 0) > 240) {
    const take = Math.min(360, (foe.grain || 0) * 0.06);
    foe.grain -= take;
    n.grain = (n.grain || 0) + take * 0.4;
  }
  if (!n.grievance) n.grievance = {};
  n.grievance[fid] = Math.min(96, heat + (bitter ? 7 : 3));
  chronicle(year, bitter
    ? "A winter skirmish on the border of " + n.name + " and " + foe.name + ". The cold takes more than the fighting."
    : "A skirmish on the border of " + n.name + " and " + foe.name + ".");
}

function cellsOf(id) {
  const cells = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (owner[y][x] === id) cells.push([x, y]);
  return cells;
}

function components(cells) {
  const set = new Set(cells.map(([x, y]) => key(x, y)));
  const seen = new Set();
  const comps = [];
  for (const [x, y] of cells) {
    const k0 = key(x, y);
    if (seen.has(k0)) continue;
    const comp = [];
    const q = [[x, y]];
    seen.add(k0);
    while (q.length) {
      const [cx, cy] = q.shift();
      comp.push([cx, cy]);
      for (const [nx, ny] of neighbors(cx, cy)) {
        const k = key(nx, ny);
        if (!seen.has(k) && set.has(k)) { seen.add(k); q.push([nx, ny]); }
      }
    }
    comps.push(comp);
  }
  comps.sort((a, b) => b.length - a.length);
  return comps;
}

function recount() {
  for (const n of nations) n.pops = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const id = owner[y][x];
    if (id >= 0) { const n = byId(id); if (n) n.pops++; }
  }
  nations = nations.filter(n => n.pops > 0);
}

function endureWinter() {
  if (ration) {
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== LAND) continue;
      const ratio = ration[y][x];
      if (!(ratio < 0.96)) continue;
      const gap = 0.96 - ratio;
      let loss = gap * 0.14;
      const c = coldAt(x, y);
      if (c > 0.45) loss *= 1 + (c - 0.45) * 1.6;
      pop[y][x] = Math.max(120, Math.round((pop[y][x] || 0) * (1 - Math.min(0.42, loss))));
    }
  }
  if (!units) return;
  const told = new Set();
  for (const u of units) {
    if (u.kind !== "host") continue;
    const c = coldAt(u.x, u.y);
    if (c < 0.42) continue;
    const fed = u.fed == null || u.fed > 0.72;
    const stocked = ((pop[u.y] && pop[u.y][u.x]) || 0) > 800;
    if (fed && stocked && c < 0.68) continue;
    const bite = Math.min(0.28, (c - 0.38) * (fed && stocked ? 0.12 : 0.34));
    u.men = Math.round((u.men || 0) * (1 - bite));
    const n = byId(u.owner);
    if (n && bite > 0.06 && !told.has(n.id)) {
      told.add(n.id);
      chronicle(year, "Winter kills men of " + n.name + "'s army. It is cold there, and the grain is thin.");
    }
  }
  units = units.filter(u => {
    if (u.kind !== "host" || (u.men || 0) >= 40) return true;
    if (owner[u.y] && owner[u.y][u.x] === u.owner && pop[u.y]) pop[u.y][u.x] += u.men || 0;
    return false;
  });
}

function campaign() {
  for (const n of nations.slice()) {
    if (!nations.includes(n) || !n.pops) continue;
    if (!n.atWar.size) {
      if ((n.id + year) % 4 === season) {
        skirmish(n);
        considerWar(n);
      }
      continue;
    }
    const foe = byId([...n.atWar][0]);
    if (!foe) continue;
    if (season === 0) {
      const cost = 16 + unitCount(n.id, "host") * 8;
      if ((n.treasury || 0) >= cost) n.treasury -= cost;
      else n.treasury = 0;
      const grabs = (n.people || 0) >= (foe.people || 1) * 0.9 ? 2 : 1;
      n.grabsLeft = grabs;
      n.fight1 = (n.id + year) % 4;
      n.fight2 = grabs > 1 ? (n.fight1 + 2) % 4 : -1;
    }
    if ((n.grabsLeft || 0) > 0 && (season === n.fight1 || season === n.fight2)) {
      warPush(n);
      n.grabsLeft--;
    }
  }
}

function step() {
  if (season === 0) {
    year++;
    reindex();
    climate();
    demography();
  } else if (season === 2) {
    reindex();
    feed();
    extractLevy();
    immigrate();
    culture();
    growCities();
  } else if (season === 3) {
    endureWinter();
    recount();
    const claimants = nations.slice();
    for (const n of claimants) {
      if (!nations.includes(n) || n.pops === 0) continue;
      settleCapital(n);
      measure(n);
      if (!n.atWar.size) grow(n);
      study(n);
      court(n);
      intrigue(n);
      considerCoup(n);
    }
    digestOccupation();
    for (const n of nations.slice()) {
      if (!nations.includes(n) || !n.pops) continue;
      considerVote(n);
      considerVoyage(n);
    }
    considerPacts();
    settleWars();
    for (const n of nations.slice()) considerCollapse(n);
    nations = nations.filter(n => n.pops > 0);
    reindex();
    for (const n of nations.slice()) considerRevolt(n);
    keepWhole();
    absorbTiny();
    if (year % 35 === 0) seedEmptyContinent();
    recount();
    for (const n of nations) holdSeat(n);
    recount();
    reindex();
  }
  campaign();
  if (season === 1) moveUnits();
  season = (season + 1) % 4;
  paintClock();
}

const TIERS = [
  { id: "village", at: 0 },
  { id: "town", at: 1700 },
  { id: "city", at: 4200 },
  { id: "great city", at: 8000 },
  { id: "metropolis", at: 12000 }
];
function tierAt(rank) {
  const i = TIERS.findIndex(t => t.id === rank);
  return i < 0 ? 0 : i;
}
function tierFor(souls, current) {
  let i = 0;
  for (let k = TIERS.length - 1; k >= 0; k--) if (souls >= TIERS[k].at) { i = k; break; }
  const cur = tierAt(current);
  if (current && i < cur && souls >= TIERS[cur].at * 0.82) return cur;
  return i;
}
function settleRanks() {
  if (!cities || !pop) return;
  for (const c of cities) {
    const souls = pop[c.y] && pop[c.y][c.x] || 0;
    const next = TIERS[tierFor(souls, c.rank)].id;
    if (next === c.rank) continue;
    const up = tierAt(next) > tierAt(c.rank);
    c.rank = next;
    if (!up || tierAt(next) < 2) continue;
    const realm = owner[c.y] && byId(owner[c.y][c.x]);
    const line = next === "city" ? " is a city now."
      : next === "great city" ? " has become a great city."
      : " has become a metropolis.";
    if (realm) chronicle(year, c.name + line);
  }
}

function placeCity(x, y, name, rank) {
  let c = cities.find(c => c.x === x && c.y === y);
  if (c) {
    if (rank === "city" && c.rank === "town") c.rank = "city";
    return c;
  }
  c = { id: nextCity++, name, x, y, rank: rank || "town" };
  cities.push(c);
  if (pop && pop[y] && rank === "city" && (pop[y][x] || 0) < 1800) pop[y][x] = 1800 + ri(500);
  return c;
}

function citiesIn(cells) {
  const set = new Set(cells.map(([x, y]) => key(x, y)));
  return cities.filter(c => set.has(key(c.x, c.y)));
}

function siteKind(x, y) {
  const onRiver = river && river[y][x] > 11;
  if (onRiver && coast && coast[y][x]) return "mouth";
  if (onRiver) return "river";
  if (coast && coast[y][x]) return "coast";
  return "inland";
}

function capacity(x, y) {
  const id = owner[y][x];
  const n = id >= 0 ? byId(id) : null;
  const kind = siteKind(x, y);
  let K = 1000;
  if (kind === "river") K += 620;
  if (kind === "mouth") K += 480;
  if (kind === "coast") K += 140;
  if (elev && elev[y][x] > 0.58) K -= 280;
  const city = cities.find(c => c.x === x && c.y === y);
  if (n) {
    const R = rules(n.gov);
    const d = n.capital ? hypot(x, y, n.capital) : 9;
    if (d < 6) K += 180 * R.heart;
    if (n.gov === "Oligarchy") K *= kind === "inland" ? 0.7 : kind === "mouth" || kind === "coast" ? 1.24 : 1.05;
    if (n.gov === "Republic" && kind === "inland") K *= 0.82;
    if (n.gov === "Theocracy" && belief && belief[y] && belief[y][x] && belief[y][x][n.faith] < 0.34) K *= 0.76;
    if ((n.legitimacy || 60) < 40) K *= 0.78;
    if ((n.treasury || 0) < 40) K *= 0.88;
    else if ((n.treasury || 0) > 700) K *= 1.04;
    if (resource && resource[y][x] === 1) K += 160;
    if (resource && resource[y][x] === 2) K += 70;
    if (n.pacts) K *= 1 + Math.min(2, n.pacts) * 0.05;
    if (n.atWar.size) {
      const edge = neighbors(x, y).some(([nx, ny]) => owner[ny][nx] >= 0 && owner[ny][nx] !== id);
      K *= edge ? 0.58 : 0.9;
    }
  }
  if (city) {
    const seat = n && n.seat === city.id;
    const caps = [2400, 4800, 9000, 14000, 20000];
    K = Math.max(K, caps[tierAt(city.rank)] * (seat ? 1.12 : 1));
  }
  return Math.max(380, Math.round(K));
}

function growCities() {
  if (!pop || !owner) return;
  const founded = new Set();
  const sites = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] !== LAND || owner[y][x] < 0) continue;
    if (cities.some(c => c.x === x && c.y === y)) continue;
    const realm = byId(owner[y][x]);
    if (!realm || realm.atWar.size || founded.has(realm.id)) continue;
    const kind = siteKind(x, y);
    const d = realm.capital ? hypot(x, y, realm.capital) : 9;
    if (kind === "inland" && (d > 5 || (pop[y][x] || 0) < 1500)) continue;
    const gap = kind === "mouth" || kind === "river" ? 6 : 8;
    if (cities.some(c => Math.hypot(c.x - x, c.y - y) < gap)) continue;
    let hinter = 0, surplus = 0, cells = 0;
    for (let yy = y - 4; yy <= y + 4; yy++) for (let xx = x - 4; xx <= x + 4; xx++) {
      if (yy < 0 || xx < 0 || yy >= ROWS || xx >= COLS || grid[yy][xx] !== LAND || owner[yy][xx] !== realm.id) continue;
      if (Math.hypot(xx - x, yy - y) > 4) continue;
      hinter += pop[yy][xx] || 0;
      surplus += Math.max(0, (pop[yy][xx] || 0) - capacity(xx, yy) * 0.72);
      if (resource && resource[yy][xx]) surplus += 80;
      cells++;
    }
    if (hinter < 7500 || surplus < 900) continue;
    const score = (kind === "mouth" ? 6 : kind === "river" ? 4 : kind === "coast" ? 2.5 : 1) + surplus / 4000;
    sites.push({ x, y, realm, kind, score });
  }
  sites.sort((a, b) => b.score - a.score);
  for (const s of sites) {
    if (founded.has(s.realm.id)) continue;
    const owned = cities.filter(c => owner[c.y][c.x] === s.realm.id).length;
    if (owned > Math.max(1, s.realm.pops / 40)) continue;
    if ((s.realm.treasury || 0) < 20) continue;
    s.realm.treasury -= 15;
    const town = placeCity(s.x, s.y, nameCity(), "town");
    const why = s.kind === "mouth" ? "where the river meets the sea"
      : s.kind === "river" ? "on the river, where the country can spare the people"
      : s.kind === "coast" ? "on the coast, fed by the country behind it"
      : "to market the country around the capital";
    chronicle(year, town.name + " is chartered in " + s.realm.name + ", " + why + ".");
    founded.add(s.realm.id);
  }
  settleRanks();
}

function relocateSeat(n, lost, cells) {
  const set = new Set(cells.map(([x, y]) => key(x, y)));
  const taker = lost ? byId(owner[lost.y][lost.x]) : null;
  if (lost && pop[lost.y]) pop[lost.y][lost.x] = Math.max(160, pop[lost.y][lost.x] || 0);
  const shock = n.gov === "Dictatorship" ? 40 : n.gov === "Monarchy" || n.gov === "Theocracy" ? 36 : 28;
  n.legitimacy = Math.max(6, (n.legitimacy || 40) - shock);
  n.stability = Math.max(5, (n.stability || 30) - 24);
  if (taker && (n.treasury || 0) > 0) {
    const loot = Math.round(n.treasury * (n.gov === "Monarchy" || n.gov === "Dictatorship" ? 0.22 : 0.14));
    n.treasury -= loot;
    taker.treasury = Math.min(12000, (taker.treasury || 0) + loot);
  }
  if (cells.length < 16) {
    chronicle(year, (taker ? taker.name + " takes " + (lost ? lost.name : "the capital") + ". " : "") + n.name + " does not outlive its capital.");
    if (taker) for (const [x, y] of cells) if (owner[y][x] === n.id) claim(x, y, taker.id);
    else annex(cells);
    n.pops = 0;
    return;
  }
  const mine = citiesIn(cells).filter(c => !lost || c.id !== lost.id);
  const far = lost ? mine.filter(c => Math.hypot(c.x - lost.x, c.y - lost.y) > 2.4) : mine;
  const pool = far.length ? far : mine;
  pool.sort((a, b) => (tierAt(b.rank) - tierAt(a.rank)) || ((pop[b.y][b.x] || 0) - (pop[a.y][a.x] || 0)));
  if (pool.length) {
    const next = pool[0];
    if (tierAt(next.rank) < 1) next.rank = "town";
    n.seat = next.id;
    n.capital = { x: next.x, y: next.y };
    chronicle(year, (taker && lost ? taker.name + " takes " + lost.name + ", capital of " + n.name + ". " : "The court of " + n.name + " is displaced. ") + "It removes to " + next.name + ".");
    return;
  }
  let best = cells[0], bestS = -1;
  const distant = lost ? cells.filter(([x, y]) => Math.hypot(x - lost.x, y - lost.y) > 4) : cells;
  for (const [x, y] of (distant.length ? distant : cells)) {
    const s = pop[y][x] || 0;
    if (s > bestS && set.has(key(x, y))) { bestS = s; best = [x, y]; }
  }
  const town = placeCity(best[0], best[1], nameCity(), "town");
  n.seat = town.id;
  n.capital = { x: best[0], y: best[1] };
  n.legitimacy = Math.max(6, n.legitimacy - 8);
  chronicle(year, (taker && lost ? taker.name + " takes " + lost.name + ", capital of " + n.name + ". " : "") + "There is no other city. A thin court sits at " + town.name + ".");
}

function holdSeat(n) {
  if (!nations.includes(n)) return;
  const seat = cities.find(c => c.id === n.seat);
  if (seat && owner[seat.y] && owner[seat.y][seat.x] === n.id) {
    n.capital = { x: seat.x, y: seat.y };
    return;
  }
  const cells = cellsOf(n.id);
  if (!cells.length) return;
  relocateSeat(n, seat, cells);
}

function settleCapital(n) { holdSeat(n); }

function taxRate(n) {
  if (!n) return 0.16;
  if (n.gov === "Dictatorship") return 0.34;
  if (n.gov === "Monarchy") return 0.2;
  if (n.gov === "Theocracy") return 0.16;
  if (n.gov === "Oligarchy") return 0.12;
  return 0.1;
}

function extractLevy() {
  for (const n of nations) { n.cutTimber = 0; n.dugOre = 0; n.drawnOil = 0; n.cutSilicon = 0; n.taxTake = 0; }
  if (resource) {
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const kind = resource[y][x];
      if (!kind || grid[y][x] !== LAND || owner[y][x] < 0) continue;
      const n = byId(owner[y][x]);
      const souls = (pop[y] && pop[y][x]) || 0;
      if (!n || souls < 280) continue;
      let work = Math.min(1, souls / 2000);
      if (n.parched && basin && basin[y][x] && kind === 1) work *= 0.5;
      const front = neighbors(x, y).some(([nx, ny]) => owner[ny][nx] >= 0 && owner[ny][nx] !== n.id);
      if (front) work *= 0.55;
      const onWater = (river && river[y][x] > 8) || (coast && coast[y][x]);
      const town = cities.some(c => c.x === x && c.y === y || (owner[c.y] && owner[c.y][c.x] === n.id && Math.hypot(c.x - x, c.y - y) <= 3));
      work *= onWater || cities.some(c => c.x === x && c.y === y) ? 1 : town ? 0.7 : 0.4;
      if (n.gov === "Theocracy" && belief && belief[y][x] && (belief[y][x][n.faith] || 0) < 0.4) work *= 0.45;
      let cutKind = 0, cutAmt = 0;
      if (kind === 1 && (n.age || 0) >= 1) { cutAmt = 7 * work; cutKind = 1; }
      else if (kind === 2 && (n.age || 0) >= 2) { cutAmt = 4.5 * work; cutKind = 2; }
      else if (kind === 3 && (n.age || 0) >= 3) { cutAmt = 3.2 * work; cutKind = 3; }
      else if (kind === 4 && (n.age || 0) >= 4) { cutAmt = 1.4 * work; cutKind = 4; }
      if (!cutKind) continue;
      const occId = occupy && occupy[y][x];
      const give = (who, amt, k) => {
        if (!who || amt <= 0 || (who.age || 0) < k) return;
        if (k === 1) { who.timber = (who.timber || 0) + amt; who.cutTimber += amt; }
        else if (k === 2) { who.ore = (who.ore || 0) + amt; who.dugOre += amt; }
        else if (k === 3) { who.oil = (who.oil || 0) + amt; who.drawnOil = (who.drawnOil || 0) + amt; }
        else { who.silicon = (who.silicon || 0) + amt; who.cutSilicon = (who.cutSilicon || 0) + amt; }
      };
      if (occId >= 0 && occId !== n.id) {
        give(byId(occId), cutAmt * 0.55, cutKind);
        give(n, cutAmt * 0.2, cutKind);
      } else give(n, cutAmt, cutKind);
    }
  }
  for (const n of nations) {
    n.timber = Math.min(5000, n.timber || 0);
    n.ore = Math.min(3500, n.ore || 0);
    n.oil = Math.min(2000, n.oil || 0);
    n.silicon = Math.min(600, n.silicon || 0);
    const duty = (n.grain || 0) / (n.gov === "Oligarchy" || n.gov === "Republic" ? 50 : 95);
    const base = (n.cutTimber || 0) * 2 + (n.dugOre || 0) * 3.2 + (n.drawnOil || 0) * 4 + (n.cutSilicon || 0) * 8 + duty;
    n.taxTake = Math.round(base * taxRate(n));
    n.treasury = Math.min(12000, (n.treasury || 0) + n.taxTake);
    if (n.gov === "Dictatorship") n.unrest = (n.unrest || 0) + ((n.hungry || 0) > 0.06 ? 0.9 : 0.15);
    else if (n.gov === "Theocracy" && (n.cultShare || 0) < 0.45) n.unrest = (n.unrest || 0) + 0.4;
    else if (n.gov === "Republic") n.unrest = Math.max(0, (n.unrest || 0) - 0.15);
  }
}

function measure(n) {
  const cells = cellsOf(n.id);
  n.pops = cells.length;
  if (!cells.length) { n.reach = 0; n.people = 0; return; }
  let maxD = 0, sum = 0, sx = 0, sy = 0, people = 0, shores = 0, wealth = 0;
  const believers = [0, 0, 0];
  const R = rules(n.gov);
  n.rivers = new Set();
  for (const [x, y] of cells) {
    const d = hypot(x, y, n.capital);
    if (d > maxD) maxD = d;
    sum += d;
    sx += x;
    sy += y;
    const souls = (pop && pop[y][x]) || 0;
    people += souls;
    const shares = belief && belief[y][x];
    if (shares) for (let i = 0; i < 3; i++) believers[i] += souls * shares[i];
    const sea = coast && coast[y] && coast[y][x];
    if (sea) shores++;
    if (riverSys && riverSys[y][x]) n.rivers.add(riverSys[y][x]);
    const mouth = sea && river && river[y][x] > 11;
    let w = souls / 800;
    if (sea) w *= R.sea;
    if (river && river[y][x] > 11) w *= 1.14;
    if (mouth) w *= R.trade > 0.5 ? 1.32 : 1.1;
    if (d < 5) w *= R.heart;
    if (souls < 1500) w *= R.poor;
    wealth += w;
  }
  n.reach = maxD;
  n.people = people;
  n.coasts = shores;
  let pacts = 0;
  if (n.pact) for (const id of Object.keys(n.pact)) if (n.pact[id] > year) pacts++;
  n.pacts = pacts;
  wealth *= 1 + pacts * 0.07;
  wealth += (n.grain || 0) / 420;
  wealth += Math.min(90, (n.treasury || 0) / 35);
  wealth += Math.min(36, (n.timber || 0) / 35);
  wealth += Math.min(36, (n.ore || 0) / 18);
  if ((n.hungry || 0) > 0.04) wealth *= 1 - Math.min(0.45, n.hungry);
  n.wealth = Math.round(wealth);
  n.avg = sum / cells.length;
  n.label = { x: sx / cells.length, y: sy / cells.length };
  let top = 0;
  for (let i = 1; i < 3; i++) if (believers[i] > believers[top]) top = i;
  n.creed = top;
  n.creedShare = people ? believers[top] / people : 0;
  n.cultShare = people ? believers[n.faith] / people : 0;
  n.believers = believers;
  n.homo = n.creedShare;
  let warYears = 0;
  if (n.atWar.size) {
    const foe = [...n.atWar][0];
    warYears = year - ((n.wars[foe] && n.wars[foe].year) || year);
  }
  const rich = wealth / Math.max(1, cells.length);
  let target = 60;
  if (n.gov === "Monarchy") target = 80 - Math.max(0, n.avg - 9) * 2.4;
  else if (n.gov === "Republic") target = 40 + Math.min(42, rich * 7);
  else if (n.gov === "Oligarchy") target = 36 + Math.min(28, (shores / cells.length) * 90) + Math.min(18, rich * 3);
  else if (n.gov === "Dictatorship") target = 70 - Math.min(28, warYears * 1.1) - (n.atWar.size ? 8 : 0);
  else if (n.gov === "Theocracy") target = 32 + n.cultShare * 62;
  if ((n.hungry || 0) > 0.06) target -= n.hungry * (n.gov === "Republic" ? 40 : n.gov === "Oligarchy" ? 16 : 26);
  if ((n.treasury || 0) < 40) target -= n.gov === "Republic" ? 3 : 10;
  else if ((n.treasury || 0) > 600 && (n.gov === "Monarchy" || n.gov === "Dictatorship")) target += 6;
  target = Math.max(12, Math.min(94, target));
  n.legitimacy = (n.legitimacy == null ? 68 : n.legitimacy) + (target - n.legitimacy) * 0.08;
  n.stability += (n.legitimacy - n.stability) * 0.06;
  if (n.atWar.size) n.stability -= n.gov === "Dictatorship" ? 0.45 : 0.22;
  n.stability = Math.max(4, Math.min(100, n.stability));
  learnSea(n);
  weighParties(n);
}

function emptyFrontier(n) {
  const moves = [];
  const seen = new Set();
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (owner[y][x] !== n.id) continue;
    for (const [tx, ty] of neighbors(x, y)) {
      const k = key(tx, ty);
      if (seen.has(k) || grid[ty][tx] !== LAND || owner[ty][tx] >= 0) continue;
      seen.add(k);
      let friends = 0;
      for (const [ax, ay] of neighbors(tx, ty)) if (owner[ay][ax] === n.id) friends++;
      moves.push({ tx, ty, d: hypot(tx, ty, n.capital), friends });
    }
  }
  return moves;
}

function pourFaith(x, y, shares, already, arriving) {
  if (!belief || !belief[y] || !belief[y][x] || !shares || arriving <= 0) return;
  const tot = already + arriving || 1;
  belief[y][x] = norm3([0, 1, 2].map(i => (belief[y][x][i] || 0) * already + (shares[i] || 0) * arriving));
}

function climate() {
  if (!dry) dry = {};
  for (const k of Object.keys(dry)) if (dry[k] <= year) delete dry[k];
  for (const n of nations) n.parched = false;
  if (!riverSys || rnd() > 0.04) {
    markParched();
    return;
  }
  const options = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (riverSys[y][x] && owner[y][x] >= 0) options.push(riverSys[y][x]);
  }
  if (options.length) {
    const sys = options[ri(options.length)];
    if (!(dry[sys] > year)) {
      dry[sys] = year + 3 + ri(4);
      let who = null;
      for (let y = 0; y < ROWS && !who; y++) for (let x = 0; x < COLS; x++) {
        if (basin && basin[y][x] === sys && owner[y][x] >= 0) { who = byId(owner[y][x]); break; }
      }
      chronicle(year, "Drought. The country that feeds " + (who ? who.name : "the river") + " yields almost nothing.");
    }
  }
  markParched();
}

function markParched() {
  if (!basin || !dry) return;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (!(dry[basin[y][x]] > year) || owner[y][x] < 0) continue;
    const n = byId(owner[y][x]);
    if (n) n.parched = true;
  }
}

function settleFrontier(n, x, y) {
  const hungry = n.hungry || 0;
  const forced = n.gov === "Dictatorship" && hungry <= 0.14 && (n.legitimacy || 0) > 48;
  if (hungry > 0.2 && !forced) return false;
  if (n.gov === "Monarchy" && n.capital && hypot(x, y, n.capital) > Math.max(26, (n.reach || 8) + 10)) return false;
  let donor = null, best = 0;
  for (const [nx, ny] of neighbors(x, y)) {
    if (owner[ny][nx] !== n.id) continue;
    const souls = pop[ny][nx] || 0;
    if (souls > best) { best = souls; donor = [nx, ny]; }
  }
  if (!donor || best < (forced ? 420 : 520)) return false;
  const frac = n.gov === "Dictatorship" ? 0.16 : n.gov === "Republic" ? 0.055 : n.gov === "Oligarchy" ? 0.07 : 0.09;
  let move = Math.round(best * frac);
  move = Math.max(30, Math.min(best - 380, move));
  if (move < 30) return false;
  const locals = pop[y][x] || 0;
  let flight = n.gov === "Republic" ? 0.1 : n.gov === "Dictatorship" ? 0.28 : 0.2;
  if (n.gov === "Theocracy" && belief && belief[y] && belief[y][x] && belief[y][x][n.faith] < 0.4) flight = 0.5;
  const stayed = Math.round(locals * (1 - flight));
  pop[donor[1]][donor[0]] = best - move;
  pop[y][x] = Math.max(60, stayed + move);
  if (belief && belief[y] && belief[y][x] && belief[donor[1]][donor[0]]) pourFaith(x, y, belief[donor[1]][donor[0]], stayed, move);
  claim(x, y, n.id);
  if (forced) n.unrest = (n.unrest || 0) + 1.8;
  else if (n.gov === "Theocracy" && belief[y][x] && belief[y][x][n.faith] < 0.35) n.unrest = (n.unrest || 0) + 1.3;
  else if (n.gov === "Republic" && belief[y][x] && faithTop(belief[y][x]) !== (n.creed || 0)) n.unrest = (n.unrest || 0) + 0.45;
  return true;
}

function faithTop(shares) {
  if (!shares) return 0;
  let t = 0;
  for (let i = 1; i < 3; i++) if ((shares[i] || 0) > (shares[t] || 0)) t = i;
  return t;
}

function admits(n, x, y, shares) {
  if (!n || (n.hungry || 0) > 0.1 || n.atWar.size) return false;
  if (n.gov === "Monarchy" || n.gov === "Dictatorship") return false;
  if (n.gov === "Theocracy") return !!(shares && shares[n.faith] > 0.48);
  if (n.gov === "Oligarchy") return !!((coast && coast[y][x]) || (river && river[y][x] >= 12));
  return n.gov === "Republic";
}

function immigrate() {
  if (!pop || !belief) return;
  for (const n of nations) {
    if ((n.hungry || 0) < 0.08) continue;
    let budget = Math.round((n.people || 2000) * 0.012 * ((n.treasury || 0) < 40 ? 1.35 : 1));
    for (let y = 0; y < ROWS && budget > 20; y++) for (let x = 0; x < COLS && budget > 20; x++) {
      if (owner[y][x] !== n.id || (pop[y][x] || 0) < 480) continue;
      for (const [nx, ny] of neighbors(x, y)) {
        if (budget <= 20) break;
        const dest = owner[ny][nx];
        const move = Math.min(budget, Math.round((pop[y][x] || 0) * 0.035), 45);
        if (move < 12) continue;
        if (dest < 0 && grid[ny][nx] === LAND) {
          const already = pop[ny][nx] || 0;
          pop[y][x] -= move;
          pop[ny][nx] = already + move;
          pourFaith(nx, ny, belief[y][x], already, move);
          budget -= move;
        } else if (dest >= 0 && dest !== n.id && admits(byId(dest), nx, ny, belief[y][x])) {
          const host = byId(dest);
          const already = pop[ny][nx] || 0;
          pop[y][x] -= move;
          pop[ny][nx] = already + move;
          pourFaith(nx, ny, belief[y][x], already, move);
          if (host && faithTop(belief[y][x]) !== (host.creed || 0)) host.unrest = (host.unrest || 0) + 0.7;
          budget -= move;
        }
      }
    }
  }
  for (const c of cities) {
    const id = owner[c.y][c.x];
    const host = id >= 0 ? byId(id) : null;
    if (!host || !admits(host, c.x, c.y, belief[c.y][c.x])) continue;
    let budget = host.gov === "Republic" ? 70 : 40;
    if ((host.treasury || 0) > 280 && (host.hungry || 0) < 0.04) budget += 30;
    if ((host.treasury || 0) < 30) budget = Math.round(budget * 0.45);
    for (let y = Math.max(0, c.y - 2); y <= Math.min(ROWS - 1, c.y + 2) && budget > 15; y++) {
      for (let x = Math.max(0, c.x - 2); x <= Math.min(COLS - 1, c.x + 2) && budget > 15; x++) {
        if (grid[y][x] !== LAND || owner[y][x] === id) continue;
        const srcN = owner[y][x] >= 0 ? byId(owner[y][x]) : null;
        const crowded = (pop[y][x] || 0) > capacity(x, y);
        if (srcN && (srcN.hungry || 0) < 0.05 && !crowded) continue;
        if ((pop[y][x] || 0) < 400) continue;
        if (!admits(host, c.x, c.y, belief[y][x])) continue;
        const move = Math.min(budget, 28, Math.round((pop[y][x] || 0) * 0.04));
        if (move < 10) continue;
        const already = pop[c.y][c.x] || 0;
        pop[y][x] -= move;
        pop[c.y][c.x] = already + move;
        pourFaith(c.x, c.y, belief[y][x], already, move);
        const foreign = faithTop(belief[y][x]) !== (host.creed || 0);
        if (foreign) host.unrest = (host.unrest || 0) + 0.55;
        budget -= move;
        if (foreign && (year + c.id) % 19 === 0) chronicle(year, c.name + " takes in outsiders. " + host.name + " is less of one mind for it.");
      }
    }
  }
}

function grow(n) {
  if ((n.hungry || 0) > 0.2) return;
  if ((n.treasury || 0) < 12) return;
  let moves = emptyFrontier(n);
  if (!moves.length) return;
  const reach = Math.max(3, n.reach || 3);
  const R = rules(n.gov);
  const bx = Math.cos(n.bearing || 0), by = Math.sin(n.bearing || 0);
  for (const m of moves) {
    let dx = m.tx - n.capital.x;
    if (dx > COLS / 2) dx -= COLS;
    if (dx < -COLS / 2) dx += COLS;
    const dy = m.ty - n.capital.y;
    const len = Math.hypot(dx, dy) || 1;
    const align = (dx / len) * bx + (dy / len) * by;
    const stretch = m.d > reach + 8 ? -1.4 : 0;
    const sea = coast && coast[m.ty][m.tx] ? R.trade * 1.2 : 0;
    const good = resource && resource[m.ty][m.tx];
    const wood = good === 1 ? (n.gov === "Oligarchy" ? 1.8 : 1.15) : 0;
    const metal = good === 2 ? (n.gov === "Dictatorship" ? 1.8 : 1.05) : 0;
    const near = m.d < 8 ? R.hold * 1.2 : 0;
    m.score = m.friends * 1.4 + align * (n.drive || 0.5) + stretch + sea + wood + metal + near + rnd();
  }
  moves.sort((a, b) => b.score - a.score);
  let take = (n.hungry || 0) < 0.08 ? 2 : 1;
  if ((n.legitimacy || 60) < 36) take = 1;
  take = Math.min(moves.length, take);
  for (let i = 0; i < take; i++) {
    const m = moves[i];
    if (owner[m.ty][m.tx] >= 0) continue;
    n.treasury = Math.max(0, (n.treasury || 0) - 6);
    settleFrontier(n, m.tx, m.ty);
  }
}

function borderCounts(n) {
  const counts = {};
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (owner[y][x] !== n.id) continue;
    for (const [tx, ty] of neighbors(x, y)) {
      const o = owner[ty][tx];
      if (o >= 0 && o !== n.id) counts[o] = (counts[o] || 0) + 1;
    }
  }
  return counts;
}

function lostBorder(n, foeId) {
  let c = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (owner[y][x] !== foeId || prev[y][x] !== n.id) continue;
    if (neighbors(x, y).some(([nx, ny]) => owner[ny][nx] === n.id)) c++;
  }
  return c;
}

function culture() {
  if (!belief) return;
  const next = belief.map(row => row.map(s => s ? s.slice() : null));
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== LAND || !belief[y][x]) continue;
      const souls = Math.max(160, (pop && pop[y][x]) || 400);
      const mix = [0, 0, 0];
      for (let i = 0; i < 3; i++) mix[i] = belief[y][x][i] * souls;
      let mass = souls;
      for (const [nx, ny] of neighbors(x, y)) {
        if (grid[ny][nx] !== LAND || !belief[ny][nx]) continue;
        const reach = Math.sqrt(Math.max(80, (pop && pop[ny][nx]) || 200)) * 0.11;
        for (let i = 0; i < 3; i++) mix[i] += belief[ny][nx][i] * reach;
        mass += reach;
      }
      const id = owner[y][x];
      const realm = id >= 0 ? byId(id) : null;
      if (realm && realm.gov === "Theocracy") {
        const d = realm.capital ? hypot(x, y, realm.capital) : 12;
        const town = cities.some(c => c.x === x && c.y === y);
        let pull = souls * (town ? 0.07 : 0.028) * (0.6 + (realm.legitimacy || 50) / 220);
        if (d > 16) pull *= 0.4;
        if ((belief[y][x][realm.faith] || 0) > 0.74) pull *= 0.25;
        mix[realm.faith] += pull;
        mass += pull;
      }
      const pulled = norm3(mix.map(v => v / mass));
      next[y][x] = norm3([0, 1, 2].map(i => belief[y][x][i] * 0.84 + pulled[i] * 0.16));
    }
  }
  belief = next;
}

function borderCult(n, otherId) {
  let people = 0, cult = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (owner[y][x] !== otherId || !belief[y][x]) continue;
    if (!neighbors(x, y).some(([nx, ny]) => owner[ny][nx] === n.id)) continue;
    const souls = (pop[y] && pop[y][x]) || 0;
    people += souls;
    cult += souls * (belief[y][x][n.faith] || 0);
  }
  return people ? cult / people : 0;
}

function considerWar(n) {
  if (n.atWar.size) return;
  if (!n.grievance) n.grievance = {};
  if (!n.gnote) n.gnote = {};
  const open = emptyFrontier(n).length;
  const counts = borderCounts(n);
  let best = null;
  for (const id of Object.keys(counts)) {
    const other = byId(Number(id));
    const border = counts[id];
    if (!other || border < 5) {
      n.grievance[id] = Math.max(0, (n.grievance[id] || 0) - 8);
      continue;
    }
    if (other.atWar.size || atPeace(n, other.id)) continue;
    if (pactOn(n, other.id)) {
      const reclaim = lostBorder(n, other.id);
      if (reclaim < 4) {
        n.grievance[id] = Math.max(0, (n.grievance[id] || 0) - 12);
        continue;
      }
      delete n.pact[other.id];
      if (other.pact) delete other.pact[n.id];
      chronicle(year, n.name + " breaks the trade peace with " + other.name + ".");
    }
    const R = rules(n.gov);
    const reasons = [];
    const reclaim = lostBorder(n, other.id);
    if (reclaim >= 2) reasons.push([24 + reclaim, "to recover land it lost"]);
    if (open < 5 && (n.people || 0) >= (other.people || 1) * 0.78) {
      reasons.push([4 + 7 * R.bully, "because no empty land remains"]);
    }
    if (R.bully > 0.6 && border >= 7 && (n.legitimacy || 0) > 48 && (n.people || 0) > (other.people || 1) * 1.12) {
      reasons.push([7 + 6 * R.bully, "because the neighbor is weaker"]);
    }
    if (R.trade > 0.7 && (other.wealth || 0) > (n.wealth || 0) * 1.1 && (other.coasts || 0) > (n.coasts || 0)) {
      reasons.push([7 + 6 * R.trade, "to take its ports and trade"]);
    }
    if ((n.ore || 0) < 24 && (other.ore || 0) > 70 && border >= 6) reasons.push([9 + 4 * R.bully, "to take the ore"]);
    else if ((n.timber || 0) < 36 && (other.timber || 0) > 110 && border >= 6) reasons.push([8 + 3 * R.bully, "to take the timber"]);
    if (n.gov === "Theocracy" && (n.cultShare || 0) > 0.4 && border >= 4) {
      const edge = borderCult(n, other.id);
      const abroad = other.people ? ((other.believers && other.believers[n.faith]) || 0) / other.people : 0;
      if (edge < 0.38) reasons.push([18 + (0.38 - edge) * 20, "because the neighbor does not keep the cult"]);
      else if (abroad > 0.16 && abroad < 0.8) reasons.push([15 + abroad * 12, "to bring the cult's people under one crown"]);
    }
    const leg = 0.62 + (n.legitimacy || 60) / 260;
    if (!reasons.length) {
      n.grievance[id] = Math.max(0, (n.grievance[id] || 0) - 10);
      continue;
    }
    reasons.sort((a, b) => b[0] - a[0]);
    n.grievance[id] = (n.grievance[id] || 0) + reasons.reduce((s, r) => s + r[0], 0) * leg;
    n.gnote[id] = reasons[0][1];
    if (!best || n.grievance[id] > best.score) best = { other, score: n.grievance[id], note: n.gnote[id] };
  }
  if (best && best.score >= 100) {
    n.grievance[best.other.id] = 0;
    declareWar(n, best.other, n.name + " goes to war with " + best.other.name + " " + best.note + ".");
  }
}

function severs(id, x, y) {
  const cells = [];
  for (let yy = 0; yy < ROWS; yy++) for (let xx = 0; xx < COLS; xx++) {
    if (owner[yy][xx] === id && (xx !== x || yy !== y)) cells.push([xx, yy]);
  }
  if (cells.length < 2) return false;
  return components(cells).length > 1;
}

function splitOff(id, x, y) {
  const cells = [];
  for (let yy = 0; yy < ROWS; yy++) for (let xx = 0; xx < COLS; xx++) {
    if (owner[yy][xx] === id && (xx !== x || yy !== y)) cells.push([xx, yy]);
  }
  if (cells.length < 2) return [];
  const comps = components(cells);
  if (comps.length < 2) return [];
  return comps.slice(1).flat();
}

function warPush(n) {
  const foeId = [...n.atWar][0];
  const foe = byId(foeId);
  if (!foe) { n.atWar.clear(); return false; }
  const grabs = 1;
  for (let g = 0; g < grabs; g++) {
    const cands = [];
    const seen = new Set();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (owner[y][x] !== n.id) continue;
      for (const [tx, ty] of neighbors(x, y)) {
        const k = key(tx, ty);
        if (seen.has(k) || owner[ty][tx] !== foe.id) continue;
        seen.add(k);
        let friends = 0;
        for (const [ax, ay] of neighbors(tx, ty)) if (owner[ay][ax] === n.id) friends++;
        const coastCell = coast && coast[ty][tx];
        cands.push({ tx, ty, friends, d: hypot(tx, ty, n.capital), reclaim: prev[ty][tx] === n.id ? 1 : 0, coast: coastCell ? 1 : 0 });
      }
    }
    if (!cands.length) return false;
    const R = rules(n.gov);
    for (const m of cands) {
      const port = m.coast && (cities.some(c => c.x === m.tx && c.y === m.ty) || (river && river[m.ty][m.tx] > 11));
      m.score = m.reclaim * 6 + m.friends + m.coast * (R.trade > 0.5 ? 2.4 : 0.8) + (port ? 2 : 0) - m.d * 0.02 + rnd();
    }
    cands.sort((a, b) => b.score - a.score);
    let moved = false;
    for (const m of cands) {
      const pocket = splitOff(foe.id, m.tx, m.ty);
      if (pocket.length > 8) continue;
      if (pocket.some(([x, y]) => foe.capital && x === foe.capital.x && y === foe.capital.y)) continue;
      const city = cities.find(c => c.x === m.tx && c.y === m.ty);
      const seat = foe.capital && m.tx === foe.capital.x && m.ty === foe.capital.y;
      const unit = canAssault(n, m.tx, m.ty);
      if (!unit) continue;
      let power = muster(n) * (0.94 + rnd() * 0.12) * hostFactor(n, m.tx, m.ty) * ((n.treasury || 0) < 40 ? 0.72 : 1) * ((n.hungry || 0) > 0.1 ? 0.84 : 1);
      let defense = muster(foe) * (0.94 + rnd() * 0.12) * hostFactor(foe, m.tx, m.ty) * ((foe.treasury || 0) < 40 ? 0.8 : 1);
      const souls = (pop && pop[m.ty][m.tx]) || 0;
      if (city) defense *= [1.04, 1.1, 1.2, 1.32, 1.45][tierAt(city.rank)] + Math.min(0.08, souls / 100000);
      if (seat) {
        defense *= 1.34;
        if (foe.gov === "Monarchy" || foe.gov === "Theocracy") defense *= 1.14;
        if (foe.gov === "Dictatorship" && (foe.legitimacy || 0) > 55) defense *= 1.12;
        if ((foe.legitimacy || 0) < 36) defense *= 0.74;
      }
      if (foe.gov === "Theocracy" && belief && belief[m.ty][m.tx]) defense *= 0.84 + belief[m.ty][m.tx][foe.faith] * 0.45;
      if (n.gov === "Theocracy" && belief && belief[m.ty][m.tx]) {
        const here = belief[m.ty][m.tx][n.faith] || 0;
        if (here > 0.34) power *= 1.06 + here * 0.22;
      }
      if (city && m.coast && rules(foe.gov).trade > 0.7) defense *= 1.12;
      if (m.reclaim) defense *= 0.7;
      if (unit.kind === "host") {
        let bite = unit.role === "levy" ? 0.09 : unit.role === "rifles" || unit.role === "arms" ? 0.045 : 0.065;
        if (season === 3 && coldAt(m.tx, m.ty) > 0.42) bite += 0.09;
        if (city) bite += 0.04;
        unit.men = Math.round((unit.men || 0) * (1 - bite));
      }
      if ((n.age || 0) >= 4 && (n.silicon || 0) >= 5 && n.missileYear !== year) {
        power *= 1.32;
        n.silicon -= 5;
        n.missileYear = year;
        chronicle(year, n.name + " sends a missile into " + foe.name + ".");
      }
      if (power * (1 + m.friends * 0.05) > defense) {
        const already = occupy && occupy[m.ty][m.tx] === n.id;
        holdLand(m.tx, m.ty, n.id);
        for (const [px, py] of pocket) if (pocket.length <= 3) holdLand(px, py, n.id);
        chronicle(year, already
          ? "Another skirmish. " + n.name + " still holds occupied ground of " + foe.name + "."
          : "A skirmish. " + n.name + " occupies a province of " + foe.name + ". It is not annexed.");
        if (city && !already && !seat && tierAt(city.rank) >= 1) {
          const tier = tierAt(city.rank);
          foe.legitimacy = Math.max(6, (foe.legitimacy || 40) - [0, 4, 9, 14, 18][tier]);
          foe.stability -= [0, 3, 7, 11, 14][tier];
          const loot = Math.round((foe.treasury || 0) * (0.05 + tier * 0.03));
          const wood = Math.round((foe.timber || 0) * (0.04 + tier * 0.02));
          const metal = Math.round((foe.ore || 0) * (0.05 + tier * 0.02));
          foe.treasury = Math.max(0, (foe.treasury || 0) - loot);
          foe.timber = Math.max(0, (foe.timber || 0) - wood);
          foe.ore = Math.max(0, (foe.ore || 0) - metal);
          n.treasury = Math.min(12000, (n.treasury || 0) + loot);
          n.timber = Math.min(5000, (n.timber || 0) + wood);
          n.ore = Math.min(3500, (n.ore || 0) + metal);
          chronicle(year, n.name + " sacks the " + city.rank + " of " + city.name + ". " + foe.name + " is thinner for it.");
        } else foe.stability -= 0.55;
      } else {
        n.stability -= city ? 0.7 : 0.35;
      }
      moved = true;
      break;
    }
    if (!moved) return false;
  }
  return true;
}

function sharesRiver(a, b) {
  if (!a.rivers || !b.rivers) return false;
  for (const id of a.rivers) if (b.rivers.has(id)) return true;
  return false;
}

function considerPacts() {
  for (let i = 0; i < nations.length; i++) {
    for (let j = i + 1; j < nations.length; j++) {
      const a = nations[i], b = nations[j];
      if (!a.pact) a.pact = {};
      if (!b.pact) b.pact = {};
      if (a.atWar.size || b.atWar.size || pactOn(a, b.id)) continue;
      const riverPeace = sharesRiver(a, b);
      const complement = ((a.ore || 0) > 70 && (b.ore || 0) < 28) || ((b.ore || 0) > 70 && (a.ore || 0) < 28)
        || ((a.timber || 0) > 120 && (b.timber || 0) < 40) || ((b.timber || 0) > 120 && (a.timber || 0) < 40)
        || ((a.oil || 0) > 24 && (b.oil || 0) < 8) || ((b.oil || 0) > 24 && (a.oil || 0) < 8)
        || ((a.silicon || 0) > 8 && (b.silicon || 0) < 3) || ((b.silicon || 0) > 8 && (a.silicon || 0) < 3);
      if (!riverPeace && !complement) continue;
      if ((borderCounts(a)[b.id] || 0) < 4 && a.gov !== "Republic" && a.gov !== "Oligarchy" && b.gov !== "Republic" && b.gov !== "Oligarchy") continue;
      if ((a.gov === "Dictatorship" || b.gov === "Dictatorship") && rnd() > 0.2) continue;
      if (a.gov === "Monarchy" && b.gov === "Monarchy" && !riverPeace && rnd() > 0.45) continue;
      if (a.gov === "Theocracy" && (a.cultShare || 0) > 0.45 && a.creed !== b.creed) continue;
      if (b.gov === "Theocracy" && (b.cultShare || 0) > 0.45 && b.creed !== a.creed) continue;
      const heat = ((a.grievance && a.grievance[b.id]) || 0) + ((b.grievance && b.grievance[a.id]) || 0);
      if (heat > 35) continue;
      const ap = Object.keys(a.pact).filter(id => a.pact[id] > year).length;
      const bp = Object.keys(b.pact).filter(id => b.pact[id] > year).length;
      if (ap >= 2 || bp >= 2) continue;
      a.pact[b.id] = year + 80;
      b.pact[a.id] = year + 80;
      const because = (a.silicon || 0) > 8 || (b.silicon || 0) > 8 ? "One has the silicon the other lacks."
        : (a.oil || 0) > 24 || (b.oil || 0) > 24 ? "One has the oil the other lacks."
        : !riverPeace && ((a.ore || 0) > 70 || (b.ore || 0) > 70) ? "One has the ore the other lacks."
        : !riverPeace ? "One has the timber the other lacks."
        : "A river runs through both.";
      chronicle(year, a.name + " and " + b.name + " keep a trade peace. " + because);
    }
  }
}

function settleWars() {
  const seen = new Set();
  for (const n of nations) {
    for (const id of [...n.atWar]) {
      const pair = n.id < id ? n.id + ":" + id : id + ":" + n.id;
      if (seen.has(pair)) continue;
      seen.add(pair);
      const foe = byId(id);
      if (!foe) { n.atWar.delete(id); continue; }
      const rec = n.wars[id] || { year, pops: n.pops };
      const foeRec = foe.wars[n.id] || { year, pops: foe.pops };
      const border = borderCounts(n)[id] || 0;
      const lostN = n.pops < rec.pops * 0.72;
      const lostF = foe.pops < foeRec.pops * 0.72;
      let why = "";
      if (border < 2) why = n.name + " and " + foe.name + " no longer share a border. The fighting ends.";
      else if (lostN) why = n.name + " sues for peace with " + foe.name + " after heavy losses.";
      else if (lostF) why = foe.name + " sues for peace with " + n.name + " after heavy losses.";
      else if ((n.treasury || 0) < 25 && year - rec.year > 6) why = n.name + " cannot pay for the war with " + foe.name + ".";
      else if ((foe.treasury || 0) < 25 && year - rec.year > 6) why = foe.name + " cannot pay for the war with " + n.name + ".";
      else if (year - rec.year > 30 + (n.id % 14)) why = "The war between " + n.name + " and " + foe.name + " burns out.";
      if (!why) continue;
      makePeace(n, foe, 50 + ri(40));
      chronicle(year, why);
    }
  }
}

function seaRange(n) {
  const s = n.sea || 0;
  if (s < 0.3) return 0;
  if (s < 0.55) return 4;
  if (s < 0.78) return 11;
  return 22;
}

function seaWord(n) {
  const r = seaRange(n);
  if (!r) return "Not yet";
  if (r <= 4) return "Straits";
  if (r <= 11) return "Coasting";
  return "Open sea";
}

function learnSea(n) {
  const before = seaRange(n);
  if (!(n.coasts || 0)) n.sea = Math.max(0, (n.sea || 0) - 0.008);
  else {
    const pace = rules(n.gov).sea / 1.3;
    let gain = 0.0032 * pace;
    if ((n.grain || 0) > 1600) gain += 0.0022;
    if ((n.timber || 0) > 90) gain += 0.0018;
    if (n.lastTrade) gain += 0.0012;
    if ((n.treasury || 0) < 30) gain -= 0.004;
    if ((n.hungry || 0) > 0.08 || n.parched) gain = -0.01;
    n.sea = Math.max(0, Math.min(1, (n.sea || 0) + gain));
  }
  const now = seaRange(n);
  if (now > before && before === 0) chronicle(year, n.name + " puts to sea. A strait is no longer the edge of the world.");
  else if (now > before && now >= 11 && before < 11) chronicle(year, n.name + " keeps a coasting trade.");
  else if (now > before && now >= 22) chronicle(year, n.name + " can cross open water.");
}

function factions(n) {
  const coastShare = n.pops ? (n.coasts || 0) / n.pops : 0;
  const hungry = n.hungry || 0;
  const cult = n.cultShare || 0;
  const unrest = Math.min(1, (n.unrest || 0) / 80);
  const rich = Math.min(1, (n.wealth || 0) / Math.max(1, n.pops) / 8);
  const broke = (n.treasury || 0) < 40 ? 0.7 : 0;
  const traded = n.lastTrade ? 0.4 : 0;
  return [
    { gov: "Republic", name: "merchants", w: Math.max(0.55, 1.7 + coastShare * 1.2 + rich * 0.6 + traded * 0.3 + (n.gov === "Republic" ? 1.2 : 0) - hungry * 0.8) },
    { gov: "Oligarchy", name: "ports", w: Math.max(0, 0.1 + coastShare * 1.6 + (n.sea || 0) * 0.5) },
    { gov: "Monarchy", name: "country", w: 0.3 + hungry * 0.9 + broke * 0.4 + (1 - coastShare) * 0.45 },
    { gov: "Theocracy", name: "cult", w: cult > 0.5 ? (cult - 0.35) * 3.2 : 0 },
    { gov: "Dictatorship", name: "hard hand", w: unrest * 2.4 + (n.atWar.size ? 0.7 : 0) + ((n.legitimacy || 50) < 32 ? 0.8 : 0) + (hungry > 0.06 && taxRate(n) > 0.25 ? 0.5 : 0) }
  ].filter(f => f.w > 0.05);
}

function weighParties(n) {
  n.parties = n.gov === "Republic" ? factions(n).sort((a, b) => b.w - a.w) : null;
}

function partyLine(n) {
  if (!n.parties || !n.parties.length) return "—";
  const t = n.parties.reduce((s, f) => s + f.w, 0) || 1;
  return n.parties.slice(0, 3).map(f => f.name + " " + Math.round(100 * f.w / t) + "%").join(" · ");
}

function considerVote(n) {
  if (n.gov !== "Republic" || n.atWar.size || n.pops < 6) return;
  if (!n.nextVote) n.nextVote = year + 20;
  if (year < n.nextVote) return;
  n.nextVote = year + 26 + ri(14);
  const list = factions(n);
  const total = list.reduce((s, f) => s + f.w, 0) || 1;
  let roll = rnd() * total;
  let pick = list[0];
  for (const f of list) { roll -= f.w; if (roll <= 0) { pick = f; break; } }
  n.parties = list.sort((a, b) => b.w - a.w);
  const merchants = list.find(f => f.gov === "Republic");
  if (!pick || pick.gov === "Republic" || (merchants && merchants.w >= pick.w * 0.8)) {
    const prev = n.leader && n.leader.name;
    seatLeader(n);
    chronicle(year, n.name + " elects " + n.leader.name + (prev ? ". " + prev + " leaves office." : "."));
    n.unrest = Math.max(0, (n.unrest || 0) - 4);
    return;
  }
  n.gov = pick.gov;
  seatLeader(n);
  n.legitimacy = Math.max(16, (n.legitimacy || 40) - 14);
  n.stability = Math.max(8, (n.stability || 30) - 10);
  n.quietUntil = Math.max(n.quietUntil || 0, year + 30);
  chronicle(year, n.name + " votes. The " + pick.name + " carry it. The republic is now " + govArticle(pick.gov) + ".");
}

function considerCoup(n) {
  if (!n || n.gov === "Republic" || n.atWar.size || year < (n.quietUntil || 0) || n.pops < 8) return;
  const hungry = n.hungry || 0;
  const legit = n.legitimacy || 50;
  const unrest = n.unrest || 0;
  if (legit > 40 && unrest < 46 && hungry < 0.09) return;
  if (unrest < 30 && hungry < 0.08) return;
  const coastShare = n.pops ? (n.coasts || 0) / n.pops : 0;
  let next = null, why = "";
  if (n.gov === "Dictatorship" && legit < 38 && (hungry > 0.07 || unrest > 48)) {
    next = "Republic";
    why = "The dictatorship is thrown out. A democratic republic is declared.";
  } else if (n.gov === "Theocracy" && (n.cultShare || 0) < 0.36 && unrest > 34) {
    next = coastShare > 0.22 ? "Republic" : "Monarchy";
    why = next === "Republic"
      ? "The cult cannot hold the capital. A democratic republic is declared."
      : "The cult cannot hold the capital. A crown is set in its place.";
  } else if (n.gov === "Oligarchy" && hungry > 0.07 && coastShare < 0.18) {
    next = "Republic";
    why = "The inland country throws out the ports. A democratic republic is declared.";
  } else if (n.gov === "Monarchy" && hungry > 0.09 && legit < 34) {
    next = "Republic";
    why = "The crown cannot feed the country. A democratic republic is declared.";
  } else if (n.gov === "Monarchy" && unrest > 62 && legit < 28) {
    next = "Dictatorship";
    why = "The crown falls. A dictatorship takes the capital.";
  } else if ((n.cultShare || 0) > 0.72 && legit < 34 && hungry > 0.05) {
    next = "Theocracy";
    why = "The cult takes the capital from the crown.";
  } else if (n.gov === "Monarchy" && coastShare > 0.34 && (n.treasury || 0) < 30 && legit < 38) {
    next = "Oligarchy";
    why = "The ports buy out the crown. An oligarchy keeps the coasts.";
  }
  if (!next || next === n.gov) return;
  n.gov = next;
  seatLeader(n);
  n.legitimacy = next === "Republic" ? 52 : 38;
  n.stability = Math.max(14, (n.stability || 30) - 6);
  n.unrest = Math.max(0, unrest * 0.3);
  n.quietUntil = year + 36;
  if (next === "Republic") n.nextVote = year + 22;
  chronicle(year, n.name + ". " + why);
}

function portOf(n) {
  let best = null, score = -1;
  for (const c of cities) {
    if (!owner[c.y] || owner[c.y][c.x] !== n.id || !(coast && coast[c.y][c.x])) continue;
    const souls = pop[c.y][c.x] || 0;
    const s = souls + ((c.fed == null || c.fed > 0.85) ? 500 : 0);
    if (s > score) { score = s; best = c; }
  }
  if (best && score >= 700) return best;
  return null;
}

function landfalls(x, y, range, selfId) {
  const q = [];
  let qh = 0;
  const seen = new Set();
  for (const [nx, ny] of neighbors(x, y)) {
    if (grid[ny][nx] === LAND) continue;
    const k = key(nx, ny);
    if (seen.has(k)) continue;
    seen.add(k);
    q.push([nx, ny, 1]);
  }
  const hits = [];
  const hitSeen = new Set();
  while (qh < q.length && seen.size < 900) {
    const [cx, cy, d] = q[qh++];
    for (const [nx, ny] of neighbors(cx, cy)) {
      const k = key(nx, ny);
      if (grid[ny][nx] === LAND) {
        if (owner[ny][nx] === selfId || hitSeen.has(k)) continue;
        hitSeen.add(k);
        hits.push({ x: nx, y: ny, d, owner: owner[ny][nx] });
      } else if (!seen.has(k) && d < range) {
        seen.add(k);
        q.push([nx, ny, d + 1]);
      }
    }
  }
  return hits;
}

function seaSupplied(n, chunk) {
  if (seaRange(n) <= 0) return false;
  if (!portOf(n)) return false;
  return chunk.some(([x, y]) => coast && coast[y] && coast[y][x]);
}

function sailTo(n, port, dest) {
  const from = pop[port.y][port.x] || 0;
  let party = Math.round(from * (n.gov === "Dictatorship" ? 0.12 : 0.07));
  party = Math.max(36, Math.min(from - 480, party));
  if (party < 36) return false;
  const drown = Math.round(party * Math.min(0.45, 0.1 + dest.d * 0.012));
  const arrive = party - drown;
  if (arrive < 24) return false;
  pop[port.y][port.x] = from - party;
  if (n.gov === "Dictatorship") n.unrest = (n.unrest || 0) + 1.4;
  const locals = pop[dest.y][dest.x] || 0;
  const foe = dest.owner >= 0 ? byId(dest.owner) : null;
  if (foe) {
    const ships = units && units.some(u => u.kind === "warship" && u.owner === n.id);
    const power = arrive * (0.75 + (n.sea || 0)) * (ships ? 1 : 0.45);
    const defense = Math.max(180, locals) * (0.85 + (foe.sea || 0) * 0.45);
    if (power < defense) {
      chronicle(year, "Ships from " + n.name + " cannot land on " + foe.name + ".");
      return true;
    }
  }
  const flight = foe ? 0.45 : 0.22;
  const stayed = Math.round(locals * (1 - flight));
  pop[dest.y][dest.x] = Math.max(40, stayed + arrive);
  if (belief && belief[dest.y] && belief[dest.y][dest.x] && belief[port.y][port.x]) pourFaith(dest.x, dest.y, belief[port.y][port.x], stayed, arrive);
  claim(dest.x, dest.y, n.id);
  n.grain = Math.max(0, (n.grain || 0) - 350);
  chronicle(year, foe
    ? "Ships from " + n.name + " take a shore from " + foe.name + "."
    : "Ships from " + n.name + " make landfall. The people who left the port settle a shore they cannot walk to.");
  if (foe) foe.stability = Math.max(4, (foe.stability || 30) - 4);
  return true;
}

function considerVoyage(n) {
  const range = seaRange(n);
  if (!range || (n.hungry || 0) > 0.05 || n.pops < 8) return;
  const chance = n.gov === "Oligarchy" ? 0.5 : n.gov === "Republic" ? 0.38 : n.gov === "Dictatorship" ? 0.2 : 0.16;
  if (rnd() > chance) return;
  const port = portOf(n);
  if (!port) return;
  const hits = landfalls(port.x, port.y, range, n.id);
  let best = null, bestS = -1;
  for (const h of hits) {
    let s = 0;
    if (h.owner < 0) s = 4.2 - h.d * 0.12;
    else if (n.atWar.has(h.owner)) s = 3.4 - h.d * 0.08;
    else continue;
    if (river && river[h.y][h.x] >= 12) s += 1.4;
    if (n.gov === "Theocracy" && belief && belief[h.y][h.x]) {
      const share = belief[h.y][h.x][n.faith] || 0;
      s += share > 0.4 ? 1.5 : -1.2;
    }
    const beside = neighbors(h.x, h.y).some(([nx, ny]) => owner[ny][nx] >= 0 && owner[ny][nx] !== n.id && !n.atWar.has(owner[ny][nx]));
    if (beside && h.owner < 0) s -= 2.5;
    s += rnd() * 0.4;
    if (s > bestS) { bestS = s; best = h; }
  }
  if (best && bestS > 1.2) sailTo(n, port, best);
}

function unitCount(id, kind) {
  if (!units) return 0;
  let n = 0;
  for (const u of units) if (u.owner === id && u.kind === kind) n++;
  return n;
}

function downstreamRun(x, y, ownerId) {
  let cx = x, cy = y;
  const seen = new Set();
  let city = null;
  for (let s = 0; s < 48; s++) {
    const nx = flowToX[cy][cx], ny = flowToY[cy][cx];
    if (nx < 0 || !grid[ny] || grid[ny][nx] !== LAND) return city || (cx === x && cy === y ? null : { x: cx, y: cy, name: "the sea" });
    const k = key(nx, ny);
    if (seen.has(k)) return city;
    seen.add(k);
    const downId = owner[ny][nx];
    if (downId >= 0 && downId !== ownerId) {
      const a = byId(ownerId), b = byId(downId);
      if (a && b && pactOn(a, b.id)) return { x: nx, y: ny, name: b.name };
      return city || (cx === x && cy === y ? null : { x: cx, y: cy, name: "the border" });
    }
    const found = downId === ownerId && cities.find(c => c.x === nx && c.y === ny);
    if (found) city = { x: found.x, y: found.y, name: found.name };
    cx = nx;
    cy = ny;
  }
  return city;
}

function launchBarge(x, y, ownerId, load) {
  const ownerNation = byId(ownerId);
  if (!units || load < 200 || !ownerNation || (ownerNation.age || 0) < 1) return 0;
  const sys = riverSys && riverSys[y][x];
  if (units.some(u => u.kind === "barge" && u.owner === ownerId && sys && riverSys[u.y] && riverSys[u.y][u.x] === sys)) return 0;
  const dest = downstreamRun(x, y, ownerId);
  if (!dest || (dest.x === x && dest.y === y)) return 0;
  units.push({ id: nextUnit++, kind: "barge", owner: ownerId, x, y, men: 0, cargo: load, destName: dest.name, dx: dest.x, dy: dest.y });
  return load;
}

function armOf(n) {
  const age = n.age || 0;
  if (age >= 3 && (n.oil || 0) >= 4 && (n.ore || 0) >= 4) return "rifles";
  if (age >= 2 && (n.ore || 0) >= 6) return "arms";
  if (age >= 1 && (n.timber || 0) >= 4) return "company";
  return "levy";
}
function armWeight(role) {
  if (role === "rifles") return 1.55;
  if (role === "arms") return 1.28;
  if (role === "company") return 1.05;
  return 0.82;
}
function armWord(role) {
  if (role === "rifles") return "Rifles";
  if (role === "arms") return "Men-at-arms";
  if (role === "company") return "Company";
  if (role === "wing") return "Wing";
  return "Levy";
}
function hullOf(n) {
  const age = n.age || 0;
  if (age >= 3) return "steam";
  if (age >= 2) return "carrack";
  return "sail";
}
function hullSteps(u) {
  if (u.hull === "steam") return 3;
  if (u.hull === "carrack") return 2;
  return 1;
}
function hullWord(n) {
  const age = n.age || 0;
  if (age >= 3) return "Steam";
  if (age >= 2) return "Carrack";
  if (age >= 1) return "Slow sail";
  return "None";
}

function canAssault(n, x, y) {
  if (!units) return null;
  let ship = null, wing = null, army = null;
  for (const u of units) {
    if (u.owner !== n.id) continue;
    const d = Math.hypot(u.x - x, u.y - y);
    if (u.kind === "host" && d <= 3.2 && (!army || d < army.d)) army = { u, d };
    else if (u.kind === "air" && d <= 7 && !wing) wing = u;
    else if (u.kind === "warship" && coast && coast[y] && coast[y][x] && d <= 6 && !ship) ship = u;
  }
  return army ? army.u : wing || ship;
}

function hostFactor(n, x, y) {
  if (!units || !n) return 0.7;
  let best = 0;
  for (const u of units) {
    if (u.kind === "air" && u.owner === n.id) {
      const d = Math.hypot(u.x - x, u.y - y);
      if (d <= 8 && best < 1.4) best = 1.4;
      continue;
    }
    if (u.kind !== "host" || u.owner !== n.id) continue;
    const d = Math.hypot(u.x - x, u.y - y);
    if (d > 4) continue;
    const strength = (0.72 + Math.min(0.5, (u.men || 200) / 1400)) * (u.fed == null || u.fed > 0.7 ? 1 : 0.75) * armWeight(u.role);
    if (strength > best) best = strength;
  }
  return best > 0 ? 0.55 + best : 0.62;
}

function raiseHost(n) {
  if ((n.treasury || 0) < 36) {
    if ((year + n.id) % 10 === 0) chronicle(year, n.name + " cannot raise an army. The treasury will not bear it.");
    return false;
  }
  const foeId = n.atWar && n.atWar.size ? [...n.atWar][0] : -1;
  let best = null, bestS = -1;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (owner[y][x] !== n.id) continue;
    const p = pop[y][x] || 0;
    if (p < 720) continue;
    if (n.capital && x === n.capital.x && y === n.capital.y) continue;
    if (units.some(u => u.kind === "host" && u.x === x && u.y === y)) continue;
    const border = foeId >= 0 && neighbors(x, y).some(([nx, ny]) => owner[ny][nx] === foeId);
    const s = (border ? 6 : 0) + p / 2500;
    if (s > bestS) { bestS = s; best = [x, y, p]; }
  }
  if (!best) return false;
  const role = armOf(n);
  const men = Math.min(role === "levy" ? 520 : 700, Math.round(best[2] * 0.12));
  if (men < 70) return false;
  if (role === "rifles") {
    if ((n.treasury || 0) < 70) return false;
    n.oil -= 4; n.ore -= 4; n.treasury -= 70;
  } else if (role === "arms") {
    if ((n.treasury || 0) < 60) return false;
    n.ore -= 6; if ((n.timber || 0) >= 3) n.timber -= 3; n.treasury -= 60;
  } else if (role === "company") {
    if ((n.treasury || 0) < 50) return false;
    n.timber -= 4; n.treasury -= 50;
  } else {
    if ((n.treasury || 0) < 36) return false;
    n.treasury -= 36;
  }
  pop[best[1]][best[0]] -= men;
  units.push({ id: nextUnit++, kind: "host", owner: n.id, x: best[0], y: best[1], men, fed: 1, cargo: 0, role, paid: true });
  return true;
}

function raiseHosts(n) {
  if (!n || !n.atWar || !n.atWar.size || !units) return;
  const want = Math.min(3, Math.max(1, Math.floor((n.pops || 1) / 40)));
  let have = unitCount(n.id, "host");
  while (have < want) {
    if (!raiseHost(n)) break;
    have++;
  }
}

function disbandHosts(id) {
  if (!units) return;
  units = units.filter(u => {
    if (u.kind !== "host" || u.owner !== id) return true;
    if (owner[u.y] && owner[u.y][u.x] === id) pop[u.y][u.x] = (pop[u.y][u.x] || 0) + Math.round((u.men || 0) * 0.8);
    return false;
  });
}

function dropFood(x, y, amt) {
  if (amt <= 0) return;
  if (!pendingFood) pendingFood = new Map();
  const k = key(x, y);
  pendingFood.set(k, (pendingFood.get(k) || 0) + amt);
}

function track(u) { u.pts = [[u.x, u.y]]; }
function moved(u) {
  if (!u.pts) u.pts = [[u.x, u.y]];
  const last = u.pts[u.pts.length - 1];
  if (last[0] !== u.x || last[1] !== u.y) u.pts.push([u.x, u.y]);
}

function stepBarge(u) {
  track(u);
  for (let s = 0; s < 2; s++) {
    const nx = flowToX[u.y][u.x], ny = flowToY[u.y][u.x];
    if (nx < 0 || grid[ny][nx] !== LAND) {
      const n = byId(u.owner);
      if (n) n.grain = (n.grain || 0) + u.cargo;
      return false;
    }
    const downId = owner[ny][nx];
    if (downId >= 0 && downId !== u.owner) {
      const a = byId(u.owner), b = byId(downId);
      const war = a && b && (a.atWar.has(b.id) || b.atWar.has(a.id));
      if (war) {
        dropFood(nx, ny, u.cargo * 0.5);
        if ((year + u.id) % 8 === 0) chronicle(year, "A barge of " + a.name + " is taken on the river by " + b.name + ".");
        return false;
      }
      if (a && b && pactOn(a, b.id)) {
        dropFood(nx, ny, u.cargo);
        if ((year + u.id) % 10 === 0) chronicle(year, a.name + " delivers grain downriver to " + b.name + ".");
        return false;
      }
      dropFood(u.x, u.y, u.cargo);
      return false;
    }
    const city = cities.find(c => c.x === nx && c.y === ny);
    if (city && owner[ny][nx] === u.owner && (city.fed == null || city.fed < 0.94) && u.cargo > 0) {
      dropFood(nx, ny, u.cargo);
      return false;
    }
    u.x = nx;
    u.y = ny;
    moved(u);
  }
  return true;
}

function waterPath(ax, ay, bx, by) {
  const start = grid[ay] && grid[ay][ax] !== LAND ? [ax, ay] : neighbors(ax, ay).find(([x, y]) => grid[y][x] !== LAND);
  if (!start) return null;
  const goal = new Set(neighbors(bx, by).filter(([x, y]) => grid[y][x] !== LAND).map(([x, y]) => key(x, y)));
  if (!goal.size) return null;
  const q = [[start[0], start[1]]];
  const prev = new Map();
  prev.set(key(start[0], start[1]), -1);
  let qh = 0;
  let found = null;
  while (qh < q.length && prev.size < 10000) {
    const [x, y] = q[qh++];
    const k = key(x, y);
    if (goal.has(k)) { found = k; break; }
    for (const [nx, ny] of neighbors(x, y)) {
      if (grid[ny][nx] === LAND) continue;
      const nk = key(nx, ny);
      if (prev.has(nk)) continue;
      prev.set(nk, k);
      q.push([nx, ny]);
    }
  }
  if (found == null) return null;
  const path = [];
  let k = found;
  while (k !== -1 && path.length < 500) {
    path.push([k % COLS, (k / COLS) | 0]);
    k = prev.get(k);
  }
  path.reverse();
  return path.length ? path : null;
}

function colonyPort(n) {
  const cells = cellsOf(n.id);
  if (cells.length < 2) return null;
  const comps = components(cells);
  if (comps.length < 2) return null;
  for (let i = 1; i < comps.length; i++) {
    const shore = comps[i].find(([x, y]) => coast && coast[y][x]);
    if (shore) return shore;
  }
  return null;
}

function loadOutbound(n, destRealm) {
  const other = destRealm != null && destRealm !== n.id ? byId(destRealm) : null;
  const grain = n.grain || 0, wood = n.timber || 0, ore = n.ore || 0, oil = n.oil || 0, silicon = n.silicon || 0;
  if (other) {
    if ((other.hungry || 0) > 0.04 && grain > 450) return { good: "grain", cargo: Math.min(900, Math.round(grain * 0.22)) };
    if ((other.silicon || 0) + 2 < silicon && silicon > 6 && (n.gov === "Republic" || n.gov === "Oligarchy" || (other.age || 0) >= 4)) return { good: "silicon", cargo: Math.min(4, Math.round(silicon * 0.2)) };
    if ((other.oil || 0) + 4 < oil && oil > 16) return { good: "oil", cargo: Math.min(10, Math.round(oil * 0.16)) };
    if ((other.ore || 0) + 15 < ore && ore > 36) return { good: "ore", cargo: Math.min(28, Math.round(ore * 0.18)) };
    if ((other.timber || 0) + 20 < wood && wood > 50) return { good: "timber", cargo: Math.min(36, Math.round(wood * 0.16)) };
    if (grain > 800) return { good: "grain", cargo: Math.min(700, Math.round(grain * 0.12)) };
    return null;
  }
  if (grain > 500) return { good: "grain", cargo: Math.min(800, Math.round(grain * 0.2)) };
  if (wood > 80) return { good: "timber", cargo: Math.min(30, Math.round(wood * 0.12)) };
  return null;
}

function takeCargo(n, offer) {
  if (!offer) return false;
  if (offer.good === "grain" && (n.grain || 0) >= offer.cargo) { n.grain -= offer.cargo; return true; }
  if (offer.good === "timber" && (n.timber || 0) >= offer.cargo) { n.timber -= offer.cargo; return true; }
  if (offer.good === "ore" && (n.ore || 0) >= offer.cargo) { n.ore -= offer.cargo; return true; }
  if (offer.good === "oil" && (n.oil || 0) >= offer.cargo) { n.oil -= offer.cargo; return true; }
  if (offer.good === "silicon" && (n.silicon || 0) >= offer.cargo) { n.silicon -= offer.cargo; return true; }
  return false;
}

function landCargo(u) {
  const n = byId(u.owner);
  if (!n || !(u.cargo > 0)) return;
  const buyer = u.destRealm != null && u.destRealm !== n.id ? byId(u.destRealm) : null;
  const who = buyer || n;
  if (u.good === "timber") who.timber = Math.min(5000, (who.timber || 0) + u.cargo);
  else if (u.good === "ore") who.ore = Math.min(3500, (who.ore || 0) + u.cargo);
  else if (u.good === "oil") who.oil = Math.min(2000, (who.oil || 0) + u.cargo);
  else if (u.good === "silicon") who.silicon = Math.min(600, (who.silicon || 0) + u.cargo);
  else dropFood(u.dx, u.dy, u.cargo);
  if (buyer) {
    const ask = u.good === "silicon" ? u.cargo * 14 : u.good === "oil" ? u.cargo * 6 : u.good === "ore" ? u.cargo * 4 : u.good === "timber" ? Math.round(u.cargo * 2.5) : Math.max(6, Math.round(u.cargo / 25));
    const paid = Math.min(buyer.treasury || 0, ask);
    buyer.treasury = (buyer.treasury || 0) - paid;
    n.treasury = Math.min(12000, (n.treasury || 0) + paid);
    u.back = 0;
    u.backGood = "";
    if (u.good !== "ore" && (n.ore || 0) < 25 && (buyer.ore || 0) > 40) {
      u.back = Math.min(12, Math.round(buyer.ore * 0.12));
      buyer.ore -= u.back;
      u.backGood = "ore";
    } else if (u.good !== "timber" && (n.timber || 0) < 40 && (buyer.timber || 0) > 60) {
      u.back = Math.min(16, Math.round(buyer.timber * 0.1));
      buyer.timber -= u.back;
      u.backGood = "timber";
    }
    n.lastTrade = u.good + " to " + buyer.name + (paid ? " · " + paid + " coin" : " · unpaid");
    buyer.lastTrade = u.good + " from " + n.name;
    if ((year + u.id) % 4 === 0) chronicle(year, paid
      ? n.name + " sells " + u.good + " to " + buyer.name + " for " + paid + " coin" + (u.back ? ". " + u.backGood + " comes back." : ".")
      : n.name + " lands " + u.good + " in " + buyer.name + ", which cannot pay.");
  }
  u.cargo = 0;
}

function ensureCogs(n) {
  if ((n.age || 0) < 1 || (n.sea || 0) < 0.16 || !(n.coasts || 0) || unitCount(n.id, "cog")) return;
  const home = portOf(n);
  if (!home) return;
  let dest = null;
  const far = colonyPort(n);
  if (far) {
    const chunk = components(cellsOf(n.id)).find(comp => comp.some(([x, y]) => x === far[0] && y === far[1]));
    const city = chunk && cities.find(c => chunk.some(([x, y]) => x === c.x && y === c.y));
    dest = city
      ? { x: city.x, y: city.y, realm: n.id, name: city.name }
      : { x: far[0], y: far[1], realm: n.id, name: "its far shore" };
  }
  if (!dest && n.pact) {
    for (const id of Object.keys(n.pact)) {
      if (!(n.pact[id] > year)) continue;
      const other = byId(Number(id));
      const p = other && portOf(other);
      if (p) { dest = { x: p.x, y: p.y, realm: other.id, name: p.name }; break; }
    }
  }
  if (!dest) return;
  const offer = loadOutbound(n, dest.realm);
  if (!offer || !takeCargo(n, offer)) return;
  const path = waterPath(home.x, home.y, dest.x, dest.y);
  if (!path || path.length < 2) {
    if (offer.good === "grain") n.grain = (n.grain || 0) + offer.cargo;
    else if (offer.good === "timber") n.timber = (n.timber || 0) + offer.cargo;
    else n.ore = (n.ore || 0) + offer.cargo;
    return;
  }
  units.push({ id: nextUnit++, kind: "cog", owner: n.id, x: path[0][0], y: path[0][1], path, pi: 0, dir: 1, cargo: offer.cargo, good: offer.good, men: 0, hull: hullOf(n), dx: dest.x, dy: dest.y, destRealm: dest.realm, destName: dest.name, pts: [[path[0][0], path[0][1]]] });
  chronicle(year, "A merchant ship of " + n.name + " sails for " + dest.name + " with " + offer.good + ".");
}

function stepCog(u) {
  const n = byId(u.owner);
  if (!n || !u.path || u.path.length < 2) return false;
  if (u.destRealm !== n.id) {
    const other = byId(u.destRealm);
    if (!other || n.atWar.has(other.id) || !(n.pact && n.pact[other.id] > year)) return false;
  }
  track(u);
  for (let s = 0; s < hullSteps(u); s++) {
    const next = u.pi + u.dir;
    if (next >= u.path.length) {
      landCargo(u);
      u.dir = -1;
      break;
    }
    if (next < 0) {
      if (u.back) {
        if (u.backGood === "ore") n.ore = Math.min(3500, (n.ore || 0) + u.back);
        else n.timber = Math.min(5000, (n.timber || 0) + u.back);
        u.back = 0;
        u.backGood = "";
      }
      const offer = loadOutbound(n, u.destRealm);
      if (!offer || !takeCargo(n, offer)) return false;
      u.good = offer.good;
      u.cargo = offer.cargo;
      u.dir = 1;
      u.pi = 0;
      break;
    }
    u.pi = next;
    u.x = u.path[u.pi][0];
    u.y = u.path[u.pi][1];
    moved(u);
  }
  return true;
}

function cogSummary(n) {
  if (!units) return "None";
  const list = units.filter(u => u.kind === "cog" && u.owner === n.id);
  if (!list.length) return "None";
  return list.map(u => (u.cargo > 0 ? "Grain aboard, bound for " : "Sailing back from ") + (u.destName || "a port")).join(" · ");
}

function boatsBeside(id) {
  if (!units) return 0;
  let n = 0;
  for (const u of units) {
    if (u.owner === id || u.kind === "host") continue;
    if (!grid[u.y]) continue;
    if (grid[u.y][u.x] === LAND) {
      if (owner[u.y][u.x] === id) n++;
    } else if (neighbors(u.x, u.y).some(([x, y]) => owner[y][x] === id)) n++;
  }
  return n;
}

function homeShore(n) {
  const home = portOf(n);
  if (!home) return [];
  const start = neighbors(home.x, home.y).find(([x, y]) => grid[y][x] !== LAND);
  if (!start) return [];
  const seen = new Set();
  const q = [start];
  const cells = [];
  while (q.length && cells.length < 48) {
    const [x, y] = q.shift();
    const k = key(x, y);
    if (seen.has(k)) continue;
    seen.add(k);
    if (!neighbors(x, y).some(([nx, ny]) => owner[ny][nx] === n.id)) continue;
    cells.push([x, y]);
    for (const [nx, ny] of neighbors(x, y)) {
      if (grid[ny][nx] === LAND || seen.has(key(nx, ny))) continue;
      q.push([nx, ny]);
    }
  }
  return cells;
}

function orderShore(cells, x, y) {
  if (!cells.length) return [];
  const set = new Set(cells.map(([a, b]) => key(a, b)));
  let cur = cells.find(([a, b]) => a === x && b === y) || cells[0];
  const path = [cur];
  const used = new Set([key(cur[0], cur[1])]);
  while (path.length < cells.length) {
    const nxt = neighbors(cur[0], cur[1]).find(([a, b]) => set.has(key(a, b)) && !used.has(key(a, b)));
    if (!nxt) break;
    used.add(key(nxt[0], nxt[1]));
    path.push(nxt);
    cur = nxt;
  }
  return path;
}

function ensureWarships(n) {
  if ((n.age || 0) < 1) return;
  const cap = seaRange(n) >= 22 ? 2 : 1;
  if ((n.sea || 0) < 0.22 || unitCount(n.id, "warship") >= cap) return;
  if (!n.atWar.size && (n.sea || 0) < 0.5) return;
  if ((n.timber || 0) < 14 || (n.treasury || 0) < 40) return;
  const shore = homeShore(n);
  if (shore.length < 1) return;
  const spot = shore[Math.min(shore.length - 1, unitCount(n.id, "warship") * 4)];
  n.timber -= 14;
  n.treasury -= 40;
  const hull = hullOf(n);
  units.push({ id: nextUnit++, kind: "warship", owner: n.id, x: spot[0], y: spot[1], men: 0, cargo: 0, dir: 1, pi: 0, hull, pts: [[spot[0], spot[1]]] });
  const home = portOf(n);
  chronicle(year, n.name + " puts " + (hull === "steam" ? "a steam warship" : hull === "carrack" ? "a carrack" : "a slow warship") + " off " + (home ? home.name : "its coast") + ".");
}

function enemyPort(n) {
  if (!n.atWar || !n.atWar.size) return null;
  const foe = byId([...n.atWar][0]);
  if (!foe) return null;
  const port = portOf(foe);
  if (port) return { x: port.x, y: port.y, name: foe.name };
  const shore = cellsOf(foe.id).find(([x, y]) => coast && coast[y][x]);
  return shore ? { x: shore[0], y: shore[1], name: foe.name } : null;
}

function stepWarship(u) {
  const n = byId(u.owner);
  if (!n) return false;
  if ((n.hungry || 0) > 0.16 || !portOf(n)) {
    chronicle(year, n.name + " lays up a warship. There is not enough food to keep the crew at sea.");
    return false;
  }
  const foe = enemyPort(n);
  if (foe && u.mission !== foe.name) {
    const path = waterPath(u.x, u.y, foe.x, foe.y);
    if (path && path.length > 1) {
      u.path = path;
      u.pi = 0;
      u.dir = 1;
      u.mode = "war";
      u.mission = foe.name;
      chronicle(year, "A warship of " + n.name + " sails for the coast of " + foe.name + ".");
    }
  }
  if (!foe && u.mode === "war") {
    const home = portOf(n);
    const path = home && waterPath(u.x, u.y, home.x, home.y);
    u.mode = "return";
    u.mission = home ? home.name : "home";
    if (path && path.length > 1) { u.path = path; u.pi = 0; u.dir = 1; }
    else { u.mode = "patrol"; u.path = null; }
  }
  if (u.mode === "war" || u.mode === "return") {
    if (!u.path || u.pi + 1 >= u.path.length) {
      if (u.mode === "return") { u.mode = "patrol"; u.path = null; u.mission = null; }
      return true;
    }
    const cell = u.path[u.pi + 1];
    if (!neighbors(u.x, u.y).some(([a, b]) => a === cell[0] && b === cell[1])) {
      u.mode = "patrol";
      u.path = null;
      u.mission = null;
      return true;
    }
    track(u);
    for (let s = 0; s < hullSteps(u) && u.pi + 1 < u.path.length; s++) {
      const step = u.path[u.pi + 1];
      if (!neighbors(u.x, u.y).some(([a, b]) => a === step[0] && b === step[1])) break;
      u.pi += 1;
      u.x = step[0];
      u.y = step[1];
      moved(u);
    }
    return true;
  }
  if (!u.path || u.path.length < 2) {
    u.path = orderShore(homeShore(n), u.x, u.y);
    u.pi = Math.max(0, u.path.findIndex(([a, b]) => a === u.x && b === u.y));
    u.dir = u.dir || 1;
  }
  if (!u.path || u.path.length < 2) return true;
  let next = u.pi + u.dir;
  if (next < 0 || next >= u.path.length) {
    u.dir = -u.dir;
    next = u.pi + u.dir;
  }
  if (next < 0 || next >= u.path.length) return true;
  const cell = u.path[next];
  if (!neighbors(u.x, u.y).some(([a, b]) => a === cell[0] && b === cell[1])) {
    u.path = null;
    return true;
  }
  track(u);
  u.pi = next;
  u.x = cell[0];
  u.y = cell[1];
  moved(u);
  return true;
}

function marchHost(u) {
  const n = byId(u.owner);
  if (!n || !n.atWar.size) return;
  const foeId = [...n.atWar][0];
  if (neighbors(u.x, u.y).some(([nx, ny]) => owner[ny][nx] === foeId)) return;
  const q = [[u.x, u.y]];
  const prev = new Map([[key(u.x, u.y), -1]]);
  let qh = 0;
  let hit = null;
  while (qh < q.length && prev.size < 80) {
    const [x, y] = q[qh++];
    if (!(x === u.x && y === u.y) && neighbors(x, y).some(([nx, ny]) => owner[ny][nx] === foeId) && owner[y][x] === n.id) {
      hit = key(x, y);
      break;
    }
    for (const [nx, ny] of neighbors(x, y)) {
      if (grid[ny][nx] !== LAND || owner[ny][nx] !== n.id) continue;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      prev.set(k, key(x, y));
      q.push([nx, ny]);
    }
  }
  if (hit == null) return;
  let k = hit;
  let step = hit;
  while (prev.get(k) !== -1 && prev.get(k) !== key(u.x, u.y)) {
    step = k;
    k = prev.get(k);
  }
  if (prev.get(k) === key(u.x, u.y)) step = k;
  u.x = step % COLS;
  u.y = (step / COLS) | 0;
  moved(u);
}

function payRealm(n) {
  if (!units) return;
  const armies = units.filter(u => u.kind === "host" && u.owner === n.id);
  const ships = units.filter(u => u.kind === "warship" && u.owner === n.id);
  const merchants = units.filter(u => u.kind === "cog" && u.owner === n.id);
  const coin = armies.length * 36 + ships.length * 22 + merchants.length * 8;
  const wood = ships.length * 2 + merchants.length;
  n.spent = coin;
  if ((n.timber || 0) >= wood) n.timber -= wood;
  else {
    const victim = ships[ships.length - 1] || merchants[merchants.length - 1];
    if (victim) {
      victim.laid = true;
      if ((year + n.id) % 5 === 0) chronicle(year, n.name + " lays up a hull. There is no timber to keep it.");
    }
  }
  if (coin <= 0) return;
  if ((n.treasury || 0) >= coin) {
    n.treasury -= coin;
    for (const u of armies) u.paid = true;
  } else {
    n.treasury = 0;
    n.legitimacy = Math.max(6, (n.legitimacy || 40) - 1.5);
    n.unrest = (n.unrest || 0) + 0.9;
    for (const u of armies) { u.paid = false; u.men = Math.round((u.men || 0) * 0.88); }
    if (armies.length && (year + n.id) % 6 === 0) chronicle(year, n.name + " cannot pay its army.");
  }
}

function ensureAir(n) {
  if ((n.age || 0) < 4 || (n.silicon || 0) < 8 || !n.atWar.size || !n.capital || unitCount(n.id, "air")) return;
  n.silicon -= 8;
  units.push({ id: nextUnit++, kind: "air", owner: n.id, role: "wing", x: n.capital.x, y: n.capital.y, men: 30, pts: [[n.capital.x, n.capital.y]] });
  chronicle(year, n.name + " puts a wing in the air.");
}

function flyWing(u) {
  const n = byId(u.owner);
  if (!n || !n.atWar.size || !n.capital) return;
  const foe = byId([...n.atWar][0]);
  if (!foe || !foe.capital) return;
  track(u);
  for (let s = 0; s < 3; s++) {
    let best = null, bestD = hypot(u.x, u.y, foe.capital);
    for (const [nx, ny] of neighbors(u.x, u.y)) {
      if (grid[ny][nx] !== LAND) continue;
      const d = hypot(nx, ny, foe.capital);
      if (d < bestD) { bestD = d; best = [nx, ny]; }
    }
    if (!best) break;
    u.x = best[0];
    u.y = best[1];
    moved(u);
  }
}

function moveUnits() {
  if (!units) units = [];
  units = units.filter(u => {
    const n = byId(u.owner);
    return n && n.pops > 0;
  });
  for (const n of nations) payRealm(n);
  units = units.filter(u => !u.laid);
  for (const n of nations) {
    if (!n.atWar.size) disbandHosts(n.id);
    else raiseHosts(n);
    ensureCogs(n);
    ensureWarships(n);
    ensureAir(n);
  }
  const keep = [];
  for (const u of units) {
    if (u.kind === "host") {
      const n = byId(u.owner);
      if (!n || !n.atWar.size) continue;
      const local = (pop[u.y] && pop[u.y][u.x]) || 0;
      if (local > 900) u.fed = 1;
      else { u.fed = 0.4; u.men = Math.round((u.men || 0) * 0.9); }
      if ((u.men || 0) < 40) {
        if (owner[u.y] && owner[u.y][u.x] === n.id) pop[u.y][u.x] += u.men;
        continue;
      }
      track(u);
      marchHost(u);
      keep.push(u);
    } else if (u.kind === "air") {
      const n = byId(u.owner);
      if (!n || !n.atWar.size) continue;
      flyWing(u);
      keep.push(u);
    } else if (u.kind === "barge") {
      if (stepBarge(u)) keep.push(u);
    } else if (u.kind === "cog") {
      if (stepCog(u)) keep.push(u);
    } else if (u.kind === "warship") {
      if (stepWarship(u)) keep.push(u);
    }
  }
  units = keep;
}

function considerCollapse(n) {
  if (!nations.includes(n) || !n.atWar.size || n.pops > 24 || n.stability > 24 || year - n.born < 30) return;
  const cells = cellsOf(n.id);
  if (cells.length < 2) return;
  const who = annex(cells);
  n.pops = 0;
  chronicle(year, who
    ? n.name + " breaks under the war. " + who.name + " occupies what remains."
    : n.name + " breaks under the war, and the land lies empty.");
}

function provinceStrain(n, x, y) {
  const d = hypot(x, y, n.capital);
  const R = rules(n.gov);
  const souls = (pop && pop[y][x]) || 0;
  const sea = coast && coast[y][x];
  let s = d > 11 ? (d - 11) * (1.2 - R.hold) * 0.18 : 0;
  if (souls < 1600 && !sea && R.trade > 0.6) s += 1.35;
  if (n.gov === "Dictatorship" && (n.legitimacy || 60) < 48) s += 1.5;
  if (n.gov === "Theocracy" && belief && belief[y][x] && belief[y][x][n.faith] < 0.34 && d > 8) s += (0.34 - belief[y][x][n.faith]) * 3.2;
  if ((n.treasury || 0) < 40 && d > 10) s += 0.85;
  if (n.gov === "Dictatorship" && (n.hungry || 0) > 0.05 && d > 8) s += 0.9;
  if (resource && resource[y][x] && d > 12 && (n.gov === "Oligarchy" || (n.treasury || 0) < 50)) s += 0.75;
  if (n.gov === "Monarchy" && d < 18) s *= 0.4;
  return s;
}

function considerRevolt(n) {
  if (!nations.includes(n) || n.atWar.size || year < (n.quietUntil || 0)) return;
  const cells = cellsOf(n.id);
  if (cells.length < 80 || (n.reach || 0) < 16) { n.unrest = Math.max(0, (n.unrest || 0) - 6); return; }
  const strained = cells.filter(([x, y]) => provinceStrain(n, x, y) > 1.15);
  if (strained.length < 8) { n.unrest = Math.max(0, (n.unrest || 0) - 6); return; }
  const region = components(strained).find(c => c.length >= 8);
  if (!region) { n.unrest = Math.max(0, (n.unrest || 0) - 6); return; }
  const cap = Math.min(14, Math.max(8, Math.floor(n.pops * 0.05)));
  let hx = region[0][0], hy = region[0][1], hd = -1;
  for (const [x, y] of region) {
    const d = hypot(x, y, n.capital);
    if (d > hd) { hd = d; hx = x; hy = y; }
  }
  const farSet = new Set(region.map(([x, y]) => key(x, y)));
  const blob = [];
  const seen = new Set([key(hx, hy)]);
  const q = [[hx, hy]];
  while (q.length && blob.length < cap) {
    q.sort((a, b) => hypot(b[0], b[1], n.capital) - hypot(a[0], a[1], n.capital));
    const [x, y] = q.shift();
    blob.push([x, y]);
    for (const [nx, ny] of neighbors(x, y)) {
      const k = key(nx, ny);
      if (seen.has(k) || !farSet.has(k)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  if (blob.length < 8) { n.unrest = Math.max(0, (n.unrest || 0) - 5); return; }
  const take = new Set(blob.map(([x, y]) => key(x, y)));
  const remain = cells.filter(([x, y]) => !take.has(key(x, y)));
  if (components(remain).length !== 1 || remain.length < n.pops * 0.86) {
    n.unrest = Math.max(0, (n.unrest || 0) - 5);
    return;
  }
  let gain = 4 + blob.reduce((s, [x, y]) => s + provinceStrain(n, x, y), 0) / blob.length;
  if ((n.legitimacy || 60) < 45) gain += 2;
  const biggest = nations.reduce((m, o) => Math.max(m, o.pops), 0);
  if (n.pops >= biggest) gain *= 0.55;
  n.unrest = (n.unrest || 0) + gain;
  if (n.unrest < 100) return;
  const babyName = nameRealm();
  let oreN = 0, woodN = 0;
  if (resource) for (const [x, y] of blob) { if (resource[y][x] === 2) oreN++; else if (resource[y][x] === 1) woodN++; }
  const why = oreN >= 3 ? "keeps the ore and will not send it to the capital"
    : woodN >= 4 ? "keeps the timber and will not send it to the capital"
    : (n.treasury || 0) < 30 && n.gov === "Republic" ? "is poor, and a republic holds together by prosperity"
    : n.gov === "Theocracy" ? "does not share the capital's cult"
    : n.gov === "Dictatorship" ? "stops obeying the dictatorship"
    : n.gov === "Republic" ? "is poor, and a republic holds together by prosperity"
    : n.gov === "Oligarchy" ? "is inland, and the oligarchy spends on the ports"
    : "is farther than the monarchy can govern";
  const babyGov = n.gov === "Republic" ? "Republic" : n.gov === "Dictatorship" ? "Dictatorship" : n.gov === "Theocracy" ? "Theocracy" : "Monarchy";
  const baby = found(hx, hy, babyName, colors[ri(colors.length)], "A march of " + n.name + " " + why + ". " + babyName + " breaks away.", babyGov, topFaith(hx, hy), n);
  for (const [x, y] of blob) claim(x, y, baby.id);
  baby.capital = { x: hx, y: hy };
  baby.quietUntil = year + 180;
  baby.unrest = 0;
  n.unrest = 0;
  n.stability = Math.min(78, n.stability + 8);
  n.quietUntil = year + 180;
  makePeace(n, baby, 80);
}


function keepWhole() {
  for (const n of nations.slice()) {
    if (!nations.includes(n)) continue;
    const cells = cellsOf(n.id);
    if (cells.length < 2) continue;
    const comps = components(cells);
    if (comps.length < 2) continue;
    const main = comps[0];
    for (let i = 1; i < comps.length; i++) {
      const chunk = comps[i];
      if (seaSupplied(n, chunk)) continue;
      if (chunk.length <= 12) {
        const who = annex(chunk);
        if (who && chunk.length >= 4) chronicle(year, who.name + " occupies ground cut off from " + n.name + ".");
      } else {
        peel(chunk, 3);
        if (!n.severNote || year > n.severNote) {
          chronicle(year, n.name + " is cut off from part of its land. Neighbors occupy it. No new crown is raised.");
          n.severNote = year + 40;
        }
      }
    }
  }
}

function annex(chunk) {
  const mine = new Set(chunk.map(([x, y]) => key(x, y)));
  const counts = {};
  for (const [x, y] of chunk) {
    for (const [nx, ny] of neighbors(x, y)) {
      if (mine.has(key(nx, ny))) continue;
      const o = owner[ny][nx];
      if (o >= 0) counts[o] = (counts[o] || 0) + 1;
    }
  }
  let best = -1, bestN = 0;
  for (const id of Object.keys(counts)) if (counts[id] > bestN) { bestN = counts[id]; best = Number(id); }
  for (const [x, y] of chunk) claim(x, y, best);
  return best >= 0 ? byId(best) : null;
}

function peel(chunk, limit) {
  const mine = new Set(chunk.map(([x, y]) => key(x, y)));
  const edge = [];
  for (const [x, y] of chunk) {
    for (const [nx, ny] of neighbors(x, y)) {
      if (mine.has(key(nx, ny))) continue;
      const o = owner[ny][nx];
      if (o >= 0) edge.push([x, y, o]);
    }
  }
  const seen = new Set();
  let k = 0;
  for (const [x, y, o] of edge) {
    const kk = key(x, y);
    if (seen.has(kk)) continue;
    seen.add(kk);
    claim(x, y, o);
    if (++k >= limit) break;
  }
}

function absorbTiny() {
  for (const n of nations.slice()) {
    if (!nations.includes(n) || n.pops >= 8 || year - n.born < 50) continue;
    const cells = cellsOf(n.id);
    if (!cells.length) continue;
    const who = annex(cells);
    chronicle(year, who ? n.name + " is too small to stand. " + who.name + " absorbs it." : n.name + " fades into empty land.");
    n.pops = 0;
  }
  nations = nations.filter(n => n.pops > 0);
}

function seedEmptyContinent() {
  const seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (seen[y][x] || grid[y][x] !== LAND) continue;
      const q = [[x, y]];
      const blob = [];
      let owned = 0;
      seen[y][x] = true;
      while (q.length) {
        const [cx, cy] = q.shift();
        blob.push([cx, cy]);
        if (owner[cy][cx] >= 0) owned++;
        for (const [nx, ny] of neighbors(cx, cy)) {
          if (!seen[ny][nx] && grid[ny][nx] === LAND) { seen[ny][nx] = true; q.push([nx, ny]); }
        }
      }
      if (owned === 0 && blob.length >= 40 && nations.length < 14) {
        const [sx, sy] = blob[Math.floor(blob.length / 2)];
        const shore = nameRealm();
        const g = pickGov(sx, sy);
        const n = found(sx, sy, shore, colors[ri(colors.length)], shore + " is founded on an empty shore as " + govArticle(g) + ".", g);
        claimDisk(n, 3);
        return;
      }
    }
  }
}

function muster(n) {
  const R = rules(n.gov);
  const leg = (n.legitimacy || 60) / 100;
  const homo = n.homo || 0.7;
  return (n.people || n.pops * 1200) * R.military * (0.5 + 0.5 * leg) * (0.72 + 0.28 * homo);
}

function seedPop() {
  pop = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] !== LAND) continue;
    const h = (Math.imul(x + 3, 374761393) ^ Math.imul(y + 5, 668265263)) >>> 0;
    let p = 800 + (h % 1600);
    if (coast[y][x]) p = Math.round(p * 0.82);
    pop[y][x] = p;
  }
}

function demography() {
  if (!pop) return;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] !== LAND) continue;
    const id = owner[y][x];
    const n = id >= 0 ? byId(id) : null;
    const K = capacity(x, y);
    let r = 0.008;
    if (n) {
      r *= rules(n.gov).grow;
      const leg = n.legitimacy || 60;
      if (leg > 72) r *= 1.12;
      if (leg < 42) r *= 0.66;
      if ((n.treasury || 0) < 30) r *= 0.82;
      if (resource && resource[y][x]) r *= 1.08;
      if (n.gov === "Dictatorship" && (n.hungry || 0) > 0.06) r *= 0.84;
      if (n.gov === "Theocracy" && belief && belief[y] && belief[y][x]) r *= 0.5 + (belief[y][x][n.faith] || 0);
      if (n.gov === "Dictatorship" && n.atWar.size) r *= 0.7;
    }
    let p = pop[y][x] || 400;
    p += p * r * (1 - p / K);
    if (n && n.atWar.size) {
      const edge = neighbors(x, y).some(([nx, ny]) => owner[ny][nx] >= 0 && owner[ny][nx] !== id);
      p *= edge ? 0.972 : 0.994;
    }
    pop[y][x] = Math.max(120, Math.round(p));
  }
  for (const c of cities) {
    const id = owner[c.y][c.x];
    if (id < 0) continue;
    const n = byId(id);
    const seat = n && n.seat === c.id;
    const tier = tierAt(c.rank);
    const rad = [2.4, 3.6, 5, 6, 7][tier] + (seat ? 1 : 0);
    const pull = [0.05, 0.1, 0.14, 0.16, 0.18][tier] + (seat ? 0.02 : 0);
    let moved = 0;
    for (let y = Math.max(0, c.y - 8); y <= Math.min(ROWS - 1, c.y + 8); y++) {
      for (let x = Math.max(0, c.x - 8); x <= Math.min(COLS - 1, c.x + 8); x++) {
        if (grid[y][x] !== LAND || owner[y][x] !== id || (x === c.x && y === c.y)) continue;
        if (cities.some(o => o.x === x && o.y === y)) continue;
        const dist = Math.hypot(x - c.x, y - c.y);
        if (dist > rad) continue;
        const surplus = (pop[y][x] || 0) - capacity(x, y);
        if (surplus < 40) continue;
        const take = Math.min(pop[y][x] - 160, Math.round(surplus * pull * (1 - dist / rad)));
        if (take <= 0) continue;
        pop[y][x] -= take;
        moved += take;
      }
    }
    pop[c.y][c.x] += moved;
  }
  settleRanks();
}

function landYield(x, y) {
  let yld = 1550;
  const kind = siteKind(x, y);
  if (kind === "river" || kind === "mouth") yld += 680;
  if (kind === "mouth") yld += 180;
  if (kind === "coast") yld += 100;
  yld *= 1.04 - coldAt(x, y) * 0.5;
  const id = owner[y][x];
  const n = id >= 0 ? byId(id) : null;
  if (n && n.atWar.size) {
    const edge = neighbors(x, y).some(([nx, ny]) => owner[ny][nx] >= 0 && owner[ny][nx] !== id);
    yld *= edge ? 0.6 : 0.88;
  }
  if (cities.some(c => c.x === x && c.y === y)) yld *= 0.25;
  if (basin && dry && basin[y][x] && dry[basin[y][x]] > year) yld *= 0.42;
  return Math.max(60, yld);
}

function feed() {
  if (!pop || !owner) return;
  for (const n of nations) { n.grain = 0; n.hungryPeople = 0; n.hungry = 0; }
  const need = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const have = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const surplus = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const placeAt = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (const c of cities) placeAt[c.y][c.x] = c;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] !== LAND) continue;
    const city = placeAt[y][x];
    const eats = (pop[y][x] || 0) * (city ? [1.04, 1.12, 1.32, 1.52, 1.72][tierAt(city.rank)] : 1);
    const yld = landYield(x, y);
    need[y][x] = eats;
    have[y][x] = Math.min(eats, yld);
    surplus[y][x] = Math.max(0, yld - eats);
  }
  if (pendingFood && pendingFood.size) {
    for (const [k, amt] of pendingFood) {
      const x = k % COLS, y = (k / COLS) | 0;
      if (have[y]) have[y][x] += amt;
    }
    pendingFood = new Map();
  }
  const places = cities.slice().sort((a, b) => tierAt(a.rank) - tierAt(b.rank));
  for (const c of places) {
    const id = owner[c.y][c.x];
    if (id < 0) continue;
    let want = need[c.y][c.x] - have[c.y][c.x];
    if (want <= 0) continue;
    const rad = [1.6, 2.2, 3, 3.4, 3.8][tierAt(c.rank)];
    const near = [];
    for (let y = Math.max(0, c.y - 4); y <= Math.min(ROWS - 1, c.y + 4); y++) {
      for (let x = Math.max(0, c.x - 4); x <= Math.min(COLS - 1, c.x + 4); x++) {
        if (grid[y][x] !== LAND || surplus[y][x] <= 0 || owner[y][x] !== id || placeAt[y][x]) continue;
        const d = Math.hypot(x - c.x, y - c.y);
        if (d > rad) continue;
        near.push([x, y, d]);
      }
    }
    near.sort((a, b) => a[2] - b[2]);
    for (const [x, y] of near) {
      if (want <= 0) break;
      const take = Math.min(surplus[y][x], want);
      surplus[y][x] -= take;
      have[c.y][c.x] += take;
      want -= take;
    }
  }
  const stream = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (river && river[y][x] >= 12) stream.push([x, y]);
  stream.sort((a, b) => river[a[1]][a[0]] - river[b[1]][b[0]]);
  const inbound = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  for (const [x, y] of stream) {
    let grain = surplus[y][x] + inbound[y][x];
    surplus[y][x] = 0;
    const want = Math.max(0, need[y][x] - have[y][x]);
    const eat = Math.min(grain, want);
    have[y][x] += eat;
    grain -= eat;
    const nx = flowToX[y][x], ny = flowToY[y][x];
    if (nx < 0) continue;
    const id = owner[y][x];
    if (id >= 0 && grain > 400) {
      const load = launchBarge(x, y, id, Math.min(grain * 0.45, 2000));
      grain -= load;
    }
    if (grid[ny][nx] !== LAND) {
      const n = id >= 0 ? byId(id) : null;
      if (n) {
        let credit = grain;
        if (n.gov === "Oligarchy") credit *= 1.5;
        else if (n.gov === "Republic") credit *= 1.25;
        else if (n.gov === "Monarchy") credit *= 0.85;
        n.grain += credit;
      }
      continue;
    }
    const downId = owner[ny][nx];
    if (id >= 0 && downId >= 0 && id !== downId) {
      const a = byId(id), b = byId(downId);
      const war = a && b && (a.atWar.has(b.id) || b.atWar.has(a.id));
      if (war) {
        if (b) b.grain += grain * 0.35;
        grain = 0;
      } else if (a && b && pactOn(a, b.id)) {
        inbound[ny][nx] += grain;
        grain = 0;
      } else if (a && b) {
        a.grain += grain;
        if (grain > 500) {
          if (!a.grievance) a.grievance = {};
          if (!a.gnote) a.gnote = {};
          a.grievance[b.id] = Math.min(70, (a.grievance[b.id] || 0) + 1.2);
          a.gnote[b.id] = "because the grain stops at the border";
        }
        grain = 0;
      }
    }
    inbound[ny][nx] += grain;
  }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] !== LAND) continue;
    const eats = need[y][x];
    if (eats < 40) continue;
    const ratio = Math.min(1, have[y][x] / eats);
    const city = placeAt[y][x];
    if (city) city.fed = ratio;
    if (!ration) ration = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
    ration[y][x] = ratio;
    const n = owner[y][x] >= 0 ? byId(owner[y][x]) : null;
    if (n && ratio < 0.9) n.hungryPeople += pop[y][x] || 0;
    if (city && ratio < 0.7 && n && (year + city.id) % 13 === 0) chronicle(year, city.name + " hungers. The country upriver is not feeding it.");
  }
  for (const n of nations) {
    const souls = cellsOf(n.id).reduce((s, [x, y]) => s + (pop[y][x] || 0), 0);
    n.hungry = souls ? (n.hungryPeople || 0) / souls : 0;
  }
  settleRanks();
}

function markCoast() {
  coast = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== LAND) continue;
      if (neighbors(x, y).some(([nx, ny]) => grid[ny][nx] !== LAND)) coast[y][x] = true;
    }
  }
}

