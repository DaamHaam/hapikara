# Plans — Hapikara

## État

- Version livrée : v0.9.0 — Plan 4 (manette) codé et contrôlé, **à tester avec une manette physique par Damien**. La validation utilisateur reste distincte des contrôles CPU/WebGPU.
- Plan 4 à tester ; Plan 5 en préparation : version discrète, bouton plein écran, portée du levier et cadrage de son ouverture. Plan 3 à tester. Plan 2 partiellement testé : mécanisme fonctionnel confirmé par Damien ; autres essais en attente. Tests antérieurs non confirmés conservés. VR toujours reportée, emplacement conservé.
- La revue du code depuis `revue-ok` reste à faire avant la prochaine clôture ; la génération de cette référence ne constitue pas une revue.
- Retours après v0.6.0 : poissons bien visibles, y compris depuis l’extérieur de l’eau ; passage intérieur approuvé en l’état, sans nouvelle refonte. Blocage sur les deux montants extérieurs de l’entrée : priorité n°1 du Plan 2. Ces retours ont été intégrés au Plan 2 lancé ensuite par Damien.

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

## Plan 2 — Livré en v0.7.0, à tester

### Retours v0.6.0 pour la prochaine session

1. **Poissons :** conserver leur bonne visibilité ; ajouter des bancs de petits poissons en complément des plus grands, et réduire la taille maximale actuelle. Plusieurs classes cohérentes par banc, plus grands plafonnés autour de 75–80 % de la taille actuelle, maillages réutilisés. Ces réglages seront à juger visuellement après implémentation.
2. **PRIORITÉ N°1 — blocage aux deux montants extérieurs de l’entrée immergée :** Damien reste coincé en touchant un montant en entrant ; regard libre, mouvements horizontaux bloqués, mouvement vertical encore possible, redémarrage nécessaire. Nouveau signalement et capture sur le montant opposé, au seuil sous l’eau ; aucun blocage similaire rencontré ailleurs lors de ses promenades. Diagnostic CPU sans modification du code : aux positions (119.9, 4.8, 32.2) et (119.9, 4.8, 39.8), avance/recul de 0.1 m refusés, montée de 0.1 m acceptée ; latéral également refusé au premier diagnostic. La caméra partiellement engagée dans le bord échoue à `cryptCameraFits` pour chaque petit pas. Prévoir récupération/glissade permettant de se dégager sans relancer ; tests des deux angles, entrée/sortie, recul, petits pas, diagonales et raccord extérieur/intérieur. Corriger ce défaut avant d’ajouter une porte à cette entrée. **Conserver le passage intérieur en l’état.** Récupération et tests livrés en v0.7.0 ; validation utilisateur encore attendue.
3. **Mécanisme unique et porte coulissante.** Entrée immergée initialement fermée par une dalle discrète ; gros levier ancien sur la rive opposée du Nil, activable volontairement en s’approchant avec un bouton « Actionner » par clic/toucher. Le mécanisme bascule avec un claquement sourd. Fondu vers une courte vue de la porte qui s’ouvre, puis retour à la position et l’orientation exactes du joueur. Porte maintenue ouverte toute la visite, **sans minuterie** ; Damien valide sa **réinitialisation fermée à chaque nouvelle visite**, sans mémorisation persistante. Un seul mécanisme pour l’instant. Prévoir absence de double activation, tactile, son respectant le réglage muet, séquence écourtable et collisions cohérentes. Coût de rendu attendu faible ; effort principal dans les interactions, transitions et tests. Levier près du débarcadère de la rive opposée ; séquence d’environ six secondes, écourtable.
4. **Musique :** validée par Damien ; conserver la musique procédurale actuelle sans la modifier. Le claquement/frottement du mécanisme est un effet distinct.
5. **Accueil :** retirer les mentions « L ambiance » **et « I informations »** des indications affichées. Les raccourcis `L` / `I`, l’atelier et les statistiques restent actifs pour les essais personnels de Damien, sans nouvel accès visible. Livré en v0.7.0.
6. **Décors habités hors de la cité :** quelques cabanes en bois au milieu des champs et quelques tentes espacées dans le désert, sans personnage ni animation. Proposition de densité à ajuster : 4–6 cabanes et 2–3 petits groupes de tentes, avec sol et implantation plausibles.
7. **Navigation et ambiance spirituelle :** un ou deux bateaux plus grands et quelques barques. Proposition : une grande barque cérémonielle statique, bois sombre, touches vert/or et pavillon de lin, près d’un débarcadère de la rive opposée ; évoquer une traversée onirique et spirituelle sans ajouter de mécanisme, de transport du joueur ni d’animation. Nombre final et emplacement à préciser ; cette direction est une proposition, pas une reconstitution historique.
8. **Mystère retenu :** même symbole sur le mécanisme distant et **au-dessus de la porte fermée**. Proposition : scarabée, également gravé en quelques lieux éloignés ; lier ces présences sans ajouter de quête ni d’autres mécanismes. Le scarabée récurrent est validé ; son emploi comme symbole de porte reste un choix artistique proposé.
9. **Fonds des canaux :** Damien n’a pas repéré les mosaïques et trouve de longues portions vides. Vérification : quatre mosaïques existent actuellement en (130,36), (130,90), (-130,-200), (266,200), plus douze ensembles statiques de découvertes des canaux. Améliorer visibilité/contraste et implantation des mosaïques, puis distribuer davantage de petites compositions de fond (amphores, fragments sculptés, pierres décorées, plantes aquatiques), avec alternance de secteurs riches et de respirations, sans tapis uniforme ni nouveau grand bassin.
10. **Esthétique retenue :** bouquets de lotus, quelques façades en faïence, voiles d’ombrage fixes, petits coins de marché, incrustations de malachite et de cuivre patiné près de l’eau. Décors statiques et maillages réutilisés privilégiés. Conserver eau verte, lumière et musique actuelles.
11. **Signature et origine du monde :** cité inspirée d’un ancien rêve lucide de Damien, où il survolait des canaux d’eau verte. Signature discrète à découvrir dans le décor : **uniquement les lettres « DAM »**, jamais le prénom complet, sans signature dans l’accueil. Petite gravure physique intégrée à la pierre dans un recoin près d’un canal, sans balisage ni texte flottant ; emplacement laissé à la composition du décor. Cette signature constitue l’exception voulue aux inscriptions lisibles dans la scène.

