# Equipment sprites — first art pass

All 181 equipment IDs have a mapped, distinct SVG icon. This pass uses 45 silhouette families, 17 motifs, discipline material palettes, boss-set accent colors, and item-specific forms for ambiguous objects. Examples include rocket exhausts, spring boots, a satellite uplink dish, Shadowpaw claws, Warding Tome armor, and distinct consumable containers.

The art is deliberately simple enough for small controls. Related items retain shared visual construction; this is a first full-catalog pass, not a claim that every item has a completely unrelated silhouette.

## Review

Open `equipment-gallery.html`, or choose **Browse equipment gallery** in the Workshop. Search by item or boss name, filter by discipline/slot/set, and select a card to compare 24, 32, 48 and 96 pixel rendering. The gallery runs independently of campaign state and does not load or save a campaign.

Icons also appear in crafting/gear cards, equipped slots, armory equip buttons, and combat equipment choices. Text labels and action/move/free cost symbols remain present. SVGs are decorative and cannot intercept pointer events.

## Assets and authoring

- `tools/build-equipment-icons.cjs`: source silhouettes, explicit item mappings, motifs, palettes and special constructions.
- `equipment-icons.js`: generated inline symbol bank and `equipmentIcon(id, size)` renderer; one bank per page and no per-item image requests.
- `equipment-icons.css`: shared layout sizing.
- `assets/equipment/equipment.svg`: reusable SVG symbol sprite, with IDs `equipment-<gear-key>`.
- `assets/equipment/manifest.json`: complete mapping, silhouette/motif metadata and 96 × 96 viewBox specification.

Regenerate with `node tools/build-equipment-icons.cjs`. A missing or mistyped gear mapping fails generation. Do not edit generated assets directly. Unknown IDs render an empty string, preserving the surrounding label.

## Verification

`node tests/equipment-icons.cjs` checks exact catalog coverage, distinct artwork, valid sprite geometry, all 181 rendered references, phone/desktop layouts, search/filtering, keyboard dialog closing/focus, and workshop/combat integration. Existing combat-menu, responsive-layout and tutorial tests cover interaction regressions. Gameplay definitions are unchanged.
