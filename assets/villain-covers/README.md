# Blackharbor — Approved Villain Playbook Covers (12/12)

This ZIP is ready for a ChatGPT Work / GitHub implementation session.
**It contains exactly the 12 user-selected covers as WebP** at native source dimensions
(1024 x 1536, except Architect 724 x 1086), plus 12 lightweight 320 x 480
thumbnail WebPs, `manifest.json`, and `cover-map.json`.

## Where to install

Copy `assets/villain-covers/` into the repository with those relative paths.
These paths are relative to the repo root; `/mnt/data/` is NOT a deployable URL.
The folder names can change only if all references are updated consistently.

## Real villain keys

Verified from `drag0nblad3/Blackharbor` -> `data.js` -> `VILLAINS`:
`gallows`, `quarry`, `cantor`, `architect`, `helios`, `serpent`,
`lode`, `noct`, `swarm`, `bomber`, `grid`, `mole`.

## Implementation requirements

1. Inspect actual source and existing in-game playbook browsing UI. Do not blindly
   paste JSON or assume a specific component architecture.
2. `data.js` currently says it is generated from `Blackharbor.html` by
   `tools/split.js`. Prefer editing the real source and running its build/split
   process rather than hand-editing generated assets only.
3. Add a browseable cover to every corresponding villain playbook (all twelve).
4. Show the complete cover WITHOUT cutting off the masthead, title, or tagline
   (`object-fit: contain`, 2:3 aspect ratio). Provide full-cover view on tap/click.
5. Prefer thumbnails in grid/list views, full-resolution WebPs on full-screen view,
   with lazy-loading as appropriate. Support both mobile and desktop.
6. Retain current game mechanics and playbook text; images are presentation only.
7. Test first on `drag0nblad3/Blackharbor-preview`, then verify and apply to
   `drag0nblad3/Blackharbor` live; report both commit hashes and test results.
8. Keep backup original artwork available separately if needed for later print
   gallery/portrait extraction; don't crop the ONLY full-cover source.

## Known exception

The **approved** red Payload source is the second generated red cover. Its
printed burst reads **EVERYTHING GOES BOOM EVENTUALLY!**, although the original
prompt requested **BOMBS AWAY!**. This is deliberate preservation of the user's
selected image. Don't silently swap or 'fix' that artwork.

## Package verification

There are 12 unique file paths under `assets/villain-covers/*.webp` and
12 under `assets/villain-covers/thumbs/*.webp`. `manifest.json` includes
per-cover SHA-256 hashes and sizes.