**Livré :** récupération des deux montants, porte coulissante et levier au scarabée ; fondu, bruit synthétique, retour exact et ouverture unique ; douze bancs de trois tailles ; dix-huit mosaïques et 118 compositions de fond supplémentaires ; cinq cabanes, trois tentes, quatre marchés avec voiles fixes, neuf panneaux de faïence, quatre incrustations, huit bouquets de lotus, une grande barque et trois petites ; gravure DAM. Musique, réglages d’ambiance et intérieur de la crypte conservés. L/I actifs mais non annoncés dans l’accueil. Le simple rechargement réinitialise la porte ; le recalcul du soleil depuis l’atelier conserve la visite et son état ouvert, comme la position de caméra déjà conservée.

**Contrôles :** plan/maillages/collisions, automate du mécanisme, réglages et bundle ; régressions des deux montants avec porte ouverte/fermée, collisions du monde complet, captures WebGPU des trois qualités, interaction réelle du bouton et remise à zéro à la relance. Aucun test sur téléphone physique dans cette session ; l’audition et le dosage du son restent à valider par Damien. Captures et rapports : `.github/screenshots/iteration8/`.

### Tests utilisateur du Plan 2 — à valider

- Toucher chacun des deux montants de l’entrée sous l’eau : pouvoir reculer/se dégager, porte fermée puis ouverte, sans relancer ; entrer et ressortir après activation.
- Essayer Passer ; vérifier que la porte reste ouverte sans minuterie et qu’une nouvelle visite la remet fermée. Tester aussi le respect du mode muet.
- Juger les trois tailles de poissons et leur visibilité depuis la surface et sous l’eau.
- Repérer davantage de mosaïques et de petits décors au fond des canaux, sans gêne pour se déplacer.
- Découvrir cabanes, tentes, marché/voiles, faïence, lotus, incrustations et barques ; juger implantation, fluidité et ambiance.
- Vérifier que l’accueil n’annonce plus L/I, que ces raccourcis restent actifs sur ordinateur et que la musique est conservée.
- Découvrir la petite gravure DAM ; vérifier que sa discrétion convient.

