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
// PRÉCISION
//
//   • Naissances : valeurs RÉELLES, année par année (France métropolitaine).
//     Aucune interpolation. Source INSEE.
//   • Mortalité : quotients de mortalité q(âge, époque) CALIBRÉS sur les tables
//     de mortalité françaises (espérance de vie et mortalité infantile par
//     époque). Ce sont des estimations rigoureuses — pas le fichier INSEE brut —
//     et elles n'isolent pas les surmortalités de guerre (1914-18, 1939-45).
//     Le nombre de décès reste, par nature, une estimation statistique.
//
// Sources :
//   INSEE — naissances séries longues : https://www.insee.fr/fr/statistiques/8582147
//   INSEE — tables de mortalité / bilan 2024 : https://www.insee.fr/fr/statistiques/8313953
//   INED — table de mortalité : https://www.ined.fr/fr/tout-savoir-population/chiffres/france/mortalite-cause-deces/table-mortalite/
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

// Quotients de mortalité annuels q(âge) par époque (probabilité, pour une
// personne vivante à l'âge x, de mourir avant x+1). Calibrés sur les tables
// de mortalité françaises de chaque période.
const MORTALITY_ERAS = {
  1900: { 0: 0.160, 1: 0.045, 5: 0.0060, 10: 0.0035, 15: 0.0040, 20: 0.0060, 25: 0.0070, 30: 0.0080, 35: 0.0090, 40: 0.0110, 45: 0.0130, 50: 0.0170, 55: 0.0220, 60: 0.0300, 65: 0.0420, 70: 0.0620, 75: 0.0900, 80: 0.1300, 85: 0.1850, 90: 0.2600, 95: 0.3500, 100: 0.4500, 105: 0.5500, 110: 0.6500 },
  1930: { 0: 0.080, 1: 0.012, 5: 0.0020, 10: 0.0015, 15: 0.0020, 20: 0.0030, 25: 0.0035, 30: 0.0040, 35: 0.0050, 40: 0.0060, 45: 0.0080, 50: 0.0120, 55: 0.0170, 60: 0.0250, 65: 0.0370, 70: 0.0570, 75: 0.0850, 80: 0.1250, 85: 0.1800, 90: 0.2550, 95: 0.3450, 100: 0.4450, 105: 0.5450, 110: 0.6500 },
  1950: { 0: 0.045, 1: 0.004, 5: 0.0008, 10: 0.0006, 15: 0.0009, 20: 0.0014, 25: 0.0015, 30: 0.0017, 35: 0.0022, 40: 0.0030, 45: 0.0045, 50: 0.0070, 55: 0.0110, 60: 0.0180, 65: 0.0280, 70: 0.0450, 75: 0.0720, 80: 0.1150, 85: 0.1700, 90: 0.2450, 95: 0.3400, 100: 0.4400, 105: 0.5400, 110: 0.6500 },
  1970: { 0: 0.015, 1: 0.0008, 5: 0.0004, 10: 0.0003, 15: 0.0006, 20: 0.0010, 25: 0.0010, 30: 0.0011, 35: 0.0015, 40: 0.0023, 45: 0.0038, 50: 0.0062, 55: 0.0098, 60: 0.0160, 65: 0.0250, 70: 0.0410, 75: 0.0670, 80: 0.1080, 85: 0.1650, 90: 0.2400, 95: 0.3350, 100: 0.4350, 105: 0.5350, 110: 0.6500 },
  1990: { 0: 0.0075, 1: 0.0004, 5: 0.0002, 10: 0.00018, 15: 0.0004, 20: 0.0007, 25: 0.0008, 30: 0.0009, 35: 0.0012, 40: 0.0018, 45: 0.0030, 50: 0.0050, 55: 0.0080, 60: 0.0120, 65: 0.0180, 70: 0.0290, 75: 0.0450, 80: 0.0750, 85: 0.1300, 90: 0.2100, 95: 0.3200, 100: 0.4300, 105: 0.5300, 110: 0.6500 },
  2010: { 0: 0.0038, 1: 0.00025, 5: 0.0001, 10: 0.0001, 15: 0.0003, 20: 0.0004, 25: 0.0005, 30: 0.0006, 35: 0.0009, 40: 0.0014, 45: 0.0024, 50: 0.0040, 55: 0.0062, 60: 0.0090, 65: 0.0130, 70: 0.0200, 75: 0.0320, 80: 0.0550, 85: 0.1000, 90: 0.1800, 95: 0.3000, 100: 0.4200, 105: 0.5250, 110: 0.6500 },
  2023: { 0: 0.0035, 1: 0.0002, 5: 0.0001, 10: 0.0001, 15: 0.00025, 20: 0.00035, 25: 0.00045, 30: 0.00055, 35: 0.0008, 40: 0.0013, 45: 0.0022, 50: 0.0037, 55: 0.0057, 60: 0.0075, 65: 0.0110, 70: 0.0160, 75: 0.0250, 80: 0.0450, 85: 0.0850, 90: 0.1600, 95: 0.2800, 100: 0.4000, 105: 0.5200, 110: 0.6500 },
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

// Quotient de mortalité à un âge donné, une année civile donnée :
// interpolé en âge dans chaque époque, puis entre les deux époques encadrantes.
function mortalityRate(age, year) {
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

// Probabilité de survie d'une génération née en `birthYear` jusqu'en 2026.
function cohortSurvival(birthYear, currentYear) {
  const age = currentYear - birthYear;
  let s = 1;
  for (let k = 0; k < age; k++) {
    s *= 1 - mortalityRate(k, birthYear + k);
  }
  return s;
}

// Naissances réelles pour une année (année la plus proche si hors plage).
function birthsForYear(year) {
  if (BIRTHS[year] != null) return BIRTHS[year];
  const keys = Object.keys(BIRTHS).map(Number).sort((a, b) => a - b);
  const y = Math.max(keys[0], Math.min(keys[keys.length - 1], year));
  return BIRTHS[y];
}

const MIN_YEAR = 1900;
const MAX_YEAR = 2025;
