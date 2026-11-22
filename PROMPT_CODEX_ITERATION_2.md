# Prompt pour Codex — Hapikara, itération 2

Copie tout ce qui suit dans Codex, lancé à la racine du dépôt.

---

Tu reprends **Hapikara**, une cité égyptienne imaginaire entre le Nil et le désert, rendue en WebGPU dans un seul `index.html`. Tout est procédural. La première version fonctionne et est publiée : https://daamhaam.github.io/hapikara/. Ta mission : rendre la ville plus **irrégulière, variée, colorée et en relief**, avec **beaucoup moins de palmiers**, et corriger les défauts listés plus bas.

## À lire avant de coder

- `AGENTS.md` : règles du projet (travail sur `main` seule, commits avec `Agent: Codex`, Mac M1 avec 8 Go).
- `artstyle.md` : la bible visuelle, seule autorité sur l'aspect. Mets-la à jour si tu changes le plan (section 5) ou la lumière (section 9).
- `concept-art/` : les 8 images de référence et `plan.png`.
- `prompt.txt` : le cahier des charges d'origine (contraintes, méthode, vérification).
- Le code dans `source/src/`. Les modules du monde, ceux que tu vas surtout modifier :
  - `layout.js` : plan (canaux `CXL`/`CZL`, anneau superellipse `RB`, `BLOCKS`), terrain, Nil, désert, points de vue `POSES`, survol `FLY` ;
  - `meshes.js` : sol de la cité (îlots découpés par `clipPoly`, qui exige un polygone de découpe **convexe**), acropole, pyramide (`PYR`), cascades, eau, ponts, terrain ;
  - `egypt.js` : palmier, papyrus, lotus, pylône, sphinx, obélisque, colonne et salle hypostyle, villa, felouque, vasque ;
  - `city.js` : placement de tout (monuments, avenue, quais, villas, plantations), boîtes de collision `hard.boxes` ;
  - `world.js` : assemblage, masques du sol (`MAP` : pavé, massifs, chemins), ponts ;
  - `collide.js` : collisions. Elles reprennent les hauteurs des maillages, donc tout changement de géométrie se reporte ici ;
  - shaders : `sh_scene.js` (matières : `M.PAINT` 18 avec frises de symboles, `M.SANDST` 19, `M.GRANITE` 20, `pave()`, `terrain()`, tuiles de feuilles `LT`), `sh_base.js` (atelier des feuilles `fsLeaf`, ciel, atmosphère `ATM`), `sh_fx.js` (eau, cascades, pyramidion), `sh_light.js` (éclairage, brume `aerial()`, étalonnage `agx()`).
- Couplages à ne pas oublier :
  - `sh_light.js` teste si un point est dans la cité avec la même superellipse 470×400 que `RB.out` (variable `wl`), pour le niveau d'eau. À mettre à jour si la forme de la ville change.
  - Le reflet plan des canaux (passe miroir) n'existe qu'à la hauteur `WATER` = 6,5. Toute eau à une autre hauteur se reflète par l'environnement, ce qui est moins net.

## Outils de travail

- Compiler : `cd source && npm run build` (écrit `index.html`) et `npm run build:dev` (écrit `dev.html`).
- Servir : `python3 -m http.server 8137` à la racine, puis `http://localhost:8137/dev.html?auto&lv=0` (0 High, 1 Medium, 2 Low).
- Fonctions de `dev.html`, à appeler dans la console ou par script :
  - `await window.__shot({pose: k})` ou `{cam: [x, y, z, lx, ly, lz]}` renvoie une capture en data-URL PNG. Pour l'enregistrer sur disque, poste-la vers un petit serveur local.
  - `window.__stats()` : temps GPU par passe.
  - `window.__path()` : vérifie le survol (vitesse ≤ 80 m/s, lacet ≤ 40°/s, marge au sol). **Relance-le après chaque modification de `FLY` ou du plan.**
  - `await window.__flicker({...})` : mesure le scintillement d'une image à la suivante. Lis sa définition dans `dev.js`.
