# Méthodologie — deathcount

> Document destiné à la relecture par un·e démographe / expert·e.
> Il décrit **exactement** ce que calcule le site `deathcount` (le compteur des
> survivants), les données, les formules, la calibration et les **limites connues**.
> Toute la logique tient dans [`data.js`](data.js) (le fichier est commenté en tête).
> Date de rédaction : 2026-07-06. Année de référence des calculs : **2026**.

---

## 1. Objectif

Pour une personne née une année `Y` en France, estimer :

- combien de personnes sont **nées la même année** (`naissances(Y)`, valeur réelle) ;
- combien sont **déjà décédées** en 2026 ;
- combien sont **encore en vie** en 2026 ;
- la **répartition des décès par âge** de cette génération (courbe affichée).

Le périmètre est la **cohorte de naissances de France métropolitaine** : on suit les
gens *nés* en métropole une année donnée, où qu'ils vivent ensuite. Ce n'est **pas**
la population résidente (voir §8, limites : les immigrés ne sont pas comptés).

---

## 2. Principe général — survie de cohorte le long de la diagonale de Lexis

On fait « vieillir » la génération année par année. La probabilité qu'une personne
née en `Y` soit encore vivante à l'âge `A` (donc en année civile `Y+A`) est le
produit des probabilités annuelles de survie, **chaque âge étant traversé à sa
propre année civile** :

```
survie(Y, A) = ∏  ( 1 − q(âge k, année Y+k) )      pour k = 0 … A−1
```

où `q(âge, année)` est le quotient de mortalité (probabilité qu'une personne vivante
à cet âge cette année-là meure avant l'anniversaire suivant).

- décès estimés = `naissances(Y) × ( 1 − survie(Y, A) )`
- vivants estimés = `naissances(Y) × survie(Y, A)`

Une génération née en 1918 traverse ainsi la forte mortalité infantile de 1918 puis
la grippe espagnole ; une née en 2010, quasiment aucune. Le calcul est fait
**séparément pour chaque sexe**, puis recombiné (§5).

---

## 3. Données d'entrée (toutes réelles sauf la table de mortalité, calibrée)

| Donnée | Nature | Source |
|---|---|---|
| Naissances par année (métropole) | **Réelle**, aucune interpolation | INSEE (séries longues) |
| Mortalité infantile `q(0, année)` | **Réelle**, série annuelle interpolée linéairement | INED / INSEE |
| Quotients `q(âge, époque)`, âges ≥ 1 | **Calibrés** (voir §6) | tables INSEE/INED, calage sur cibles publiées |
| Décès **réels** par âge et sexe | **Réels** (fichier des personnes décédées) | INSEE — fichier des décès (1970 → 2025) |
| Part de garçons à la naissance | 51,2 % (sex-ratio ~105) | INSEE |

La table de mortalité est structurée par **époques-ancres** (1900, 1930, 1950, 1970,
1990, 2010, 2023). Pour une année quelconque, `q` est interpolé linéairement en âge
*dans* chaque époque, puis linéairement *entre* les deux époques encadrantes.

---

## 4. Hybridation « modèle + décès réels INSEE »

Le fichier INSEE des personnes décédées couvre les décès survenus **de 1970 à 2025**.
On l'utilise comme **vérité terrain** là où il est disponible, et le modèle ailleurs :

Pour une génération née en `Y`, à l'âge `a` (année civile `Y+a`) :

- si `1970 ≤ Y+a ≤ 2025` **et** que le fichier a une valeur → on prend le **décès réel**
  (comptage exact) ;
- sinon (avant 1970, après 2025, ou âge non couvert) → on applique le **taux du
  modèle aux survivants réellement restants** (voir §7.2).

Conséquence : pour les générations nées **en 1970 ou après**, toute la partie « déjà
vécue » est du **réel exact**. Pour les générations plus anciennes, l'enfance/jeunesse
(avant 1970) est modélisée, le reste est réel.

Deux périmètres sont proposés dans l'UI :
- `metro` (défaut) : personnes **nées en métropole** (cohorte de naissances) ;
- `all` : toute personne décédée en France née cette année-là (immigrés inclus dans
  les décès).

---

## 5. Affinage par sexe

Femmes et hommes ont des courbes très différentes (surmortalité masculine des jeunes
adultes ; avantage féminin aux grands âges). Comme la survie est un **produit**,
moyenner les quotients des deux sexes ≠ moyenner les deux survies (convexité) : le
modèle « ensemble » sous-estimait les décès d'environ 2 %. On modélise donc chaque
sexe séparément.

La courbe `q(âge, époque)` both-sexes sert de base ; **deux facteurs d'échelle par
sexe et par époque** (avant / après 65 ans) la déforment jusqu'à reproduire, pour
**chaque sexe**, l'espérance de vie **et** la survie à 65 ans réelles (Banque
mondiale). Recombinaison finale pondérée par le sex-ratio à la naissance (51,2 % ♂).

