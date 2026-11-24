# HAPIKARA : BIBLE ARTISTIQUE

> Transposition égyptienne de l'`artstyle.md` d'Atlantis (Noniv, MIT). Même structure, mêmes 14 sections, pour que le prompt et le critique visuel fonctionnent pareil.
> Nom provisoire de la cité : **Hapikara** (de *Hâpy*, dieu de la crue du Nil et de l'abondance). À changer librement.

Ce fichier définit **à quoi la scène doit ressembler**. Il s'adresse au développeur et au critique visuel, et ne contient aucune consigne d'implémentation. Les images de référence sont dans `concept-art/` (les huit images du premier niveau seulement ; ignorer les sous-dossiers `rejected/` et `source/`). La section 3 dit comment s'en servir.

**La scène en une phrase :** Hapikara en fin de journée, une cité-oasis de grès doré, de calcaire blanc et de pierres précieuses, posée sur une île en terrasses entre le Nil et le désert, où une eau vert-jade claire jaillit du sommet d'une pyramide de cristal émeraude et ruisselle partout, de bassin en bassin, jusqu'au fleuve. Elle doit respirer **l'abondance, la lumière et la fraîcheur**.

---

## 1. Vision

Une Égypte antique rêvée, jamais archéologique : neuve, intacte, lumineuse, aérienne et habitée. La technologie n'apparaît que sous forme de pierre précieuse, de verre, de lumière et d'eau, jamais de machines. L'eau est partout : elle coule le long des murs, déborde des vasques, descend des escaliers d'eau, remplit les bassins de lotus. La pierre est dorée, chaude, sculptée de symboles. Les palmiers, papyrus et jardins débordent des terrasses.

**Principes**
1. **Cohérence.** Un axe processionnel est-ouest (du Nil vers le désert) et un réseau de canaux à coudes, interrompu par de grands îlots, gouvernent le plan, comme dans les vraies villes égyptiennes. Pas d'anneaux concentriques.
2. **L'eau descend.** Toute l'eau part du sommet (la pyramide) et descend par gravité, en cascades, rigoles et escaliers d'eau, vers le Nil. On doit pouvoir suivre son trajet des yeux.
3. **La lumière est franche.** Soleil bas à 12°, lumière rasante, ombres longues mais jamais noires, rebonds dorés du sable et verts de l'eau. Les pierres précieuses brillent parce que le soleil les traverse, pas parce qu'elles sont « magiques ».
4. **Les symboles sont de la sculpture.** Ankh, djed, œil oudjat, disque solaire ailé, scarabée, lotus et papyrus sont gravés en bas-relief ou incrustés en pierre précieuse dans l'architecture, jamais flottants ni lumineux.
5. **Le désert est un écrin.** Quelques traces d’occupation humaine et des sanctuaires oubliés ponctuent les extérieurs, sans foule ni animation. Le désert à l’ouest et le Nil à l’est encadrent la cité verte ; le contraste sable/eau/verdure est la signature du paysage.
6. **Monumentalité aérienne.** Grande échelle, mais légère : colonnades ouvertes, pylônes percés, terrasses suspendues, voiles de lin tendues. Jamais écrasant ni sombre.

**Silhouette :** une pyramide à degrés couronnée d'un pyramidion de cristal émeraude d'où jaillit l'eau, sur une acropole en terrasses, flanquée de quatre obélisques à pointe d'or, au-dessus de canaux vert-jade, avec le Nil scintillant à l'est et les falaises de grès rose du désert à l'ouest.

## 2. Cible de rendu : photoréalisme fantastique

**Le sujet est fantastique, le rendu ne l'est pas.** Chaque image doit ressembler à un lieu réel rendu par un moteur de jeu AAA actuel. Une capture doit pouvoir passer pour une image d'un tel jeu.

Elle ne doit **jamais** ressembler à : une peinture de concept, une illustration, un rendu stylisé ou cel-shadé, une maquette ou un jouet, du low-poly, de l'argile ou du plastique, du « CG propre », un péplum en carton-pâte, un jeu des années 2010.

**Ancrages réels.** Chaque matériau fantastique se comporte comme un vrai :

| Élément | Doit ressembler à |
|---|---|
| Pierre principale | Grès doré de Nubie et calcaire blanc de Tourah, poli ou adouci |
| Pyramidion et gemmes | Émeraude, malachite polie, lapis-lazuli, turquoise, cornaline, verre optique |
| Or | Feuille d'or et électrum satinés (pointes d'obélisques, incrustations) |
| Canaux et bassins | Eau de source claire sur fond de pierre claire, teinte vert-jade (rivières de Plitvice, cénotes) |
| Nil | Grand fleuve calme vert-bleu, reflets larges |
| Désert | Dunes de l'erg et falaises de grès rose de Wadi Rum / Vallée des Rois |
| Végétation | Palmeraie égyptienne : palmier dattier, palmier doum, sycomore, tamaris, acacia, papyrus, lotus bleu, jasmin, bougainvillier, vigne en treille |

