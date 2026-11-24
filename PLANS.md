# Plans — Hapikara

## État

- Version livrée : v0.6.0 — Plan 1 codé et contrôlé automatiquement, **à tester par Damien**. La validation utilisateur reste distincte des contrôles CPU/WebGPU.
- Plan 1 à tester ; Plan 2 en préparation, non lancé : poissons, raccord de l’entrée et mécanisme unique validés dans leur principe. VR toujours reportée, emplacement conservé. Référence visuelle v1 validée comme direction artistique.
- La revue du code depuis `revue-ok` reste à faire avant la prochaine clôture ; la génération de cette référence ne constitue pas une revue.
- Retours après v0.6.0 : poissons bien visibles, y compris depuis l’extérieur de l’eau ; passage intérieur approuvé en l’état, sans nouvelle refonte. Blocage sur les deux montants extérieurs de l’entrée : priorité n°1 du Plan 2. Aucun nouveau code autorisé pour ces retours.

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

1. **Poissons — validé pour le prochain plan, pas encore lancé :** conserver leur bonne visibilité ; ajouter des bancs de petits poissons en complément des plus grands, et réduire la taille maximale actuelle. Plusieurs classes cohérentes par banc, plus grands plafonnés autour de 75–80 % de la taille actuelle, maillages réutilisés. Ces réglages seront à juger visuellement après implémentation.
2. **PRIORITÉ N°1 — blocage aux deux montants extérieurs de l’entrée immergée :** Damien reste coincé en touchant un montant en entrant ; regard libre, mouvements horizontaux bloqués, mouvement vertical encore possible, redémarrage nécessaire. Nouveau signalement et capture sur le montant opposé, au seuil sous l’eau ; aucun blocage similaire rencontré ailleurs lors de ses promenades. Diagnostic CPU sans modification du code : aux positions (119.9, 4.8, 32.2) et (119.9, 4.8, 39.8), avance/recul de 0.1 m refusés, montée de 0.1 m acceptée ; latéral également refusé au premier diagnostic. La caméra partiellement engagée dans le bord échoue à `cryptCameraFits` pour chaque petit pas. Prévoir récupération/glissade permettant de se dégager sans relancer ; tests des deux angles, entrée/sortie, recul, petits pas, diagonales et raccord extérieur/intérieur. Corriger ce défaut avant d’ajouter une porte à cette entrée. **Conserver le passage intérieur en l’état.** Le signalement « à corriger en priorité » complète le plan en préparation ; aucune exécution générale du plan demandée à ce stade.
3. **Mécanisme unique et porte coulissante — principe validé, exécution non lancée.** Entrée immergée initialement fermée par une dalle discrète ; gros levier ancien sur la rive opposée du Nil, activable volontairement en s’approchant avec un bouton « Actionner » par clic/toucher. Le mécanisme bascule avec un claquement sourd. Fondu vers une courte vue de la porte qui s’ouvre, puis retour à la position et l’orientation exactes du joueur. Porte maintenue ouverte toute la visite, **sans minuterie** ; Damien valide sa **réinitialisation fermée à chaque nouvelle visite**, sans mémorisation persistante. Un seul mécanisme pour l’instant. Prévoir absence de double activation, tactile, son respectant le réglage muet, séquence écourtable et collisions cohérentes. Coût de rendu attendu faible ; effort principal dans les interactions, transitions et tests. **À préciser :** apparence/emplacement exact et durée de la séquence. Aucun code à ce stade.
4. **Musique :** validée par Damien ; conserver la musique procédurale actuelle sans la modifier. Le claquement/frottement du mécanisme est un effet distinct.
5. **Accueil :** retirer les mentions « L ambiance » **et « I informations »** des indications affichées. Les raccourcis `L` / `I`, l’atelier et les statistiques restent actifs pour les essais personnels de Damien, sans nouvel accès visible. Noté pour le prochain plan, non exécuté.
6. **Décors habités hors de la cité :** quelques cabanes en bois au milieu des champs et quelques tentes espacées dans le désert, sans personnage ni animation. Proposition de densité à ajuster : 4–6 cabanes et 2–3 petits groupes de tentes, avec sol et implantation plausibles.
7. **Navigation et ambiance spirituelle :** un ou deux bateaux plus grands et quelques barques. Proposition : une grande barque cérémonielle statique, bois sombre, touches vert/or et pavillon de lin, près d’un débarcadère de la rive opposée ; évoquer une traversée onirique et spirituelle sans ajouter de mécanisme, de transport du joueur ni d’animation. Nombre final et emplacement à préciser ; cette direction est une proposition, pas une reconstitution historique.
8. **Mystère retenu :** même symbole sur le mécanisme distant et **au-dessus de la porte fermée**. Proposition : scarabée, également gravé en quelques lieux éloignés ; lier ces présences sans ajouter de quête ni d’autres mécanismes. Le scarabée récurrent est validé ; son emploi comme symbole de porte reste un choix artistique proposé.
9. **Fonds des canaux :** Damien n’a pas repéré les mosaïques et trouve de longues portions vides. Vérification : quatre mosaïques existent actuellement en (130,36), (130,90), (-130,-200), (266,200), plus douze ensembles statiques de découvertes des canaux. Améliorer visibilité/contraste et implantation des mosaïques, puis distribuer davantage de petites compositions de fond (amphores, fragments sculptés, pierres décorées, plantes aquatiques), avec alternance de secteurs riches et de respirations, sans tapis uniforme ni nouveau grand bassin.
10. **Esthétique retenue :** bouquets de lotus, quelques façades en faïence, voiles d’ombrage fixes, petits coins de marché, incrustations de malachite et de cuivre patiné près de l’eau. Décors statiques et maillages réutilisés privilégiés. Conserver eau verte, lumière et musique actuelles.
11. **Signature et origine du monde :** cité inspirée d’un ancien rêve lucide de Damien, où il survolait des canaux d’eau verte. Damien choisit explicitement une **signature discrète à découvrir dans le décor**, sans signature dans l’accueil. Proposition : petite plaque physique gravée « Damien » dans un recoin au bord d’un canal, sans balisage ni texte flottant ; emplacement précis à définir. Cette signature constitue l’exception voulue aux inscriptions lisibles dans la scène.

