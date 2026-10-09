function tint(hex, toward, p) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = parseInt(toward.slice(1), 16);
  const tr = (t >> 16) & 255, tg = (t >> 8) & 255, tb = t & 255;
  r = Math.round(r + (tr - r) * p);
  g = Math.round(g + (tg - g) * p);
  b = Math.round(b + (tb - b) * p);
  return "rgb(" + r + "," + g + "," + b + ")";
}

function dotRadius(c, cw, ch) {
  const souls = (pop && pop[c.y] && pop[c.y][c.x]) || 0;
  const size = [0.075, 0.11, 0.16, 0.22, 0.3][tierAt(c.rank)];
  const grow = 0.75 + Math.min(0.6, souls / 14000);
  return Math.max(1.15, Math.min(cw, ch) * size * grow);
}
function drawPlace(c, core, cw, ch) {
  const rad = dotRadius(c, cw, ch);
  const cx = (c.x + 0.5) * cw, cy = (c.y + 0.5) * ch;
  const tier = tierAt(c.rank);
  ctx.lineWidth = 1;
  if (tier >= 3) {
    ctx.beginPath(); ctx.arc(cx, cy, rad * 1.55, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(244,247,252,0.45)"; ctx.stroke();
  }
  if (tier >= 4) {
    ctx.beginPath(); ctx.arc(cx, cy, rad * 1.95, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(244,247,252,0.28)"; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fillStyle = "#f4f7fc"; ctx.fill();
  if (core) {
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(1.2, rad * 0.46), 0, Math.PI * 2); ctx.fillStyle = core; ctx.fill();
  }
}
function glide() {
  const f = Math.max(0, Math.min(1, (acc || 0) / 280));
  return f * f * (3 - 2 * f);
}
function placeOf(u) {
  const pts = u.pts;
  if (!pts || pts.length < 2) return { x: u.x + 0.5, y: u.y + 0.5, hdg: -Math.PI / 2 };
  const span = glide() * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(span));
  const t = span - i;
  const a = pts[i], b = pts[i + 1];
  let dx = b[0] - a[0];
  if (dx > COLS / 2) dx -= COLS;
  if (dx < -COLS / 2) dx += COLS;
  const dy = b[1] - a[1];
  if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) return { x: u.x + 0.5, y: u.y + 0.5, hdg: -Math.PI / 2 };
  return { x: a[0] + dx * t + 0.5, y: a[1] + dy * t + 0.5, hdg: Math.atan2(dy, dx) };
}
function drawBoat(x, y, color, hdg, scale, mast) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((hdg == null ? -Math.PI / 2 : hdg) + Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(0, -4.2 * scale);
  ctx.quadraticCurveTo(2.8 * scale, -1.2 * scale, 2.3 * scale, 2.4 * scale);
  ctx.lineTo(-2.3 * scale, 2.4 * scale);
  ctx.quadraticCurveTo(-2.8 * scale, -1.2 * scale, 0, -4.2 * scale);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(6,8,12,0.9)";
  ctx.lineWidth = 1;
  ctx.stroke();
  if (mast) {
    ctx.beginPath();
    ctx.moveTo(0, 1.2 * scale);
    ctx.lineTo(0, -6.4 * scale);
    ctx.strokeStyle = "#f4f7fc";
    ctx.lineWidth = Math.max(0.6, scale * 0.7);
    ctx.stroke();
    if (mast === "war") {
      ctx.beginPath();
      ctx.moveTo(0.4, -5.6 * scale);
      ctx.lineTo(3.2 * scale, -4.5 * scale);
      ctx.lineTo(0.4, -3.6 * scale);
      ctx.fillStyle = "#f4f7fc";
      ctx.fill();
    }
  }
  ctx.restore();
}
function drawUnits(cw, ch) {
  if (!units) return;
  for (const u of units) {
    if (u.kind !== "cog" || !u.path) continue;
    const n = byId(u.owner);
    if (!n) continue;
    ctx.beginPath();
    let open = false;
    for (let i = 0; i < u.path.length; i++) {
      const px = (u.path[i][0] + 0.5) * cw, py = (u.path[i][1] + 0.5) * ch;
      if (i > 0 && Math.abs(u.path[i][0] - u.path[i - 1][0]) > 2) open = false;
      if (!open) { ctx.moveTo(px, py); open = true; }
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = n.color;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const u of units) {
    const n = byId(u.owner);
    if (!n) continue;
    const p = placeOf(u);
    const x = p.x * cw, y = p.y * ch;
    if (u.kind === "host") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = n.color;
      ctx.strokeStyle = u.fed < 0.7 ? "rgba(244,247,252,0.35)" : "#f4f7fc";
      ctx.lineWidth = 1;
      const s = Math.max(2.4, Math.min(cw, ch) * 0.18);
      ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.restore();
    } else if (u.kind === "barge") drawBoat(x, y, n.color, p.hdg, 0.62, null);
    else if (u.kind === "cog") drawBoat(x, y, n.color, p.hdg, 1, "cog");
    else if (u.kind === "warship") drawBoat(x, y, n.color, p.hdg, 1.35, "war");
  }
}
function render() {
  const cw = canvas.width / COLS, ch = canvas.height / ROWS;
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#10192c");
  sky.addColorStop(1, "#070b14");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(170,198,230,0.045)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x += 10) {
    ctx.beginPath(); ctx.moveTo(x * cw, 0); ctx.lineTo(x * cw, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y += 10) {
    ctx.beginPath(); ctx.moveTo(0, y * ch); ctx.lineTo(canvas.width, y * ch); ctx.stroke();
  }
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== LAND) continue;
      const id = owner[y][x];
      let fill = "#3a463c";
      if (mapMode === "faith" && belief && belief[y][x]) {
        fill = mixFaithColor(belief[y][x]);
      } else if (id >= 0) {
        const base = byId(id)?.color || "#888888";
        fill = tint(base, "#ffffff", Math.max(0, Math.min(0.1, ((pop && pop[y][x]) || 1000) / 36000)));
        if (mapMode === "goods") fill = tint(fill, "#10140e", 0.34);
      }
      ctx.fillStyle = fill;
      ctx.fillRect(x * cw, y * ch, Math.ceil(cw) + 0.5, Math.ceil(ch) + 0.5);
    }
  }
  if (selected != null) {
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (owner[y][x] === selected) ctx.fillRect(x * cw, y * ch, Math.ceil(cw) + 0.5, Math.ceil(ch) + 0.5);
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(214,226,214,0.38)";
  ctx.beginPath();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== LAND) continue;
      const east = (x + 1) % COLS;
      const west = (x + COLS - 1) % COLS;
      if (grid[y][east] !== LAND) { ctx.moveTo((x + 1) * cw, y * ch); ctx.lineTo((x + 1) * cw, (y + 1) * ch); }
      if (y === ROWS - 1 || grid[y + 1][x] !== LAND) { ctx.moveTo(x * cw, (y + 1) * ch); ctx.lineTo((x + 1) * cw, (y + 1) * ch); }
      if (grid[y][west] !== LAND) { ctx.moveTo(x * cw, y * ch); ctx.lineTo(x * cw, (y + 1) * ch); }
      if (y === 0 || grid[y - 1][x] !== LAND) { ctx.moveTo(x * cw, y * ch); ctx.lineTo((x + 1) * cw, y * ch); }
    }
  }
  ctx.stroke();
  if (river && flowToX) {
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (river[y][x] < 28 || flowToX[y][x] < 0 || Math.abs(flowToX[y][x] - x) > 2) continue;
      ctx.moveTo((x + 0.5) * cw, (y + 0.5) * ch);
      ctx.lineTo((flowToX[y][x] + 0.5) * cw, (flowToY[y][x] + 0.5) * ch);
    }
    ctx.strokeStyle = "rgba(126,184,204,0.85)";
    ctx.lineWidth = 1.35;
    ctx.stroke();
    ctx.beginPath();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (river[y][x] < 11 || river[y][x] >= 28 || flowToX[y][x] < 0 || Math.abs(flowToX[y][x] - x) > 2) continue;
      ctx.moveTo((x + 0.5) * cw, (y + 0.5) * ch);
      ctx.lineTo((flowToX[y][x] + 0.5) * cw, (flowToY[y][x] + 0.5) * ch);
    }
    ctx.strokeStyle = "rgba(150,198,214,0.65)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.strokeStyle = mapMode === "faith" ? "rgba(244,247,252,0.62)" : "rgba(8,10,14,0.72)";
  ctx.beginPath();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const id = owner[y][x];
      if (id < 0) continue;
      const east = (x + 1) % COLS;
      if (grid[y][east] === LAND && owner[y][east] !== id) {
        ctx.moveTo((x + 1) * cw, y * ch); ctx.lineTo((x + 1) * cw, (y + 1) * ch);
      }
      if (y < ROWS - 1 && grid[y + 1][x] === LAND && owner[y + 1][x] !== id) {
        ctx.moveTo(x * cw, (y + 1) * ch); ctx.lineTo((x + 1) * cw, (y + 1) * ch);
      }
    }
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.88)";
  ctx.beginPath();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (owner[y][x] !== selected) continue;
      const east = (x + 1) % COLS;
      if (grid[y][east] === LAND && owner[y][east] !== selected) { ctx.moveTo((x + 1) * cw, y * ch); ctx.lineTo((x + 1) * cw, (y + 1) * ch); }
      if (y < ROWS - 1 && grid[y + 1][x] === LAND && owner[y + 1][x] !== selected) { ctx.moveTo(x * cw, (y + 1) * ch); ctx.lineTo((x + 1) * cw, (y + 1) * ch); }
    }
  }
  ctx.stroke();
  drawGoods(cw, ch);
  drawUnits(cw, ch);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0.14em";
  for (const n of nations) {
    if (!n.label || n.pops < 36) continue;
    const px = (n.label.x + 0.5) * cw, py = (n.label.y + 0.5) * ch;
    const size = n.pops > 220 ? 15 : n.pops > 90 ? 13 : 11;
    ctx.font = "600 " + size + "px \"Barlow Condensed\", \"Arial Narrow\", sans-serif";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(6,8,12,0.82)";
    ctx.strokeText(n.name.toUpperCase(), px, py);
    ctx.fillStyle = n.id === selected ? "#ffffff" : "rgba(244,247,252,0.88)";
    ctx.fillText(n.name.toUpperCase(), px, py);
  }
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  for (const c of cities) {
    if (!owner[c.y] || owner[c.y][c.x] < 0) continue;
    if (nations.some(n => n.seat === c.id && n.pops > 0)) continue;
    drawPlace(c, null, cw, ch);
  }
  for (const n of nations) {
    const seat = cities.find(c => c.id === n.seat);
    if (!seat || !owner[seat.y] || owner[seat.y][seat.x] !== n.id) continue;
    drawPlace(seat, n.color, cw, ch);
  }
}