```
survie_ensemble(Y) = 0,512 × survie♂(Y) + 0,488 × survie♀(Y)
```

---

## 6. Calibration

### 6.1 Cibles principales (âges < 90) — espérance de vie & survie à 65 ans

Deux facteurs d'échelle par époque (avant / après 65 ans) sont ajustés numériquement
pour que **chaque époque-ancre** reproduise deux cibles réelles publiées :

- **e0** : espérance de vie à la naissance (période, both sexes) ;
- **s65** : survie à 65 ans (période, both sexes).

Vérification (table période reconstituée à partir de `data.js`, y compris **hors
échantillon** — 1960, 1980, 2000, 2020) :

| Année | e0 modèle | e0 cible | s65 modèle | s65 cible |
|---|---:|---:|---:|---:|
| 1900 | 47,0 | 47,0 | 40,1 | 40 |
| 1930 | 56,7 | 56,7 | 50,7 | 51 |
| 1950 | 66,5 | 66,4 | 67,5 | 67 |
| 1960 | 69,9 | — | 72,4 | — |
| 1970 | 72,5 | 72,4 | 76,3 | 75,8 |
| 1980 | 74,8 | — | 79,6 | — |
| 1990 | 76,9 | 76,9 | 82,5 | 82,2 |
| 2000 | 79,2 | ~80 | 85,2 | — |
| 2010 | 81,7 | 81,8 | 87,8 | 87,4 |
| 2020 | 82,6 | — | 89,2 | — |
| 2023 | 82,8 | 82,9 | 89,6 | 89,6 |

Écart e0 < 0,5 an ; écart s65 < 0,8 pt. **Ces cibles ne sont pas touchées par le
traitement des grands âges** (§7) car quasiment personne n'atteint 95 ans : l'impact
sur e0 est de l'ordre de quelques jours.

### 6.2 Cible grands âges — pyramide nationale des centenaires

Ajoutée pour caler la queue de distribution (voir §7.3). Cible INSEE **2023** :
~31 000 personnes de 100 ans et +, ~2 000 de 105 +, **39 de 110 +**.

---

## 7. Traitement des grands âges (le point critique — corrigé le 2026-07-06)

### 7.1 Le problème d'origine (bug signalé)

La table de mortalité et la boucle de calcul s'arrêtaient à **110 ans**. Trois
défauts cumulés faisaient qu'une génération ne s'éteignait **jamais** :

1. **Troncature à 110 ans** : les survivants au-delà de 110 ans n'étaient plus jamais
   décomptés → comptés « vivants » indéfiniment. Une personne née en 1901 (125 ans en
   2026) affichait **23 324 « encore en vie »** — impossible.
2. **Projection hors fenêtre réelle incohérente** : au-delà des données INSEE, on
   empilait les effectifs d'une *cohorte-modèle parallèle* (minuscule) au lieu
   d'appliquer le taux aux survivants réellement restants.
3. **Sous-comptage du fichier réel aux très grands âges** (voir §7.3).