**Ce qui le rend réel :**
1. **Ancrage au sol.** Ombres de contact et occlusion partout où les choses se touchent : bases des colonnes, murs à la ligne d'eau, sous les corniches à gorge, dans les portes des pylônes, sous les treilles. L'image est très claire, mais les creux restent vraiment sombres (brun-sépia profond ou vert-bleu, jamais noir pur).
2. **Un soleil, un ciel.** Fresnel visible partout : la pierre et l'eau s'éclaircissent en incidence rasante, le verre devient miroir sur les bords.
3. **Arêtes adoucies.** Chaque arête architecturale est légèrement arrondie et accroche un fin reflet.
4. **Surfaces neuves mais physiques.** Grain du grès, strates fines, zones polies (dallages, marches) contre zones adoucies (murs), assombrissement et un peu de mousse verte à la ligne d'eau, traces humides sous les rigoles. Détail calme, jamais bruité.
5. **Détail secondaire à toutes les distances.** Corniches à gorge égyptienne, tores d'angle, chapiteaux papyriformes et lotiformes, frises sculptées, bandeaux de symboles, jardinières, treilles. Aucune grande surface vide.
6. **Végétation botanique.** Stipes de palmiers annelés, palmes découpées qui laissent passer le ciel, translucides en contre-jour. Jamais de boules ou de cônes.
7. **Profondeur.** La perspective aérienne augmente avec la distance : les falaises du désert sont clairement à plusieurs kilomètres, dans une brume chaude et lumineuse.
8. **Réponse caméra.** Tonalité filmique, saturation naturelle, bloom discret, pas d'étoiles scintillantes.

## 3. Images de référence

Les huit images montrent la même cité dans le même style de rendu de jeu. Elles définissent ensemble le look visé. (Prompts ChatGPT : voir `PROMPTS_CHATGPT.md`.)

| Fichier | Plan | Ce qu'il faut en prendre |
|---|---|---|
| `P1_hero_aerial.png` | P1 | Plan de la cité : axe processionnel, acropole et pyramide, trame de canaux, quais du Nil, palmeraies, désert et falaises, palette et brume |
| `P2_axis_approach.png` | P2 | L'allée processionnelle : dallage à incrustations d'or et de lapis, sphinx couchés, pylônes, rigoles d'eau le long de l'allée, la pyramide au fond |
| `P3_canal_level.png` | P3 | L'eau : clarté vert-jade, caustiques sur le fond, reflets des colonnes, mousse à la ligne d'eau, papyrus et lotus |
| `P4_pyramid_closeup.png` | P4 | Le pyramidion : émeraude réfractante, jaillissement d'eau, nappes d'eau sur les degrés, incrustations de gemmes |
| `P5_garden_quarter.png` | P5 | Densité du quartier des jardins : villas à terrasses sous les palmiers, treilles, bassins, eau qui coule de partout |
| `P6_nile_quay.png` | P6 | Le Nil et l'éblouissement : chemin de reflets du soleil, felouques, quais à degrés, colonnes en contre-jour |
| `M1_materials.png` | planche matériaux | Gros plans : grès, calcaire poli, or satiné, lapis, turquoise, cornaline, bas-reliefs, eau qui ruisselle sur la pierre |
| `V1_garden_street.png` | planche végétation | Gros plan d'une rue-jardin : villa, fenêtres à claustra, palmiers, treille de vigne, bougainvillier, rigole d'eau, ombre tachetée |

**Coller aux références pour** la composition, la palette, la direction de la lumière et l'ambiance, l'architecture, les matériaux et la densité de végétation.

`plan.png` (vue zénithale, hors plans de revue) sert de plan d'ensemble : ovale de la cité, pyramide légèrement à l'ouest du centre, axe droit vers le Nil, trame de canaux, champs au nord et au sud, désert et falaises à l'ouest. Le suivre pour la disposition, la section 5 pour les dimensions.

