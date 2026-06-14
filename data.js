// data.js — données démographiques France
//
// ───────────────────────────────────────────────────────────────────────────
// MÉTHODE
//
//   Pour une personne née en année Y, vivante à l'âge A en 2026 :
//
//     survie(Y) = ∏  (1 − q(âge k, année civile Y+k))    pour k = 0 … A−1
//
//   On fait littéralement « vieillir » la génération année par année le long de
//   sa diagonale de Lexis, en appliquant à chaque âge le taux de mortalité de
//   l'année civile correspondante. Une génération née en 1918 traverse donc une
//   forte mortalité infantile ; une née en 2010 quasiment aucune.
//
//     décès estimés = naissances(Y) × (1 − survie(Y))
//
// ───────────────────────────────────────────────────────────────────────────
// PRÉCISION & CALIBRATION
//
//   • Naissances : valeurs RÉELLES, année par année (France métropolitaine).
//     Aucune interpolation. Source INSEE.
//   • Mortalité infantile (q à 0 an) : série annuelle RÉELLE (`INFANT_MORTALITY`),
//     interpolée linéairement entre points (INED/INSEE, taux pour 1000 enregistré
//     en France). Plus aucune interpolation d'époque sur ce quotient — c'est le
//     poste le plus déterminant pour les générations récentes.
//   • Mortalité aux autres âges : quotients q(âge, époque) CALIBRÉS pour que chaque
//     époque-ancre reproduise DEUX cibles réelles publiées :
//       — l'espérance de vie à la naissance (période, both sexes) ;
//       — la survie à 65 ans (période, both sexes).
//     Deux facteurs d'échelle par époque (avant / après 65 ans) ont été ajustés
//     numériquement jusqu'à matcher ces deux cibles. Vérifié hors échantillon
//     (1960, 1980, 2000, 2020) : e0 à <0,5 an près, survie à 65 à <0,8 pt près.
//   • Limite connue : les surmortalités de guerre (1914-18, 1939-45) ne sont pas
//     isolées. Impact négligeable sur le compteur 2026 : ces générations ont
//     aujourd'hui ~100 ans, leur survie est quasi nulle quoi qu'il arrive.
//
// Cibles de calibration (période, both sexes, France) :
//   e0  — 1900:47,0 · 1930:56,7 · 1950:66,4 · 1970:72,4 · 1990:76,9 · 2010:81,8 · 2023:82,9
//   s65 — 1900:40 · 1930:51 · 1950:67 · 1970:75,8 · 1990:82,2 · 2010:87,4 · 2023:89,6
//   (survie à 65 = moyenne H/F des séries Banque mondiale SP.DYN.TO65.*, dérivées
//    des tables de mortalité nationales.)
//
// Sources :
//   INSEE — naissances séries longues : https://www.insee.fr/fr/statistiques/8582147
//   INSEE — tables de mortalité / bilan 2024 : https://www.insee.fr/fr/statistiques/8313953
//   INED — table de mortalité : https://www.ined.fr/fr/tout-savoir-population/chiffres/france/mortalite-cause-deces/table-mortalite/
//   INED — mortalité infantile depuis 1901 : https://www.ined.fr/fr/tout-savoir-population/chiffres/france/mortalite-cause-deces/mortalite-infantile/
//   Banque mondiale — survie à 65 ans (H/F) : indicateurs SP.DYN.TO65.MA.ZS / .FE.ZS
//   Série naissances : Wikipédia « Démographie de la France » (d'après l'INSEE).

