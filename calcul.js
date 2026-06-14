// calcul.js — exemple interactif de la page « Comprendre le calcul ».
// Réutilise BIRTHS, mortalityRate(), birthsForYear() et les bornes de data.js.

const CURRENT_YEAR = 2026;

const demoInput = document.getElementById("demo-year");
const demoSummary = document.getElementById("demo-summary");
const demoRows = document.getElementById("demo-rows");
const demoCaption = document.getElementById("demo-caption");

const nf = new Intl.NumberFormat("fr-FR");
const pf = (x, d = 1) => x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

// Âges-repères affichés dans la table (on ne montre pas les ~100 lignes, mais le
// produit complet est bien calculé sur tous les âges).
const SAMPLE_AGES = [0, 1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function render(year) {
  if (Number.isNaN(year) || year < MIN_YEAR || year > MAX_YEAR) {
    demoSummary.innerHTML = `On a les données de <b>${MIN_YEAR}</b> à <b>${MAX_YEAR}</b>.`;
    demoRows.innerHTML = "";
    demoCaption.textContent = "";
    return;
  }

  const age = CURRENT_YEAR - year;
  const births = Math.round(birthsForYear(year));

  // Survie cumulée le long de la diagonale de Lexis, âge par âge.
  // cumSurv[a] = probabilité d'être encore vivant à l'âge a (produit k=0..a-1).
  const cumSurv = [1];
  for (let k = 0; k < age; k++) {
    cumSurv[k + 1] = cumSurv[k] * (1 - mortalityRate(k, year + k));
  }
  const survival = cumSurv[age];
  const alive = Math.round(births * survival);
  const dead = Math.max(0, births - alive);
  const pctDead = (dead / births) * 100;

  demoSummary.innerHTML =
    `En <b>${year}</b>, <b>${nf.format(births)}</b> bébés sont nés. ` +
    `En les faisant vieillir jusqu'en ${CURRENT_YEAR} (âge ${age}), il en reste ` +
    `<b>${nf.format(alive)}</b> vivants — soit <b>${nf.format(dead)}</b> disparus ` +
    `(${pf(pctDead, pctDead < 1 ? 1 : 0)}&nbsp;% de la génération).`;

  // Lignes de la table : âges-repères <= âge actuel, + ligne finale.
  const rows = [];
  for (const a of SAMPLE_AGES) {
    if (a > age) break;
    rows.push(rowHtml(a, year + a, mortalityRate(a, year + a), cumSurv[a]));
  }
  // Ligne finale (âge atteint en 2026), si pas déjà un repère.
  if (!SAMPLE_AGES.includes(age)) {
    rows.push(rowHtml(age, CURRENT_YEAR, mortalityRate(age, CURRENT_YEAR), cumSurv[age], true));
  } else {
    rows[rows.length - 1] = rows[rows.length - 1].replace("<tr>", '<tr class="row-final">');
  }
  demoRows.innerHTML = rows.join("");

  demoCaption.innerHTML =
    `q est exprimé pour 1000 (‰). Seuls quelques âges sont affichés, mais la survie ` +
    `finale est le produit sur les <b>${age}</b> années réelles. ` +
    `Survie totale&nbsp;: ${pf(survival * 100, 2)}&nbsp;%.`;
}

function rowHtml(age, year, q, surv, isFinal = false) {
  return (
    `<tr${isFinal ? ' class="row-final"' : ""}>` +
    `<td>${age} an${age > 1 ? "s" : ""}</td>` +
    `<td>${year}</td>` +
    `<td class="q-col">${pf(q * 1000, q < 0.01 ? 2 : 1)} ‰</td>` +
    `<td>${pf(surv * 100, 1)} %</td>` +
    `</tr>`
  );
}

demoInput.addEventListener("input", () => render(parseInt(demoInput.value, 10)));
render(parseInt(demoInput.value, 10));
