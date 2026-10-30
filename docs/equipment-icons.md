# Painted equipment icons

All 181 equipment IDs map to individual approved painted artwork. Low-tier equipment has practical materials; higher tiers use more elaborate construction and effects. Gameplay data and save IDs are unchanged. The Field Utility Belt artwork represents `detcord` (Det Cord Belt).

## Assets

`assets/equipment/manifest.json` is the authoritative mapping, with source titles, original SHA-256 hashes and available Library identifiers. Each item has a 128px thumbnail and a 512px detail WebP under `assets/equipment/painted/`. Artwork retains its full square composition without cropping. The original SVG sprite is retained as an archive but is no longer loaded by the game.

`equipment-icons.js` renders decorative image elements through the existing `equipmentIcon(id, size)` function. Small controls use thumbnails; larger cards and the gallery use detail images. Images load lazily with explicit dimensions and asynchronous decoding. Visible item labels and action cost symbols remain accessible.

The Workshop links to `equipment-gallery.html`: search, filter, and inspect every item at several sizes. The same artwork appears in crafting cards, equipped slots, armory buttons, and combat equipment choices.

Run `node tools/build-equipment-icons.cjs` after updating the manifest to rebuild the renderer. Run `node tests/equipment-icons.cjs` to check catalog coverage, unique sources, image decoding, gallery navigation, and game integration at phone and desktop widths.