### 7.2 Correction structurelle — table de cohorte complète jusqu'au plafond biologique

- La courbe `q` est **prolongée jusqu'à q ≈ 0,99 à 122 ans**. Justification :
  - **plateau super-centenaire** : le quotient annuel plafonne autour de **0,5 entre
    105 et ~114 ans** (Gampe 2010 ; Barbi et al., *Science* 2018, base IDL) ;
  - **plafond biologique dur** : record mondial 122 ans (J. Calment) ; doyen·ne
    français·e ~118 ans → q monte vers la certitude au-delà de 118-120.
- Âge maximum du modèle porté à **122 ans** (`MAX_LIFE = 123`).
- La série de décès est réécrite en **vraie table de cohorte** : hors fenêtre réelle,
  on applique le **taux** de mortalité au **nombre de survivants réellement restants**
  (et non des effectifs d'une cohorte fictive). Résultat : `∑ décès = naissances` à
  l'unité près → **toute génération finit par s'éteindre**.

### 7.3 Correction de niveau — plancher + excès de mortalité aux grands âges

Le fichier des décès réels **s'arrête à 110 ans** et **sous-compte les très grands
âges** (notamment les natifs de métropole **décédés à l'étranger**, absents du
fichier français → ils apparaissent à tort « en vie »). Sans correction, le modèle
laissait ~160 000 centenaires et ~1 400 personnes de 110 +.

Deux garde-fous, calibrés sur la pyramide INSEE (§6.2) :

- **Plancher** (`OLDAGE_FLOOR_FROM = 95`) : à partir de 95 ans, on prend
  `max( décès réels, taux modèle × survivants )` — le comptage réel ne peut jamais
  faire *sous-mourir* la cohorte par rapport à la table de vie.
- **Excès** (`OLDAGE_EXCESS = 1,4` dès 95 ans) : facteur multiplicatif sur `q`,
  calé pour reproduire la pyramide nationale.

Après correction (modèle 2026) :

| Seuil | Avant | Après | Cible INSEE 2023 (croissance ~+6 %/an) |
|---|---:|---:|---:|
| 100 + | 162 000 | **38 060** | ~31 000 (→ ~35-37 k en 2026) |
| 105 + | 19 000 | **2 277** | ~2 000 |
| 110 + | 1 400 | **58** | 39 |

---

## 8. Résultats & contrôle

### 8.1 Le bug est corrigé

| Né en | Âge 2026 | Vivants avant | Vivants après |
|---|---:|---:|---:|
| 1901 | 125 | 23 324 | **0** |
| 1911 | 115 | 50 374 | **0** |
| 1913 | 113 | 165 | **4** |
| 1916 | 110 | 26 578 | **29** |

### 8.2 Comparaison à la population résidente INSEE (contrôle « gonflé »)

⚠️ Le modèle compte les **nés en métropole encore vivants** — il **exclut les
immigrés**. Il doit donc être **inférieur** à la population résidente INSEE.

| Seuil | Modèle | INSEE résidents 2026 | Lecture |
|---|---:|---:|---|
| 65 + | 13,27 M | ~14,95 M (21,8 %) | ✅ modèle < résident (immigrés en +) |
| 75 + | 6,87 M | **7,686 M** (INSEE) | ✅ écart ~0,8 M = immigrés 75+ |
| 85 + | 2,28 M | ~2,0-2,3 M | ≈ correct |
| 90 + | 1,09 M | ~0,9-1,0 M | ⚠️ modèle **~+15-20 %** |
| 95 + | 0,315 M | ~0,20-0,25 M | ⚠️ modèle **~+40 %** |
| 100 + | 38 060 | ~34-36 k | légèrement haut (~+8 %) |

**Interprétation** : sous 85 ans, les effectifs sont cohérents (et correctement
*sous* le résident, immigrés exclus). Le sur-comptage réel est concentré sur
**90-99 ans** : la mortalité *avant 1970* (enfance/jeunesse des générations
1926-1936) est modélisée et légèrement trop douce ; l'erreur se propage jusqu'aux
grands âges. La correction §7.3 ramène le 100 + dans les clous mais laisse ce résidu.

---

## 9. Limites connues (à challenger avec l'expert)

1. **Sur-comptage 90-99 ans (~+15 à +40 %)** — principal point ouvert. Origine
   probable : mortalité modélisée trop douce avant 1970 pour les cohortes 1926-1936,
   qui se propage. Piste : caler la queue 88-99 sur la pyramide INSEE par âge simple
   (données non encore intégrées faute de série fine sous la main).
2. **Périmètre cohorte ≠ résidents** : le modèle ignore l'**immigration** (nés hors
   métropole) et l'**émigration** (natifs partis mourir à l'étranger, invisibles du
   fichier des décès → « faux survivants », partiellement corrigé par le plancher §7.3).
