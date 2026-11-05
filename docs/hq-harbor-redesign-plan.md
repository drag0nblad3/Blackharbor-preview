# Dense technology-and-magic harbor — review proposal

Status: approved for implementation after the compact mobile mockup and lighthouse addition. See headquarters.md for the implemented behavior and removable animation layer.

## Finished screen and art direction

The review screen is a complete desktop Build HQ composition, retaining the lighthouse masthead, navigation, real 17-facility menu and selected-facility information. The campus is planned as a fully occupied base before any empty or partial-build state is exported. Replace the spread-out industrial park with compact architectural groups: armored ivory/teal fabrication shells, faceted research wings, a contained energy ring, magical stonework, a rune arch and a small holographic training court. Keep expressive ink, economical hatching and bounded cel shading. Use brick and corrugated metal sparingly.

Use one near-frontal parallel camera, shared lighting, calibrated doors, common foundation lines and three coherent depth bands. Larger research and flight facilities occupy the rear terrace. Foreground facilities remain visually prominent. Roof silhouettes and sightlines are evaluated in the complete assembled view, alongside the top-down footprint guide.

## Authored groups and complete build positions

Coordinates below are approximate planning units on a 100×60 site. They describe ground footprints rather than final screen pixels. Roof fixtures use a permanent HQ anchor. The SVG and PNG show these placements and the intended service routes.

| Facility | Planned position / footprint | Architecture and connection |
|---|---|---|
| Workshop | Central foreground, (35,34), 16×12 | Compact armored fabrication hall; guaranteed starting anchor |
| Skunkworks | Workshop east flank, (51,38), 9×8 | Raised engineering wing, sharing Workshop walls, foundations and roof junctions |
| Med Bay | Rear science terrace, (52,18), 10×8 | Rounded ivory capsule with medical glazing; nests against Forensics |
| Comms Array | Permanent HQ roof, near (48,16) | Small segmented antenna with an authored roof socket |
| Training Room | West middle terrace, (16,29), 13×10 | U-shaped holotraining court, joined at lower edge to Dojo |
| Press Office | HQ west flank, (31,22), 7×9 | Slim civic Art Deco wing with restrained holographic signage |
| Forensics Lab | Rear science terrace, (62,18), 10×8 | Faceted cyan research wing; shared edges with Med Bay and Antivenom |
| Sky Hangar | Rear east, (73,13), 18×14 | Broad split-shell VTOL canopy; smaller on screen through distance; access faces east quay |
| Arc Reactor | East utility terrace, (83,31), 7×7 | Contained suspended energy ring; separate from the ordnance court |
| Sanctum | Rear west, (17,17), 11×11 | Asymmetric magical stonework, rune arch and small suspended keystone |
| Bunker Protocol | Southeast retaining wall, (79,44), 11×6 | Embedded armored vault; terrain supports the structure |
| Antivenom Lab | Science block lower wing, (62,26), 10×7 | Angled green bio-glass wing, built into the same planned research block |
| Scrap Magnet | Southwest dock, (20,43), 11×8 | Compact gravity-coil gantry feeding the fabrication service court |
| Blackout Dojo | West foreground, (11,39), 9×8 | Low dark sweeping roof and ward details, sharing the training court |
| Bomb Squad Bay | Southeast service court, (65,43), 10×8 | Armored ordnance pods with their own blast court and wall |
| Optics Bench | Permanent HQ roof, near (41,17) | Small telescope pod; Cassegrain reflector on permanent pier/fork mount |
| Hive Jammer | Fixed eastern quay, (89,40), 2×3 | Compact interference fins integrated into the seawall |

The permanent HQ, arrival court and docks are environment elements, not extra buildable facilities. The construction counter and menu remain exactly 17.

## Terrain and connections

The shoreline hugs the fully occupied architectural masses. Preserve a small arrival court, useful service access and narrow pedestrian passages; planting occupies edge strips and tiny pockets. Each rear building needs a visible ground contact. The flight apron, main entrances and docks remain accessible. Eliminate ornamental clearings between individual buildings.

Draw connected groups as complete architectural compositions before exporting states. Workshop has standalone and joined states. Science wings use a common authored footprint and junction design: an absent optional neighbor leaves a believable closed wall, not an unsupported corridor or open shell. Training and Dojo share a planned courtyard. Roof fixtures attach to the guaranteed permanent HQ. Preserve individual facility selection and existing gameplay effects in every construction state.

## Minor animation plan

| Area | Motion | Suggested cadence |
|---|---|---|
| Arc Reactor | Small internal energy pulse and a slow highlight around its contained ring | 7–10 s, low amplitude |
| Sanctum / Dojo | Rune shimmer and a very slight keystone hover | 8–12 s, asynchronous |
| Comms / Hangar | Brief sequenced status lights; occasional short antenna indicator sweep | 5–9 s |
| Workshop / Skunkworks | One small fabrication arm cycle or light inside a window | Occasional 10–15 s activity |
| Harbor | Short masked water highlights and faint reflected light | Gentle 8–12 s loops |
| Training | A short holographic target shimmer | Mainly while selected |

Animate small authored sublayers with opacity, short sprite cycles or tiny local transforms. Keep foundations and whole buildings still. Limit simultaneous prominent effects, pause hidden/offscreen scenes and honor reduced-motion preferences. The review image is static; these motions are planned, not implemented.

## Implementation sequence after review

1. Approve the complete assembled screen, site adjacencies, material mix and scale relationships.
2. Produce the master grounds and coordinated facility/roof layers from that composition. Check the complete build and the starting Workshop state before export.
3. Implement independent facility targets, selected previews and real construction-state variants using existing FAC and save data.
4. Add the small animation layers, then verify partial builds, reloads, phone panning, desktop readability and reduced motion.
5. Show the resulting local screen before any preview deployment, as requested.
