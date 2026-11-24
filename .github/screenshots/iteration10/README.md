# Plan 4 — Manette, v0.9.0

La capture et le rapport sont issus d’une **manette simulée** qui appelle le même traitement que les instantanés Gamepad du navigateur. Le petit panneau QA à droite appartient uniquement à un HTML temporaire dans `/tmp`, jamais au livrable. Contrôles observés : Bas sélectionne la qualité, A valide, Haut puis A lance la visite, Start ouvre puis reprend l’accueil. Aucune erreur GPU dans le rapport.

Reproduction : `cd source && npm run build:dev && node tools/qa-gamepad.mjs`, puis le serveur `python3 source/tools/qa-server.py` depuis la racine et un seul onglet sur `/__palm-control.html?auto&lv=1&w=1440&h=900&fps=30`.

`npm run check:gamepad` teste l’armement neutre, les zones mortes, sticks, gâchettes analogiques, boutons maintenus, actions, qualité, menus, atelier protégé, déconnexion/reconnexion et perte de focus. Il exécute aussi le vrai `frame()` en environnement CPU pour vérifier déplacement, appel aux collisions, accélération, montée, rotation et immobilité dans le menu. Autres contrôles : plan, ambiance, mécanisme et bundle. Le livrable minifié est chargé sans erreur dans le navigateur sans manette ; l’aide conditionnelle reste cachée.

**À faire avec Damien :** essai d’une manette physique USB/Bluetooth standard, notamment son identification, le confort des sticks, le levier, la reconnexion et l’audio au premier lancement. Selon les restrictions audio du navigateur, un premier clic/toucher ou une touche peut être nécessaire pour déverrouiller le son ; la manette tente d’utiliser exactement le même graphe musical. Aucun essai matériel ni benchmark comparatif dans cette session.