function drawGoods(cw, ch) {
  if (mapMode !== "goods" || !resource) return;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const g = resource[y][x];
    if (!g) continue;
    const inset = g === 1 ? 0.18 : 0.3;
    ctx.fillStyle = g === 1 ? "rgba(126,168,92,0.95)" : "rgba(196,150,88,0.96)";
    ctx.fillRect((x + inset) * cw, (y + inset) * ch, Math.max(1, cw * (1 - inset * 2)), Math.max(1, ch * (1 - inset * 2)));
  }
  ctx.font = "500 11px \"IBM Plex Mono\", ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(8,10,14,0.72)";
  ctx.fillRect(12, canvas.height - 36, 132, 22);
  ctx.fillStyle = "#7ea85c";
  ctx.fillRect(18, canvas.height - 29, 8, 8);
  ctx.fillStyle = "#c49658";
  ctx.fillRect(78, canvas.height - 29, 8, 8);
  ctx.fillStyle = "#f4f7fc";
  ctx.fillText("Timber", 30, canvas.height - 25);
  ctx.fillText("Ore", 90, canvas.height - 25);
}

function fmt(n) {
  n = Math.round(n || 0);
  if (n >= 1000000) return (n / 1000000).toFixed(2) + "m";
  if (n >= 10000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1) + "k";
  return String(n);
}

