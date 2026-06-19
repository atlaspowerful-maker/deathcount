# deathcount — « Tu as survécu à combien de gens de ton âge ? »

Page statique (HTML/CSS/JS pur, aucun build, aucun backend). Tu entres ton année
de naissance (et, en option, ton sexe et le périmètre) ; on compte à combien de
personnes nées la même année que toi en France tu as déjà survécu.

Les décès sont **comptés un par un** dans le fichier INSEE des personnes décédées
(data.gouv.fr, ~26 M de décès, 1970-2025) — exact pour les générations nées en
1970+. Pour la part d'avant 1970 et la projection des années à venir, on complète
par un modèle de mortalité calibré sur les tables INSEE/INED (par sexe).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `index.html` | structure de la page (compteur) |
| `calcul.html` | page « Comprendre le calcul » : méthode détaillée + exemple interactif |
| `style.css` | styles (partagés par les deux pages) |
| `deaths.js` | décès réels agrégés du fichier INSEE (par année de naissance × sexe × âge ; généré hors-ligne, voir `tools/`) |
| `data.js` | naissances + modèle de mortalité calibré + accès aux données réelles |
| `app.js` | logique du compteur |
| `calcul.js` | exemple chiffré interactif de la page méthode |

## Déploiement

Hébergé sur le serveur lab/asimov sous **`https://lab.bourdat.fr/deathcount/`**
(également servi sur `asimov.bourdat.fr` / `atlas.bourdat.fr`, vhost partagé).

- Front statique servi directement par Caddy depuis `/var/www/deathcount/` (clone de ce repo).
- **Déployer = push sur `main`** : un cron serveur (`*/5 min`) pull GitHub et met le site à jour en ≤ 5 min. Pas de build, pas de webhook.
- IaC : rôle Ansible `deathcount` dans `atlas-infra` ; route Caddy dans le rôle `caddy`.
- Doc serveur : `~/Desktop/Dev/Openclaw/08_PROJECTS.md`.

Source données : INSEE (naissances séries longues, tables de mortalité) + INED (tables de mortalité).
