# Prompts ChatGPT pour les images de référence

Les prompts sont en anglais, car les générateurs d'images y répondent mieux. Range chaque image dans `concept-art/` sous le nom de fichier indiqué (PNG, en 16:9 / paysage).

## Méthode (la même que pour Atlantis)

1. **Une seule conversation ChatGPT** pour les 8 images, afin que la cité reste cohérente d'une image à l'autre.
2. Colle d'abord le **bloc « BIBLE »** ci-dessous, seul, puis demande P1.
3. Quand P1 te plaît, dis : *« Keep exactly this city, same architecture, same palette, same light. Now: »* et colle le prompt suivant.
4. Si une image dérive (eau bleue, coupoles, style peinture, personnages), régénère-la au lieu de la corriger par petites touches.
5. Mets les ratées dans `concept-art/rejected/`. Note ce qui ne va pas dans une image retenue dans la section 3 de `artstyle.md` (« Écarts connus »).

Pas besoin de plan dessiné à part : P1 (la vue aérienne) **sert de plan**, comme chez Atlantis. Si tu veux un plan en plus, utilise le prompt 0 (facultatif).

---

## BIBLE (à coller en premier, une seule fois)

```text
We are designing reference images for a real-time 3D game. The subject is an imaginary ancient Egyptian oasis city called Hapikara, built on a gently terraced hill between the Nile (east) and the desert (west).
RENDER STYLE for every image: fantasy photorealism, like a frame from a current-generation AAA game in Unreal Engine 5, physically based materials, global illumination, realistic contact shadows. NOT a painting, NOT an illustration, NOT stylized, NOT a toy model, no fog, no lens-flare stars.
CITY: golden sandstone and white polished limestone, new and pristine (never ruins). At the centre, a seven-step white limestone pyramid crowned by a clear refractive EMERALD pyramidion set in a fine gold lattice; clear water gushes from its top and slides down every step in thin smooth sheets. Four pink granite obelisks with gold tips stand in overflowing square pools around it. A processional avenue lined with recumbent sphinx statues and water channels runs straight east to monumental pylons and stepped quays on the wide Nile. Open hypostyle halls with papyrus and lotus columns painted in faded ochre, turquoise and lapis bands. Water is everywhere: canals in a slightly irregular grid, water stairs, lotus-shaped overflowing basins, small channels along every street and wall, lion-head spouts. The water is crystal clear with a slight JADE-GREEN tint, with caustics on the pale stone floor and mirror reflections.
Precious stones are inlaid flush into the architecture: lapis lazuli, turquoise, carnelian, malachite, gold. Carved Egyptian symbols in low relief (ankh, djed, winged sun disc, eye of Horus, scarab, lotus, papyrus), never floating or glowing.
Vegetation: tall date palms in rows along the canals, doum palms, sycamore figs, papyrus thickets, blue and white lotus, vine pergolas, bougainvillea, jasmine. White linen sails and awnings.
Beyond: green fields and palm groves, then a sharp line where the desert starts, golden dunes and pink layered sandstone cliffs 2 km to the west with a waterfall falling into a small oasis.
LIGHT: mid-morning, very bright and airy, sun about 35 degrees high from the south-east, clear luminous blue sky, warm golden-white light, amber bounce light from sand, green bounce from water. Mood: abundance, freshness, serenity.
NEVER: people, animals, birds, readable text, Greek columns, domes, round arches, Islamic architecture, machines, neon, magic particles, dust, sepia.
Confirm you understand, then wait for my first shot request.
```

---

## 0. Plan de la cité (facultatif)

```text
Top-down orthographic map of Hapikara, like a clean architectural site plan with soft realistic shading (satellite-photo look, not a drawing). The Nile runs vertically along the right (east) side. In the centre, the square seven-step pyramid with its four obelisks and sacred pools. A straight processional avenue runs from the pyramid to the Nile quays on the right. A slightly irregular orthogonal grid of jade-green canals and streets fills a roughly 900 m wide oval city; terraced temple courts near the centre, garden villas further out. Green fields and palm groves to the north and south, then a crisp edge where golden desert dunes start on the left (west), and pink sandstone cliffs at the far left edge. No text, no labels.
```

## P1_hero_aerial.png — Vue aérienne

