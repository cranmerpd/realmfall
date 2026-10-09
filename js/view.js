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
function drawShip(x, y, color, war, hdg) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((hdg || -Math.PI / 2) + Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(0, war ? -6.2 : -4.4);
  ctx.lineTo(war ? 3.1 : 2.2, war ? 4.4 : 3.1);
  ctx.lineTo(war ? -3.1 : -2.2, war ? 4.4 : 3.1);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(244,247,252,0.9)";
  ctx.lineWidth = war ? 1 : 0.7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, war ? -8.2 : -6);
  ctx.stroke();
  if (war) {
    ctx.beginPath();
    ctx.moveTo(0.6, -7.4);
    ctx.lineTo(3.4, -6.2);
    ctx.lineTo(0.6, -5.2);
    ctx.fillStyle = "#f4f7fc";
    ctx.fill();
  }
  ctx.restore();
}
function drawUnits(cw, ch) {
  if (!units) return;
  for (const u of units) {
    const n = byId(u.owner);
    if (!n) continue;
    const x = (u.x + 0.5) * cw, y = (u.y + 0.5) * ch;
    if (u.kind === "host") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = n.color;
      ctx.strokeStyle = u.fed < 0.7 ? "rgba(244,247,252,0.35)" : "#f4f7fc";
      ctx.lineWidth = 1;
      const s = Math.max(2.2, Math.min(cw, ch) * 0.16);
      ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.restore();
    } else if (u.kind === "barge") {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = n.color;
      ctx.strokeStyle = "rgba(244,247,252,0.75)";
      ctx.lineWidth = 0.6;
      ctx.fillRect(-3.2, -1.3, 6.4, 2.6);
      ctx.strokeRect(-3.2, -1.3, 6.4, 2.6);
      ctx.restore();
    } else drawShip(x, y, n.color, u.kind === "warship", u.hdg);
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
      const edge = coast && coast[y][x];
      let fill = edge ? "#243028" : "#354238";
      if (mapMode === "faith" && belief && belief[y][x]) {
        fill = mixFaithColor(belief[y][x]);
      } else if (id >= 0) {
        const base = byId(id)?.color || "#888888";
        fill = edge ? tint(base, "#10140f", 0.28) : tint(base, "#ffffff", Math.max(0, Math.min(0.14, ((pop && pop[y][x]) || 1000) / 28000)));
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
      if (x === COLS - 1 || grid[y][x + 1] !== LAND) { ctx.moveTo((x + 1) * cw, y * ch); ctx.lineTo((x + 1) * cw, (y + 1) * ch); }
      if (y === ROWS - 1 || grid[y + 1][x] !== LAND) { ctx.moveTo(x * cw, (y + 1) * ch); ctx.lineTo((x + 1) * cw, (y + 1) * ch); }
      if (x === 0 || grid[y][x - 1] !== LAND) { ctx.moveTo(x * cw, y * ch); ctx.lineTo(x * cw, (y + 1) * ch); }
      if (y === 0 || grid[y - 1][x] !== LAND) { ctx.moveTo(x * cw, y * ch); ctx.lineTo((x + 1) * cw, y * ch); }
    }
  }
  ctx.stroke();
  if (river && flowToX) {
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (river[y][x] < 28 || flowToX[y][x] < 0) continue;
      ctx.moveTo((x + 0.5) * cw, (y + 0.5) * ch);
      ctx.lineTo((flowToX[y][x] + 0.5) * cw, (flowToY[y][x] + 0.5) * ch);
    }
    ctx.strokeStyle = "rgba(126,184,204,0.85)";
    ctx.lineWidth = 1.35;
    ctx.stroke();
    ctx.beginPath();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (river[y][x] < 11 || river[y][x] >= 28 || flowToX[y][x] < 0) continue;
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
      if (x < COLS - 1 && grid[y][x + 1] === LAND && owner[y][x + 1] !== id) {
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
      if (x < COLS - 1 && grid[y][x + 1] === LAND && owner[y][x + 1] !== selected) { ctx.moveTo((x + 1) * cw, y * ch); ctx.lineTo((x + 1) * cw, (y + 1) * ch); }
      if (y < ROWS - 1 && grid[y + 1][x] === LAND && owner[y + 1][x] !== selected) { ctx.moveTo(x * cw, (y + 1) * ch); ctx.lineTo((x + 1) * cw, (y + 1) * ch); }
    }
  }
  ctx.stroke();
  const shade = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width * 0.28, canvas.width / 2, canvas.height / 2, canvas.width * 0.72);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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

function fmt(n) {
  n = Math.round(n || 0);
  if (n >= 1000000) return (n / 1000000).toFixed(2) + "m";
  if (n >= 10000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1) + "k";
  return String(n);
}

function row(label, value) {
  return '<div class="row"><span>' + label + '</span><b>' + value + '</b></div>';
}