- Mac de 8 Go : un seul navigateur de test à la fois, à fermer avec le serveur après usage.

## Contraintes à garder

- Un seul `index.html` autonome, sans aucun fichier de texture, de modèle ou de son. WebGPU, sans moteur 3D.
- Zéro allocation JavaScript par image.
- Performance : niveau Medium ≥ 60 i/s sur le M1 à 1440×900 (environ 12 ms aujourd'hui à 2048×1536). Le niveau High fonctionne sur un iPhone 17 Pro : ne casse pas ça.
- **Ne change pas l'eau verte des canaux** : sa couleur et son rendu sont réussis. Tu peux élargir ou modeler les canaux, pas leur matière.
- Pas de personnages, ni de texte lisible, ni d'architecture grecque, romaine ou islamique (section 4 de la bible).

## Ce qu'il faut améliorer, par priorité

### 1. Une ville moins quadrillée, avec du relief (demande principale)
- Aujourd'hui la ville est une grille régulière de canaux droits, de même largeur, sur un sol plat à 10 m. On ne voit que des palmiers à hauteur uniforme.
- **Grands îlots par endroits** : transformer les canaux de lignes complètes en **segments**, pour supprimer des tronçons. On obtient alors des îlots plus grands pour des temples, des esplanades et de grands ensembles. Varier la largeur des canaux : certains plus larges, des bassins, des lagunes, une ou deux îles. Introduire des tracés plus « tourmentés » (coudes, élargissements, quais en redans).
  - Comme `clipPoly` exige une découpe convexe et que les îlots sont des rectangles, des canaux non rectilignes demandent sans doute de régénérer le sol autrement. Par exemple : une carte 2D des canaux (distance signée), puis des murs de quai extraits par contour (marching squares), avec `canalAt`/`edgeDist`/`collide.js`/`MAP` alimentés par la même carte.
- **Relief** : une ville en terrasses qui monte vers l'acropole (quartiers à 10, 16, 22 m…), avec des **esplanades** et des escaliers monumentaux. **Des canaux en biefs** : tronçons horizontaux reliés par des tronçons inclinés ou en escaliers d'eau, avec des chutes. Réutiliser `fall()` de `meshCascades`, qui pose une nappe d'eau le long d'un bord droit.
  - Gérer le reflet : la passe miroir n'existe qu'à `WATER`. Soit on accepte le reflet par l'environnement sur les biefs hauts, soit on garde la majorité des canaux visibles à `WATER`.
- **Repères verticaux visibles de loin**, en plus de la pyramide : grands temples à pylônes sur les grands îlots, groupes d'obélisques, colosses de sphinx, béliers ou faucons (statues d'animaux autorisées, jamais de figures humaines), une seconde pyramide plus petite ou un sanctuaire en hauteur, des portes monumentales.
- Mettre à jour `artstyle.md` (section 5), `POSES` et `FLY`, puis relancer `__path()`.

### 2. Beaucoup moins de palmiers, répartis selon les zones
- Dans `city.js` : remplissage des jardins (`n = aire / 55`, 42 % de palmiers), palmiers le long des quais (75 %), palmeraies hors les murs (`woodAt`).
- Réduire fortement le nombre. Les palmeraies vont surtout hors les murs et le long du Nil. Dans la ville, varier les essences : sycomores, arbres en fleurs, tamaris, massifs, papyrus au bord de l'eau. Prévoir des esplanades dégagées, sans arbres. Il faut qu'on **voie les bâtiments**.

### 3. Plus de variété dans les bâtiments
- Villas (`meshVillaE`, 8 variantes) : plus de variantes et de hauteurs (1 à 3 niveaux, maisons-tours), des plans en L, en U ou à cour, des teintes plus variées, des portiques à colonnes, des treilles, des loggias, des toits-terrasses habités.
- Ajouter des bâtiments publics : petits temples, chapelles, kiosques à colonnes, greniers ronds, portes.
- Le critique a relevé des villas « identiques, même bandeau turquoise, mêmes fenêtres partout » et des pelouses vides entre elles.

