# Makefile — Rapport PFA SBS Data Factory / Drive-to-Store DSP
#
# Cibles :
#   make            (ou make xelatex)  -> compile avec XeLaTeX (recommandé)
#   make pdflatex                      -> compile avec pdfLaTeX
#   make clean                         -> supprime les fichiers auxiliaires
#   make cleanall                      -> clean + supprime le PDF
#
# Deux passes sont exécutées pour résoudre la table des matières,
# la liste des figures/tableaux et les références croisées.

MAIN = rapport-final-stage

.PHONY: all xelatex pdflatex clean cleanall

all: xelatex

xelatex:
	xelatex -interaction=nonstopmode $(MAIN).tex
	xelatex -interaction=nonstopmode $(MAIN).tex

pdflatex:
	pdflatex -interaction=nonstopmode $(MAIN).tex
	pdflatex -interaction=nonstopmode $(MAIN).tex

clean:
	rm -f *.aux *.log *.toc *.lof *.lot *.out *.bbl *.blg *.fls *.fdb_latexmk sections/*.aux

cleanall: clean
	rm -f $(MAIN).pdf