3. **Surmortalités de guerre non isolées** (1914-18, 1939-45) : diluées dans les
   époques-ancres, pas modélisées comme chocs. Impact négligeable sur le compteur 2026
   (ces générations sont ~éteintes) mais visible sur la *forme* de la courbe historique.
4. **Table both-sexes + facteurs d'échelle** : approximation de la structure par sexe ;
   calée sur e0 et s65 seulement, pas sur la courbe complète.
5. **Interpolation linéaire** entre époques-ancres (tous les 20-30 ans) et entre âges :
   lisse les variations annuelles fines.
6. **Excès grand âge = facteur unique (×1,4 dès 95 ans)** : correctif empirique calé
   sur 3 points (100+/105+/110+), pas une table de mortalité des grands âges en soi.
7. **Mortalité infantile** : quotient à 0 an commun aux deux sexes (l'écart H/F y est
   faible devant les autres incertitudes).

---

## 10. Questions pour l'expert

1. La tranche **90-99 ans** est ~+20-40 % au-dessus du résident INSEE (immigrés
   pourtant exclus). Confirmez-vous le sur-comptage, et quelle est la meilleure cible
   pour recaler (pyramide par âge simple ? tables de cohorte INSEE/HMD ?) ?
2. Le **plateau à q ≈ 0,5** (105-114 ans) puis la montée vers q ≈ 0,99 à 122 ans est-il
   un choix acceptable pour la France, ou préférez-vous une loi (Gompertz plafonnée,
   Kannisto, Beard) explicite ?
3. Le **plancher table-modèle dès 95 ans** (au lieu du décès réel) pour compenser
   l'émigration des natifs est-il défendable, ou biaise-t-il le comptage « réel » ?
4. Faut-il isoler explicitement les **chocs de guerre** pour les cohortes 1890-1925 ?
5. La distinction **cohorte de naissances vs population résidente** est-elle assez
   claire pour l'usage grand public du site ?

---

## Sources

- INSEE — naissances (séries longues) : <https://www.insee.fr/fr/statistiques/8582147>
- INSEE — tables de mortalité / bilan 2024 : <https://www.insee.fr/fr/statistiques/8313953>
- INSEE — « 30 000 centenaires en France » (Insee Première n°1943, 2023) : <https://www.insee.fr/fr/statistiques/7234483>
- INSEE — bilan démographique 2024 : <https://www.insee.fr/fr/statistiques/8327319>
- INED — table de mortalité : <https://www.ined.fr/fr/tout-savoir-population/chiffres/france/mortalite-cause-deces/table-mortalite/>
- INED — mortalité infantile depuis 1901 : <https://www.ined.fr/fr/tout-savoir-population/chiffres/france/mortalite-cause-deces/mortalite-infantile/>
- Banque mondiale — survie à 65 ans (H/F) : indicateurs `SP.DYN.TO65.MA.ZS` / `.FE.ZS`
- Gampe, J. (2010), « Human mortality beyond age 110 », in *Supercentenarians*, Springer.
- Barbi, E. et al. (2018), « The plateau of human mortality: Demography of longevity pioneers », *Science* 360:1459. <https://www.science.org/doi/10.1126/science.aat3119>
