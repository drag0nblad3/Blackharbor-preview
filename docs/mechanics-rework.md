# Charging, reactions, gear and investigation changes

The mechanical rework and the eight replacement boss actions are approved. This document records the implemented rules and the separate, unimplemented character proposals.

## Implemented rules

- The next boss page leaves the draw pile and occupies a charging slot. It remains part of boss health. A previously revealed page shows its full name and rules. Unknown pages remain concealed; signatures retain their shout.
- Each successful wound contributes one damage toward the boss's per-hero-round interruption threshold. Wounds normally tear the draw pile. The wound reaching boss level tears the planned signature instead, without an extra tear. The boss does not immediately replace an interrupted action. Damage counts reset for the next hero round, independently for each boss.
- Existing two-stage area attacks keep their windup and marked hexes. Their page remains in the charging slot through windup, then enters discard after firing. Tearing the charging page cancels the marked attack.
- When only the planned page remains, it becomes woundable to finish the fight, even if it is a signature: the next successful wound tears it (Tyler, 2026-10-30).
- Scry chooses between the planned page and following pages. It cannot replace an already winding-up area attack or restore an action already interrupted this round. Bury can replace a planned page; both preserve card counts and the round's accumulated damage.
- Hexen's Repress costs 2 Arcana, targets the selected boss within 4 and suppresses exactly the next hit reaction revealed. The wound roll proceeds normally. It persists until consumed and cannot stack. Repress also cancels beneficial hit-card effects if that is the next card.
- Warding Tome gives its wearer immunity to damage from hit reactions for the rest of the round. Non-damage effects still happen. This includes reaction-triggered beams, pulses and bomb detonations, but not ordinary attacks or ordinary bomb ticks.
- Boss Blinded effects are now -3 Accuracy. Effects that reduce Evasion are unchanged.
- Each campaign boss gains two optional pages and two unique reactions. At investigation selection, its deck is sampled from the larger available catalog, preserving deck size and the existing upgrade budget. The original reaction-supporting pages remain anchors. Additional pages are sampled without repetition until the catalog is exhausted. Higher-level decks can contain repeated moves. The deck is saved and does not reroll while viewing leads or loading a save.
- Campaign hit decks start with five unique boss reactions and five basic cards: Weak Point, Reinforced, Overextended, Counterstrike and Clean Hit. Page-linked reactions disappear when their last supporting page is torn. Mole Boy retains his tutorial-specific deck.
- Third-lead pools now include villain-specific battlefield-preparation leads. Choose preparation instead of clues, take two clues instead, or spend one Intel for preparation plus one clue. Preparation supplies entry barricades, a clear approach, civilians near the exits, or one fewer regular starting henchman. It never removes an elite.

## Approved replacement boss actions

These replace the repetitive first-pass options. Remaining new pages and reactions are retained.

| Boss | Replacement | Implemented behavior |
| --- | --- | --- |
| Gallows | Closed Circuit | Links the two nearest heroes. Power-costing abilities remove 1 Composure from the other. Separation of 4 hexes breaks it permanently; otherwise expires before the next boss action. |
| Quarry | Tectonic Heave | Marks a three-hex line through the nearest hero. Before the next boss action, displaces occupants to the nearest legal space and raises permanent rubble. Anchored/trapped heroes take 2 damage; occupied hexes remain open. Board edges can clip the line. |
| Cantor | The Collection | Hired guns move up to 2 toward civilians and take custody when adjacent; existing guards instead drag captives toward the edge. Captives remain available for rescue. These guns do not also take a normal henchman turn that round. |
| Architect | Renovation Notice | Marks seven hexes. Before the next action, clears rubble and temporary walls inside; empty perimeter hexes become walls lasting two hero rounds. Occupants and exits leave openings; permanent walls remain. |
| Helios | Solar Debt | Ability activations within 2 build Heat, capped at 4. Before the next action, heroes within 2 take damage equal to Heat; at 3+ Heat one draw-pile page tears. This self-inflicted tear does not interrupt the planned action or increment hero-round damage. |
| Lodestone | Scrap Satellites | Converts rubble within 3 into up to two satellites total. Each absorbs one successful attack wound and drops as adjacent rubble toward the attacker if space permits. An adjacent hero can spend an action through Other Actions to pull one down without a roll. |
| Nocturne | Stolen Shadow | Marks the nearest hero. Their next position change leaves a 1-HP copy at their former hex if unoccupied. Before the next action, Nocturne swaps there if the copy survives and the space fits; the spent copy fades. Destroying the copy prevents the swap. |
| Murmur | Borrowed Bodies | Up to two regular mites replace secondary swarm-body origins for one action. Destroyed carriers remove those origins for that action. The lead body stays; no extra attack instances are added. Physical bodies are restored afterward, including after loading a save made during resolution. |