**Écarts connus dans les références** (suivre ce document, pas l'image) :
- **Saturation et netteté** : P1, P2 et P3 sont très saturées et sur-contrastées, avec un aspect d'illustration retouchée. Le rendu doit être plus naturel et plus photographique (section 2), en gardant la luminosité et l'abondance.
- **Pyramidion** : dans P1 et P2, c'est un bloc vert opaque, presque en plastique. Il doit être une émeraude claire et réfractante, avec résille d'or et plans internes (section 6.B).
- **Taille de la pyramide** : dans P1, elle paraît trop basse et ne domine pas assez. Le pyramidion culmine vers 140 m au-dessus du Nil, bien au-dessus des obélisques.
- **Distance des falaises** : dans P1 et P2, elles semblent toutes proches de la cité. Elles sont à 1–3 km, adoucies par la brume chaude.
- **Couleur de l'eau** : dans P3 et une partie de P2, l'eau tire vers le turquoise. Elle doit pencher davantage vers le vert-jade (section 8). La clarté, les caustiques et les reflets de P3 sont en revanche exactement la cible.
- **Figures humaines** : les sphinx ont des visages détaillés, et les pylônes portent de grands reliefs de personnages. On garde les sphinx avec des visages simplifiés et lisses ; sur les pylônes, on préfère le disque solaire ailé, les lotus, les papyrus et des bandeaux de symboles. Des silhouettes en bas-relief, peu profondes et stylisées, restent tolérées.
- **Éclats en étoile** sur l'eau et les pointes dorées : les reflets doivent avoir une forme physique, sans étoiles.

Un rendu moins riche en micro-détail que les références est acceptable. Un rendu moins physiquement réel ne l'est pas.

## 4. Périmètre et exclusions

**Un seul état du monde :** neuf, abondant, à une heure fixe (section 9). Pas de ruine, de nuit, de tempête de sable, de crue destructrice.

**Ne jamais inclure :**
- personnes, silhouettes, animaux vivants et oiseaux ; exception validée : petits bancs de poissons discrets dans le Nil, argentés, olive ou dorés, sans aspect cartoon (les **statues** de sphinx, de béliers ou de faucons sont autorisées, en pierre, sans visage humain détaillé)
- texte lisible, lettres latines, logos, interface ou hologrammes dans la scène (les bandeaux de pseudo-hiéroglyphes sculptés sont autorisés comme texture, flous à distance)
- ordres classiques grecs (dorique, ionique, corinthien), frontons triangulaires, coupoles, arcs en plein cintre, éléments gréco-romains ou islamiques
- machines : moteurs, tuyaux, fils, engrenages, écrans, gratte-ciel en verre
- néon, éclairs, rayons laser, particules magiques, symboles lumineux flottants
- ruines, usure, sable envahissant la ville, palette sépia ou poussiéreuse, brume permanente
- la cliché « temple de Louxor » à l'identique : tout est réinventé

**Découvertes validées :** quelques vestiges discrets hors de la cité, coffres et sarcophages vides dans les hauts-fonds, mosaïques vert et or sous les canaux. Un passage entièrement immergé sous l’acropole conduit à une galerie puis à la chambre secrète de la pyramide. Grès chaud, malachite, or patiné, pénombre et braseros ; une étroite ouverture laisse un rayon solaire atteindre le sarcophage. Aucun mort ni personnage, aucune porte ou lumière magique.

## 5. Plan du monde

Le Nil coule du **sud vers le nord**, à l'**est** de la cité. Le désert et les falaises sont à l'**ouest**. Les tailles sont des proportions (±15 %), mais la hiérarchie et l'ordre comptent.

| Zone | Position | Contenu |
|---|---|---|
| Acropole sacrée | 0–90 m du centre | Pyramide à degrés (7 degrés), pyramidion d'émeraude, source jaillissante, bassin carré des lotus, quatre obélisques |
| Terrasses des temples | 90–220 m | Trois terrasses descendant vers l'est : salles hypostyles ouvertes, pylônes, colonnades, escaliers d'eau |
| Quartier des jardins | 220–450 m | Villas à toits-terrasses, palmiers, treilles, bassins, rigoles le long des rues, trame orthogonale irrégulière |
| Canaux | partout | Biefs à coudes et redans, tronçons interrompus, largeurs de 14 à 22 m ; lagunes de 60 à 85 m, îlot-jardin au nord-est, convergeant vers le Nil |
| Allée processionnelle | du centre jusqu'au Nil, plein est | 20 m de large, bordée de sphinx couchés et de rigoles, deux pylônes monumentaux |
| Quais du Nil | à 500–600 m à l'est | Quais à degrés, nilomètre (escalier descendant dans l'eau), felouques amarrées ; petit débarcadère sur la rive opposée pour regarder la ville face au soleil |
| Nil | 600–1100 m à l'est | Fleuve large (400–500 m), une ou deux îles de papyrus, rive opposée verte puis désert lointain |
| Ceinture agricole | 450–900 m, nord et sud | Champs et palmeraies en bandes, canaux d'irrigation, petits bassins |
| Lisière du désert | ouest, à partir de 700 m | Une ligne nette : dernier canal, dernier palmier, puis le sable |
| Désert et falaises | 1–3 km à l'ouest | Dunes douces puis falaises de grès rose de 150–250 m, une ou deux cascades descendant des falaises vers une oasis |