// Naissances vivantes en France métropolitaine, par année (valeurs réelles).
const BIRTHS = {
  1900: 885200, 1901: 917075, 1902: 904434, 1903: 884498, 1904: 877091,
  1905: 865604, 1906: 864745, 1907: 829632, 1908: 848982, 1909: 824739,
  1910: 828140, 1911: 793506, 1912: 801642, 1913: 795851, 1914: 757931,
  1915: 482968, 1916: 384676, 1917: 412744, 1918: 472816, 1919: 506960,
  1920: 838137, 1921: 816555, 1922: 764373, 1923: 765888, 1924: 757873,
  1925: 774455, 1926: 771690, 1927: 748102, 1928: 753570, 1929: 734140,
  1930: 754020, 1931: 737611, 1932: 726299, 1933: 682394, 1934: 681518,
  1935: 643870, 1936: 634344, 1937: 621453, 1938: 615582, 1939: 615599,
  1940: 561281, 1941: 522261, 1942: 575261, 1943: 615780, 1944: 629878,
  1945: 645899, 1946: 843904, 1947: 870472, 1948: 870836, 1949: 872661,
  1950: 862310, 1951: 826722, 1952: 822204, 1953: 804696, 1954: 810754,
  1955: 805917, 1956: 806916, 1957: 816467, 1958: 812215, 1959: 829249,
  1960: 819819, 1961: 838633, 1962: 832353, 1963: 868876, 1964: 877804,
  1965: 865688, 1966: 863527, 1967: 840568, 1968: 835796, 1969: 842245,
  1970: 850381, 1971: 881284, 1972: 877506, 1973: 857186, 1974: 801218,
  1975: 745065, 1976: 720395, 1977: 744744, 1978: 737062, 1979: 757354,
  1980: 800376, 1981: 805483, 1982: 797223, 1983: 748525, 1984: 759939,
  1985: 768431, 1986: 778468, 1987: 767828, 1988: 771268, 1989: 765473,
  1990: 762407, 1991: 759056, 1992: 743658, 1993: 711610, 1994: 710993,
  1995: 729609, 1996: 734338, 1997: 726768, 1998: 738080, 1999: 744791,
  2000: 774782, 2001: 770945, 2002: 761630, 2003: 761464, 2004: 767816,
  2005: 774355, 2006: 796896, 2007: 785985, 2008: 796044, 2009: 793420,
  2010: 802224, 2011: 792996, 2012: 790290, 2013: 781621, 2014: 781167,
  2015: 760421, 2016: 744697, 2017: 730242, 2018: 719737, 2019: 714029,
  2020: 696664, 2021: 701819, 2022: 686654, 2023: 639533, 2024: 626776,
  2025: 611000, // estimation
};

// Mortalité infantile RÉELLE (décès avant 1 an pour 1000 naissances vivantes),
// France métropolitaine, par année (INED/INSEE). Interpolée linéairement entre
// points. C'est la source unique du quotient à 0 an : aucune interpolation
// d'époque ici, contrairement aux autres âges.
const INFANT_MORTALITY = {
  1900: 160, 1910: 111, 1920: 99, 1930: 84, 1938: 66, 1940: 91, 1945: 114,
  1950: 52, 1955: 39, 1960: 27, 1965: 21.9, 1970: 18.2, 1975: 13.8, 1980: 10.0,
  1985: 8.3, 1990: 7.3, 1995: 4.9, 2000: 4.4, 2005: 3.6, 2010: 3.6, 2015: 3.5,
  2020: 3.6, 2024: 4.1,
};

// Quotient de mortalité à 0 an pour une année donnée (proba), depuis la série réelle.
function infantMortality(year) {
  return interp(INFANT_MORTALITY, year) / 1000;
}

