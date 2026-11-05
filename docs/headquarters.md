# Approved compact harbor

Build HQ now uses the approved dense science-fiction and magic harbor, including its permanent lighthouse. The scene fits narrow screens at its authored 1896:830 aspect ratio without a minimum-width panning canvas. Desktop uses the illustrated facility list beside the selected preview. Phones use a full-width native facility picker, large preview, and stacked build controls. Selection never pays for construction.

The completed base uses `harbor-complete.webp`, the coordinated approved illustration with all 17 facilities. Incomplete bases use the matching `harbor-ground.webp` plus the built facility modules in the three transparent atlases. `HQ_SITES` anchors each module to its authored terrace or permanent HQ roof socket. Workshop and Skunkworks use one continuous `workshop-complex.webp` when both exist, with a proposed-state preview when Skunkworks is selected. Art crops and silhouette masks keep atlas padding out of the scene. Costs, blueprint gates, facility effects and `S.facilities` saves remain unchanged.

The permanent command HQ, lighthouse and docks are scenery, not extra facilities. The counter and picker contain exactly the existing 17 FAC keys.

## Day and night

The daytime artwork contains an unlit lighthouse with dark glass and no beam. Its light is a separate SVG overlay. Day hides both lantern and beam. Night tints the grounds and enables the steady golden light. Auto uses the browser's local clock: day is 07:00–18:59, night is 19:00–06:59. Players can explicitly select Day or Night. The view updates while open and refreshes when the tab becomes visible.

Lighting and animation preferences are saved separately from campaign state, under `blackharbor-harbor-lighting` and `blackharbor-harbor-motion`. They survive reloads and new campaigns without changing the existing save key or migrations.

## Optional animation

`src/hq/harbor-motion.js` and `css/headquarters-motion.css` contain all movement. Small authored SVG overlays add a circulating reactor spark, moving rune strokes, sequenced lights, a fabrication-window scan and moving water streaks. Non-scaling strokes stay visible at phone resolution, and the effects begin moving immediately rather than waiting through long quiet intervals. Facilities without another effect receive short, asynchronous window or indicator flickers; the permanent HQ windows flicker too. Buildings with custom effects do not get duplicate flickers. Night's beam drifts gently. Unbuilt facilities have no effects. Motion pauses offscreen and in hidden tabs, and follows `prefers-reduced-motion`. The Animations button remembers Off. Reduced-motion devices show a disabled Off · system control.

To remove animation entirely, remove the two motion-file tags from the game entry pages (or disable the CSS file). The construction renderer and render hook guard every optional motion call. Static buildings, facility selection, build rules, day/night controls and steady night lighting remain functional. No movement is embedded in the artwork or gameplay logic.

## Validation

`tests/headquarters.cjs` checks saved construction, costs, unlocks, art coverage, partial/completed scenes, local-clock boundaries, preference validation, motion state and reduced motion. `tests/layout-smoke.cjs` checks desktop and phone fit, the phone picker, live lighting changes, motion-off, reload persistence and system reduced motion, and captures screenshots. `tests/harbor-motion-phone.cjs` additionally checks 320px and 390px portrait plus phone landscape, compares rendered pixels at two animation times, checks a running animation clock, and records a short 390px phone clip. The PR harbor review workflow runs these before preview is merged; the main preview gate retains its complete campaign and browser checks.

## Art production

Generated with the built-in image tool using the approved lighthouse mobile screen as the visual reference. Prompts preserved its complete compact harbor composition, sci-fi fabrication/science wings, magical western terraces, permanent Art Deco HQ, Cassegrain roof telescope, and hand-inked cel shading. A clean daytime master removes only the lighthouse light. Matching empty grounds remove optional facilities. Three 3×2 transparent atlases supply the seventeen modules, and one complete transparent fabrication drawing supplies the joined Workshop/Skunkworks state. Files are packed as WebP with alpha preserved.
