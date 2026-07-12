# Rapport final PFA — Version prête pour Overleaf

Version **auto-contenue** du rapport LaTeX : les images (logos et captures
d'écran) sont incluses **à l'intérieur** de ce dossier, et les chemins
d'images sont **relatifs à la racine du projet** (pas de `../`). C'est cette
version qu'il faut téléverser sur Overleaf.

## Structure (racine = ce dossier)

```
rapport-final-stage.tex          # Fichier principal (à compiler)
references.bib                   # Références BibTeX (optionnel)
README.md                        # Ce fichier
sections/                        # Contenu du rapport (un fichier par partie)
rapport-final-assets/
├── logos/                       # logoENsam.png, SBS_LOGO.png
└── screenshots/                 # 12 captures d'écran
```

Le fichier principal définit :

```latex
\graphicspath{{rapport-final-assets/screenshots/}{rapport-final-assets/logos/}}
```

Les images sont donc trouvées par leur simple nom de fichier, sans aucun
`../`.

## Téléverser sur Overleaf (méthode recommandée : ZIP)

1. Utiliser l'archive fournie : **`docs/rapport-final-overleaf.zip`**.
   Sa racine contient directement `rapport-final-stage.tex`, `sections/`,
   `references.bib`, `rapport-final-assets/` et `README.md` (et **non** un
   dossier `rapport-final-overleaf/` au-dessus).
2. Sur Overleaf : **New Project → Upload Project → Zip File**, puis
   sélectionner `rapport-final-overleaf.zip`.
3. Ouvrir le menu **Menu → Settings** et régler **Compiler** sur
   **XeLaTeX** (recommandé). pdfLaTeX fonctionne également.
4. Définir le **Main document** sur `rapport-final-stage.tex` si Overleaf ne
   le détecte pas automatiquement.
5. Cliquer sur **Recompile**. Les logos et captures d'écran s'affichent
   correctement (plus de cadres vides avec le nom de fichier).

## Compilation en local

Deux passes sont nécessaires pour la table des matières, la liste des
figures/tableaux et les références croisées.

```bash
# XeLaTeX (recommandé)
xelatex rapport-final-stage.tex
xelatex rapport-final-stage.tex

# ou pdfLaTeX
pdflatex rapport-final-stage.tex
pdflatex rapport-final-stage.tex
```

Le PDF produit est `rapport-final-stage.pdf`.

## Notes importantes

- **Aucun mode brouillon** : ni `[draft]` dans `\documentclass`, ni option
  `draft`/`demo` dans `graphicx`, ni `\setkeys{Gin}{draft=true}`. Les images
  sont donc rendues normalement, pas sous forme de cadres.
- **Casse des noms de fichiers** : Overleaf est sensible à la casse. Les noms
  respectent exactement ceux des fichiers (par ex. `logoENsam.png`,
  `SBS_LOGO.png`).
- La bibliographie est **manuelle** (`sections/16-bibliographie.tex`, liste
  numérotée composée à la main, sans environnement `thebibliography`), donc
  aucun outil externe (`bibtex`/`biber`) n'est requis ; `references.bib` est
  fourni en complément.
- Ce dossier ne contient **que de la documentation** : aucun fichier de code
  (`frontend/`, `backend/`) n'est concerné.
