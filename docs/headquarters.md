# Harbor headquarters construction

Open **Build HQ** beside Operations and Roster. The grounds occupy the upper page panel below the banners, preserving the authored 3:1 panorama. Small screens pan the grounds horizontally; facility choices and the selected artwork stack below.

All 17 existing FAC keys have generated ink-drawn sprites, mapped in `src/hq/construction.js`. `HQ_SITES` supplies individual positions and sizes along the organic campus backdrop. Facilities appear from the existing `S.facilities` save field; selecting an unbuilt facility previews its proposed location. Build costs, blueprints, and effects still come from FAC. The old operations page links here, including the beginner guide.

The shared masthead uses the lighthouse BLACKHARBOR artwork from concept A; resource chips and campaign information remain live text. Combat keeps its compact header.

Art direction: the approved workshop, L-shaped clinic, and slender mast concept sheet. Expressive variable-weight brush lines, economical structural detail, flat brick/ivory/teal/ochre colors, and one clearly bounded shadow tone. Believable working structures have distinct ground plans and silhouettes: sprawling low sheds, narrow towers, courtyards, hooked wings, service arrays, and utility yards. Grounds: an irregular waterfront peninsula, winding paths, retaining walls, greenery, and open clearings, with no regular grid. The approved architecture sheet is the visual reference for both the facilities and the grounds. Site positions are authored individually; widths follow the shared architectural scale. The interference station remains inland. Generated atlas files retain transparency and are compressed to WebP. The final atlas contains five facility sprites and one empty cell.

Validation: `node tests/headquarters.cjs`, `node tests/comic-ui.cjs`, `node tests/investigation-ui.cjs`, `node tests/story.cjs`; browser checks cover selecting, paying for construction, built sprites, all-facility visibility, reload persistence, and a 390px viewport.

## Shared scale and authored site plan

`HQ_SCALE` anchors each 512px art cell to an upright feature: ordinary doors are approximately 2.1m; workshop/loading openings and equipment use their own plausible heights. The 22m mast is scaled by its overall height. `hqScaledWidth()` converts all references into the same 112m visual frontage. These are illustrative calibration anchors, not surveyed engineering dimensions. `HQ_SITES` then places those scaled cells around the authored plan in `hq-scale-plan.svg`.

The grounds canvas keeps a 3:1 aspect ratio so the background and sprites resize together. Narrow screens pan horizontally. The compact plan shares loading courts and medical access, keeps salvage at the docks, and places the observatory and communications mast along the lower quay.

The observatory contains a short, large-aperture reflecting telescope held in a fork/yoke mount on a permanent pier, replacing the portable tripod instrument. Observatory mount/pier reference: [ESO telescope structure](https://www.eso.org/sci/facilities/paranal/telescopes/ut.html).

## Compact connected harbor

The campus frontage is now 112m instead of 160m: 30% less in each ground dimension, or about 51% less implied area. Buildings therefore fill the island more densely. The warehouse-like Workshop uses a 3.3m loading opening (27% smaller than its earlier 4.5m reference); the Sky Hangar opening is 5m instead of 6m (17% smaller). Other architectural reference sizes are preserved.

A new ink-drawn backdrop replaces large ornamental lawns and broad roads with shared working courts, a narrow service lane, and edge planting. Four covered passages join Workshop–Skunkworks, Forensics–Med Bay, Med Bay–Antivenom, and Training–Dojo. Each passage appears only when both endpoint facilities are built. The links are decorative and do not affect facility costs, effects, unlocks, or saves. All 17 facilities keep separate selection targets.

Grounds artwork prompt: edit the existing island into a compact working harbor with roughly half the land area for unchanged human scale, contiguous unadorned buildable courts, one narrow lane, two small docks, minimal edge planting, the existing upper-left HQ and distant skyline; preserve the original 3:1 ink and cel-shaded palette. Generated with the built-in image tool; production asset: `assets/headquarters/grounds.webp`.