function row(label, value) {
  return '<div class="row"><span>' + label + '</span><b>' + value + '</b></div>';
}
function vital(label, value) {
  return '<div class="vital"><span>' + label + '</span><b>' + value + '</b></div>';
}
function meter(pct) {
  const w = Math.max(0, Math.min(100, Math.round(pct)));
  return '<div class="meter"><i style="width:' + w + '%"></i></div>';
}
function faithBar(shares, total) {
  const t = total || (shares ? shares.reduce((s, n) => s + n, 0) : 0) || 1;
  let html = '<div class="mix">';
  for (let i = 0; i < 3; i++) html += '<i style="width:' + ((shares[i] || 0) / t * 100) + '%;background:' + faithColor(i) + '"></i>';
  return html + "</div>";
}
function sheetNav() {
  return '<div class="sheets">' + [["brief", "Brief"], ["country", "Country"], ["rule", "Rule"], ["coin", "Coin"], ["water", "Water"]].map(([id, label]) =>
    '<button type="button" data-sheet="' + id + '"' + (sheet === id ? ' class="on"' : "") + ">" + label + "</button>").join("") + "</div>";
}
function bindPanel() {
  const panel = document.getElementById("panel");
  if (!panel) return;
  panel.querySelectorAll("[data-sheet]").forEach(b => { b.onclick = () => { sheet = b.dataset.sheet; drawUI(); }; });
  panel.querySelectorAll("li[data-id]").forEach(li => { li.onclick = () => { selected = Number(li.dataset.id); tab = "realm"; drawUI(); }; });
}
function pactNames(n) {
  if (!n.pact) return "None";
  const names = [];
  for (const id of Object.keys(n.pact)) {
    if (!(n.pact[id] > year)) continue;
    const o = byId(Number(id));
    if (o) names.push(o.name);
  }
  return names.length ? names.join(", ") : "None";
}
function cityLines(n) {
  const list = cities.filter(c => owner[c.y] && owner[c.y][c.x] === n.id)
    .sort((a, b) => ((pop[b.y] && pop[b.y][b.x]) || 0) - ((pop[a.y] && pop[a.y][a.x]) || 0))
    .slice(0, 6);
  if (!list.length) return "";
  return '<div class="kicker">PLACES</div>' + list.map(c => {
    const seat = n.seat === c.id ? "Capital · " : "";
    const fed = c.fed != null && c.fed < 0.9 ? " · hungry" : "";
    return row(c.name, seat + c.rank + fed);
  }).join("");
}
function cogLines(n) {
  const list = (units || []).filter(u => u.kind === "cog" && u.owner === n.id);
  if (!list.length) return '<p class="quiet-line">No merchant is sailing. One sails when there is grain, timber, or ore to sell to a colony or a partner.</p>';
  return list.map(u => {
    const way = u.cargo > 0 ? (u.good || "grain") + " to " : (u.backGood ? u.backGood + " home from " : "home from ");
    return '<p class="quiet-line">Merchant · ' + way + (u.destName || "a port") + '.</p>';
  }).join("");
}
function bargeLines(n) {
  const list = (units || []).filter(u => u.kind === "barge" && u.owner === n.id);
  if (!list.length) return row("Barges", "None") + '<p class="quiet-line">No surplus is moving down this river.</p>';
  return row("Barges", list.length) + list.slice(0, 4).map(u => '<p class="quiet-line">Carrying grain to ' + (u.destName || "a city") + '.</p>').join("");
}
function partyBlock(n) {
  if (n.gov !== "Republic" || !n.parties || !n.parties.length) return '<p class="quiet-line">This state does not hold a vote.</p>';
  const t = n.parties.reduce((s, f) => s + f.w, 0) || 1;
  return n.parties.map(f => {
    const pct = Math.round(100 * f.w / t);
    return row(f.name, pct + "%") + meter(pct);
  }).join("");
}
function realmBrief(n, foe) {
  const shares = n.believers || [0, 0, 0];
  return '<div class="vitals">'
    + vital("People", fmt(n.people))
    + vital("Hungry", Math.round((n.hungry || 0) * 100) + "%")
    + vital("Legitimacy", Math.round(n.legitimacy || 0))
    + vital("Provinces", n.pops || 0)
    + "</div>"
    + '<div class="kicker">FAITH HERE</div>'
    + faithBar(shares)
    + [0, 1, 2].map(i => row(faithName(i), Math.round((n.people ? shares[i] / n.people : 0) * 100) + "%")).join("")
    + '<p class="quiet-line">' + (foe ? "At war with " + foe.name + "." : "At peace.")
    + (n.parched ? " Drought on the river." : "")
    + " Seamanship: " + seaWord(n) + ".</p>";
}
function realmCountry(n) {
  const seat = cities.find(c => c.id === n.seat);
  return row("Population", fmt(n.people))
    + row("Per province", fmt(n.pops ? n.people / n.pops : 0))
    + row("Provinces", n.pops || 0)
    + row("Hungry", Math.round((n.hungry || 0) * 100) + "%")
    + row("Grain at the ports", fmt(n.grain || 0))
    + row("Fields", n.parched ? "Drought" : "Ordinary")
    + row("Seat", seat ? seat.name : "—")
    + cityLines(n);
}
function realmCoin(n) {
  const rate = Math.round(taxRate(n) * 100);
  const why = n.gov === "Dictatorship" ? "A dictatorship taxes hard, and pays the army with it. Hungry people resent the levy."
    : n.gov === "Republic" ? "A republic taxes lightly. Prosperity is the country itself, not the treasury."
    : n.gov === "Oligarchy" ? "An oligarchy taxes lightly and takes its coin from the ports."
    : n.gov === "Theocracy" ? "A theocracy takes a tithe. It sits worse where the cult is not the faith of the people."
    : "A monarchy taxes the produce and is judged by whether the treasury can still pay.";
  return row("Treasury", fmt(n.treasury))
    + row("Tax", rate + "% · " + fmt(n.taxTake) + " this year")
    + row("Spent on arms", fmt(n.spent))
    + row("Prosperity", fmt(n.wealth))
    + row("Timber", fmt(n.timber) + (n.cutTimber ? " · " + fmt(n.cutTimber) + " cut" : ""))
    + row("Ore", fmt(n.ore) + (n.dugOre ? " · " + fmt(n.dugOre) + " dug" : ""))
    + row("Grain at the ports", fmt(n.grain))
    + row("Last trade", n.lastTrade || "None")
    + '<p class="quiet-line">' + why + ' Timber and ore far from a river, a coast, or a town barely reach the treasury. A broke realm settles less, fights worse, and loses people to anywhere that can pay.</p>';
}

