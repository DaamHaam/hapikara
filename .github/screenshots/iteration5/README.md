# Hapikara v0.4.0 — 24 novembre 2026

Captures à 1440 × 900, WebGPU matériel Apple / Metal 3 dans le navigateur intégré. Résolution fixe : l’adaptation automatique ne masque pas le coût des matériaux. Ce sont des contrôles courts, pas un benchmark de fluidité de 60 secondes ni un essai iPhone/GTX/RTX/VR.

## Livré

- Soleil à 12°, mêmes autres réglages de Sanctuaire voilé.
- Corniches et pilastres sur les degrés conservés, panneaux votifs et motifs or/malachite ; retrait des bandes systématiques bleu-rouge-vert de la pyramide.
- Grain modéré, relief des épaules des joints et légères variations par bloc ; détails fins atténués avant de devenir trop petits à l’écran.
- Relief renforcé optionnel, désactivé par défaut. Pierre et Sous l’eau en tête du panneau L.
- Sous l’eau : niveau 3 et rayons à 2 par défaut, densité conservée à 0,085 ; douze ensembles statiques de jarres, fragment de colonne et pierre gravée.
- Quatre découvertes extérieures. Le terrain détermine leur position exacte, enregistrée dans chaque rapport. Un dégagement de végétation évite les arbres traversant les petits sanctuaires. Les murs, piliers et caisses ont des collisions ; les toiles restent décoratives.

## Comparaison des matériaux

Chaque triplet garde la même scène et la même lumière. Moyenne de 24 relevés GPU après stabilisation ; échantillon court, sensible au bruit et à la température de la machine.

| Qualité | Grain 0, relief 0 | Grain 1, relief 0 (défaut) | Grain 1, relief 1 |
|---|---:|---:|---:|
| Medium, mur proche à environ 4 m | 12,38 ms | 13,13 ms | 14,12 ms |
| High, même mur proche | 13,77 ms | 14,62 ms | 15,44 ms |
| Low, vue plus large à environ 11 m | 4,33 ms | 4,46 ms | 4,87 ms |

Comparer les réglages au sein de chaque ligne ; la vue Low n’est pas identique aux deux autres. Le grain modéré reste activé pour ce gain visuel et ce surcoût mesuré ; le renforcement demeure un choix explicite.

Les rapports Medium et High précèdent la dernière gravure du petit marqueur sous-marin ; Low précède aussi les finitions de la tente et le dégagement des plantations. Ces dernières modifications n’affectent pas la comparaison du mur. Le fichier minifié final a ensuite été chargé et contrôlé : pas d’erreur ni avertissement console, curseur de relief, réinitialisation de l’eau, valeurs par défaut et ordre des groupes vérifiés. `panneau.jpg` et `accueil.jpg` proviennent de ce livrable final.

## Vérifications et limites

Contrôles CPU : 41 607 points du plan, 166 dessus maillés, 42 générateurs/variantes finis, implantations sèches et assez plates, collisions des canaux et quais, import borné, valeurs par défaut, cinq LOD de palmes et jardins secs. Contrat du HTML autonome et attribution MIT vérifiés.

Le scintillement connu des végétaux n’est pas traité par cette version. Les rayons et réfractions restent des approximations. La qualité visuelle doit encore être appréciée par Damien sur ses machines ; aucune validation photoréaliste n’est annoncée.