Delayed setup effects resolve before the boss's next scheduled action, even if that planned page has been interrupted. They are separate from the reserved charging page. Marked terrain, linked heroes, Heat, satellites, and carriers are visible in the battle status; special tokens use purple/green rings and text labels. Existing generic card upgrades do not increase these fixed caps or trigger distances.

## Equipment reworks

Existing resource costs, slots and passive stats are retained except where a new active cost is specified below. Full current definitions are in `data.js`.

| Item | New role |
| --- | --- |
| Warded Cloak | Snapshot +1 Evasion for each hex already walked or jumped this hero round, until round end; teleports and forced movement do not count. |
| Shadowpaw Treads | Swap with another hero within 2 for 1 Arcana. Neither hero spends their move. |
| Polarity Shield | Another hero within 3 gains +3 Evasion this round and is pushed one hex away into a chosen safe empty hex. Costs 2 Power. |
| Warding Tome | Reaction Ward for 1 Arcana. |
| Familiar Drone | Pull another hero one hex toward the wearer and give Reaction Ward; range 3, 2 Power. |
| Rune Lens | Inspect the next hit reaction without consuming it; 1 Arcana. |
| Faraday Coat | Give a hero within 3 Reaction Ward; 2 Arcana. |
| Hexfist Glove | Repress the next reaction and apply -2 Evasion; consumes the Innate activation. |
| Trinity Crown | Reveal the planned action and inspect the next hit reaction; 2 Arcana. |
| Paragon Core | Pull another hero one hex toward the wearer and restore that hero's 2 Composure; range 3, 3 Power. |
| Wyrmhide Boots | Innate leap with range scaling from Innate rank. |
| Kinetic Bracer | Retains its attack buff and also protects against reaction damage that round. |
| Halo Projector | Pull another hero one hex and restore 2 Composure; range 3, 2 Power. |
| Ledger of Debts | Repress the next revealed reaction; 2 Arcana. |
| Mirror Tome | Inspect the next reaction and gain Reaction Ward; 2 Arcana. |
| Lens Visor | Inspect the next reaction and gain +2 Accuracy on the next attack; 2 Power. |
| Sunfire Lantern | Blind for -3 Accuracy and reveal hidden facing. |
| Coil Whip | Turn the boss toward the wearer and repress its next reaction. |
| Rail Gauntlet | Pull another hero up to 2 hexes toward the wearer; range 4, 3 Power. |
| Shed-Skin Cloak | Short teleport plus Reaction Ward. |
| Umbra Step | Teleport and flank bonus retained, with Reaction Ward. |

Ally pushes and pulls require a legal landing space, never spend the recipient's move, cannot select the wearer, and avoid pits, molten floor, active beams and bomb blast areas. Invalid selections spend no resource. Shadow Exchange swaps occupied hero positions and still resolves beam exposure and civilian following.

## Henchman areas

