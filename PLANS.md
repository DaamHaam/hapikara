# Plans — Hapikara

## État

- Version publiée : v0.5.0. Tests utilisateur partiels : entrée immergée trouvée et trésor du Nil observé sur iPhone ; défauts ci-dessous signalés. Ces retours ne valent pas validation générale.
- Plan 1 en préparation, non autorisé à coder. Référence visuelle proposée, non validée.
- La revue du code depuis `revue-ok` reste à faire avant la prochaine clôture ; la génération de cette référence ne constitue pas une revue.

## Plan 1 — Fiabiliser le passage et enrichir la découverte

1. **D’abord valider la référence visuelle** : `concept-art/source/crypte-reference-v1.png`. Prompt exact dans `crypte-reference-v1-prompt.txt`, intention et limites dans `crypte-reference-v1.md`. Référence artistique uniquement, aucune image à intégrer au moteur.
2. Comprendre et reproduire la traversée de la paroi gauche après la sortie de l’eau dans la galerie, qui remonte la caméra sur la pyramide. Corriger les limites physiques ; tester les deux côtés, angles, plafond et déplacements en diagonale.
3. Fixer les torches contre les murs, avec supports et passage dégagé.
4. Étudier puis créer un conduit solaire traversant **uniquement la pyramide**, sans remanier la cité. Fragment du vrai extérieur visible, petite ouverture infranchissable, orientation selon hauteur ET azimut du soleil. Étudier un rendu extérieur limité à l’ouverture. Conserver un faisceau léger pour la lisibilité si nécessaire. La faisabilité et le coût restent à préciser avant exécution.
5. Sarcophage fermé anthropomorphe, masque et coiffe sculptés, décorations vert/or, trésor composé de coffres, vases canopes, coupes, bijoux et pièces ; panneaux de hiéroglyphes. Décors statiques privilégiés.
6. Poissons non repérés sur iPhone : vérifier le rendu léger, rapprocher/répartir les bancs devant la cité, varier les profondeurs, améliorer silhouettes et contraste ; décider de leur nombre après ces vérifications.

**Ordre demandé :** référence visuelle avant le code ; après validation et ordre explicite, réaliser les changements de code en une seule passe.

**À décider :** validation/corrections de l’image ; solution du conduit et coût de la vue extérieure ; densité des poissons après diagnostic mobile. Aucune garantie de reproduction pixel à pixel du concept.

## Tests utilisateur encore à valider — version v0.5.0

- Installation depuis l’écran d’accueil : icône et absence des barres du navigateur, marges sans gêne avec l’encoche.
- Fluidité des nouveautés sur ordinateur et iPhone, en qualité choisie.
- Réglages `L` : grain 1,25, relief renforcé absent, densité de poissons fonctionnelle sur ordinateur.

Le passage, les torches, le rayon et les poissons ont reçu des retours de défauts/améliorations : travaux consignés au Plan 1. Les futurs tests de ce plan seront ajoutés après implémentation.

## Plan 2 — Pour plus tard : réalité virtuelle

WebXR / HTC Vive : déplacement selon casque ou manette, montée/descente, niveaux de qualité et essais matériels. Projet Sous-Marin à tester séparément. Non lancé ; les tests casque devront être identifiés comme bloquants avant de construire sur leur résultat.