Retour de Damien après livraison : mécanisme fonctionnel et claquement du loquet confirmés ; petite barque appréciée. Test général du mécanisme retiré ; les cas particuliers (Passer, relance, muet) restent à vérifier. Demandes d’amélioration consignées dans le Plan 3. VR exclue de cette livraison.

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

## Plan 3 — Livré v0.8.0 : levier plus visible et signatures réparties

**Exécution autorisée par Damien :** levier plus visible, Espace, grondement de porte et plusieurs signatures DAM. Les autres idées de clins d’œil ne sont pas sélectionnées automatiquement. La VR reste à son emplacement précédent, reportée ; aucun déplacement décidé par l’agent.

1. **Levier visible depuis la traversée du Nil.** Le placer sur la petite esplanade de la rive opposée, plus grand et clairement identifiable ; scarabée davantage mis en évidence pour rappeler celui de la porte immergée. Étudier un dégagement central, ou décaler le petit temple si nécessaire, en conservant un passage libre et des collisions cohérentes. Emplacement exact à confronter au décor lors de l’implémentation ; ne pas cacher le levier derrière le temple.
2. **Touche Espace.** Permettre l’activation contextuelle du levier avec Espace en plus du clic/toucher, sans activation à distance ni répétition par maintien de la touche.
3. **Ouverture de la porte audible.** Le claquement du loquet est entendu ; rendre distinct et plus perceptible le grondement sourd de pierre pendant l’ouverture. Une couche de frottement existe déjà mais ne ressort pas suffisamment dans l’essai de Damien. Respecter le mode muet et conserver la musique.
4. **Signatures réparties.** Cinq gravures DAM au total, même petit maillage partagé : plaque historique, canal près de la pyramide, canal sud-est, canal nord et débarcadère opposé. Aucun texte flottant ni indication sur l’accueil. Les trois captures de repérage de la plaque historique restent dans `.github/screenshots/dam-guide/`.

**Décision lumière :** Damien abandonne l’ajustement local de l’ouverture intérieure ; conserver la pièce, le soleil et le conduit lumineux actuels. Le petit dépassement extérieur est également conservé en l’état ; aucune modification du conduit dans cette livraison.

Repère de la signature actuelle (information à Damien, pas de déplacement demandé) : `[-119.03, 8.3, 210]`, sur la paroi est du canal nord-sud situé à l’ouest de la pyramide, au sud de celle-ci ; gravure à 1,8 m au-dessus de l’eau, à regarder depuis le canal en direction de la pyramide. Petit scarabée incrusté sur la même paroi à z=196, soit 14 m plus au nord.


**Livré :** levier à l’avant de l’esplanade de la rive opposée (x=EAST_QUAY.x−7, z=−231, sol à 3,6 m), poignée plus grande, petit temple décalé à l’arrière sur le côté et collisions de colonnes déplacées avec lui ; zone libre d’arbres. Scarabées agrandis sur le socle et au-dessus de la porte. Espace active uniquement à proximité, hors menu/champ et hors répétition. Son de loquet conservé avec enveloppe distincte ; grondement de pierre renforcé et couche grave pendant l’ouverture. Quatre nouvelles plaques DAM, soit cinq en tout. Musique et conduit lumineux inchangés.