```text
Shot P1, hero aerial. Camera about 350 m high above the Nile, east-south-east of the city, looking west-north-west toward the pyramid. Foreground: the wide green-blue Nile with felucca boats and the stepped stone quays. The processional avenue leads straight from the quays through two pylons to the terraced acropolis and the stepped pyramid with its shining emerald pyramidion, water sheeting down every step. The jade-green canal grid, gardens, palm rows, villas and hypostyle halls fill the city. Behind: green fields, then the sharp desert edge, golden dunes and pink sandstone cliffs with a waterfall, softened by warm haze. Sun high-left. 16:9.
```

## P2_axis_approach.png — Approche par l'axe

```text
Shot P2, axis approach. Camera 15 m above the processional avenue, looking straight west along it toward the pyramid 500 m away. Polished limestone paving with flush gold and lapis inlay lines, recumbent sphinx statues on both sides every 8 m, water channels on both sides with small waterfalls at each level change, date palms behind. Two monumental pylons with linen banners frame the view; behind them the hypostyle halls and the pyramid with water sliding down its steps and the emerald pyramidion catching the sun. Sun front-left, slightly backlighting the water and palms. 16:9.
```

## P3_canal_level.png — Niveau du canal

```text
Shot P3, canal level. Camera 1 m above a 15 m wide canal in the garden quarter. Crystal clear jade-green water, the pale stone floor visible with moving caustics, slight green moss at the waterline, caustic light dancing on the quay walls. Mirror reflections of papyrus columns, palm trees and an obelisk. Papyrus thickets and blue lotus along the edges, bougainvillea spilling over the sandstone walls, a lion-head spout pouring a thin stream into the canal, a small felucca moored. The emerald pyramidion visible above the rooftops in the distance. 16:9.
```

## P4_pyramid_closeup.png — Pyramidion

```text
Shot P4, pyramidion close-up. Camera standing on the top step of the white limestone pyramid, looking up at the 15 m emerald pyramidion. It is a clear, refractive gemstone: the sky and city are visibly bent through it, internal cleavage planes and inclusions catch the sun, thin green-gold fringes on its edges only, held by a fine gold lattice. Clear water gushes from its base on all four sides and slides over the step edges in smooth thin sheets. Foreground: the step's riser carved with a band of Egyptian symbols inlaid with lapis, turquoise, carnelian and gold, wet and glistening. 16:9.
```

## P5_garden_quarter.png — Quartier des jardins

```text
Shot P5, garden quarter. Camera about 25 m above the villas, looking toward the centre. Dense garden quarter: two-storey villas in cream plaster and golden sandstone with battered walls, cavetto cornices and lattice windows, roof terraces with white linen pergolas, vine trellises and jars. Palm crowns rise above the roofs. Small water channels run along every street, overflowing lotus basins in courtyards, a canal with a flat stone bridge with papyrus-shaped balusters. In the midground two obelisks and a hypostyle hall; beyond, the pyramid and its emerald tip. Sun upper-left, behind palm fronds, leaves glowing translucent. 16:9.
```

## P6_nile_quay.png — Quai du Nil

```text
Shot P6, Nile quay facing the sun. Camera 10 m above the stepped quays, looking south-east across the wide Nile toward the sun. A broad silky sun-glitter path on the green-blue water, felucca sails glowing translucent in backlight, a nilometer staircase descending into the water, a colonnade of lotus columns rim-lit along the quay, papyrus islands, warm luminous haze over the far bank. Highlights soft and physically shaped, no star glints. 16:9.
```

## M1_materials.png — Planche matériaux

```text
Material close-up M1, as a single realistic game screenshot (not a sheet with labels). A corner of the pyramid terrace at 3 m distance: polished white limestone paving with soft blurry reflections, golden sandstone wall with fine strata, a pink granite obelisk base, flush inlays of lapis lazuli, turquoise, carnelian, malachite and satin gold forming a winged sun disc in low relief. Clear jade-green water slides in a thin smooth sheet over a step edge and runs in a carved channel, wet stone darker beside it, small caustics. 16:9.
```

## V1_garden_street.png — Rue-jardin

```text
Vegetation close-up V1. Eye-level view down a narrow garden street in Hapikara. Cream plaster villa walls with lattice windows and small turquoise-glazed tiles, a vine pergola overhead throwing dappled light, a date palm trunk with realistic ring scars and fronds against the sky, bougainvillea and jasmine on the walls, papyrus in a stone planter, a worn stone path with a clear jade-green water channel running along its edge, a small lotus-shaped basin overflowing. 16:9.
```