**Règles du plan**
- **Un axe majeur** est-ouest (Nil → pyramide → désert), plus un axe secondaire nord-sud. Les canaux secondaires sont des segments de longueurs inégales : coudes, redans, grands îlots sans traversée et lagunes, jamais un quadrillage continu.
- **Végétation par zones** : palmiers de différentes hauteurs par petits groupes, sycomores, tamaris, arbres fleuris et massifs bas. Petits jardins clos avec fontaine parmi les maisons ; quelques fontaines et plantations au bord des esplanades, en gardant les axes sacrés dégagés. Palmeraies espacées hors les murs, rives du Nil et oasis.
- **Relief par quartiers** : quais urbains à 10 m, quartiers sacrés à 16 et 22 m, acropole à 15 puis 20 m. De larges escaliers rejoignent les esplanades ; trois ensembles de temples et des groupes d’obélisques dégagent la silhouette. Les terrasses ne portent pas de palmeraie.
- **L'eau descend du centre vers le Nil** : la majorité du réseau reste à 6,5 m ; des biefs sacrés surélevés débordent vers les canaux, puis le Nil à 0 m.
- **Hiérarchie des hauteurs.** Le pyramidion (environ 110 m) domine, les obélisques montent à 45–55 m, les pylônes à 30 m, tout le reste sous 20 m. La pyramide est visible de presque partout.
- **Test de lisibilité.** Vue d'en haut : désert ocre, ruban vert, cité dorée parcourue d'eau verte, fleuve. Au sol : la pointe d'émeraude dépasse des toits et des palmes.

## 6. Éléments phares

**A. Pyramide à degrés.** Sept degrés de grès doré clair, à arêtes adoucies, base de 126 m, sommet à environ 110 m. Sur chaque degré, l'eau déborde en **nappes minces et lisses** vers le degré inférieur (comme une fontaine à débordement), sur les quatre faces, en laissant des escaliers secs au milieu de chaque face. Deux petits kiosques ouverts occupent les angles arrière du sommet, en laissant le point focal dégagé. Corniches et petits pilastres sculptés, panneaux votifs de malachite et d’or. Pas d’alternance systématique bleu-rouge-vert : or et vert dominent la pyramide, avec de larges plages de pierre calme.

**B. Pyramidion d'émeraude (point focal).** Pointe pyramidale de 15 m de haut en émeraude claire et réfractante, sertie d'une fine résille d'or. Une source jaillit de sa base sur les quatre côtés. Il est **clair et réfractant** : le ciel et la cité se voient déformés à travers, des plans de clivage et inclusions internes accrochent la lumière, des franges vertes et dorées apparaissent sur les arêtes. C'est l'objet le plus brillant de la scène, mais comme une gemme au soleil, pas comme une lampe.

**C. Quatre obélisques.** Granit rose poli, 45–55 m, pointes d'électrum, bandeaux verticaux de symboles en creux. Chacun se dresse dans un bassin carré dont l'eau déborde.

**D. Pylônes et salles hypostyles.** Pylônes trapézoïdaux à fruit (murs inclinés), corniche à gorge, portes hautes, mâts à oriflammes de lin blanc. Salles à colonnes papyriformes et lotiformes, peintes en bandes ocre, turquoise et lapis légèrement passées, toits ouverts en partie (claire-voie), sol couvert d'une fine lame d'eau qui reflète les colonnes.