### 4. Plus de couleurs : ornements, pierres, fleurs
- Plus d'ornements égyptiens peints et incrustés. La matière `M.PAINT` existe avec sa palette `PAINTC` (`sh_scene.js`, miroir `PC` dans `meshes.js`) et ses frises de symboles (ankh, djed, œil, disque, scarabée, lotus). À utiliser beaucoup plus : colonnes, portes, corniches, plafonds étoilés, carreaux de faïence.
- Plus de pierres : cornaline, turquoise, malachite, or.
- Des massifs de fleurs variés (`FLOWERS` dans `sh_scene.js`, `shrubDef` et `SEEDS` dans `city.js`) : bougainvilliers, lotus bleus et blancs, jasmin, et d'autres teintes.

### 5. Scintillement des palmes (présent à tous les niveaux de qualité)
- Causes probables :
  - les folioles très fines de la tuile `LT.PALM` (tuile 10 de `fsLeaf` dans `sh_base.js` : largeur 0,02, rachis 0,011) découpées en alpha ;
  - de petites cartes croisées en V (`meshPalm` dans `egypt.js`) ;
  - le frémissement rapide des feuilles dans `sway()` (`sh_scene.js` : `sin(t * 2.6 …) * .022`).
- Pistes : des folioles plus larges et moins nombreuses, un seuil d'alpha et une taille adaptés à la distance, moins de frémissement pour les palmes, et une vérification avec `__flicker`.

### 6. La pyramide n'est pas belle
- Aujourd'hui : 7 degrés en calcaire blanc-gris, des bandeaux lapis et turquoise, des chutes d'eau séparées, un escalier est, un pyramidion d'émeraude.
- Pistes : une couleur qui s'intègre à la ville (grès doré, ou calcaire chaud avec arêtes dorées), des frises plus riches et plus grandes, des statues ou des obélisques aux angles, une colonnade ou un kiosque au sommet autour du pyramidion, de vrais escaliers sur plusieurs faces, des proportions à revoir, des cascades plus vivantes (écume, brume).
- Le pyramidion a une frange de dispersion rose trop forte sur une arête (P4) : voir `behind()` dans `sh_fx.js`.

### 7. Canaux et eau
- Plus larges par endroits, plus tourmentés (voir point 1).
- Gargouilles à tête de lion, escaliers d'eau, rigoles plus visibles, vasques qui débordent. L'eau doit couler de partout.
- Ajouter une **cascade** depuis les falaises vers l'oasis : `OASIS` et `cliffX` dans `layout.js`. L'ancien code d'Atlantis avait des chutes de montagne : voir l'historique git du premier commit, `source/src/city.js`.

### 8. Autres défauts relevés par le critique visuel
- Sphinx encore cubiques : il faut une silhouette plus sculptée.
- Murs de canaux encore un peu nus : lierre et bougainvilliers qui retombent, mousse, escaliers d'accès à l'eau.
- Une brume claire au-dessus du désert dans la vue aérienne P1. Elle vient surtout du sable très clair au soleil (`terrain()` dans `sh_scene.js`) plus que de l'air.
- Ombres de contact encore faibles à certains endroits.
- Survol : le lacet monte à 60°/s vers 52 s, pour une cible de 40°/s.

## Méthode
- Profondeur avant étendue : une étape à la fois, un commit par étape validée.
- Après chaque grande étape, captures des 6 points de vue (`pose: 0` à `5`), comparées aux références.
- Faire relire les rendus par un **critique visuel séparé**, qui ne voit que `artstyle.md`, `concept-art/` et les captures, jamais le code. Il note selon la grille de la section 14 de la bible.
- Vérifier la performance (`__stats()` en Medium) et le survol (`__path()`) avant chaque commit.
- À la fin, mettre à jour les captures du README (`.github/screenshots/`) et recompiler `index.html`. Un push sur `main` republie la page GitHub Pages.