function realmRule(n) {
  return row("Government", govLabel(n.gov))
    + row("Legitimacy", Math.round(n.legitimacy || 0))
    + meter(n.legitimacy || 0)
    + row("Stability", Math.round(n.stability || 0))
    + meter(n.stability || 0)
    + row("Unrest", Math.round(n.unrest || 0))
    + meter(Math.min(100, n.unrest || 0))
    + row("Prosperity", fmt(n.wealth))
    + '<div class="kicker">PARTIES</div>'
    + partyBlock(n);
}
function realmWater(n) {
  const hulls = unitCount(n.id, "warship") + unitCount(n.id, "cog") + unitCount(n.id, "barge");
  return row("Hulls on the map", hulls)
    + row("Warships", unitCount(n.id, "warship"))
    + row("Armies", unitCount(n.id, "host"))
    + row("Seamanship", seaWord(n))
    + bargeLines(n)
    + (boatsBeside(n.id) ? row("Other boats here", boatsBeside(n.id)) : "")
    + row("River trade", pactNames(n))
    + '<p class="quiet-line">At peace a warship patrols this coast. In a war it sails for the enemy coast. A barge carries surplus grain. A merchant sells grain, timber, or ore, and is paid on arrival.</p>'
    + '<div class="kicker">BY SEA</div>'
    + cogLines(n);
}