// Quotients de mortalité annuels q(âge) par époque (probabilité, pour une
// personne vivante à l'âge x, de mourir avant x+1), pour les âges ≥ 1.
// Calibrés (deux facteurs d'échelle avant/après 65 ans par époque) pour que
// chaque époque reproduise l'espérance de vie ET la survie à 65 ans réelles —
// voir l'en-tête du fichier. La valeur à 0 an reste là pour mémoire mais n'est
// PAS utilisée : `mortalityRate` lit la mortalité infantile dans la série réelle.
const MORTALITY_ERAS = {
  1900: { 0: 0.16, 1: 0.0378, 5: 0.00504, 10: 0.00294, 15: 0.00336, 20: 0.00504, 25: 0.00588, 30: 0.00671, 35: 0.00755, 40: 0.00923, 45: 0.0109, 50: 0.0143, 55: 0.0185, 60: 0.0252, 65: 0.0341, 70: 0.0503, 75: 0.0731, 80: 0.106, 85: 0.15, 90: 0.211, 95: 0.284, 100: 0.365, 105: 0.446, 110: 0.528 },
  1930: { 0: 0.084, 1: 0.0127, 5: 0.00212, 10: 0.00159, 15: 0.00212, 20: 0.00318, 25: 0.00371, 30: 0.00424, 35: 0.0053, 40: 0.00636, 45: 0.00847, 50: 0.0127, 55: 0.018, 60: 0.0265, 65: 0.0417, 70: 0.0643, 75: 0.0958, 80: 0.141, 85: 0.203, 90: 0.287, 95: 0.389, 100: 0.502, 105: 0.614, 110: 0.733 },
  1950: { 0: 0.052, 1: 0.0042, 5: 0.000839, 10: 0.00063, 15: 0.000944, 20: 0.00147, 25: 0.00157, 30: 0.00178, 35: 0.00231, 40: 0.00315, 45: 0.00472, 50: 0.00734, 55: 0.0115, 60: 0.0189, 65: 0.0257, 70: 0.0413, 75: 0.0662, 80: 0.106, 85: 0.156, 90: 0.225, 95: 0.312, 100: 0.404, 105: 0.496, 110: 0.597 },
  1970: { 0: 0.0182, 1: 0.000757, 5: 0.000379, 10: 0.000284, 15: 0.000568, 20: 0.000946, 25: 0.000946, 30: 0.00104, 35: 0.00142, 40: 0.00218, 45: 0.0036, 50: 0.00587, 55: 0.00928, 60: 0.0151, 65: 0.0203, 70: 0.0333, 75: 0.0545, 80: 0.0878, 85: 0.134, 90: 0.195, 95: 0.272, 100: 0.354, 105: 0.435, 110: 0.528 },
  1990: { 0: 0.0073, 1: 0.000362, 5: 0.000181, 10: 0.000163, 15: 0.000362, 20: 0.000633, 25: 0.000724, 30: 0.000814, 35: 0.00109, 40: 0.00163, 45: 0.00271, 50: 0.00452, 55: 0.00724, 60: 0.0109, 65: 0.0144, 70: 0.0233, 75: 0.0361, 80: 0.0601, 85: 0.104, 90: 0.168, 95: 0.257, 100: 0.345, 105: 0.425, 110: 0.521 },
  2010: { 0: 0.0036, 1: 0.000209, 5: 0.0000837, 10: 0.0000837, 15: 0.000251, 20: 0.000335, 25: 0.000419, 30: 0.000502, 35: 0.000754, 40: 0.00117, 45: 0.00201, 50: 0.00335, 55: 0.00519, 60: 0.00754, 65: 0.00879, 70: 0.0135, 75: 0.0216, 80: 0.0372, 85: 0.0676, 90: 0.122, 95: 0.203, 100: 0.284, 105: 0.355, 110: 0.439 },
  2023: { 0: 0.0041, 1: 0.000153, 5: 0.0000767, 10: 0.0000767, 15: 0.000192, 20: 0.000269, 25: 0.000345, 30: 0.000422, 35: 0.000614, 40: 0.000998, 45: 0.00169, 50: 0.00284, 55: 0.00437, 60: 0.00576, 65: 0.00831, 70: 0.0121, 75: 0.0189, 80: 0.034, 85: 0.0642, 90: 0.121, 95: 0.212, 100: 0.302, 105: 0.393, 110: 0.491 },
};

// Interpolation linéaire sur un objet {clé numérique : valeur}.
function interp(anchors, x) {
  const keys = Object.keys(anchors).map(Number).sort((a, b) => a - b);
  if (x <= keys[0]) return anchors[keys[0]];
  if (x >= keys[keys.length - 1]) return anchors[keys[keys.length - 1]];
  for (let i = 0; i < keys.length - 1; i++) {
    const lo = keys[i], hi = keys[i + 1];
    if (x >= lo && x <= hi) {
      const t = (x - lo) / (hi - lo);
      return anchors[lo] + t * (anchors[hi] - anchors[lo]);
    }
  }
  return anchors[keys[keys.length - 1]];
}

// Quotient de mortalité à un âge donné, une année civile donnée.
// À 0 an : série réelle de mortalité infantile (aucune interpolation d'époque).
// Aux autres âges : interpolé en âge dans chaque époque, puis entre les deux
// époques civiles encadrantes.
function mortalityRate(age, year) {
  if (age === 0) return infantMortality(year);

  const eraKeys = Object.keys(MORTALITY_ERAS).map(Number).sort((a, b) => a - b);
  const yr = Math.max(eraKeys[0], Math.min(eraKeys[eraKeys.length - 1], year));

  let loEra = eraKeys[0], hiEra = eraKeys[eraKeys.length - 1];
  for (let i = 0; i < eraKeys.length - 1; i++) {
    if (yr >= eraKeys[i] && yr <= eraKeys[i + 1]) {
      loEra = eraKeys[i];
      hiEra = eraKeys[i + 1];
      break;
    }
  }
  const qLo = interp(MORTALITY_ERAS[loEra], age);
  const qHi = interp(MORTALITY_ERAS[hiEra], age);
  if (hiEra === loEra) return qLo;
  const t = (yr - loEra) / (hiEra - loEra);
  return qLo + t * (qHi - qLo);
}