**Contrôles :** check:plan, check:mechanism, check:ambiance, build, check:bundle ; captures WebGPU Équilibrée du levier depuis la traversée et de près, du scarabée de porte et des cinq plaques. Espace testé en interaction réelle, puis retour devant le levier basculé ; aucune erreur navigateur. Relecture du diff du Plan 3 effectuée ; elle ne remplace pas la revue globale depuis `revue-ok`, toujours en attente avant clôture. Rapport et captures : `.github/screenshots/iteration9/`.

### Tests utilisateur du Plan 3 — à valider

- Depuis la traversée du Nil, repérer spontanément le levier sur l’esplanade et reconnaître le scarabée commun avec la porte ; circuler librement autour du socle et des colonnes déplacées.
- Actionner avec Espace sur ordinateur et avec le bouton sur téléphone ; retrouver sa position après la séquence. Maintenir Espace ne doit pas relancer ni écourter celle-ci.
- Entendre un grondement distinct pendant l’ouverture de la porte, avec un volume agréable sur ordinateur et téléphone ; vérifier le mode muet.
- Découvrir quelques plaques DAM au fil de la promenade ; juger leur répartition et leur discrétion.

Les anciens essais non confirmés restent en attente ; ils pourront être retirés sur confirmation de Damien.

## Plan 4 — Livré v0.9.0 : support d’une manette

**Exécution autorisée par Damien.** Manettes reconnues par le navigateur avec la disposition Gamepad `standard` (Xbox / PlayStation selon OS et navigateur), USB ou Bluetooth ; une manette active, clavier/souris/tactile toujours utilisables. Pas de VR.

- Stick gauche : avancer/reculer et déplacement latéral, proportionnel ; stick droit : regarder. Zones mortes radiales à 18 %, direction diagonale normalisée, vitesse de regard indépendante de la fréquence d’affichage.
- Gâchette gauche : descendre ; droite : monter, proportionnellement.
- A / Croix : lancer/reprendre ou actionner le levier à proximité ; nouvel appui pour passer sa séquence. B / Rond : accélérer pendant l’appui avec la même vitesse que Maj. Start / Options : accueil / reprise.
- Menus à la croix directionnelle ou au stick gauche : haut vers la visite, bas vers la qualité courante, gauche/droite entre les qualités, A valide. Sélection encadrée, aide uniquement lorsqu’une manette est détectée.
- Branchement/reprise : attendre le retour au neutre pour éviter une activation involontaire ; boutons traités au nouvel appui. Déconnexion ou perte de focus : arrêt des mouvements, accueil, réarmement au neutre. Les manettes sans disposition standard n’imposent pas de commandes devinées ; indication dans l’accueil.
- Appel au graphe audio existant sur un bouton de manette, sans changer musique, mélodie ou mixage. Le navigateur peut demander une première interaction clavier/souris/tactile pour autoriser le son.
- Corrections liées : caméra immobile dans l’accueil ; choix de qualité conservant proprement les autres paramètres d’URL.

**Contrôles :** check:gamepad (état et vrai frame), check:plan, check:mechanism, check:ambiance, build et check:bundle. Parcours de menus avec manette simulée dans le navigateur, puis chargement du livrable sans manette. Relecture du diff du Plan 4 faite ; revue globale depuis `revue-ok` toujours à faire avant clôture. Capture et rapport dans `.github/screenshots/iteration10/`. Aucun essai de manette physique dans cette session.

### Tests utilisateur du Plan 4 — à valider