### Réservoir d’idées demandé — propositions non retenues automatiquement

Pistes à discuter et sélectionner ; ne pas implémenter ces trente idées par défaut. Privilégier décors statiques, maillages réutilisés, proximité et état simple. Aucun mécanisme supplémentaire dans le périmètre validé.

**G — Gamification douce — écartée par Damien, ne pas implémenter**
1. G1 : carnet des lieux découverts, consultable à la demande.
2. G2 : petites amulettes repérées automatiquement à proximité.
3. G3 : piste de symboles menant au mécanisme déjà prévu.
4. G4 : belvédères à découvrir, chacun offrant un cadrage remarquable.
5. G5 : mode photo masquant l’interface et conservant une capture.
6. G6 : quartiers nommés à la première entrée, indication brève.
7. G7 : objectifs facultatifs de promenade, sans chronomètre.
8. G8 : reconnaissance des silhouettes de poissons dans un petit carnet.
9. G9 : repères favoris personnels pour retrouver les lieux aimés.
10. G10 : distinctions discrètes d’exploration, sans score permanent.

**M — Mystère**
Sélection retenue : M1 (symbole au-dessus de la porte et sur le mécanisme), M5 (scarabée récurrent). Mosaïques à améliorer selon le point 9 ; aucune piste de quête validée. Les autres propositions restent non sélectionnées.
1. M1 : symbole commun sur la dalle immergée et le levier distant.
2. M2 : mosaïque interrompue suggérant un chemin sous l’eau.
3. M3 : fausse porte funéraire sculptée, purement décorative.
4. M4 : socle vide dans un ensemble symétrique, suggérant une absence.
5. M5 : même scarabée gravé dans plusieurs lieux éloignés.
6. M6 : ombre dessinant un ankh avec le soleil à 12°.
7. M7 : détail sculpté visible seulement dans un alignement de colonnes.
8. M8 : amphore scellée entrouverte laissant voir quelques bijoux.
9. M9 : traces statiques sur une rive conduisant à une halte abandonnée.
10. M10 : rares sons localisés près d’un lieu caché, sans changer la musique.

**E — Esthétique et surprises du décor**
Sélection retenue : E1, E3, E4, E6, E8. Les barques sont précisées au point 7. Les autres propositions restent non sélectionnées.
1. E1 : bouquets de lotus irréguliers dans quelques recoins.
2. E2 : petits îlots de papyrus de hauteurs variées, silhouettes stables.
3. E3 : motifs de faïence distincts sur quelques façades.
4. E4 : voiles d’ombrage fixes, vert, lin et or sourd.
5. E5 : fleurs retombant de certaines terrasses.
6. E6 : coins de marché statiques, paniers, jarres et étoffes.
7. E7 : deux ou trois variantes de barques amarrées.
8. E8 : incrustations de malachite et de cuivre patiné près de l’eau.
9. E9 : minuscules jardins intérieurs révélés par un passage étroit.
10. E10 : patines et traces d’eau discrètes à la base des pierres, sans rétablir le relief renforcé.

### Réalité virtuelle — toujours pour plus tard, emplacement conservé

WebXR / HTC Vive : déplacement selon casque ou manette, montée/descente, niveaux de qualité et essais matériels. Projet Sous-Marin à tester séparément. Non lancé ; les tests casque devront être identifiés comme bloquants avant de construire sur leur résultat.