// ───────────────────────────────────────────────────────────────────────────
// AFFINAGE PAR SEXE
//
//   Femmes et hommes ont des courbes de mortalité très différentes : surmortalité
//   masculine des jeunes adultes (accidents : q♂ jusqu'à ~1,5× q♀ vers 20 ans) et
//   net avantage féminin aux grands âges. Comme la survie est un PRODUIT, faire la
//   moyenne des quotients des deux sexes ne donne pas la même chose que la moyenne
//   des deux survies (convexité) : le modèle « ensemble » sous-estime les décès
//   d'environ 2 %. On modélise donc chaque sexe séparément, puis on recombine.
//
//   La courbe `MORTALITY_ERAS` (both-sexes) sert de base ; deux facteurs d'échelle
//   par sexe et par époque (avant / après 65 ans) la déforment jusqu'à reproduire
//   l'espérance de vie ET la survie à 65 ans réelles de CHAQUE sexe (Banque
//   mondiale, SP.DYN.LE00.* et SP.DYN.TO65.*). La mortalité infantile, dont l'écart
//   H/F est faible devant les autres incertitudes, reste celle de la série réelle.
//
//   Part des garçons à la naissance : ~51,2 % (sex-ratio ~105 garçons / 100 filles).
// ───────────────────────────────────────────────────────────────────────────

const BIRTH_SHARE_MALE = 0.512;

// Facteurs [αavant65, αaprès65] appliqués à la courbe both-sexes, par époque et sexe.
const SEX_SCALE = {
  1900: { F: [0.9056, 1.1348], M: [1.1068, 1.1935] },
  1930: { F: [0.8644, 0.8065], M: [1.1281, 1.5712] },
  1950: { F: [0.8116, 0.8137], M: [1.2492, 1.3261] },
  1970: { F: [0.6475, 0.8639], M: [1.4448, 1.5308] },
  1990: { F: [0.5744, 0.7818], M: [1.4990, 1.4443] },
  2010: { F: [0.6433, 0.7603], M: [1.4466, 1.3748] },
  2023: { F: [0.6611, 0.7940], M: [1.3518, 1.2983] },
};

// Facteur d'échelle d'un sexe à un âge/année donnés (interpolé entre époques).
function sexScale(sex, age, year) {
  const eraKeys = Object.keys(SEX_SCALE).map(Number).sort((a, b) => a - b);
  const yr = Math.max(eraKeys[0], Math.min(eraKeys[eraKeys.length - 1], year));
  let lo = eraKeys[0], hi = eraKeys[eraKeys.length - 1];
  for (let i = 0; i < eraKeys.length - 1; i++) {
    if (yr >= eraKeys[i] && yr <= eraKeys[i + 1]) { lo = eraKeys[i]; hi = eraKeys[i + 1]; break; }
  }
  const idx = age < 65 ? 0 : 1;
  const sLo = SEX_SCALE[lo][sex][idx], sHi = SEX_SCALE[hi][sex][idx];
  if (hi === lo) return sLo;
  const t = (yr - lo) / (hi - lo);
  return sLo + t * (sHi - sLo);
}

// Quotient de mortalité d'un sexe ("F" ou "M") à un âge / une année.
function mortalityRateSex(sex, age, year) {
  if (age === 0) return infantMortality(year); // écart H/F faible : série commune
  return Math.min(0.99, mortalityRate(age, year) * sexScale(sex, age, year));
}

// Survie d'un sexe pour une génération née en `birthYear`.
function cohortSurvivalSex(sex, birthYear, currentYear) {
  const age = currentYear - birthYear;
  let s = 1;
  for (let k = 0; k < age; k++) s *= 1 - mortalityRateSex(sex, k, birthYear + k);
  return s;
}

// Survie d'ensemble d'une génération née en `birthYear` jusqu'à `currentYear` :
// moyenne des survies des deux sexes, pondérée par le sex-ratio à la naissance.
function cohortSurvival(birthYear, currentYear) {
  const sM = cohortSurvivalSex("M", birthYear, currentYear);
  const sF = cohortSurvivalSex("F", birthYear, currentYear);
  return BIRTH_SHARE_MALE * sM + (1 - BIRTH_SHARE_MALE) * sF;
}

// Répartition des décès d'une génération par âge, sur toute la vie (0 à 110 ans).
// sex = "F" | "M" | null (ensemble, pondéré par le sex-ratio à la naissance).
// Renvoie un tableau : décès[a] = nombre de personnes de la génération qui
// meurent à l'âge a. Les âges au-delà de l'âge actuel sont une projection
// (mortalité figée à l'époque la plus récente).
const MAX_LIFE = 111;
function cohortDeathsByAge(birthYear, sex) {
  const births = birthsForYear(birthYear);
  const out = [];
  if (sex) {
    const share = sex === "M" ? BIRTH_SHARE_MALE : 1 - BIRTH_SHARE_MALE;
    let alive = births * share;
    for (let a = 0; a < MAX_LIFE; a++) {
      const d = alive * mortalityRateSex(sex, a, birthYear + a);
      out.push(d);
      alive -= d;
    }
  } else {
    let aliveM = births * BIRTH_SHARE_MALE;
    let aliveF = births * (1 - BIRTH_SHARE_MALE);
    for (let a = 0; a < MAX_LIFE; a++) {
      const dM = aliveM * mortalityRateSex("M", a, birthYear + a);
      const dF = aliveF * mortalityRateSex("F", a, birthYear + a);
      out.push(dM + dF);
      aliveM -= dM;
      aliveF -= dF;
    }
  }
  return out;
}

