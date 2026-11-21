# Guide : Hapikara, la cité égyptienne procédurale

## Ce que l'auteur d'Atlantis a vraiment fait

En lisant son `prompt.txt` (copie dans `reference/atlantis/`), on découvre un détail que le post Reddit ne mentionne pas : **il n'est pas parti de zéro.** Son prompt pointe vers un projet antérieur (`Underwater_Git`, publié sous le nom [abyssal-garden](https://github.com/Noniv/abyssal-garden)) et dit à Claude : « reprends sa structure et ses techniques, pas ses visuels ». Atlantis est donc la **deuxième** itération d'un même moteur.

Sa recette, en 4 ingrédients :
1. `artstyle.md` : une bible artistique très précise (plan, matériaux, lumière, palette, interdits, plans de revue, grille de notation).
2. `concept-art/` : 8 images ChatGPT de la même ville, une par plan de revue, plus 2 planches de matériaux et de végétation.
3. `prompt.txt` : contraintes techniques, cibles de performance, ordre de travail, et surtout **une boucle d'auto-vérification** (un sous-agent critique qui ne voit que la bible, les images et les rendus).
4. Un projet précédent qui sert de base technique.

## Les chemins possibles

| Chemin | Principe | Effort | Risque |
|---|---|---|---|
| A. Retoucher Atlantis | Changer couleurs et formes dans son code | Faible | Résultat « Atlantis déguisée », plan en anneaux impossible à quitter |
| B. Tout refaire de zéro | Son processus, sans son code | Très lourd (voir plus bas) | Élevé : il a fallu 2 projets à l'auteur pour en arriver là |
| **C. Hybride (recommandé)** | **Son processus + son code comme base moteur**, exactement ce qu'il a fait lui-même avec abyssal-garden | Moyen | Faible : le rendu (ciel, eau, ombres, TAA, niveaux de détail, tactile) est déjà éprouvé |

Le chemin C garde tout le moteur et remplace tout le monde (plan, bâtiments, végétation, matériaux). C'est ce que dit le `prompt.txt` préparé ici. La licence MIT l'autorise ; il suffit de garder son fichier `LICENSE` et de le citer.

Une variante pour plus tard : rendre le moteur générique pour produire d'autres cités (Maya, Angkor…) avec le même processus. Il suffit de changer `artstyle.md`, les images et le dossier monde.

## Est-ce un gros travail ?

Oui. Le code source d'Atlantis fait environ 360 Ko de JavaScript et de WGSL répartis en 15 modules. Il n'y a que 4 commits, donc on ne voit pas l'historique, mais un tel résultat représente vraisemblablement **plusieurs dizaines d'heures de travail d'agent**, réparties sur plusieurs jours et de nombreuses sessions, avec beaucoup de rendus et de revues.

Avec le chemin C, une grosse partie est déjà faite. Le travail restant :
- générateurs égyptiens (pyramide, obélisques, pylônes, colonnes, villas, palmiers, felouques, dunes) ;
- eau qui ruisselle sur les degrés ;
- plan entre Nil et désert ;
- réglage de la lumière ;
- boucle de critique.

Compte quand même plusieurs longues sessions.

## Opus 5.5 au lieu de Fable 5.2 ?

Honnêtement : Fable 5.2 est le modèle le plus fort pour ce genre de travail long et visuel, et repartir de zéro en Opus avec un effort moyen serait risqué. **En revanche, le chemin C est à ma portée**, parce que la partie la plus difficile (le pipeline de rendu WebGPU) existe déjà et fonctionne. Deux leviers aident :
- pour les sessions de construction, passer l'effort à « élevé » (ou passer à Fable pour les étapes les plus dures : shaders d'eau et végétation) ;
- avancer par étapes courtes avec un commit à chaque étape validée, et ta validation visuelle en plus du critique.

**Contrainte réelle : ton Mac M1 avec 8 Go.** Atlantis visait une RTX 5070 Ti. Le prompt est réglé sur ton M1 (niveau Medium) et ton téléphone (niveau Low). Les captures et le critique seront plus lents que chez l'auteur.

## Faut-il un plan de la cité ? Des images ?

- **Les images, oui, indispensables.** C'est ce qui ancre le style. Les 8 prompts sont dans [PROMPTS_CHATGPT.md](PROMPTS_CHATGPT.md), à faire dans **une seule** conversation ChatGPT pour garder la cohérence.
- **Un plan séparé : non.** Le plan est décrit en mètres dans `artstyle.md` (section 5), et la vue aérienne P1 sert de plan visuel. Un prompt de plan facultatif (n° 0) est fourni si tu veux le voir avant.

## Ce que j'ai adapté pour ta vision

- **Pierre** dorée et blanche, **eau vert-jade** qui jaillit du sommet d'une pyramide d'émeraude et ruisselle partout : degrés, escaliers d'eau, rigoles, gargouilles, vasques.
- **Pierres précieuses** incrustées (lapis, turquoise, cornaline, malachite, or) et **symboles égyptiens** sculptés.
- **Matinée très lumineuse** (soleil à 35°, plus haut que le crépuscule d'Atlantis) : aérien et abondant.
- **Nil à l'est, désert à l'ouest**, avec une lisière nette. Comme chez Atlantis, on peut aller dans le désert ou sur le fleuve, mais le cœur de l'expérience est le survol de la cité.
- L'« onde d'énergie » d'Atlantis devient une **onde de crue** : une pulsation d'eau qui descend la pyramide et se propage jusqu'au Nil.

Tout est modifiable : nom de la cité, heure, couleurs, nombre d'obélisques… Corrige `artstyle.md` avant de lancer la construction, car c'est la seule autorité.

## Étapes

1. **Toi :** relire et corriger [artstyle.md](artstyle.md).
2. **Toi :** générer les images avec ChatGPT, les ranger dans `concept-art/` sous les noms indiqués, puis noter les écarts dans la section 3 d'`artstyle.md`.
3. **Moi :** créer le dépôt (git + GitHub sur ton compte), copier `source/` d'Atlantis, vérifier qu'il compile et tourne sur ton Mac.
4. **Moi, en plusieurs sessions :** suivre [prompt.txt](prompt.txt), avec un commit par étape et le critique à chaque jalon.
5. **Publication :** GitHub Pages, comme `noniv.github.io/atlantis`.
6. **Plus tard, la VR.** Piste déjà repérée : la PR [Noniv/abyssal-garden#1](https://github.com/Noniv/abyssal-garden/pull/1) a ajouté le WebXR à ce même moteur (casque PC via SteamVR / Quest Link, pont WebGPU → WebGL2). Le prompt garde le code prêt pour ça, sans l'implémenter.

## Fichiers

| Fichier | Rôle |
|---|---|
| `artstyle.md` | Bible artistique égyptienne (transposée section par section) |
| `PROMPTS_CHATGPT.md` | Prompts pour les 8 images de référence (+ plan facultatif) |
| `prompt.txt` | Cahier des charges pour Claude Code (chemin hybride) |
| `concept-art/` | Où ranger les images |
| `reference/atlantis/` | Clone du projet d'origine (MIT), en lecture seule |
