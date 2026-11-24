# Hapikara — règles du projet

Source unique des règles pour Codex et Claude Code (`CLAUDE.md` contient seulement `@AGENTS.md`).

## Façon de travailler sur ce projet

- **Branche de travail** : on développe directement sur `main` ; ne pas créer de branche `dev`.
- **Publication** : GitHub Pages depuis la racine de `main` (`index.html`) : https://daamhaam.github.io/hapikara/ — chaque push sur `main` republie.
- **Clarifications** : regrouper les questions nécessaires en un seul envoi pour permettre une réponse d’ensemble. Ne pas créer une succession d’attentes et de questions isolées ; recueillir librement les idées, les organiser dans les plans et trancher les choix courants avec des hypothèses explicites.
- **Tags de version** : `vX.Y.Z` posés automatiquement par `.github/workflows/agents.yml` depuis `source/package.json`.
- **Particularités** :
  - Mac M1 8 Go : une seule fenêtre de navigateur de test à la fois, la fermer et arrêter le serveur après usage ; limiter les i/s en développement.
  - Serveur local : configuration `hapikara` de `.claude/launch.json` (port 8137).
  - La VR (WebXR) viendra dans un second temps : ne pas l'implémenter sans demande, mais garder le rendu appelable une fois par œil.

## Projet et commandes

