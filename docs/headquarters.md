# Harbor headquarters construction

Open **Build HQ** beside Operations and Roster. The grounds occupy the upper page panel below the banners, preserving the authored 3:1 panorama. Small screens pan the grounds horizontally; facility choices and the selected artwork stack below.

All 17 existing FAC keys have generated ink-drawn sprites, mapped in `src/hq/construction.js`. `HQ_SITES` supplies individual positions and sizes along the organic campus backdrop. Facilities appear from the existing `S.facilities` save field; selecting an unbuilt facility previews its proposed location. Build costs, blueprints, and effects still come from FAC. The old operations page links here, including the beginner guide.

The shared masthead uses the lighthouse BLACKHARBOR artwork from concept A; resource chips and campaign information remain live text. Combat keeps its compact header.

Art direction: the approved workshop, L-shaped clinic, and slender mast concept sheet. Expressive variable-weight brush lines, economical structural detail, flat brick/ivory/teal/ochre colors, and one clearly bounded shadow tone. Believable working structures have distinct ground plans and silhouettes: sprawling low sheds, narrow towers, courtyards, hooked wings, service arrays, and utility yards. Grounds: an irregular waterfront peninsula, winding paths, retaining walls, greenery, and open clearings, with no regular grid. The approved architecture sheet is the visual reference for both the facilities and the grounds. Site positions are authored individually; widths follow the shared architectural scale. The interference station remains inland. Generated atlas files retain transparency and are compressed to WebP. The final atlas contains five facility sprites and one empty cell.

Validation: `node tests/headquarters.cjs`, `node tests/comic-ui.cjs`, `node tests/investigation-ui.cjs`, `node tests/story.cjs`; browser checks cover selecting, paying for construction, built sprites, all-facility visibility, reload persistence, and a 390px viewport.

## Shared scale and authored site plan

`HQ_SCALE` anchors each 512px art cell to an upright feature: ordinary doors are approximately 2.1m; workshop/loading openings and equipment use their own plausible heights. The 22m mast is scaled by its overall height. `hqScaledWidth()` converts all references into the same 160m visual frontage. These are illustrative calibration anchors, not surveyed engineering dimensions. `HQ_SITES` then places those scaled cells around the authored plan in `hq-scale-plan.svg`.

The grounds canvas keeps a 3:1 aspect ratio so the background and sprites resize together. Narrow screens pan horizontally. The plan reserves loading courts, a hangar apron, medical footpaths, salvage access, a quiet observatory clearing, and an extended lower-right cape for the communications mast.

The observatory contains a short, large-aperture reflecting telescope held in a fork/yoke mount on a permanent pier, replacing the portable tripod instrument. Observatory mount/pier reference: [ESO telescope structure](https://www.eso.org/sci/facilities/paranal/telescopes/ut.html).
