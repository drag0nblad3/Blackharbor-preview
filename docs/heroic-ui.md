# Superhero UI surfaces

Adds `css/heroic-ui.css` after the existing style layers in the main game and isometric battle lab. The layer uses the superhero sprites’ ink-blue, ivory, gold and cyan palette for the page background, masthead, panel frames, navigation, cards and battle controls. It replaces decorative tape, offset red shadows and busy blueprint fills with simpler ink frames and a generated paper surface. The battlefield, sprite gallery, targeting shapes, action dispatch and save data retain their existing implementation.

`assets/ui/heroic-paper.webp` is a 640×640 optimized surface generated from this brief: seamless warm ivory comic-book stock, fine paper fibers and light stipple, uniform low contrast, no text, stains, folds, frames or objects. The same small image repeats behind paper panels and multiplies into dark header surfaces.

`ui-style-lab.html` presents the actual HQ, roster, villain and battle screens in a save-isolated review session. It never calls load and replaces save with a no-op. It also includes a Screen selector for quick comparison.

Validation: existing comic-ui, investigation-ui, hero-loadout and isometric checks; desktop browser review of HQ, roster and battle; 390px frame fit check (375px content area with scrollbar, no horizontal overflow); movement highlighting remains interactive. The existing browser layout test now checks the new paper surface and ink shadow instead of the replaced red-shadow/blueprint treatment. No new gameplay or balance changes.


Battle frame correction: the board now takes the main desktop column with a single
compact control rail, rather than being pinched between two rails. Mobile keeps
board, actions, villain details in that order. Warm stock and oxblood registration
replace the blue dotted surfaces. Review labs load the cover viewer and game menu
dependencies used by the main game; battle playbooks can open, turn pages and close.
The layout smoke test exercises those lab playbooks at desktop and phone sizes.
