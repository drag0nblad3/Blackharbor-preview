# Harbor headquarters construction

Open **Build HQ** beside Operations and Roster. The grounds occupy about one third of the viewport below the banners. Small screens pan the grounds horizontally; facility choices and the selected artwork stack below.

All 17 existing FAC keys have generated cel-shaded sprites, mapped in `src/hq/construction.js`. `HQ_SITES` supplies individual positions and sizes along the organic campus backdrop. Facilities appear from the existing `S.facilities` save field; selecting an unbuilt facility previews its proposed location. Build costs, blueprints, and effects still come from FAC. The old operations page links here, including the beginner guide.

The shared masthead uses the lighthouse BLACKHARBOR artwork from concept A; resource chips and campaign information remain live text. Combat keeps its compact header.

Art direction: thick black contour ink, two-value hard cel shadows, bright flat superhero colors, angular highlights, and varied architectural silhouettes. Grounds: an irregular waterfront peninsula, winding paths, retaining walls, greenery, and open clearings, with no regular grid. Building sprites use the combat heroes as the style reference. Generated atlas files retain transparency and are compressed to WebP. The unused sixth sprite in the final atlas is decorative and has no gameplay effect.

Validation: `node tests/headquarters.cjs`, `node tests/comic-ui.cjs`, `node tests/investigation-ui.cjs`, `node tests/story.cjs`; browser checks cover selecting, paying for construction, built sprites, all-facility visibility, reload persistence, and a 390px viewport.
