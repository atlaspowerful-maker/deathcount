# Instructions pour Claude — projet deathcount

> Créé depuis `~/Desktop/Openclaw/templates/CLAUDE-nouveau-projet.md` (2026-06-15).
> **Setup terminé (2026-06-14)** : page codée + déployée. Rôle Ansible `deathcount` (atlas-infra),
> route Caddy + cron auto-deploy actifs. Site live : `https://lab.bourdat.fr/deathcount/`.

## Fiche d'identité

| Champ | Valeur |
|-------|--------|
| Nom | `deathcount` (kebab-case) |
| URL | `https://lab.bourdat.fr/deathcount/` |
| Repo GitHub | [`atlaspowerful-maker/deathcount`](https://github.com/atlaspowerful-maker/deathcount) — **public** |
| Ports locaux | aucun (statique pur, pas de backend) |
| Auth | publique |
| Services | aucun (site statique servi par Caddy) |
| Données | aucune (pas de DB, pas de secret ; données INSEE/INED embarquées dans `data.js`) |
| Rôle Ansible | `~/Desktop/atlas-infra/roles/deathcount/` — cron pull-only `*/5` (pas de build, pas de webhook) |

> **Cas statique pur** : HTML/CSS/JS vanilla, tout côté navigateur. Pas de backend / ports / env-secrets / tools-auth / backups. Déploiement = `git pull` du cron (≤ 5 min après un push sur `main`), **aucun build**. Le but : estimer, depuis les naissances réelles INSEE par année + taux de mortalité calibrés, combien de gens de ta génération ont déjà disparu (méthode documentée en tête de `data.js`).

## 🎫 Tes tickets — backlog commun flaggé `#deathcount`

Ce projet **n'a pas son backlog à lui** : ses tickets vivent dans le **backlog commun du serveur** (`/root/.openclaw/server-context/backlog.md`, source de vérité unique, rendu live sur `asimov.bourdat.fr`). Loïc — ou Asimov, son PO — y dépose des tâches **flaggées `#deathcount`** (ex. « sur deathcount, ajoute un partage du résultat » → `[P2][todo] #deathcount Partage du résultat — … ~1h`).

**Au début d'une session de travail sur deathcount**, récupère TES tickets et propose-les à Loïc :

```bash
ssh root@atlas.bourdat.fr \
  "grep -nE '^\[P[012]\]\[(todo|progress)\] #deathcount ' /root/.openclaw/server-context/backlog.md"
```

Pour chaque ticket traité : **(option)** flip `[todo]` → `[progress]` côté serveur ; **traite-le** ici (branche-par-session) ; **marque-le `done` sur le serveur** (la source de vérité) une fois fini **et prouvé** :
```bash
ssh root@atlas.bourdat.fr \
  "sed -i 's/^\[P[012]\]\[\(todo\|progress\)\] #deathcount Partage du résultat/[P2][done] #deathcount Partage du résultat/' \
   /root/.openclaw/server-context/backlog.md"
```
Puis **signifie-le à Loïc** : « ✅ ticket *Partage du résultat* traité (commit `…`), passé en `done` ». Il le verra aussi sur le hub. Ne touche **que** tes lignes `#deathcount` ; ne ferme jamais un ticket non prouvé.

## Références obligatoires (hors de ce repo)

Ce projet est hébergé sur **lab.bourdat.fr** (VPS `161.97.72.173`), serveur partagé. Tout l'état serveur vit dans deux repos de référence à consulter **avant toute action serveur** :

| Sujet | Où |
|-------|----|
| Setup d'un nouveau projet (conventions, ports, checklist) | `~/Desktop/Openclaw/13_NOUVEAU_PROJET.md` |
| Carte du serveur : qui tourne où, ports, frontières entre apps | `~/Desktop/Openclaw/08_PROJECTS.md` |
| Où vivent les secrets, procédures de rotation | `~/Desktop/Openclaw/06_SECRETS.md` |
| Index complet de la doc serveur | `~/Desktop/Openclaw/README.md` |
| **IaC Ansible** (état désiré du serveur, rôles, vault) | `~/Desktop/atlas-infra/` — méthode dans `docs/METHODOLOGY.md` |

La doc peut être périmée : si une commande ou un état est critique, vérifier sur le serveur avant d'affirmer.

## Règle de pérennité — Ansible + doc, toujours

Toute modif serveur liée à ce projet doit être **portée dans Ansible** (`~/Desktop/atlas-infra`, rôle `roles/deathcount/`) et **reflétée dans la doc** (`~/Desktop/Openclaw/08_PROJECTS.md`), dans la même tâche. Ce qui existe sur le serveur mais pas dans Ansible sera écrasé au prochain `ansible-playbook bootstrap.yml`. (Ici, le déploiement du contenu = simple `git pull` du cron : pousser sur `main` suffit, pas de changement serveur.)

## Règle de doc vivante

À la fin de toute session qui apprend ou change quelque chose de notable : mettre à jour la doc dans la même session (README/docs du repo, fiche ci-dessus si l'état change, doc serveur si ça touche le serveur). Ce qui n'est pas noté est perdu.

## Règle git — branche par session, merge en fin de session

Jamais de travail direct sur `main` :
1. **Début** : `git fetch && git pull` sur `main`, puis branche `session/YYYY-MM-DD-<sujet>`.
2. Committer **uniquement sur cette branche**.
3. **Fin** : rebase sur `main`, merge, push, supprimer la branche.
4. **Conflit** = travail d'une autre session : ne jamais écraser, intégrer les deux.

## Spécificités projet

- **Stack** : statique pur, HTML/CSS/JS vanilla, aucune dépendance de build. Données dans `data.js` (naissances INSEE + mortalité calibrée INSEE/INED, méthode en tête de fichier).
- **Déploiement** : push sur `main` → site à jour ≤ 5 min (cron pull, pas de build). Log : `/var/log/deathcount-deploy.log`.
