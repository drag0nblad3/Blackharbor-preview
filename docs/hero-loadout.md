# Hero equipment dossier

Open Roster and expand a hero. The paper doll uses all eight existing equipment slots and the installed painted equipment thumbnails. Select a slot to view its current item and matching armory equipment. Selecting an armory item only inspects it; Equip applies the swap. The detail panel shows full existing bonuses, abilities, requirements and displaced items. Consumable pouches and set bonuses remain below the doll. Equipment remains locked outside HQ/prepared investigations.

The two accessories honor the explicitly selected slot. Two-handed weapons display in both hands, but are stored and counted once. Removing the off-hand representation removes the main-hand item correctly. The guided tutorial retains its existing single-step equip picker and action targets.

Files: hero-loadout.js, hero-loadout.css, assets/hero-loadout/mannequin.webp. The illustration is a shared symbolic mannequin, not a portrait or a depiction of the equipped items. The interactive controls are HTML; no UI text is embedded in the picture.

Artwork: built-in image generation, then resized to 512×768 WebP. Brief: gender-neutral, featureless, geometric jointed paper mannequin; flat charcoal/slate comic ink shapes on parchment; no defined anatomy, costume, labels or scenery. The full prompt emphasized a readable equipment body diagram at small sizes.

Checks: node tests/hero-loadout.cjs, node tests/comic-ui.cjs, node tests/mechanics-rework.cjs, node tests/gameplay-text.cjs. Browser inspection was unavailable in the authoring session because the browser approval service reported a usage limit. The existing preview gate retains its browser regression suites.