| Item | Center / range | Radius | Damage |
| --- | --- | --- | --- |
| Fusion Core / Power Cell | Wearer | 1 | 3 |
| Tesla Coil Belt / Earthshaker Greaves | Wearer | 2 | 2 |
| Det Cord Belt | Wearer; also breaches adjacent walls | 1 | 2 |
| Fuse Bandolier | Visible chosen hex within 4 | 1 | 1 |
| Frag Grenade | Visible chosen hex within 3 | 1 | 1 |
| Dead Man's Switch | Visible chosen hex within 5 | 1 | 1 |
| Flare Gauntlets | Visible chosen hex within 3 | 0 (one hex) | 2 |

## Character proposals — not implemented

These replace or refine existing effects rather than adding all benefits on top.

| Character / origin | Proposed ability | Limits and tradeoffs |
| --- | --- | --- |
| Born Different | **Second Nature:** once per fight, activate the signature Innate power without spending that round's Innate activation. | Replaces +2 HP. Explicit optional activation so the player chooses when to use it. Does not bypass a once-per-fight power limit or grant another attack/action. |
| Bulwark | **Hold the Line:** Braced adjacent allies cannot be forcibly moved. | Extends Brace's positioning role; does not stop their voluntary moves. |
| Rivet | **Reconfigure:** choose to place a barricade or relocate one of his existing barricades. | Same activation/cost, at most two personal barricades. No placing walls under units or exits. |
| Wisp | **Phase Escort:** Blur permits one escorted civilian to accompany a short wall crossing. | Safe landing for both; no crossing an entire map or teleporting a group. |
| Cipher | **Field Protocol:** choose healing or restore 2 Power to another hero within 3. | Alternate Patch Up mode, not both benefits. No self-refunding loop. |
| Goliath | **Controlled Quake:** choose the direction of one eligible adjacent boss's one-hex shove. | Retains size limits and Gridlock's rooted immunity. |
| Lynx | **Pursuit Mark:** when the marked boss escapes, one ally within 3 may step one safe hex toward it. | Once during Mark Prey's existing attack window; no free attack. |
| Sibyl | **Forewarn:** after revealing a planned action, nominate one ally for a safe one-hex step before that action resolves. | One nominated ally; replaces Omen's team Composure restoration. |
| Custom Tech signature | **Pocket Sentry:** deploy a 1-HP turret that deals 1 damage to one henchman within 2 at round end. | Uses an action and 2 Power; lasts two rounds; one per hero; cannot target bosses or block exits. |
| Custom Innate signature | **Rescue Line:** pull another hero up to two safe hexes toward you. | Range 3; consumes the Innate activation. |
| Custom Magic signature | **Echo Double:** place a weak decoy that can satisfy nearest/farthest targeting for one boss action. | One decoy, one round; no damage; requires clear targeting UI and extra AI testing. |
| Making Up for Something | **Redemption:** restore 2 Composure on the first civilian rescue each fight. | Replaces the flat HP bonus. |

## Validation

Focused tests cover the charging lifecycle, card conservation, interruption timing, visibility, final-page resolution, Repress, reaction wards, movement, blast footprints, randomized decks, preparation effects and save state. Passed: focused mechanics tests; all 22 added boss-page executions; all 11 boss views; balance, Payload, Cantor, boss-selection and gameplay-text checks; phone/desktop mechanics and simulated-battle browser tests; save/load, Avoid Damage and tactical-action browser checks. Two complete campaign smoke runs covered 38 fights with zero stalls. Both finales were lost; this small sample validates execution, not balance. Browser coverage is in `tests/mechanics-browser.cjs`.

Replacement-action validation: dedicated rules tests cover all eight effects, counterplay and persistence; every Murmur page is exercised with borrowed origins. Phone/desktop browser coverage checks setup markers, effect descriptions, save/load, special-token labels and the select/confirm satellite action. Two campaign smoke runs completed 38 fights with no stalls; one finale was won. This is execution coverage, not a balance study.
