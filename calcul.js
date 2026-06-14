// calcul.js — exemple interactif de la page « Comprendre le calcul ».
// Réutilise BIRTHS, mortalityRate(), mortalityRateSex(), birthsForYear(),
// cohortSurvival(), cohortSurvivalSex() et les bornes de data.js.

const CURRENT_YEAR = 2026;

const demoInput = document.getElementById("demo-year");
const demoSummary = document.getElementById("demo-summary");
const demoRows = document.getElementById("demo-rows");
const demoCaption = document.getElementById("demo-caption");

const nf = new Intl.NumberFormat("fr-FR");
const pf = (x, d = 1) => x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

// Âges-repères affichés dans la table (on ne montre pas les ~100 lignes, mais le
// produit complet est bien calculé sur tous les âges, et pour chaque sexe).
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

  // Survie cumulée le long de la diagonale de Lexis, âge par âge, pour chaque sexe.
  // cumF[a] / cumM[a] = probabilité d'être encore vivant·e à l'âge a.
  const cumF = [1], cumM = [1];
  for (let k = 0; k < age; k++) {
    cumF[k + 1] = cumF[k] * (1 - mortalityRateSex("F", k, year + k));
    cumM[k + 1] = cumM[k] * (1 - mortalityRateSex("M", k, year + k));
  }
  // Survie d'ensemble = compteur de la page d'accueil (pondéré par le sex-ratio).
  const survival = cohortSurvival(year, CURRENT_YEAR);
  const survF = cohortSurvivalSex("F", year, CURRENT_YEAR);
  const survM = cohortSurvivalSex("M", year, CURRENT_YEAR);

  const alive = Math.round(births * survival);
  const dead = Math.max(0, births - alive);
  const pctDead = (dead / births) * 100;

  demoSummary.innerHTML =
    `En <b>${year}</b>, <b>${nf.format(births)}</b> bébés sont nés. ` +
    `En faisant vieillir la génération jusqu'en ${CURRENT_YEAR} (âge ${age}), il en reste ` +
    `<b>${nf.format(alive)}</b> vivants — soit <b>${nf.format(dead)}</b> disparus ` +
    `(${pf(pctDead, pctDead < 1 ? 1 : 0)}&nbsp;%). ` +
    `Survie&nbsp;: <b>${pf(survF * 100, 1)}&nbsp;%</b> chez les femmes, ` +
    `<b>${pf(survM * 100, 1)}&nbsp;%</b> chez les hommes.`;

  // Lignes de la table : âges-repères <= âge actuel, + ligne finale.
  const rows = [];
  for (const a of SAMPLE_AGES) {
    if (a > age) break;
    rows.push(rowHtml(a, year + a, year, cumF, cumM, a === age));
  }
  if (!SAMPLE_AGES.includes(age)) {
    rows.push(rowHtml(age, CURRENT_YEAR, year, cumF, cumM, true));
  }
  demoRows.innerHTML = rows.join("");

  demoCaption.innerHTML =
    `q exprimé pour 1000 (‰). Seuls quelques âges sont affichés, mais la survie de ` +
    `chaque sexe est le produit sur les <b>${age}</b> années réelles, puis recombinée ` +
    `(51,2&nbsp;% de garçons à la naissance). On voit l'écart se creuser&nbsp;: ` +
    `c'est lui que le modèle «&nbsp;ensemble&nbsp;» écrasait.`;
}

function rowHtml(age, calYear, birthYear, cumF, cumM, isFinal) {
  const qF = mortalityRateSex("F", age, birthYear + age) * 1000;
  const qM = mortalityRateSex("M", age, birthYear + age) * 1000;
  const ens = (0.488 * cumF[age] + 0.512 * cumM[age]) * 100; // vivants d'ensemble
  return (
    `<tr${isFinal ? ' class="row-final"' : ""}>` +
    `<td>${age} an${age > 1 ? "s" : ""}</td>` +
    `<td>${calYear}</td>` +
    `<td class="q-col">${pf(qF, qF < 0.1 ? 2 : 1)}</td>` +
    `<td class="q-col">${pf(qM, qM < 0.1 ? 2 : 1)}</td>` +
    `<td>${pf(ens, 1)} %</td>` +
    `</tr>`
  );
}

demoInput.addEventListener("input", () => render(parseInt(demoInput.value, 10)));
render(parseInt(demoInput.value, 10));
