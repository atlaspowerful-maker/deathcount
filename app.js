// app.js — logique de l'interface

const CURRENT_YEAR = 2026;

const form = document.getElementById("form");
const input = document.getElementById("year");
const errorEl = document.getElementById("error");
const result = document.getElementById("result");

const countEl = document.getElementById("count");
const yearOut = document.getElementById("year-out");
const birthsOut = document.getElementById("births-out");
const aliveOut = document.getElementById("alive-out");
const pctOut = document.getElementById("pct-out");
const barDead = document.getElementById("bar-dead");
const barAlive = document.getElementById("bar-alive");
const legendDead = document.getElementById("legend-dead");
const legendAlive = document.getElementById("legend-alive");
const barCaption = document.getElementById("bar-caption");

const nf = new Intl.NumberFormat("fr-FR");

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

function compute(year) {
  const age = CURRENT_YEAR - year;
  const births = Math.round(birthsForYear(year));
  const survival = cohortSurvival(year, CURRENT_YEAR);

  const alive = Math.round(births * survival);
  const dead = Math.max(0, births - alive);
  const pctDead = ((dead / births) * 100);

  // Affichage
  yearOut.textContent = year;
  birthsOut.textContent = nf.format(births);
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
