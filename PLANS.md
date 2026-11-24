# Plans — Hapikara

## État

- Version livrée : v0.6.0 — Plan 1 codé et contrôlé automatiquement, **à tester par Damien**. La validation utilisateur reste distincte des contrôles CPU/WebGPU.
- Plan 1 à tester ; Plan 2 (VR) en préparation pour plus tard, non lancé. Référence visuelle v1 validée comme direction artistique.
- La revue du code depuis `revue-ok` reste à faire avant la prochaine clôture ; la génération de cette référence ne constitue pas une revue.
- Retours après v0.6.0 : poissons bien visibles, y compris depuis l’extérieur de l’eau ; passage intérieur approuvé en l’état, sans nouvelle refonte. Blocage distinct au montant droit extérieur de l’entrée, consigné au Plan 2. Aucun nouveau code autorisé pour ces retours.

## Plan 1 — Fiabiliser le passage et enrichir la découverte

1. **Référence visuelle validée** : `concept-art/source/crypte-reference-v1.png`. Prompt exact dans `crypte-reference-v1-prompt.txt`, intention et limites dans `crypte-reference-v1.md`. Référence artistique uniquement, aucune image à intégrer au moteur.
2. Comprendre et reproduire la traversée de la paroi gauche après la sortie de l’eau dans la galerie, qui remonte la caméra sur la pyramide. Corriger les limites physiques ; tester les deux côtés, angles, plafond et déplacements en diagonale.
3. Fixer les torches contre les murs, avec supports et passage dégagé.
4. Étudier puis créer un conduit solaire traversant **uniquement la pyramide**, sans remanier la cité. Fragment du vrai extérieur visible, petite ouverture infranchissable, orientation selon hauteur ET azimut du soleil. Étudier un rendu extérieur limité à l’ouverture. Conserver un faisceau léger pour la lisibilité si nécessaire. La faisabilité et le coût restent à préciser avant exécution.
5. Sarcophage fermé anthropomorphe, masque et coiffe sculptés, décorations vert/or, trésor composé de coffres, vases canopes, coupes, bijoux et pièces ; panneaux de hiéroglyphes. Décors statiques privilégiés.
6. Poissons non repérés sur iPhone : vérifier le rendu léger, rapprocher/répartir les bancs devant la cité, varier les profondeurs, améliorer silhouettes et contraste ; décider de leur nombre après ces vérifications.

**Ordre demandé :** référence visuelle avant le code ; après validation et ordre explicite, réaliser les changements de code en une seule passe.

**Livré :** limites physiques de l’intérieur, torches sur supports muraux, conduit réellement découpé dans les triangles de la pyramide et ses films d’eau, ciel procédural visible au bout, faisceau analytique renforcé ; sarcophage anthropomorphe et trésors inspirés de l’image, panneaux de hiéroglyphes ; dix bancs plus proches des quais, plus clairs et moins profonds. Le ciel est rendu depuis l’intérieur, sans redessiner la cité extérieure. Aucune image de référence intégrée au moteur.

**Contrôles :** CPU plan/maillages/collisions, géométrie du conduit et enveloppe des poissons ; réglages et bundle. Le test de la paroi gauche échoue avec l’ancien code (x=70, côté gauche) et passe avec le nouveau. Tests géométriques supplémentaires à 70° et avec azimuts 90°/180°. Captures WebGPU des trois qualités ; mesures et limites dans `.github/screenshots/iteration7/README.md`. Pas de test sur iPhone physique dans cette session.

### Tests utilisateur du Plan 1 — à valider

- Vérifier que les torches sont contre les murs, sans gêner le passage.
- Depuis la chambre, repérer le conduit et la lumière ; depuis l’extérieur, juger l’ouverture discrète et vérifier qu’on ne la traverse pas.
- Juger le sarcophage, les trésors et les hiéroglyphes par rapport à la direction artistique validée.
- Sur iPhone, vérifier la fluidité ; sur ordinateur, tester aussi la densité des poissons dans `L`. Repérage des bancs validé par Damien, depuis l’eau et depuis l’extérieur.

## Tests utilisateur encore à valider — version v0.5.0

- Installation depuis l’écran d’accueil : icône et absence des barres du navigateur, marges sans gêne avec l’encoche.
- Fluidité des nouveautés sur ordinateur et iPhone, en qualité choisie.
- Réglages `L` : grain 1,25, relief renforcé absent, densité de poissons fonctionnelle sur ordinateur.

Les tests v0.5.0 ci-dessus restent en attente faute de validation explicite ; ils peuvent être réalisés avec v0.6.0. Avant le prochain plan, proposer à Damien de retirer ceux que son usage a déjà confirmés, sans les retirer d’office.

## Plan 2 — En préparation, non lancé

### Retours v0.6.0 pour la prochaine session

1. **Poissons :** conserver leur bonne visibilité ; ajouter des bancs de petits poissons en complément des plus grands, et réduire la taille maximale actuelle. Proposition à valider : plusieurs classes de taille cohérentes par banc ; plafonner les plus grands à environ 75–80 % de la taille actuelle et privilégier la réutilisation des maillages. Aucun nombre ou facteur encore validé.
2. **Blocage au montant droit extérieur de l’entrée immergée :** Damien reste coincé en touchant le montant droit en entrant ; regard libre, mouvements horizontaux bloqués, mouvement vertical encore possible, redémarrage nécessaire. Reproduction CPU sans modification du code : position (119.9, 4.8, 32.2), avance/recul/latéral de 0.1 m refusés, montée de 0.1 m acceptée. La caméra partiellement engagée dans le bord échoue à `cryptCameraFits` pour chaque petit pas. Prévoir une récupération/glissade permettant de se dégager, et des tests de raccord extérieur/intérieur sur les deux montants et dans les deux sens. Corriger ce défaut avant d’ajouter une porte à cette entrée. **Conserver le passage intérieur en l’état.**
3. **Idée à définir, non encore validée pour implémentation : mécanisme à distance et porte coulissante.** Entrée immergée initialement fermée par une dalle discrète ; gros levier ancien sur la rive opposée du Nil, activable volontairement en s’approchant puis par clic/toucher. Le levier bascule avec un son procédural, une courte séquence montre la porte qui s’ouvre, puis restaure exactement position et orientation de la visite. Proposition : fondu vers une vue de la porte plutôt qu’un long survol ; ouverture maintenue pendant la visite, sans minuterie ; remise à zéro à la prochaine ouverture. Prévoir absence de double activation, commandes adaptées au tactile, son respectant le réglage muet, séquence écourtable et collisions cohérentes avec l’ouverture. Coût de rendu attendu faible ; effort principal dans les interactions, transitions caméra et tests. **À décider :** apparence/emplacement du levier, persistance entre visites, durée et déclenchement de la séquence. Aucun code à ce stade.

### Réalité virtuelle — toujours pour plus tard, emplacement conservé

WebXR / HTC Vive : déplacement selon casque ou manette, montée/descente, niveaux de qualité et essais matériels. Projet Sous-Marin à tester séparément. Non lancé ; les tests casque devront être identifiés comme bloquants avant de construire sur leur résultat.
