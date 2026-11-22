# Hapikara v0.3.0 — contrôles du 22 novembre 2026

- `final-medium.json` : version finale après retrait de toutes les impulsions sur l’eau, six vues et quatre niveaux sous-marins, 1440 × 900, Chrome matériel Apple/Metal 3. Aucun signal d’erreur WebGPU. Quatre fontaines d’esplanade ajoutées.
- `high.json` et `low.json` : compilation et captures des variantes High et Low (avant le dernier retrait des impulsions). Low est capturé en portrait sur le Mac : ce contrôle ne remplace pas un essai sur iPhone.
- `medium.json` et `lod-control.json` : comparaison à géométrie/lumière identiques, motif de transition fixe contre motif temporel. Vue proche immobile : variation verte moyenne 0,351 contre 0,350 ; pixels dépassant 6 niveaux : 0,62 % dans les deux cas. Aucun gain démontré sur cette vue. Le scintillement des végétaux demeure une limite connue.
- GPU sous l’eau, capture finale Medium : niveaux 0/1/2/3 à 11,47 / 11,47 / 11,60 / 13,37 ms. Relevés ponctuels, pas moyennes de benchmark ; les passes se chevauchent, leurs durées ne s’additionnent pas.
- Captures QA effectuées en arrière-plan : elles ne permettent pas de conclure à une fréquence d’affichage réelle. Aucun nouveau benchmark de survol de 60 secondes. GTX 1070, RTX 4060 et VR non testées.
- Interface vérifiée sur le fichier minifié : accueil, L, I, curseur de nuages, rechargement remettant les valeurs par défaut, application du soleil conservant les essais pour ce rechargement technique. Accueil lisible à 390 × 844. Pas de simulation complète des gestes tactiles.
- Contrôles CPU : plan/maillage/collisions, caméra avec volume contre un quai à grande vitesse, fond solide et surface traversable ; import borné, réglages de visite et transfert temporaire du soleil ; palmes opaques et jardins secs ; contrat du livrable autonome.

Les quatre niveaux sous-marins restent des approximations : brouillard coloré en post-traitement, réfraction de surface en espace écran, caustiques procédurales, rayons à 3/5/8 échantillons selon la qualité globale. Les objets du fond sont statiques. Les petits bassins hauts ne sont pas plongeables.