// Naissances réelles pour une année (année la plus proche si hors plage).
function birthsForYear(year) {
  if (BIRTHS[year] != null) return BIRTHS[year];
  const keys = Object.keys(BIRTHS).map(Number).sort((a, b) => a - b);
  const y = Math.max(keys[0], Math.min(keys[keys.length - 1], year));
  return BIRTHS[y];
}

// ───────────────────────────────────────────────────────────────────────────
// DONNÉES RÉELLES (fichier INSEE des personnes décédées, via deaths.js)
//
//   REAL_DEATHS[scope][annéeNaissance][sexe] = décès réels par âge.
//   On hybride : on utilise le comptage RÉEL là où il est disponible (décès
//   survenus entre 1970 et REAL_DEATHS_LAST_YEAR), et le MODÈLE ailleurs —
//   c.-à-d. la part d'avant 1970 des générations anciennes, et la projection
//   des années futures (décès pas encore survenus). Pour les générations nées
//   en 1970+, toute la part « déjà vécue » est donc du réel exact.
//     scope "metro" = personnes nées en France métropolitaine (cohorte de naissances).
//     scope "all"   = toute personne décédée en France née cette année-là (immigrés inclus).
// ───────────────────────────────────────────────────────────────────────────

function realDeathArray(scope, birthYear, sex) {
  if (typeof REAL_DEATHS === "undefined") return null;
  const entry = REAL_DEATHS[scope] && REAL_DEATHS[scope][birthYear];
  return entry && entry[sex] ? entry[sex] : null;
}

// Décès modélisés par âge (0..110) d'un sexe pour une génération.
function modelDeathsBySexAge(birthYear, sex) {
  const births = birthsForYear(birthYear);
  const share = sex === "M" ? BIRTH_SHARE_MALE : 1 - BIRTH_SHARE_MALE;
  const out = [];
  let alive = births * share;
  for (let a = 0; a < MAX_LIFE; a++) {
    const d = alive * mortalityRateSex(sex, a, birthYear + a);
    out.push(d);
    alive -= d;
  }
  return out;
}

// Série de décès par âge d'un sexe, selon la source :
//   "model"        → modèle pur ;
//   "metro"/"all"  → réel là où dispo (1970..LAST), modèle avant et après.
function deathSeriesSex(birthYear, sex, source) {
  const model = modelDeathsBySexAge(birthYear, sex);
  if (source === "model") return model;
  const real = realDeathArray(source, birthYear, sex);
  const out = [];
  for (let a = 0; a < MAX_LIFE; a++) {
    const year = birthYear + a;
    if (real && year >= 1970 && year <= REAL_DEATHS_LAST_YEAR) {
      out.push(real[a] || 0);
    } else {
      out.push(model[a]);
    }
  }
  return out;
}

// Série agrégée selon le sexe choisi ("all" | "F" | "M").
function deathSeries(birthYear, sexSel, source) {
  if (sexSel === "all") {
    const m = deathSeriesSex(birthYear, "M", source);
    const f = deathSeriesSex(birthYear, "F", source);
    return m.map((v, i) => v + f[i]);
  }
  return deathSeriesSex(birthYear, sexSel, source);
}

// Décès déjà survenus (somme jusqu'à l'âge actuel exclu) selon la source.
function deathsSoFar(birthYear, sexSel, source, currentYear) {
  const series = deathSeries(birthYear, sexSel, source);
  const age = currentYear - birthYear;
  let s = 0;
  for (let a = 0; a < age && a < MAX_LIFE; a++) s += series[a];
  return s;
}

// Effectif de référence de la cohorte (naissances métropole × part du sexe).
function cohortBase(birthYear, sexSel) {
  const t = birthsForYear(birthYear);
  if (sexSel === "M") return t * BIRTH_SHARE_MALE;
  if (sexSel === "F") return t * (1 - BIRTH_SHARE_MALE);
  return t;
}

const MIN_YEAR = 1900;
const MAX_YEAR = 2025;
