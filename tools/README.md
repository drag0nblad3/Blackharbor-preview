# Blackharbor tools (start here)

Shared headless tooling for the game at the repo root, added 2026-10-26 and moved into the repo on 2026-10-28. Run it from the repo root (`node tools/q.js ...`). It reads the game files directly every time, so it always matches the checkout you are on (a branch, or `main` = the live build). There is nothing to copy or rebuild. Use it instead of reading whole game files or writing new one-off harnesses.

Since Version 127 the data tables (GEAR, VILLAINS, SETS and the unlock lists) hold their final values where they are declared; the old patch blocks were folded in. Edit them in place. The pre-fold build is kept in the Claude project files at `/mnt/project-files/blackharbor/notes/blackharbor-pre-v127.html` for before/after comparisons.

## Ask about the data: `q.js`

```
node tools/q.js gear                 # every item, one line each (~20 KB for 181 items)
node tools/q.js gear 'magic.*arc3'   # regex over the line: key | name | slot/hand | reqs | cost | mods [ability] | set | unlock
node tools/q.js gear wings --txt     # add the in-game ability text
node tools/q.js villain              # one line per villain; `villain gallows` for stats and every card
node tools/q.js sets | fac | heroes | powers
node tools/q.js 'stat'               # source of the live function (any JS expression works)
node tools/q.js 'GEAR.wings.mods'    # compact JSON
node tools/q.js outline [regex]      # top-level functions/consts and "Version N" comments, as file:line (e.g. data.js:33)
node tools/q.js where SET_N          # script lines mentioning a word, cut to 160 chars (long lines run to 2,000)
node tools/q.js dump                 # full post-patch data to tools/cache/data.json (~66 KB)
```
Add `--patch 'GEAR.wings.mods.eva=1'` or `--sub 'const SET_N=4;=>const SET_N=3;'` to look at a change before making it, and `--html <game folder or old single .html>` to point at another build. Unlock column: start, arc2, mid2 (tier 3 mid Arc 2), arc3, beat:villain.

## Run sims: `sim.js`

```
node tools/sim.js --runs 8 --abil --jobs 4                      # ~150 fights, about 3 s per campaign split across jobs
node tools/sim.js --runs 8 --abil --vs 'GEAR.wings.mods.eva=1'  # A/B on the same seeds
node tools/sim.js --runs 8 --abil --vs-sub 'const SET_N=4;=>const SET_N=3;'
node tools/sim.js --runs 8 --abil --html /mnt/project-files/blackharbor/notes/blackharbor-single-v142.html --vs-html .   # before/after a refactor
```
- Prints one compact table per variant: per Arc point fights, win %, rounds, KOs, HP lost, ability and power uses per fight, villain level, and hero level/acc/str/dice/eva/sets/gear, plus facilities, gear, salvage, tech and intel at the end of each Arc.
- Campaign i uses seed `--seed + i` (default 1), so a run repeats exactly and `--vs` plays the same seeds. Paired runs differ only where the change matters, so you need fewer fights for the same answer.
- `--abil` turns on gear abilities and signature powers. Leave it on for balance questions; the plain bot badly understates the game since V120.
- Each campaign is about 19 fights. The CLI refuses more than 1,000 fights in total (Tyler's budget) unless you pass `--force`.
- Other flags: `--mode collect`, `--env NOINTG=1|CONS=2|ETHB=public`, `--patch file.js|code` (both sides), `--sub 'old=>new'` (both sides), `--out raw.json` (every fight record), `--json` (summary as JSON).
- A `--patch` runs after the game loads and can change objects and reassign functions. It cannot reassign a `const` such as `SET_N`; use `--sub` for that.
- The bot ignores set bonuses when picking gear, so the "sets" column stays near 0.

## Game files (since 2026-10-31: `src/`)

The game is `index.html` plus about 50 scripts under `src/` (data, core, campaign, heroes, investigation, hq, ui, tutorial, battle, art), each 1-35 KB with a one-line header saying what it holds, and styles in `css/` (one file per area). The file map, the button-action registry (`ACT`) and where new features go are in `CLAUDE.md` at the repo root. There is no build step: GitHub Pages serves the files as they are.

- The tools read the `<script src>` tags of `index.html` in order, so a new file only needs its tag. `q.js outline`/`where` print `src/...:line`.
- Scripts are classic scripts sharing one global scope, loaded in page order. Code that runs while the page loads can only use names from earlier files.
- Data tables (`src/data/`) must stay plain literals; tests read them with `require('./tools/bh.js').dataCode()`.
- `index.html` declares UTF-8 itself; without it the scripts load as Latin-1 and text like `·` breaks.
- `join.js` rebuilds one self-contained html (`node tools/join.js out.html`) for an archive copy. Never edit a joined file.
- Before the split (2026-10-31) the code was data.js, game.js, battle.js and art.js at the root; compare against that with `--html <old checkout>`. Archive of the last single-file build: `/mnt/project-files/blackharbor/notes/blackharbor-single-v142.html`.

## Files

- `bh.js`: the loader. `require('./bh').load({seed, env, patches, subs, html})` (html: game folder, default the repo root) gives `{get(expr), run(code), hash}`. Build your own analysis on it instead of copying stubs.
- `bot.js`: the one campaign bot (sim/abil-bot/bot.js plus per-hero Power and Arcana pools). Change bot behaviour here.
- `stub.js`: DOM stand-ins (same as sim/stub.js).

Verified 2026-10-26 on build 905578c732: with the same seed, `sim.js` gives byte-identical fight records to the old `sim/abil-bot` build.sh harness, and `--jobs 2` matches `--jobs 1`.

## Older harnesses (superseded, kept for their results)

In the Claude project files only (`/mnt/project-files/blackharbor/`), not in this repo:
- `sim/` economy bot, `abil-bot/`, `peak-stats/`, `salvage/`, `v121/`, `v124/` (the v124 runs used the bot without abilities).
- `combat-sim/` single-fight lair sims from V69, with its own loader.

## Tests and going live

This repo (Blackharbor-preview) is where every change is made and played first; https://drag0nblad3.github.io/Blackharbor-preview/ deploys from `main` with its own save key. Files are copied to the live repo (drag0nblad3/Blackharbor) only with Tyler's OK, through a release pull request.

- `tests/*.cjs` are the regression suites, run from the repo root with `node tests/<name>.cjs`. The browser ones need Playwright.
- `.github/workflows/preview-gate.yml` runs the fast rules/text suites, one seeded `sim.js` campaign and the browser suites on every push that touches the game. Check it is green before asking Tyler to play a change.
- The balance studies (campaign-strategies, boss-slate, loot-impact, large-campaign-study, villain-matchup, villain-ablation, mobility-loot) keep their own workflows and reports; run them by hand when balance changes.