Cité égyptienne imaginaire entre le Nil et le désert, survolable dans le navigateur. Tout est généré par le code au chargement (WebGPU, sans moteur ni fichier d'image, de modèle ou de son), livré en un seul `index.html`. Base technique : le moteur d'[Atlantis](https://github.com/Noniv/atlantis) (MIT), dont on garde le rendu et dont on remplace tout le monde.

- Installer : `cd source && npm install`
- Construire `index.html` (minifié) : `npm run build`
- Version lisible : `npm run build:readable` ; outils de dev (`F` survol, `B` benchmark) : `npm run build:dev` → `dev.html`
- Servir : `python3 -m http.server 8137` à la racine, puis ouvrir `http://localhost:8137/dev.html` dans Chrome
- Vérifier les réglages d’ambiance et la végétation : `cd source && npm run check:ambiance` (CPU).
- Vérifier le contrat plan/maillage/collisions : `cd source && npm run check:plan` (CPU, sans navigateur).
- Vérifier le mécanisme : `cd source && npm run check:mechanism` (CPU : activation, pause, ouverture unique, retour exact, saut et réinitialisation).
- Captures et mesures : `python3 source/tools/qa-server.py` à la racine, puis `dev.html?auto&lv=1&w=1440&h=900&qa=release-medium&bench`. Les résultats sont écrits dans `/tmp/hapikara-qa/release-medium/`. Un seul onglet de test ; arrêter le serveur après usage. Pour un benchmark représentatif, relever l'état de l'économiseur Chrome ; ne modifier ce réglage qu'avec l'accord de l'utilisateur, puis le rétablir.

## Architecture

- `artstyle.md` : bible artistique, seule autorité sur l'aspect de la scène.
- `prompt.txt` : cahier des charges de construction (étapes, cibles, critique visuel).
- `PROMPTS_CHATGPT.md` : prompts des images de référence ; `concept-art/` : les images retenues (`rejected/` = écartées).
- `GUIDE.md` : démarche et choix du projet.
- `source/src/` : modules (voir le tableau du README d'Atlantis). Moteur à garder : `main.js`, `quality.js`, `math.js`, `collide.js`, `dev.js`, `sh_base.js`, `sh_light.js`. Monde à remplacer : `layout.js`, `city.js`, `plants.js`, `meshes.js`, `world.js`, plus matériaux de `sh_scene.js`/`sh_fx.js` et `music.js`.
- `source/build.mjs` : concatène `src/` dans l'ordre donné et écrit `../index.html`.
- `layout.js` est la source du réseau rectangulaire segmenté `CHANNELS`, des cellules convexes `BLOCKS`, des terrasses `TERRACES`/`cityH`, des biefs `BIEFS` et des escaliers de quai `QUAY_STEPS`. Sol, plantations, masques et collisions s'y réfèrent. L'enveloppe extérieure reste la superellipse 470 × 400, également utilisée par `sh_light.js`.
- Accueil minimal sans image ni plan ; `L` seul ouvre les réglages sur ordinateur, `I` affiche les statistiques. Les essais d’ambiance ne persistent pas : « Sanctuaire voilé » avec soleil à 12° revient à chaque ouverture. Pierre, vie sous-marine et eau sont les premiers groupes du panneau ; grain à 1,25, relief renforcé supprimé, poissons à 1, niveau sous-marin 3 et rayons à 2 par défaut. Les quatre niveaux sous-marins sont indépendants des trois qualités globales. Les canaux, le Nil et l’oasis sont plongeables ; les petits bassins hauts restent superficiels.
- `crypt.js` partage le plan du passage immergé et de la crypte entre maillage et collisions. Les limites intérieures sont explicites, indépendantes des hauteurs des sols extérieurs. Les types `INTERIOR` restent seuls visibles depuis la partie intérieure ; miroir et ombres extérieures y sont suspendus. `cutCryptShaft` découpe à la construction un conduit dans le maillage de la pyramide et ses films d’eau ; les parois du conduit rejoignent celles de la chambre. Son axe suit le soleil au chargement. On voit le ciel procédural par le conduit, sans redessiner la cité extérieure ; le faisceau est renforcé par une approximation analytique. L’ouverture reste infranchissable. Le sarcophage anthropomorphe, les trésors et les panneaux de pseudo-hiéroglyphes sont procéduraux ; la référence artistique validée est `concept-art/source/crypte-reference-v1.png`, jamais intégrée au rendu.
- `aquatics.js` génère les poissons à deux LOD, les trésors, 18 mosaïques et 118 compositions de fond supplémentaires. Douze bancs de 32/24/16 poissons en High/Medium/Low, classes de taille .19–.32 / .34–.49 / .55–.78, enveloppe réservée au-dessus du fond. Animation GPU, densité réglable par `L`, sans simulation JS par poisson ni ombre/reflet miroir.
- `mechanism.js` : unique porte et levier, symbole scarabée partagé, état de visite `GATE_OPEN`, automate de fondu/caméra et effet sonore ponctuel distinct de `music.js`. `look7` porte intérieur/ouverture/levier/fondu ; seules la porte et la poignée bougent au vertex shader. Les contrôles de navigation sont suspendus pendant la séquence ; bouton contextuel souris/tactile, saut possible, position/orientation restaurées exactement. Pas de minuterie de fermeture ni de sauvegarde persistante. Le recalcul du soleil depuis l’atelier reprend l’état ouvert avec la caméra ; une nouvelle visite normale ferme la porte. Les deux montants récupèrent une caméra déjà en chevauchement au lieu de refuser tous ses petits déplacements.
- `scenery.js` : cabanes, tentes, marchés avec voiles fixes, faïence, incrustations, lotus et barques statiques. Maillages partagés et distances de visibilité limitées, colliders des murs/poteaux réels ; gravure physique discrète **DAM**. Emplacements exposés seulement au QA de développement. `L` et `I` restent actifs sur ordinateur, sans mention dans l’accueil.
- Installation mobile : métadonnées Apple, zones sûres et favicon SVG intégrée ; `source/tools/make-icon.py` produit `apple-touch-icon.png` (icône d’installation facultative, extérieure au rendu 3D).
- `source/src/discoveries.js` : petits sanctuaires, abris et campement statiques, maillages et boîtes de collision partagés, choix d’un terrain sec et suffisamment plat près des sites souhaités ; ensembles de jarres et fragments sous-marins. `city.js` les implante et expose leurs positions aux captures de développement.
- `source/src/egypt.js` : générateurs des bâtiments, végétaux et ornements égyptiens ; `PDN` dans `layout.js` fournit les dimensions du pyramidion à la géométrie et à la réfraction.
- `source/tools/qa-export.py` exporte les captures vérifiées et les rapports bruts dans `.github/screenshots/` (Pillow, uniquement pour les outils). `qa-palm-control.mjs` fabrique dans `/tmp` une variante de contrôle avec les anciennes palmes, sans modifier le livrable.
- `reference/atlantis/` : clone du projet d'origine, ignoré par git, en lecture seule.

## Invariants métier

- Un seul `index.html` autonome pour toute la scène 3D, sans ressource externe de scène. Seule exception : `apple-touch-icon.png`, facultatif pour l’icône sur l’écran d’accueil ; son absence ne bloque pas la visite.
- Aucune allocation JS par image.
- Rien de visuel d'Atlantis ne doit subsister dans le rendu final.
- Garder `LICENSE` avec la mention de copyright d'Atlantis.

## Règles communes (catalogue WORKFLOW)

- **Instructions** : ce fichier est l'unique source des règles ; `CLAUDE.md` se limite à `@AGENTS.md`. Ne jamais dupliquer une règle ailleurs. Les singularités du projet (branche, publication, versions) sont dans « Façon de travailler sur ce projet » et priment sur ce bloc.
- **Comptes et services** : voir `ACCOUNTS.md` (GitHub, hébergement, base de données, API, emplacement des secrets), avec pour chaque service **l'identifiant de connexion** (e-mail exact ou méthode). Le mettre à jour dès qu'un compte, un service ou un secret change ; sur le Mac, reporter aussi tout nouveau compte dans `WORKFLOW/COMPTES.md`. Aucune valeur secrète dedans.
- **Avant de coder** : pour une demande non triviale, reformuler ce qui a été compris et poser les questions utiles avant de coder.
- **Faire plutôt que guider** : une étape dans un service (Vercel, Convex, Supabase, GitHub…) se fait avec son CLI ou son MCP, pas en me guidant écran par écran. Si l'outil manque ou n'est pas connecté, le dire d'emblée et proposer de le brancher une fois ; ne guider à la main qu'en dernier recours.
- **Git** : travailler sur la **branche de travail** déclarée plus haut, sans créer d'autre branche durable ni changer ce modèle sans demande explicite. Pas de pull request. Ne jamais réécrire l'historique de la branche de travail ou de `main`. En cloud, si l'outil impose une branche de session, fusionner le travail dans la branche de travail et la pousser avant de terminer.
- **Trace de l'agent** : terminer chaque message de commit par une ligne `Agent: Claude` ou `Agent: Codex`, selon l'agent qui a réellement fait le travail.
- **GitHub** : le compte est fixé par la configuration git (voir `ACCOUNTS.md`). Ne pas utiliser `gh auth switch` ; en cas d'erreur d'accès, le signaler.
- **Automatisations GitHub** (`.github/workflows/agents.yml`) : GitHub pose lui-même les tags (`revue-ok`, `vX.Y.Z`) et envoie les notifications Telegram de clôture et de version, ce qui fonctionne aussi depuis le cloud. Ne pas pousser ces tags soi-même : il suffit de pousser les commits.
- **Notification de fin** : si la tâche a demandé plus de 2 minutes, lancer juste avant la réponse finale `tg-notify "<résumé en quelques phrases>"`, ou `tg-notify --bloque "<raison>"` en cas de blocage après un travail significatif. Une seule notification par tâche, sans donnée sensible. Si l'envoi échoue, le signaler sans considérer la tâche comme échouée. (Chemin complet : `/opt/homebrew/bin/tg-notify`.) En cloud, `tg-notify` n'existe pas : ne rien envoyer, la clôture et les versions sont notifiées par GitHub.
- **Revue de code** (demande « revue », sans PR) : examiner en lecture seule les commits déjà poussés sur la branche de travail depuis le tag `revue-ok` (à défaut depuis `origin/main`), ou le commit / la plage indiqués. Rendre : résumé des fonctionnalités couvertes, problèmes classés par gravité avec `fichier:ligne` et correction proposée, plan de correction. Ne rien corriger sans accord.
- **Clôture** (demande « clôture » ou « fin de session », une fois les corrections validées et poussées) : ajouter en tête de `JOURNAL.md` (titre `# Journal des clôtures` s'il n'existe pas) une entrée courte, sans donnée sensible :
  ```
  ## AAAA-MM-JJ — Claude|Codex · local|cloud
  - Livré : <fonctionnalités revues et testées>
  - Tests : <vérifications lancées et résultat>
  - Corrigé à la revue : <corrections, ou « rien »>
  - En attente : <points reportés, ou « rien »>
  - Prochaine étape : <…>
  ```
  La commiter avec un message qui **commence par `Clôture`** (ex. `Clôture : journal`) et la pousser sur la branche de travail : l'Action GitHub déplace alors `revue-ok` sur ce commit et envoie l'entrée sur Telegram (pas de `tg-notify` en plus). Si le MCP Notion est disponible, mettre aussi à jour la ligne du projet dans la base Notion « État de reprise projets » (Branche, Dernier agent, Environnement, Dernier commit, Dernière session, Où on en est, Prochaine étape). Terminer par un récapitulatif et la ligne « ✅ CONVERSATION CLÔTURÉE — développé, testé, revu ».
- **Reprise** (premier message d'une conversation) : `git fetch origin --tags --force`, puis donner l'état en une ligne avant de traiter la demande : « ✅ Tout est clôturé (dernière entrée de `JOURNAL.md` : date, agent, prochaine étape) » si `revue-ok` et `origin/<branche de travail>` pointent le même commit, sinon « ⚠️ N commits poussés depuis la dernière clôture, non revus » avec leur liste courte (`git log --oneline revue-ok..origin/<branche de travail>`). Sans tag `revue-ok` : « Aucune clôture enregistrée ». Rappeler la branche de travail, signaler les modifications locales non commitées, puis ajouter la ligne : « Raccourcis : *réfléchis* (reformuler avant de coder) · *revue* (revue de code) · *clôture* ou *fin de session* (journal, tag, notification) · *initialise ce projet* (mise aux normes du workflow) ».
- Maintenir ce fichier quand les commandes, l'architecture, les invariants, la façon de travailler ou le déploiement évoluent.
