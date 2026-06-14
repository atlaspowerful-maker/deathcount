// app.js — logique de l'interface

const CURRENT_YEAR = 2026;

const form = document.getElementById("form");
const input = document.getElementById("year");
const errorEl = document.getElementById("error");
const result = document.getElementById("result");

const countEl = document.getElementById("count");
const yearOut = document.getElementById("year-out");
const nounOut = document.getElementById("noun-out");
const bornOut = document.getElementById("born-out");
const birthsOut = document.getElementById("births-out");
const birthsLabel = document.getElementById("births-label");
const aliveOut = document.getElementById("alive-out");
const pctOut = document.getElementById("pct-out");
const barDead = document.getElementById("bar-dead");
const barAlive = document.getElementById("bar-alive");
const legendDead = document.getElementById("legend-dead");
const legendAlive = document.getElementById("legend-alive");
const barCaption = document.getElementById("bar-caption");
const chart = document.getElementById("chart");
const chartCaption = document.getElementById("chart-caption");

const nf = new Intl.NumberFormat("fr-FR");

// État : sexe ("all"|"F"|"M") et périmètre ("metro"|"all")
let currentSex = "all";
let currentSource = "metro";
let lastYear = null;

const sexButtons = document.querySelectorAll(".sex-opt[data-sex]");
sexButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    sexButtons.forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-checked", b === btn ? "true" : "false");
    });
    currentSex = btn.dataset.sex;
    if (lastYear != null) compute(lastYear);
  });
});

const srcButtons = document.querySelectorAll(".sex-opt[data-src]");
srcButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    srcButtons.forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-checked", b === btn ? "true" : "false");
    });
    currentSource = btn.dataset.src;
    if (lastYear != null) compute(lastYear);
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  errorEl.textContent = "";

  const year = parseInt(input.value, 10);

  if (!input.value || Number.isNaN(year)) {
    return showError("Entre une année de naissance.");
  }
  if (year < MIN_YEAR || year > MAX_YEAR) {
    return showError(`On a les données de ${MIN_YEAR} à ${MAX_YEAR}.`);
  }
  if (year > CURRENT_YEAR) {
    return showError("Tu n'es pas encore né·e !");
  }

  compute(year);
});

function showError(msg) {
  errorEl.textContent = msg;
  result.hidden = true;
}

// Vocabulaire selon le sexe choisi.
const WORDS = {
  all: { noun: "personnes", born: "nées", babies: "bébés nés cette année-là" },
  F: { noun: "femmes", born: "nées", babies: "filles nées cette année-là" },
  M: { noun: "hommes", born: "nés", babies: "garçons nés cette année-là" },
};

function compute(year) {
  lastYear = year;
  const sex = currentSex;
  const source = currentSource;
  const age = CURRENT_YEAR - year;

  const base = Math.round(cohortBase(year, sex));
  const series = deathSeries(year, sex, source);
  const dead = Math.round(deathsSoFar(year, sex, source, CURRENT_YEAR));
  const alive = Math.max(0, base - dead);
  const pctDead = base > 0 ? (dead / base) * 100 : 0;

  const w = WORDS[currentSex];

  yearOut.textContent = year;
  nounOut.textContent = w.noun;
  bornOut.textContent = w.born;
  birthsLabel.textContent = w.babies;
  birthsOut.textContent = nf.format(base);
  aliveOut.textContent = nf.format(alive);
  pctOut.textContent = pctDead.toFixed(pctDead < 1 ? 1 : 0) + " %";

  legendDead.textContent = nf.format(dead);
  legendAlive.textContent = nf.format(alive);

  result.hidden = false;
  animateCount(dead);

  const deadPct = Math.min(100, pctDead);
  barDead.style.width = "0";
  barAlive.style.width = "0";
  requestAnimationFrame(() => {
    barDead.style.width = deadPct.toFixed(2) + "%";
    barAlive.style.width = (100 - deadPct).toFixed(2) + "%";
  });

  barCaption.textContent = caption(age, pctDead);
  renderChart(year, sex, source, age, dead, series);
}