**E. Escaliers d'eau et rigoles.** Signature de la cité : des escaliers où l'eau descend en marches miroitantes, des rigoles taillées dans la pierre le long des rues et des murs, des vasques en forme de lotus qui débordent, des gargouilles à tête de lion d'où l'eau tombe en filets.

**F. Villas des jardins** (environ 150–250, vingt familles de formes). Un à trois niveaux (5–12 m), murs de calcaire enduit blanc-crème ou ocre clair, fruit léger, corniches à gorge, fenêtres à claustra, toits-terrasses avec pergolas de lin, treilles de vigne et jarres. Plans en L, en U ou à cour, maisons-tours de trois niveaux, portiques, jarres et treilles sur les toits ; petits sanctuaires et greniers ronds entre les habitations. Disposition irrégulière le long des canaux et des rues. **Les palmes dépassent des toits.**

**G. Allée des sphinx et pylônes d'entrée.** Dallage de calcaire poli à incrustations d'or et de lapis, sphinx couchés tous les 8 m, rigoles des deux côtés, deux pylônes monumentaux vers le Nil.

**H. Ponts et quais.** Ponts de pierre plats ou à faibles voûtes, garde-corps à balustres en forme de papyrus. Quais à degrés descendant dans l'eau (contremarches de 0,18 m), nilomètre.

**I. Felouques** (mineur). 8 à 15 felouques en bois clair à voile latine blanche, sur le Nil et les grands canaux, glissant lentement ou amarrées.

**J. Désert et falaises.** Dunes douces ocre-or, falaises stratifiées de grès rose et ocre, une ou deux cascades blanches tombant vers une petite oasis de palmiers au pied des falaises.

## 7. Matériaux

