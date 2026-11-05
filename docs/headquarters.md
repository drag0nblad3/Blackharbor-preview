# Harbor headquarters construction

Open **Build HQ** beside Operations and Roster. The grounds occupy about one third of the viewport below the banners. Small screens pan the grounds horizontally; facility choices and the selected artwork stack below.

All 17 existing FAC keys have generated ink-drawn sprites, mapped in `src/hq/construction.js`. `HQ_SITES` supplies individual positions and sizes along the organic campus backdrop. Facilities appear from the existing `S.facilities` save field; selecting an unbuilt facility previews its proposed location. Build costs, blueprints, and effects still come from FAC. The old operations page links here, including the beginner guide.

The shared masthead uses the lighthouse BLACKHARBOR artwork from concept A; resource chips and campaign information remain live text. Combat keeps its compact header.

Art direction: the approved workshop, L-shaped clinic, and slender mast concept sheet. Expressive variable-weight brush lines, economical structural detail, flat brick/ivory/teal/ochre colors, and one clearly bounded shadow tone. Believable working structures have distinct ground plans and silhouettes: sprawling low sheds, narrow towers, courtyards, hooked wings, service arrays, and utility yards. Grounds: an irregular waterfront peninsula, winding paths, retaining walls, greenery, and open clearings, with no regular grid. The approved architecture sheet is the visual reference for both the facilities and the grounds. Sprite positions and widths are authored individually, including moving the interference station inland. Generated atlas files retain transparency and are compressed to WebP. The final atlas contains five facility sprites and one empty cell.

Validation: `node tests/headquarters.cjs`, `node tests/comic-ui.cjs`, `node tests/investigation-ui.cjs`, `node tests/story.cjs`; browser checks cover selecting, paying for construction, built sprites, all-facility visibility, reload persistence, and a 390px viewport.
