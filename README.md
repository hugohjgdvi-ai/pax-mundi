# PAX MUNDI — Grande stratégie mondiale (style Call of War)

**V7 — régions réuelles (façon CoW) + cartes de construction/production**

## Jouer
- En ligne : https://hugohjgdvi-ai.github.io/pax-mundi/ (nécessite Pages activé : Settings → Pages → Source = **GitHub Actions**)
- Hors ligne : télécharger le ZIP (bouton Code) et ouvrir `index.html`.

## Quoi de neuf (V7)
- **~3 000 RÉGIONS** (plus les départements fins) : grandes régions comme Call of War, avec les FORMES précises du monde réel — France = 13 régions métropole + 5 DOM, Espagne = 19 communautés autonomes, USA = 51 états, Allemagne = 16 Länder. Frontières internes dissoutes entre régions (contours fermés, précision d'après Natural Earth 10m).
- **Cartes de construction/production** (pavé gauche, style mobile) : icône + nom + « Lvl. X » + coûts en ressources + temps + gros bouton 🔨 CONSTRUIRE ; unités avec icône + coûts, VERROUILLÉES (🔒 bâtiment requis affiché) tant que le bâtiment n'existe pas.
- L'onglet du bas s'appelle maintenant RÉGIONS ; on attaque toujours des régions/villes, pas un pays entier.

## Quoi de neuf (V6)
- **Troupes indépendantes** : chaque armée est un blason militaire posé sur la carte (numéro + effectif + barre de vie). Sélection directe au clic, ou rectangle de sélection au glisser — AUCUN menu déroulant.
- **Troupes indépendantes** : chaque armée est un blason militaire posé sur la carte (numéro + effectif + barre de vie). Sélection directe au clic, ou rectangle de sélection au glisser — AUCUN menu déroulant.
- Ordres militaires : clic droit (ou clic gauche) sur une cible → flèche d'ordre, mouvement en temps réel.
- On attaque des **provinces et des villes** — pas un pays entier. Occupation progressive des provinces.
- Interface aux emplacements Call of War : drapeau + menus en haut à gauche, 7 ressources en haut à droite, marché, points de victoire, minuteur de journée (30 s, ⏸ ×1 ×2 ×3), onglets du bas, panneau de province CONSTRUCTION/PRODUCTION.
- 178 pays, 5 vraies villes par pays, 26 unités (dont Rafale, Porte-hélicoptères, Frégate furtive), bâtiments 1942 (Fonderie de munitions, Usine de chars, Bureau de recrutement…), 7 ressources, diplomatie complète, recherche, espionnage, IA.

## Fichier
`index.html` est 100 % autonome (~1,3 Mo) — aucune dépendance. Scripts de génération des données dans `tools/` (Natural Earth 10m admin-1 → régions).

## Contrôles
- Molette : zoom · Glisser : déplacer la carte · Clic sur blason : sélectionner · Glisser en rectangle : sélection multiple (Maj : ajouter)
- Clic droit : ordre de marche/attaque · Clic sur province : panneau CONSTRUCTION/PRODUCTION
- ÉCHAP : désélectionner · Espace : pause