| Matériau | Aspect |
|---|---|
| **Grès doré** | Murs, pylônes, villas : ocre-or chaud au soleil, ambre-rosé à l'ombre, strates fines, grain mat |
| **Calcaire blanc** | Pyramide, dallages, marches : blanc chaud, poli doux sur les sols (reflets flous), adouci sur les murs. Rebond vert de l'eau sur les dessous |
| **Granit rose** | Obélisques, socles : poli, moucheté |
| **Émeraude et verre** | Pyramidion : réfractant, fresnel, plans internes, franges sur les arêtes seulement. Pas de scintillement |
| **Gemmes incrustées** | Lapis (bleu nuit à paillettes d'or), turquoise, cornaline, malachite : en incrustations plates et polies dans la pierre, jamais en blocs |
| **Or et électrum** | Pointes, résilles, incrustations fines, bordures. Satiné, jamais miroir, jamais en revêtement massif |
| **Peinture ancienne** | Bandes ocre, turquoise, lapis, rouge cornaline sur les colonnes et frises, mates, légèrement passées par le soleil |
| **Lin** | Voiles, oriflammes, pergolas : blanc cassé, translucide en contre-jour, ondule au vent |

**Vocabulaire de motifs :** lotus, papyrus, disque solaire ailé, ankh, djed, œil oudjat, scarabée, vague de Nil (zigzag), étoiles à cinq branches sur les plafonds. Toujours sculptés ou incrustés dans la structure, jamais collés.

## 8. L'eau

L'eau est le deuxième héros après le pyramidion. Elle est **légèrement verte** partout.
1. **Eau des canaux et bassins.** Vert-jade clair, transparente sur un fond de pierre claire, avec des caustiques mouvantes dans les hauts-fonds, s'approfondissant en vert-émeraude. Calme, petites rides. **Reflets nets** de la pyramide, des obélisques, des colonnes, des palmiers et du ciel ; fresnel fort en incidence rasante. Des caustiques dansent sur les murs des quais.
2. **Eau qui ruisselle.** Nappes minces et lisses sur les degrés de la pyramide, filets des gargouilles, marches miroitantes des escaliers d'eau, rigoles le long des murs. Légèrement plus claire, mousse blanche fine au pied des chutes, brume légère irisée au soleil près des grandes chutes.
3. **Le Nil.** Grand fleuve vert-bleu, plus opaque que les canaux, courant lent visible, large chemin de reflets soyeux du soleil (jamais de bruit pointillé), mousse fine sur les berges de papyrus.
4. **Bassins sacrés.** Autour de la pyramide et des obélisques : eau plus profonde, vert émeraude, lotus bleus et blancs à la surface, reflets miroir.

## 9. Lumière, ciel, atmosphère et couleur

**Heure par défaut : fin de journée lumineuse, soleil à 12°.** Le ciel garde son bleu jusqu’à l’horizon ; le voile doré et la perspective aérienne sont réservés au lointain, sans filtre jaune sur les premiers plans.
- **Soleil :** 12° d’élévation par défaut, venant du **sud-ouest** (au-dessus du désert). Lumière blanc-doré (environ #FFE9C4), ombres nettes. Dans les plans phares, qui regardent vers l'ouest, le soleil est de trois-quarts face : le pyramidion, l'eau, les palmes et le lin sont partiellement en contre-jour.
- **Ciel :** clair et lumineux, zénith bleu franc (#3F86C8) dégradé vers un bleu pâle (#A8D0EA) puis un horizon crème lumineux (#F4E6C8). Quelques nuages légers très hauts. Pas de lune, pas d'étoiles.
- **Atmosphère :** chaude, sèche sur le désert (brume dorée légère, chaleur qui tremble au loin), plus humide et fraîche au-dessus de l'eau. Les falaises lointaines sont adoucies et teintées de rose-violet. Halo doux autour du soleil, rayons de lumière subtils à travers les palmes et les colonnades.
- **Ombres :** ombres ouvertes ambrées par le rebond du sable et vertes près de l'eau. Ombres de contact profondes.
- **Lumière des gemmes** : seulement par transmission du soleil et reflets. Elle ne remplit jamais la scène.

**Palette (image finale, après tone mapping)**

| Rôle | Couleurs |
|---|---|
| Pierre | Calcaire #F3ECDD, grès doré #E2BF84, grès à l'ombre #B98E62, granit rose #C48A7A |
| Eau | Vert-jade #3FB59A, jade clair #8FD8C0, émeraude profond #0E5A4A, Nil #2E8A86, écume #EAF6F0 |
| Ciel et désert | Bleu ciel #3F86C8, horizon #F4E6C8, sable #E9C98E, falaises #C98F6E |
| Végétation | Palme #4D7A3A, palme en contre-jour #A9C65A, papyrus #6E9A3E, sycomore #3E6B34 |
| Gemmes et accents | Lapis #1F3C8C, turquoise #36B5C4, cornaline #C2452D, malachite #1F7A55, or #E5BE5A |
| Fleurs | Lotus bleu #6E8ED8, lotus blanc, bougainvillier #C23E8A, jasmin blanc |

**Image type :** environ 35 % ciel et eau, 35 % pierre dorée et blanche, 20 % verts, 10 % gemmes, fleurs et accents. Saturation naturelle, jamais fluo.

## 10. Végétation et paysage

- **Arbres :** palmiers dattiers hauts et élancés (le rythme vertical de la cité, souvent en rangées le long des canaux), palmiers doum à tronc fourchu, sycomores et tamaris à couronne large (6–12 m), acacias en ombrelle à la lisière du désert.
- **Sous-étage :** massifs de papyrus au bord de l'eau, lotus sur les bassins, jasmin, bougainvilliers sur les murs, treilles de vigne au-dessus des rues, jarres et jardinières.
- **Densité :** maximale dans le quartier des jardins et la ceinture agricole ; cours plantées dans les terrasses des temples ; quelques palmiers ornementaux seulement sur l'acropole.
- **Ceinture agricole :** bandes de champs verts et dorés, palmeraies, canaux d'irrigation, légèrement irréguliers.
- **Lisière :** une transition nette verdure/sable, très lisible d'en haut.

## 11. Mouvement

Tout mouvement est lent, fluide et cohérent.

| Élément | Comportement |
|---|---|
| Respiration du pyramidion | Légère variation d'éclat (période d'environ 10 s, ±10 %) |
| **Onde de crue** (événement signature) | Toutes les 15 s environ, une pulsation d'eau plus abondante descend les degrés de la pyramide puis se propage dans les canaux vers le Nil (environ 20 m/s) : nappes un peu plus épaisses, caustiques plus vives, rides concentriques dans les bassins. Jamais d'éclair ni de rayon |
| Eau | Rides, caustiques, nappes sur les degrés, filets, courant du Nil, brume des chutes |
| Végétation | Brise douce et cohérente, palmes qui ondulent |
| Lin | Voiles et oriflammes qui ondulent |
| Felouques | Trajectoires lentes en boucle, les amarrées tanguent |

## 12. Signes de vie (sans personne)

- **Échelle :** portes et fenêtres à taille humaine, marches, garde-corps, dalles de 2 m, felouques de 8–10 m, palmiers de 12–20 m.
- **Usage :** chemins usés, jarres, nattes sur les terrasses, voiles de lin tendues, felouques amarrées, rangs cultivés.
- **Variété :** pas deux bâtiments voisins identiques ; la trame a de petites asymétries.

## 13. Plans de revue

Six plans fixes (16:9, FOV vertical d'environ 60°).

| # | Plan | Référence | Lecture attendue |
|---|---|---|---|
| P1 | **Vue aérienne héroïque** depuis l'est-sud-est, au-dessus du Nil, environ 350 m de haut | P1 | Toute la cité : le Nil au premier plan, l'axe processionnel menant à la pyramide, les canaux, le ruban vert, le désert et les falaises au fond. Le pyramidion est le point focal |
| P2 | **Approche par l'axe**, à basse altitude sur l'allée des sphinx | P2 | L'allée mène tout droit aux pylônes puis à la pyramide ; rigoles des deux côtés ; soleil de trois-quarts face |
| P3 | **Niveau du canal**, juste au-dessus de l'eau | P3 | Eau vert-jade claire avec caustiques, reflets des colonnes et palmiers, papyrus, pyramide au loin |
| P4 | **Gros plan du pyramidion** depuis le dernier degré | P4 | Réfraction, plans internes, eau jaillissante, nappes sur les degrés, incrustations au premier plan |
| P5 | **Quartier des jardins**, environ 25 m au-dessus des villas | P5 | Villas sous les palmes, treilles, rigoles, canal et pont, obélisques et pyramide au fond |
| P6 | **Quai du Nil face au soleil** | P6 | Test d'éblouissement : chemin de reflets sur le Nil, felouques en contre-jour, quais à degrés, colonnes. Reflets soyeux sans scintillement |

## 14. Grille de revue (pour le critique visuel)

**Gravité**
- **Critique :** ne se lit pas comme cette cité (un péplum en carton, des ruines, un décor de Las Vegas, un désert vide) ; **semble stylisé, cartoon, jouet, low-poly ou en argile** ; pas de point focal pyramide/émeraude ; eau absente ou bleue au lieu de vert-jade ; palette très décalée ; image sombre ou boueuse.
- **Majeur :**
  - matériaux plastiques ou argileux
  - objets qui flottent faute d'ombres de contact
  - végétation en sucettes ou en boules
  - eau sans reflets, ou eau qui ne coule nulle part
  - pyramidion qui ressemble à un néon ou à un hologramme
  - étoiles scintillantes ou bloom généralisé
  - ciel ou brume plats
  - banding, scintillement, aliasing ou popping visibles
- **Modéré :** bâtiments identiques répétés, surfaces vides, symboles collés ou flottants, joints durs, cadrage faible, plan qui contredit sa référence.
- **Mineur :** finitions.

**Tests oui/non** (chaque « non » est un défaut) :
1. Chaque capture pourrait-elle passer pour une image d'un jeu AAA actuel ?
2. Tous les objets sont-ils ancrés par des ombres de contact ?
3. Les matériaux se lisent-ils comme leurs ancrages réels (section 2) ?
4. La végétation est-elle botanique, dense, avec des palmiers crédibles ?
5. La cité se lit-elle comme un axe et une trame de canaux autour de la pyramide, entre Nil et désert ?
6. L'architecture est-elle égyptienne (fruit, corniches à gorge, colonnes papyriformes), sans éléments grecs, romains ou islamiques ?
7. Le pyramidion est-il clair et réfractant, avec des franges seulement sur les arêtes ?
8. L'eau est-elle vert-jade, claire, réfléchissante, et ruisselle-t-elle de partout ?
9. La lumière est-elle un soleil de matinée cohérent, très lumineux, avec une perspective aérienne propre ?
10. La palette correspond-elle à la section 9 et aux références ?
11. À côté de chaque référence, le plan a-t-il la même composition et la même ambiance, en plus physiquement réel ?
12. Ressent-on l'abondance, la fraîcheur et la vie ?

**Contrôles temporels** (images du survol) : scintillement sur les incrustations, les colonnes, les palmes, les reflets d'eau ; aliasing ; popping ; banding dans le ciel, la brume, le pyramidion ou la profondeur de l'eau ; instabilité, ghosting ou changements brusques d'exposition.