function situation(n) {
  if (n.parched) return "Drought. The river's country is failing, and the cities feel it.";
  if ((n.hungry || 0) > 0.1) return "The cities are short of grain. People are dying of it faster than they are born.";
  if (n.atWar.size && units && units.some(u => u.kind === "host" && u.owner === n.id && u.fed < 0.7)) return "The army is standing on thin country, and the men are going hungry.";
  const foe = n.atWar.size ? byId([...n.atWar][0]) : null;
  if (foe) return "At war with " + foe.name + ". Strength is people, legitimacy, and how united those people are.";
  if (n.gov === "Republic") return "A democratic republic. It votes. Hunger, the cult, or a long fear can vote it into something else.";
  if (n.gov === "Oligarchy") return "An oligarchy. The ports pay for the state. The inland provinces do not share in it.";
  if (n.gov === "Theocracy") return "A theocracy. The cult is whatever the capital already believed. Neighbors change faith, not the state.";
  if (n.gov === "Dictatorship") return "A dictatorship. It fights harder while it is feared, and a long war eats that fear.";
  return "A monarchy. Distance is what it cannot hold. Faith is not its business.";
}

function faithCensus() {
  const rows = (faithNames || []).map((name, i) => ({ name, color: faithColor(i), people: 0 }));
  if (!belief) return rows;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] !== LAND || !belief[y][x]) continue;
    const souls = (pop && pop[y][x]) || 0;
    for (let i = 0; i < 3; i++) rows[i].people += souls * belief[y][x][i];
  }
  return rows;
}