function caption(age, pctDead) {
  if (age < 5) return "Encore tout petit·e : presque toute ta génération est là.";
  if (pctDead < 2) return "Ta génération est quasiment intacte. Profite.";
  if (pctDead < 10) return "Quelques départs, mais la grande majorité est encore là.";
  if (pctDead < 30) return "Ta génération commence à s'éclaircir.";
  if (pctDead < 55) return "Tu fais partie de la moitié restante. Belle endurance.";
  if (pctDead < 80) return "Tu es parmi les derniers debout de ta génération.";
  return "Tu es une légende vivante : presque tous les autres sont partis.";
}

// Courbe des décès par âge : réel (INSEE) à gauche du repère, projection à droite.
function renderChart(year, sex, source, age, dead, series) {
  const deaths = series;
  const N = deaths.length;
  const W = 320, H = 150, padL = 6, padR = 6, padT = 12, padB = 20;
  const base = H - padB;
  const maxD = Math.max.apply(null, deaths) || 1;

  const X = (a) => padL + (a / (N - 1)) * (W - padL - padR);
  const Y = (d) => padT + (1 - d / maxD) * (base - padT);

  const pts = deaths.map((d, a) => [X(a), Y(d)]);
  const idx = Math.max(0, Math.min(N - 1, age));
  const fmt = (p) => p[0].toFixed(1) + "," + p[1].toFixed(1);

  const line = pts.map(fmt).join(" ");
  const past =
    `${X(0).toFixed(1)},${base} ` +
    pts.slice(0, idx + 1).map(fmt).join(" ") +
    ` ${X(idx).toFixed(1)},${base}`;
  const future =
    `${X(idx).toFixed(1)},${base} ` +
    pts.slice(idx).map(fmt).join(" ") +
    ` ${X(N - 1).toFixed(1)},${base}`;

  const mx = X(idx);
  const my = Y(deaths[idx]);
  const ticks = [0, 25, 50, 75, 100].filter((t) => t <= N - 1);
  const tickEls = ticks
    .map(
      (t) =>
        `<text class="ch-tick" x="${X(t).toFixed(1)}" y="${H - 6}" text-anchor="middle">${t} ans</text>`
    )
    .join("");

  const labelRight = idx / (N - 1) < 0.55;
  const labelX = labelRight ? mx + 5 : mx - 5;
  const anchor = labelRight ? "start" : "end";

  chart.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Répartition des décès par âge">` +
    `<polygon class="ch-future" points="${future}" />` +
    `<polygon class="ch-past" points="${past}" />` +
    `<polyline class="ch-line" points="${line}" />` +
    `<line class="ch-axis" x1="${padL}" y1="${base}" x2="${W - padR}" y2="${base}" />` +
    `<line class="ch-mark" x1="${mx.toFixed(1)}" y1="${base}" x2="${mx.toFixed(1)}" y2="${(padT - 4).toFixed(1)}" />` +
    `<circle class="ch-dot" cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="3.2" />` +
    `<text class="ch-label" x="${labelX.toFixed(1)}" y="${(padT - 1).toFixed(1)}" text-anchor="${anchor}">Toi · ${age} ans</text>` +
    tickEls +
    `</svg>`;

  const noun = WORDS[currentSex].noun;
  const peakAge = deaths.indexOf(maxD);
  const pastLabel = year >= 1970
    ? `les <b>${nf.format(dead)}</b> ${noun} déjà parti·es (comptage réel INSEE)`
    : `les <b>${nf.format(dead)}</b> déjà parti·es (réel depuis 1970, estimé avant)`;
  let extra = "";
  if (source === "all") {
    const foreign = Math.round(dead - deathsSoFar(year, sex, "metro", CURRENT_YEAR));
    if (foreign > 0) extra = ` Dont <b>${nf.format(foreign)}</b> né·es à l'étranger.`;
  }
  chartCaption.innerHTML =
    `Décès par âge de ta génération. À gauche du repère, ${pastLabel}&nbsp;; ` +
    `à droite, la projection (modèle), avec un pic vers <b>${peakAge} ans</b>.` +
    extra;
}

function animateCount(target) {
  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    countEl.textContent = nf.format(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
