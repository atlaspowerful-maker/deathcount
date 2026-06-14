#!/usr/bin/env python3
"""Génère ../deaths.js à partir du « Fichier des personnes décédées » (INSEE, data.gouv.fr).

Pipeline (hors-ligne, ponctuel) :
  1. Récupère la liste des fichiers annuels deces-AAAA.txt via l'API data.gouv.
  2. Télécharge chaque fichier en streaming (rien n'est stocké sur disque).
  3. Agrège les décès par année de naissance × sexe × âge, en deux périmètres :
       - "all"   : toute personne décédée en France née cette année-là (immigrés inclus) ;
       - "metro" : uniquement les personnes nées en France métropolitaine.
  4. Écrit ../deaths.js (zéros de fin retirés pour alléger).

Format du fichier source : largeur fixe, positions (0-based) utilisées ici :
  sexe [80] (1=H, 2=F) · date naissance [81:89] AAAAMMJJ · code lieu naissance [89:94]
  · pays de naissance [124:154] (rempli seulement si né à l'étranger) · date décès [154:162]

Usage :  python3 tools/build_deaths.py          (depuis la racine du repo)
"""
import json, os, ssl, sys, time, urllib.request

API = "https://www.data.gouv.fr/api/1/datasets/fichier-des-personnes-decedees/"
OUT = os.path.join(os.path.dirname(__file__), "..", "deaths.js")
MINBY, MAXBY, MAXAGE = 1900, 2025, 110
CTX = ssl._create_unverified_context()


def annual_urls():
    import re
    with urllib.request.urlopen(API, timeout=60, context=CTX) as r:
        ds = json.load(r)
    urls = {}
    for res in ds.get("resources", []):
        m = re.search(r"deces-(\d{4})\.txt$", res.get("title") or "")
        if m:
            urls[int(m.group(1))] = res["url"]
    return dict(sorted(urls.items()))


def aggregate(urls):
    real = [dict(), dict()]  # 0 = all, 1 = metropole

    def bucket(v, by, sex):
        return real[v].setdefault(by, {}).setdefault(sex, [0] * (MAXAGE + 1))

    t0, grand = time.time(), 0
    for y, url in urls.items():
        n = 0
        for attempt in range(3):
            try:
                with urllib.request.urlopen(url, timeout=180, context=CTX) as resp:
                    for line in resp:
                        if len(line) < 162:
                            continue
                        by, dy = line[81:85], line[154:158]
                        if not (by.isdigit() and dy.isdigit()):
                            continue
                        by, dy = int(by), int(dy)
                        if by < MINBY or by > MAXBY:
                            continue
                        age = dy - by
                        if age < 0 or age > MAXAGE:
                            continue
                        sex = "M" if line[80:81] == b"1" else "F" if line[80:81] == b"2" else None
                        if sex is None:
                            continue
                        bucket(0, by, sex)[age] += 1
                        metro = line[124:154].strip() == b"" and line[89:91] not in (b"97", b"98", b"99")
                        if metro:
                            bucket(1, by, sex)[age] += 1
                        n += 1
                break
            except Exception as e:
                sys.stderr.write(f"  retry {y} ({attempt}): {e}\n")
                time.sleep(2)
        grand += n
        print(f"{y}: {n:>7} décès | cumul {grand:>9} | {time.time()-t0:5.0f}s", flush=True)
    return real


def trim(arr):
    last = max((i for i, v in enumerate(arr) if v), default=-1)
    return arr[: last + 1]


def write_js(real):
    def pack(v):
        return {by: {s: trim(a) for s, a in sx.items()} for by, sx in real[v].items()}

    out = {"all": pack(0), "metro": pack(1)}
    with open(OUT, "w") as f:
        f.write("// deaths.js — décès réels agrégés depuis le « Fichier des personnes décédées » (INSEE, data.gouv.fr).\n")
        f.write("// Généré par tools/build_deaths.py à partir des fichiers annuels 1970-2025.\n")
        f.write("// REAL_DEATHS[scope][annéeNaissance][sexe] = [décès à l âge 0, 1, 2, …] (zéros de fin retirés).\n")
        f.write('//   scope "all"   = toute personne décédée en France née cette année-là (immigrés inclus).\n')
        f.write('//   scope "metro" = uniquement les personnes nées en France métropolitaine.\n')
        f.write("// Complet pour les générations nées en 1970+ (tous leurs décès sont postérieurs à 1970).\n")
        f.write("// Source : https://www.data.gouv.fr/fr/datasets/fichier-des-personnes-decedees/\n")
        f.write("const REAL_DEATHS_LAST_YEAR = 2025;\n")
        f.write("const REAL_DEATHS = " + json.dumps(out, separators=(",", ":")) + ";\n")
    print("écrit", OUT, "(", round(os.path.getsize(OUT) / 1024), "Ko )")


if __name__ == "__main__":
    urls = annual_urls()
    print(f"{len(urls)} fichiers annuels ({min(urls)}-{max(urls)})")
    write_js(aggregate(urls))