function chronicleHTML() {
  return logLines.map(l => {
    const i = l.indexOf(":");
    const y = i < 0 ? "" : l.slice(0, i);
    const t = i < 0 ? l : l.slice(i + 1).trim();
    return '<div class="ev"><span>' + y + '</span><p>' + t + '</p></div>';
  }).join("");
}

function drawUI() {
  document.getElementById("year").textContent = String(year);
  const count = document.getElementById("count");
  if (count) count.textContent = nations.length + " REALMS";
  const pause = document.getElementById("pause");
  if (pause) pause.textContent = paused ? "Resume" : "Pause";
  const tabs = document.getElementById("tabs");
  if (tabs && tabs.querySelectorAll) tabs.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  const layer = document.getElementById("layer");
  if (layer && layer.querySelectorAll) layer.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.m === mapMode));
  const ver = document.getElementById("ver");
  if (ver) ver.classList.toggle("on", tab === "notes");
  const panel = document.getElementById("panel");
  if (!panel) return;
  const focus = byId(selected);
  const foe = focus && focus.atWar.size ? byId([...focus.atWar][0]) : null;
  const people = nations.reduce((s, n) => s + (n.people || 0), 0);
  if (tab === "world") {
    let list = "";
    [...nations].sort((a, b) => (b.people || 0) - (a.people || 0)).forEach(n => {
      list += '<li class="' + (n.id === selected ? "on" : "") + '" data-id="' + n.id + '"><i class="swatch" style="background:' + n.color + '"></i><span class="name">' + n.name + '</span><span class="meta">' + (n.atWar.size ? "At war" : govLabel(n.gov)) + '</span><span class="num">' + fmt(n.people) + '</span></li>';
    });
    panel.innerHTML = '<div class="kicker sub">WORLD</div>'
      + row("Continents", continents || 0)
      + row("Realms", nations.length)
      + row("Population", fmt(people))
      + '<div class="kicker">REALMS</div><ul id="list">' + list + '</ul>';
    panel.querySelectorAll("li").forEach(li => { li.onclick = () => { selected = Number(li.dataset.id); tab = "realm"; drawUI(); }; });
  } else if (tab === "faith") {
    const census = faithCensus();
    const total = census.reduce((s, f) => s + f.people, 0) || 1;
    const rows = census.map(f => '<li><i class="swatch" style="background:' + f.color + '"></i><span class="name">' + f.name + '</span><span class="num">' + fmt(f.people) + '</span></li>').join("");
    const cults = nations.filter(n => n.gov === "Theocracy").map(n => n.name).join(", ");
    panel.innerHTML = '<h2>Faith</h2><p id="blurb">Each province is a mix, not a flag. People pick up the faith of the people next to them. The color on the Faith map is that mix.</p>'
      + faithBar(census.map(f => f.people), total)
      + '<div class="kicker">BELIEVERS</div><ul>' + rows + '</ul>'
      + '<div class="kicker">THEOCRACIES</div><p id="blurb">' + (cults || "None. A theocracy keeps the cult its capital already had.") + '</p>';
  } else if (tab === "log") {
    panel.innerHTML = '<div class="kicker">CHRONICLE</div><div id="log">' + chronicleHTML() + '</div>';
  } else if (tab === "notes") {
    const notes = (typeof HISTORY === "undefined" ? [] : HISTORY).map(h =>
      '<article class="note"><h3>v' + h.v + '</h3><div class="when">' + h.date + '</div><ul>'
      + h.items.map(i => "<li>" + i + "</li>").join("") + "</ul></article>").join("");
    panel.innerHTML = '<h2>Notes</h2><p id="blurb">Version ' + (typeof VERSION === "undefined" ? "" : VERSION) + '. The whole simulation stays in this browser. Nothing is uploaded.</p>' + notes;
  } else {
    panel.innerHTML = focus
      ? '<h2>' + focus.name + '</h2><p id="subtitle">' + govLabel(focus.gov) + (foe ? " · at war" : "") + '</p><p id="blurb">' + situation(focus) + '</p>'
        + sheetNav()
        + (sheet === "country" ? realmCountry(focus) : sheet === "rule" ? realmRule(focus) : sheet === "coin" ? realmCoin(focus) : sheet === "water" ? realmWater(focus) : realmBrief(focus, foe))
      : '<h2>The world</h2><p id="blurb">Pick a realm on the map, or open World.</p>'
        + row("Continents", continents || 0)
        + row("Realms", nations.length)
        + row("Population", fmt(people));
  }
  bindPanel();
}

