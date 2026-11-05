# Harbor headquarters construction

Open **Build HQ** beside Operations and Roster. The grounds occupy the upper page panel below the banners on a fixed 3:1 canvas. Small screens pan the grounds horizontally; facility choices and selected artwork stack below.

All 17 FAC keys have transparent hand-inked building sprites in `assets/headquarters/facilities-1.webp` through `facilities-3.webp`. Identity, materials and distinct silhouettes follow the approved comic style: variable brush contours, economical hatching, brick/ivory/teal/ochre colors and one bounded cel-shadow tone. The observatory retains a short Cassegrain reflector in a fork mount on a permanent pier.

## Projection, depth and grounds

Every sprite uses a near-frontal parallel architectural projection: upright verticals, horizontal front edges, shallow roof depth and parallel receding edges. Buildings do not turn toward a vanishing point at the center of the sheet or map. This permits placing them on either side of the panorama.

The compact island has 112m illustrative frontage, versus its original 160m. `HQ_SCALE` calibrates each new art cell against an upright architectural feature. `HQ_SITE_POINTS` supplies individually authored foot positions. `hqDistanceScale(y)` then reduces all dimensions together from 100% in the foreground to 72% on the rear terrace. The hangar, clinic, forensic lab and power plant occupy the back; the smaller training, dojo, disposal and signal facilities frame the front. Reference sizes remain illustrative rather than surveyed dimensions.

The backdrop has shared working courts, a winding service lane, small docks and edge planting. Sites stay inboard of the seawall, with salvage by the docks and the hangar's loading approach clear. `docs/hq-scale-plan.svg` shows full sprite cell bounds, including transparent margins.

## Workshop expansion

Workshop is guaranteed at campaign start. It displays its standalone sprite until Skunkworks is selected or built. The joined state uses **one complete drawing**, `workshop-complex.webp`, containing the warehouse, engineering wing and their continuous masonry, foundation, flashing and roof junctions. There is no separate connector overlay. The rejected `workshop-annex.webp` asset is removed.

Selecting an unbuilt Skunkworks previews the entire complex in amber and shows the same complete drawing in the detail panel. Construction makes it solid. Two independent facility selection targets remain over the drawing; the drawing itself does not intercept clicks. Legacy saves lacking Workshop use standalone Skunkworks art. Facility effects, costs, blueprints, unlocks and save fields remain owned by FAC and `S.facilities`.

## Art generation

Generated with the built-in image tool and packed as WebP with alpha preserved. The integrated complex prompt specified a modest two-bay sawtooth warehouse on the left, compact red-brick/ivory engineering wing on the right, a recessed joining wing built into both volumes, continuous wall and roof junctions, clear loading access and a near-frontal parallel projection. Each of the three atlas prompts used its prior atlas for identity and the joined complex for projection/style; equal 3×2 cells, bases near 88% height, one complete building per cell and a transparent background. The last atlas contains five facilities and one empty cell.

The shared lighthouse masthead remains separate from the grounds and keeps live resource chips. Combat uses its compact header.

## Validation

`node tests/headquarters.cjs` covers navigation, selection, costs, duplicate and unlock guards, saves, sprite mappings, distance scaling, joined previews and standalone/legacy states. `tests/layout-smoke.cjs` loads the complete complex and all 17 facilities at phone and desktop widths, checks canvas containment and independent targets, and captures the built campus. `node tests/comic-ui.cjs` covers surrounding page structure.