function situation(n) {
  if (n.parched) return "Drought. The river's country is failing, and the cities feel it.";
  if ((n.hungry || 0) > 0.1) return "The cities are short of grain. People are dying of it faster than they are born.";
  if (n.atWar.size && units && units.some(u => u.kind === "host" && u.owner === n.id && u.fed < 0.7)) return "The host is in the field and the grain is not keeping up with it.";
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
      list += '<li class="' + (n.id === selected ? "on" : "") + '" data-id="' + n.id + '"><i class="swatch" style="background:' + n.color + '"></i><span class="name">' + n.name + '</span><span class="num">' + fmt(n.people) + '</span></li>';
    });
    panel.innerHTML = '<div class="kicker sub">WORLD</div>'
      + row("Continents", continents || 0)
      + row("Realms", nations.length)
      + row("Population", fmt(people))
      + '<div class="kicker">REALMS</div><ul id="list">' + list + '</ul>';
    panel.querySelectorAll("li").forEach(li => { li.onclick = () => { selected = Number(li.dataset.id); tab = "realm"; drawUI(); }; });
  } else if (tab === "faith") {
    const rows = faithCensus().map(f => '<li><i class="swatch" style="background:' + f.color + '"></i><span class="name">' + f.name + '</span><span class="num">' + fmt(f.people) + '</span></li>').join("");
    const cults = nations.filter(n => n.gov === "Theocracy").map(n => n.name).join(", ");
    panel.innerHTML = '<h2>Faith</h2><p id="blurb">Each province is a mix, not a flag. People pick up the faith of the people next to them, weighted by how many live there. The color on the Faith map is that mix. White lines are still the states.</p>'
      + '<div class="kicker">BELIEVERS</div><ul>' + rows + '</ul>'
      + '<div class="kicker">THEOCRACIES</div><p id="blurb">' + (cults || "None. A theocracy only keeps the cult its capital already had. It does not spread it.") + '</p>';
  } else if (tab === "log") {
    panel.innerHTML = '<div class="kicker">CHRONICLE</div><div id="log">' + chronicleHTML() + '</div>';
  } else if (tab === "notes") {
    const notes = (typeof HISTORY === "undefined" ? [] : HISTORY).map(h =>
      '<article class="note"><h3>v' + h.v + '</h3><div class="when">' + h.date + '</div><ul>'
      + h.items.map(i => "<li>" + i + "</li>").join("") + "</ul></article>").join("");
    panel.innerHTML = '<h2>Notes</h2><p id="blurb">Version ' + (typeof VERSION === "undefined" ? "" : VERSION) + '. The whole simulation stays in this browser. Nothing is uploaded.</p>' + notes;
  } else {
    panel.innerHTML = focus
      ? '<h2>' + focus.name + '</h2><p id="subtitle">' + govLabel(focus.gov) + '</p><p id="blurb">' + situation(focus) + '</p>'
        + '<div class="kicker sub">PEOPLE</div>'
        + row("Population", fmt(focus.people))
        + row("Hungry", Math.round((focus.hungry || 0) * 100) + "%")
        + row("Grain to the sea", fmt(focus.grain || 0))
        + row("Fields", focus.parched ? "Drought" : "Ordinary")
        + row("Provinces", focus.pops)
        + row("Per province", fmt(focus.pops ? focus.people / focus.pops : 0))
        + row("Seat", (() => { const s = cities.find(c => c.id === focus.seat); return s ? s.name + " · " + s.rank : "—"; })())
        + row("Cities", cities.filter(c => owner[c.y] && owner[c.y][c.x] === focus.id).length)
        + row("Largest faith", faithName(focus.creed) + " " + Math.round((focus.creedShare || 0) * 100) + "%")
        + '<div class="kicker sub">STATE</div>'
        + row("Government", govLabel(focus.gov))
        + (focus.gov === "Republic" ? row("Parties", partyLine(focus)) : "")
        + row("Ships", seaWord(focus))
        + row("On the water", unitCount(focus.id, "barge") + " barges · " + unitCount(focus.id, "cog") + " cogs · " + unitCount(focus.id, "warship") + " warships")
        + row("Hosts", unitCount(focus.id, "host"))
        + row("Legitimacy", Math.round(focus.legitimacy || 0))
        + row("River pacts", focus.pacts || 0)
        + row("Prosperity", fmt(focus.wealth))
        + row("Stability", Math.round(focus.stability))
        + row("Unrest", Math.round(focus.unrest || 0))
        + row("Status", foe ? "War with " + foe.name : "At peace")
      : '<h2>The world</h2><p id="blurb">Pick a realm on the map, or open World. Faith is a separate layer.</p>'
        + row("Continents", continents || 0)
        + row("Realms", nations.length)
        + row("Population", fmt(people));
  }
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
      label = placeBit + (n ? n.name : "Realm") + "  ·  " + govLabel(n && n.gov) + "  ·  " + souls;
    } else label = "Unclaimed  ·  " + souls;
  }
  const here = (units || []).filter(u => u.x === x && u.y === y);
  if (here.length) {
    const bit = here.map(u => {
      const who = byId(u.owner);
      const name = who ? who.name : "a realm";
      if (u.kind === "barge") return "Barge of " + name;
      if (u.kind === "cog") return "Cog of " + name + " · grain " + fmt(u.cargo);
      if (u.kind === "warship") return "Warship of " + name;
      return "Host of " + name + " · " + fmt(u.men);
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
    while (acc > 280 && n < 2) { acc -= 280; step(); n++; stepped = true; }
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