- Brancher/appairer la manette, appuyer sur un bouton puis relâcher : aide affichée et visite lançable avec A/Croix. Choisir une qualité depuis la manette et retrouver les menus après le rechargement.
- Vérifier déplacement, regard, absence de dérive, montée/descente aux gâchettes et accélération avec B/Rond ; juger le confort sur la télévision.
- Actionner le levier avec A/Croix, puis tester le saut de séquence ; retour au bon endroit. Start/Options doit permettre l’accueil et la reprise sans mouvement de caméra dans le menu.
- Débrancher/rebrancher et changer de fenêtre : aucun mouvement bloqué ni activation involontaire au retour. Clavier, souris et tactile restent fonctionnels.
- Vérifier musique et sons avec la manette ; si le navigateur bloque le son au premier lancement, vérifier qu’un clic ou une touche le déverrouille.

## Plan 5 — En préparation : repères de version et confort du mécanisme

Retours de Damien après la v0.9.0. **Pour la prochaine session, sans exécution autorisée à ce stade.** Les essais utilisateur antérieurs restent en attente ; ce retour ne valide pas à lui seul l’ensemble du support manette.

1. **Version discrète dans un coin.** Afficher un petit numéro de version lisible, peu contrasté mais identifiable, placé dans une zone sûre sans chevaucher les boutons ni les marges mobiles. Le renseigner automatiquement à la construction depuis `source/package.json` pour qu’il corresponde au HTML chargé. Proposition : coin inférieur gauche, y compris pendant la visite.
2. **Actionner le levier de plus loin.** Damien doit actuellement s’approcher jusqu’à ce que la poignée dépasse l’écran. Augmenter la distance d’interaction (actuellement 9 m), avec une cible initiale de 18–20 m à ajuster visuellement pour garder le levier entier dans le cadre. Examiner aussi la tolérance de visée ; garder une activation volontaire et tournée vers le mécanisme. Même portée pour clic, toucher, Espace et A/Croix. Vérifier que le bouton apparaît à une distance confortable, y compris sur téléphone et télévision.
3. **Séquence de porte depuis la surface — direction proposée par Damien.** Replacer la caméra au-dessus de l’eau, légèrement en surplomb et si utile en biais, pour voir le scarabée et situer l’entrée tout en regardant la porte s’ouvrir à travers la surface verte. Référence : photo jointe au retour de Damien (grand scarabée sur le mur, ouverture turquoise visible sous la surface au premier plan). Choisir le cadrage d’après le rendu réel : limiter les reflets masquant la porte, conserver une ouverture bien lisible et le retour exact à la position/orientation du visiteur. Conserver fondu, grondement, possibilité de passer et ouverture sans minuterie.

4. **Bouton plein écran sur ordinateur.** Petite icône explicite à quatre coins de cadre en haut à droite, dans un bouton translucide et discret, accessible sur PC et Mac, à l’accueil et pendant la visite. Clic pour entrer en plein écran ; même bouton pour en sortir, Échap conservé selon le navigateur. Utiliser l’API Fullscreen après le clic, synchroniser l’icône et le libellé accessible avec l’état réel (`fullscreenchange`), gérer un refus sans bloquer la visite et masquer le bouton si l’API n’est pas disponible. Conserver une cible cliquable confortable et éviter tout chevauchement avec les autres panneaux. Vérifier l’entrée/sortie et le redimensionnement du rendu. Aucun changement exécuté à ce stade.

5. **Bouton « Actionner » plus soigné.** Damien le trouve trop petit et peu stylisé par rapport à l’accueil et au décor. Le rendre plus généreux et lisible, avec une composition inspirée du bouton principal de l’accueil : or doux, fond profond jade/pétrole, bordure fine et relief léger. Une petite évocation du scarabée peut renforcer le lien au mécanisme sans surcharger. Conserver une apparence discrète hors proximité (bouton toujours contextuel), un contraste lisible sur l’eau et le sable et une taille confortable à la souris, au toucher et depuis une télévision. Harmoniser aussi l’état « Passer » de la séquence. Valider visuellement sur ordinateur et mobile, sans annoncer L/I ni ajouter de menu. Préparation uniquement.

Ne pas lancer sans ordre explicite. Aucun changement du jeu dans cette préparation.

