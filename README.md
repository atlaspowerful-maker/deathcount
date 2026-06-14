# deathcount — « Tu as survécu à combien de gens de ton âge ? »

Page statique (HTML/CSS/JS pur, aucun build, aucun backend). Tu entres ton année
de naissance ; à partir des naissances réelles de cette année-là en France (INSEE)
et de taux de mortalité par époque calibrés sur les tables INSEE/INED, on estime
à combien de personnes nées la même année que toi tu as déjà survécu.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `index.html` | structure de la page (compteur) |
| `calcul.html` | page « Comprendre le calcul » : méthode détaillée + exemple interactif |
| `style.css` | styles (partagés par les deux pages) |
| `data.js` | données démographiques + modèle de survie (méthode documentée en tête de fichier) |
| `app.js` | logique du compteur |
| `calcul.js` | exemple chiffré interactif de la page méthode |

## Déploiement

Hébergé sur le serveur lab/asimov sous **`https://lab.bourdat.fr/deathcount/`**
(également servi sur `asimov.bourdat.fr` / `atlas.bourdat.fr`, vhost partagé).

- Front statique servi directement par Caddy depuis `/var/www/deathcount/` (clone de ce repo).
- **Déployer = push sur `main`** : un cron serveur (`*/5 min`) pull GitHub et met le site à jour en ≤ 5 min. Pas de build, pas de webhook.
- IaC : rôle Ansible `deathcount` dans `atlas-infra` ; route Caddy dans le rôle `caddy`.
- Doc serveur : `~/Desktop/Openclaw/08_PROJECTS.md`.

Source données : INSEE (naissances séries longues, tables de mortalité) + INED (tables de mortalité).
