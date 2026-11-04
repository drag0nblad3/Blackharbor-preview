# Isometric battlefield preview

Open `isometric-lab.html` for an isolated playable showdown. It never loads or writes campaign saves. Switch bosses with the Lair selector. In a campaign battle, use **Try the new isometric view** above the board; the comparison toggle returns to classic graphics. This is a session-only presentation preference.

The angled hex renderer uses the existing movement, targeting, facing, collisions and ability rules. Actors sort by projected ground depth. Floor highlights show movement, targets, exits, bombs, beams and boss marks. Boss footprint outlines and arrows show occupied hexes and facing. Effects use the same projection, with extra colored light and rising particles for paid signature and equipment abilities. Reduced motion suppresses these additional effects.

## Artwork

`assets/isometric/characters.webp`: archived first-pass transparent 6×6 raster atlas, replaced in the isometric renderer by the unified superhero sheets. Nine heroes, twelve villains, two additional swarm bodies, eleven faction henchmen and two civilians. `assets/isometric/digger.webp` adds a separate newly generated Digger henchman for Mole Boy, bringing the roster to 37 sprites.

`assets/isometric/street.webp`: newly generated painted slate street texture.

Production brief used for the built-in image generator: painterly inked pulp-noir tactical RPG sprites; consistent elevated three-quarter camera; full bodies facing lower right; transparent 6×6 grid; no labels, bases or background; distinguish each named roster entry by silhouette, costume and faction palette. Digger brief: full-body short tunnel worker, ochre overalls, helmet lamp, goggles, oversized digging claws, elevated three-quarter camera, transparent background. Ground brief: overhead seamless dark slate asphalt and cracked concrete, wet teal and amber reflections, no objects or text. Source PNGs were converted to WebP for browser delivery.

## Current limits

This is a first playable art pass. Character poses have one facing, without walk/attack frame sequences. Ouroboros now has one cover-matched head, a continuous textured body following its occupied hexes, and a dedicated tapered tail. Walls, rubble, terminals and bombs use a new painted prop atlas. Floors have steel, timber, sewer masonry and street materials with layered tactical effects. Character poses still have one facing; full walk/attack frame sequences remain. Desktop browser movement and boss switching were checked. Movement also worked in a 390px browser viewport; physical phone touch testing remains.

## Validation

`node tests/isometric.cjs` checks all villain types, all hero mappings, the swarm queen alias, every playable cell, valid geometry, state purity, classic comparison and packaged assets. Existing mechanics, boss-options, hero-loadout and comic-ui suites also pass. One seeded campaign with abilities completed all 19 fights without a stall.


## Cover fidelity and environment pass

The twelve approved covers were used directly as identity references for three new 2×2 sprite atlases (`cover-1.webp` through `cover-3.webp`). Corrections include Gallows’ white hair and green optics, Quarry’s molten stone features, Cantor’s fedora and hypnotic cane, the Architect’s blue-and-gold engineering armor, Lodestone’s exposed bald head and red coils, Murmur’s amber wasp silhouette, and Mole Boy’s yellow helmet and blue overalls. All character groups now use the clean, stylized superhero art pass described below.

`props.webp` provides illustrated concrete barricades, masonry rubble, an evidence terminal, and a bomb. `serpent-parts.webp` is the generated modular artwork; `serpent-scales.webp` and `serpent-tail.webp` are prepared crops used by the connected body renderer. Body geometry follows the live ordered body hexes, including bends and growth. Occupancy and collision still use the original game rules.

Floor texture remains visible through movement/target overlays. Cracks, puddles, pit rims and depth, illuminated lava fissures, exit arrows and striped blast warnings add detail. Floor warning and lava motion respect reduced-motion preferences. Material patterns are presentation-only and do not add hazards.

Asset prompt briefs: use each approved cover as canonical identity reference; full-body isolated isometric game sprites with black brush contours, warm highlights and controlled vintage halftone; preserve face, gender, costume, colors and signature props. Environment atlas: chipped concrete with rebar and hazard paint, low masonry rubble, weathered cyan-screen terminal, industrial mechanical bomb, transparent background. Serpent atlas: dark green-black scales, olive highlights, yellow belly and dorsal spines, straight body, bending body, tapered tail and scale texture; no additional heads.

## Hero facing and superhero silhouettes

All nine hero archetypes face screen-left in the isometric renderer. Cipher, Rivet, Goliath, Sibyl and Hexen use newly drawn left-facing sprites in `cast-1.webp`. Bulwark, Volt, Wisp and Lynx use `heroes-superhero.webp`, a new 2×2 atlas drawn facing left. Figure orientation does not mirror names, HP/level badges, selection rings, map coordinates or attack effects.

The four revised costumes keep their role colors: Bulwark has streamlined blue-and-silver guardian armor and a forearm shield, Volt has an amber lightning-panel suit and compact electrical gauntlets, Wisp has a teal speedster suit and trailing translucent scarf, and Lynx has an orange-and-charcoal cowl suit with retractable claws. The generation brief requested elevated three-quarter game poses, strong ink contours, clear superhero silhouettes, controlled vintage halftone, transparent surroundings and no text or cell borders.


## Full-cast style pass and fitted camera

All 37 character identities now use the bold ink/cel-shaded superhero style of the new four-hero atlas. Three cover sheets retain the twelve villains’ recognizable cover identities. `cast-1.webp` maps five remaining heroes, two civilians and two distinct swarm satellites (3×3); `cast-2.webp` maps the first six faction henchmen (3×2); `cast-3.webp` maps the other five faction henchmen and Digger (3×2). All sheets use the new hero sheet as the style reference. No character relies on the old painterly atlas in the isometric view.

The camera computes its bounds from the projected perimeter instead of using a fixed empty 14×8 frame. It reserves modest headroom for upright sprites and offers rotation in 15-degree steps, from −60 to +30 degrees, with a default of −15 degrees and a Fit view reset. Ground, clickable hex shapes, unit depth, facing arrows, serpent body and effect positions share this projection. Hero artwork stays upright and facing screen-left as the ground rotates. Camera preferences are session-only and do not change saves or rules.

Open `isometric-sprites.html` to inspect all 37 current sprites at a readable size, grouped into heroes, villains, henchmen/swarm bodies and civilians. The gallery uses the same sprite mapping as the battlefield and never loads campaign saves.