canvas.addEventListener("click", e => {
  const r = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * COLS);
  const y = Math.floor((e.clientY - r.top) / r.height * ROWS);
  if (grid && grid[y] && grid[y][x] === LAND && owner[y][x] >= 0) { selected = owner[y][x]; tab = "realm"; }
  drawUI();
});
canvas.addEventListener("mousemove", e => {
  const tip = document.getElementById("tip");
  if (!tip || !grid) return;
  const r = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * COLS);
  const y = Math.floor((e.clientY - r.top) / r.height * ROWS);
  let label = "Ocean";
  if (grid[y] && grid[y][x] === LAND) {
    const souls = fmt(pop && pop[y] ? pop[y][x] : 0);
    const place = cities.find(c => c.x === x && c.y === y);
    const placeBit = place ? place.name + (owner[y][x] >= 0 && byId(owner[y][x])?.seat === place.id ? " · capital" : " · " + place.rank) + (place.fed != null && place.fed < 0.9 ? " · hungry" : "") + " · " : "";
    if (mapMode === "faith" && belief && belief[y] && belief[y][x]) {
      const s = belief[y][x];
      const order = [0, 1, 2].sort((a, b) => s[b] - s[a]);
      const who = owner[y][x] >= 0 ? (byId(owner[y][x])?.name || "Unclaimed") : "Unclaimed";
      label = placeBit + faithName(order[0]) + " " + Math.round(s[order[0]] * 100) + "%"
        + (s[order[1]] > 0.12 ? "  ·  " + faithName(order[1]) + " " + Math.round(s[order[1]] * 100) + "%" : "")
        + "  ·  " + who;
    } else if (owner[y][x] >= 0) {
      const n = byId(owner[y][x]);
      label = placeBit + (n ? n.name : "Realm") + "  ·  " + govLabel(n && n.gov) + "  ·  " + souls
        + (resource && resource[y] && resource[y][x] === 1 ? "  ·  timber" : resource && resource[y] && resource[y][x] === 2 ? "  ·  ore" : "");
    } else label = "Unclaimed  ·  " + souls;
  }
  const here = (units || []).filter(u => u.x === x && u.y === y);
  if (here.length) {
    const bit = here.map(u => {
      const who = byId(u.owner);
      const name = who ? who.name : "a realm";
      if (u.kind === "barge") return "Barge of " + name + " · grain to " + (u.destName || "a city");
      if (u.kind === "cog") return "Merchant of " + name + " · " + (u.cargo > 0 ? (u.good || "grain") + " to " : "home from ") + (u.destName || "a port");
      if (u.kind === "warship") return "Warship of " + name + (u.mission ? " · " + (u.mode === "war" ? "sailing to " : u.mode === "return" ? "returning to " : "") + u.mission : " · patrolling the coast");
      return "Army of " + name + " · " + fmt(u.men);
    }).join("  ·  ");
    label = grid[y] && grid[y][x] === LAND ? label + "  ·  " + bit : bit;
  }
  tip.textContent = label;
  tip.style.display = "block";
  tip.style.left = (e.clientX + 14) + "px";
  tip.style.top = (e.clientY + 14) + "px";
});
canvas.addEventListener("mouseleave", () => {
  const tip = document.getElementById("tip");
  if (tip) tip.style.display = "none";
});
document.getElementById("newmap").onclick = generate;
document.getElementById("pause").onclick = () => { paused = !paused; drawUI(); };
const tabsEl = document.getElementById("tabs");
if (tabsEl) tabsEl.onclick = e => {
  const b = e.target.closest && e.target.closest("button");
  if (!b) return;
  tab = b.dataset.tab;
  drawUI();
};
const layerEl = document.getElementById("layer");
if (layerEl) layerEl.onclick = e => {
  const b = e.target.closest && e.target.closest("button");
  if (!b) return;
  mapMode = b.dataset.m;
  drawUI();
  render();
};
const speedBox = document.getElementById("speed");
if (speedBox && speedBox.querySelectorAll) {
  speedBox.querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      speed = Number(b.dataset.s);
      speedBox.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
    };
  });
}

function paintClock() {
  const y = document.getElementById("year");
  if (y) y.textContent = year == null ? "—" : String(year);
  const count = document.getElementById("count");
  if (count) count.textContent = (nations ? nations.length : 0) + " REALMS";
}

let last = 0;
let uiAt = 0;
function loop(t) {
  if (document.hidden) {
    last = 0;
    acc = 0;
    requestAnimationFrame(loop);
    return;
  }
  if (!last) last = t;
  let dt = t - last;
  last = t;
  if (dt > 250) dt = 250;
  let stepped = false;
  if (!paused) {
    acc += dt * speed;
    let n = 0;
    while (acc > 280 && n < 1) { acc -= 280; step(); n++; stepped = true; }
    if (acc > 560) acc = 0;
    render();
  }
  if (stepped && t - uiAt > 280) { drawUI(); uiAt = t; }
  requestAnimationFrame(loop);
}
const verBtn = document.getElementById("ver");
if (verBtn) verBtn.onclick = () => { tab = tab === "notes" ? "realm" : "notes"; drawUI(); };
resize();
generate();
requestAnimationFrame(loop);
