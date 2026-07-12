# Rapport final PFA — SBS Data Factory · Drive-to-Store DSP (LaTeX)

Ce dossier contient le **rapport de fin d'année** au format LaTeX, prêt à être
compilé en PDF pour dépôt à l'ENSAM Casablanca et remise à SBS Data Factory.

## Structure

```
rapport-final-latex/
├── rapport-final-stage.tex     # Fichier principal (à compiler)
├── references.bib              # Références au format BibTeX (optionnel)
├── Makefile                    # Raccourcis de compilation
├── README.md                   # Ce fichier
└── sections/                   # Contenu du rapport, un fichier par partie
    ├── 00-page-garde.tex
    ├── 01-remerciements.tex
    ├── 02-resume-abstract.tex
    ├── 03-introduction.tex
    ├── 04-organisme-accueil.tex
    ├── 05-problematique-objectifs.tex
    ├── 06-methodologie.tex
    ├── 07-analyse-fonctionnelle.tex
    ├── 08-architecture-technique.tex
    ├── 09-conception-base-donnees.tex
    ├── 10-realisation-modules.tex
    ├── 11-tests-validation.tex
    ├── 12-documentation-livraison.tex
    ├── 13-limites-perspectives.tex
    ├── 14-conclusion.tex
    ├── 16-bibliographie.tex
    └── 15-annexes.tex
```

Les images (logos et captures d'écran) sont référencées en chemin relatif
depuis :

```
../rapport-final-assets/logos/
../rapport-final-assets/screenshots/
```

Le fichier principal définit `\graphicspath` vers ces deux dossiers ; les
images sont donc incluses par leur simple nom de fichier.

## Compilation

Le rapport est conçu pour compiler avec **XeLaTeX** (recommandé) **ou**
**pdfLaTeX** : le préambule choisit automatiquement le bon paquet de gestion
des polices via `iftex`. Aucun paquet nécessitant `--shell-escape` n'est
utilisé.

Deux passes sont nécessaires pour résoudre la table des matières, la liste des
figures/tableaux et les références croisées.

### Avec le Makefile

```bash
cd docs/rapport-final-latex
make            # XeLaTeX (deux passes)
# ou
make pdflatex   # pdfLaTeX (deux passes)
make clean      # nettoie les fichiers auxiliaires
```

### En ligne de commande directe

```bash
cd docs/rapport-final-latex

# XeLaTeX (recommandé)
xelatex rapport-final-stage.tex
xelatex rapport-final-stage.tex

# ou pdfLaTeX
pdflatex rapport-final-stage.tex
pdflatex rapport-final-stage.tex
```

Le PDF généré est `rapport-final-stage.pdf`, dans ce même dossier.

### Avec Overleaf ou un éditeur LaTeX

1. Importer le dossier `rapport-final-latex/` **et** le dossier
   `rapport-final-assets/` en conservant leur position relative
   (`rapport-final-latex/` et `rapport-final-assets/` doivent rester frères,
   c'est-à-dire tous deux dans `docs/`).
2. Définir le fichier principal sur `rapport-final-stage.tex`.
3. Choisir le compilateur **XeLaTeX** (ou pdfLaTeX).
4. Compiler.

## Bibliographie

Le rapport utilise par défaut une **bibliographie manuelle**
(`sections/16-bibliographie.tex`, liste numérotée composée à la main — sans
environnement `thebibliography`, afin d'éviter les doublons de titre et
d'en-tête que cet environnement génère). La compilation reste donc simple,
sans outil externe (pas besoin de `bibtex` ni `biber`). Le fichier
`references.bib` est fourni en complément, pour une éventuelle migration vers
`bibtex`/`biblatex`.

## Paquets requis

`iftex`, `inputenc`/`fontenc`/`lmodern` (pdfLaTeX) ou `fontspec` (XeLaTeX),
`babel` (français), `csquotes`, `geometry`, `setspace`, `graphicx`, `xcolor`,
`float`, `caption`, `subcaption`, `tikz`, `booktabs`, `longtable`, `array`,
`tabularx`, `enumitem`, `listings`, `titlesec`, `fancyhdr`, `hyperref`.

Ces paquets sont fournis par toute distribution TeX complète (TeX Live,
MiKTeX). Aucune ressource en ligne n'est requise à la compilation.

## Remarque

Ce dossier ne contient **que de la documentation** : aucun fichier de code
fonctionnel (`frontend/`, `backend/`) n'est modifié par la génération de ce
rapport.
