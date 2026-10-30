/* Deterministic, editable equipment artwork. Run: node tools/build-equipment-icons.cjs
   Silhouettes communicate item form; motifs communicate fiction. No gameplay data is changed. */
const fs=require('node:fs'),path=require('node:path'),bh=require('./bh');
const root=path.resolve(__dirname,'..'),game=bh.load({html:root});
const gear=game.get('JSON.parse(JSON.stringify(GEAR))');
const groups={
 visor:'visor surveyor cmdvisor lensvisor',goggles:'goggles blastgog',monocle:'monocle runelens',earpiece:'earpiece',
 helmet:'helm ferrohelm',mask:'mask nmask bloodhound ouromask senses compeyes',crown:'diadem crown circlet refractor crest',headband:'headband',hood:'hood',
 armor:'suit buttress graft vest exo scalemail chitin padvest mirrorplate fusion hide corona dynamo',cloak:'cloak faraday mantle shed shroud robes martyr',heart:'titan apex',
 boots:'boots wyrm greaves shadowpaw magboots umbrastep springboots vaultjets gravboots quakelegs stilts trailrun moonslip dawnstride coilstride blastjump',sandals:'sandals',wings:'wings swings',
 gauntlet:'gaunt jackhammer hexfist railglove prismgaunt meteor flaregaunt deflector piledriver',bracer:'bracer stinger wraps',claw:'claws talon',rings:'rings knuckles',
 blade:'fangs blades runeblade soulreaver spellblade sigilblade plasmacut',staff:'staff starfall oracle lance',wand:'wand condbaton baton',whip:'whip',hammer:'maul quakehammer boneclub quarrypick',
 book:'grimoire wardtome mirrortome journal debtledger',shield:'polar riotshield kinbuckler bonebuckler quillguard ironbark sanctaegis faradaybuck bedrock carapace',
 drone:'familiar uplink',halo:'halo',charm:'charm sigil totem coin moonshade c_charm',gem:'bloodstone stone focuscrystal',core:'paragon cell arccore font loadcell lodeorb',
 radio:'scanner wiretap hivelink scramblepad aegisgen deadswitch',kit:'medkit',harness:'harness',belt:'grapbelt bandolier trophy champ rebarbelt magbuckle detcord teslabelt hivegirdle ironhide utilrig',
 sash:'sash nightcord prismcord starsash',bag:'satchel fusebando',lantern:'censer veillantern sunlantern',pendant:'serpeye sunamulet owlpend locket',
 bottle:'mutagen serum pheromone c_salts c_vial',syringe:'c_stim c_adren',grenade:'c_smoke c_flash c_frag c_chaff',battery:'c_batt',gun:'shotgun arcpistol railspike',hooks:'hooks'
};
const family={};for(const [f,keys] of Object.entries(groups))for(const k of keys.split(' ')){if(family[k])throw Error('Duplicate '+k);family[k]=f}
for(const k of Object.keys(gear))if(!family[k])throw Error('Unmapped equipment '+k);
for(const k of Object.keys(family))if(!gear[k])throw Error('Unknown equipment '+k);
const motifs={
 bolt:'visor suit earpiece gaunt boots uplink bracer charm exo helm faraday staff cell fusion lance cmdvisor arccore c_batt teslabelt faradaybuck baton arcpistol dynamo plasmacut',
 stone:'graft wraps crest serum titan greaves jackhammer quakelegs stilts quarrypick bedrock quakehammer loadcell piledriver stone',
 eye:'monocle runelens scanner mask goggles surveyor senses bloodhound compeyes lensvisor hivelink',
 rune:'rings grimoire hexfist crown sash journal wardtome runeblade spellblade sigilblade prismcord starsash',
 sun:'wings diadem halo corona flaregaunt sunamulet sunlantern dawnstride',
 moon:'shadowpaw shroud blades nmask umbrastep moonslip moonshade nightcord hood',
 snake:'wyrm scalemail fangs whip shed serpeye coilstride ouromask',
 magnet:'magboots railglove polar ferrohelm magbuckle lodeorb railspike gravboots',
 wing:'chitin stinger swings hivegirdle pheromone carapace familiar',
 fuse:'padvest fusebando blastgog springboots detcord deadswitch blastjump c_frag c_flash c_chaff c_smoke',
 prism:'mirrorplate prismgaunt vaultjets focuscrystal refractor mirrortome',
 paw:'vest mantle hide claws talon trophy owlpend trailrun',
 heart:'apex bloodstone medkit locket c_stim c_adren c_salts martyr',
 star:'paragon coin font robes circlet starfall oracle wand sigil totem sanctaegis c_charm c_vial',
 gear:'harness grapbelt wiretap bandolier rebarbelt utilrig scramblepad aegisgen deflector riotshield kinbuckler shotgun',
 bone:'maul boneclub bonebuckler quillguard ironbark ironhide champ knuckles headband satchel hooks',
 smoke:'censer veillantern debtledger condbaton sandals mutagen'
};const motif={};for(const [f,ks]of Object.entries(motifs))for(const k of ks.split(' '))motif[k]=f;
const palette={tech:['#416985','#97b9c6','#55e6ff'],innate:['#845240','#d7a273','#ffb75f'],magic:['#665078','#b29ac9','#e5baff']};
const sets={gallows:'#58f0bc',quarry:'#e2a16b',cantor:'#dcb85c',architect:'#ffa65b',helios:'#ffe66a',serpent:'#9ade7a',lode:'#89c9ef',noct:'#c2a3ff',swarm:'#d2ed6c',bomber:'#ff8663',grid:'#81f5f4'};
const p=(d,fill='var(--metal)',extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const line=d=>p(d,'none');
const circle=(x,y,r,fill='var(--glow)')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const rect=(x,y,w,h,r=3,fill='var(--metal)')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
const motifsSvg={
 bolt:p('M2-11-7 2h6l-3 10L9-3H2Z','var(--glow)'),stone:p('M-10-5-3-11 8-7 11 4 2 11-9 6Z','var(--glow)')+line('M-3-11 1-2-4 3 2 11'),
 eye:p('M-12 0Q0-13 12 0Q0 13-12 0Z','var(--light)')+circle(0,0,4),rune:line('M0-11V11M0-10 8-4 0 2-8-4ZM0 3 7 8M0 3-7 8'),
 sun:circle(0,0,6)+line('M0-13V-10M0 10V13M-13 0H-10M10 0H13M-9-9-7-7M7 7 9 9M-9 9-7 7M7-7 9-9'),
 moon:p('M5-11A12 12 0 1 0 10 8A11 11 0 0 1 5-11Z','var(--glow)'),snake:p('M-8 8Q9 15 7 3Q5-3-3-2Q-11-1-6-7Q-2-12 7-8','none')+p('M5-12 12-7 5-3Z','var(--glow)'),
 magnet:p('M-10-10H-4V3Q0 10 4 3V-10H10V3Q0 20-10 3Z','var(--glow)')+line('M-10-4H-4M4-4H10'),
 wing:p('M0 8Q-18-14-11-12Q0-8 0 3Q0-8 11-12Q18-14 0 8Z','var(--glow)')+line('M0-5V11'),
 fuse:circle(0,3,8,'var(--light)')+line('M0-5Q-4-13 5-11M7-14 9-17M9-10 14-11')+rect(-4,-6,8,3,1),
 prism:p('M0-12 11 5 0 12-11 5Z','var(--glow)')+line('M0-12V12M-11 5H11'),paw:p('M-8 7Q-8 0 0-3Q8 0 8 7Q0 13-8 7Z','var(--glow)')+circle(-9,-5,3)+circle(-3,-10,3)+circle(4,-10,3)+circle(10,-4,3),
 heart:p('M0 11C-22-4-7-16 0-7C7-16 22-4 0 11Z','var(--glow)'),star:p('M0-12 4-4 12 0 4 4 0 12-4 4-12 0-4-4Z','var(--glow)'),
 gear:p('M-5-11H5V-7L10-5 13-1 9 4 7 10 1 9-5 12-9 6-12 1-8-5Z','var(--light)')+circle(0,0,4),
 bone:line('M-7-7 7 7M-7 7 7-7')+circle(-8,-8,3,'var(--light)')+circle(8,8,3,'var(--light)')+circle(-8,8,3,'var(--light)')+circle(8,-8,3,'var(--light)'),
 smoke:p('M-10 8Q-13 0-4-1Q-12-11-2-12Q3-18 7-10Q16-7 8 0Q18 8 7 11Z','var(--light)')
};
const shapes={
 visor:()=>p('M15 31 25 24H72L82 35 75 52 22 55 12 45Z')+p('M21 34 73 32 69 44 25 46Z','var(--glow)')+line('M47 33 43 45M20 56V65M75 53V62'),
 goggles:()=>line('M9 35H87')+rect(14,30,29,27,8)+rect(53,30,29,27,8)+circle(28,43,9)+circle(68,43,9)+line('M43 40H53M18 63H78'),
 monocle:()=>circle(46,40,23)+circle(46,40,16,'var(--dark)')+line('M62 59Q83 68 67 82Q59 87 54 79')+line('M36 31 42 25M36 41 49 28'),
 earpiece:()=>p('M59 17Q23 12 25 48L33 67H43L39 46Q35 28 55 30Z')+rect(25,37,18,29,7)+line('M39 60Q46 78 68 70')+rect(64,66,14,8,4,'var(--glow)'),
 helmet:()=>p('M22 60V35Q24 13 48 13Q73 13 75 35V60L61 77H35Z')+p('M24 36H73L66 50H31Z','var(--glow)')+p('M37 56H59L65 68H31Z','var(--dark)')+line('M48 15V30M23 57 12 48M74 57 84 48'),
 mask:()=>p('M20 22 47 29 76 20 71 61 48 80 25 61Z')+p('M28 38 43 43 31 49ZM68 38 53 43 65 49Z','var(--glow)')+line('M48 46 42 60H54M38 68H58'),
 crown:()=>p('M17 30 31 43 36 19 48 34 62 17 67 42 81 28 73 66H25Z','var(--metal)')+p('M26 56H72V67H26Z','var(--light)')+circle(48,49,6)+circle(35,20,3)+circle(62,17,3),
 headband:()=>p('M14 34Q48 22 81 34V54Q48 43 14 54Z')+p('M19 51 12 79 32 69 28 51Z')+line('M33 34V47M65 32V46'),
 hood:()=>p('M12 78 23 32 49 12 75 34 85 78 63 84H32Z')+p('M32 37 48 26 64 38 63 65 49 76 32 64Z','var(--dark)')+p('M35 48 43 52 35 55ZM61 48 53 52 61 55Z','var(--glow)'),
 armor:()=>p('M17 23 33 17 40 26H56L63 17 80 24 75 47 65 51 69 79 49 86 27 79 30 51 19 47Z')+p('M33 30 48 37 63 30 60 64 48 72 35 64Z','var(--light)')+line('M21 31 30 34M66 35 76 31M31 72H64M48 38V69'),
 cloak:()=>p('M33 19Q48 10 63 19L67 32 83 81 61 75 49 85 34 76 13 81 29 32Z')+p('M33 19 48 33 63 19 58 40H38Z','var(--light)')+line('M38 42 29 72M58 42 69 71M48 45V75'),
 heart:()=>p('M43 27 39 13 51 11 55 25 64 18 72 25 62 35Q88 50 62 74L46 85 28 69Q10 47 28 29Z','var(--metal)')+line('M46 37 38 52 49 61 46 77M48 52 65 47')+rect(31,35,30,12,3,'var(--light)'),
 boots:()=>p('M26 18H48L45 55 57 65V78H17V65L25 57Z','var(--dark)')+p('M47 18H70L66 57 82 66V79H40V66L46 57Z')+p('M49 25H68L65 43H48Z','var(--light)')+line('M43 72H79M20 71H36M48 49H66'),
 sandals:()=>p('M28 18Q43 14 43 29L39 70Q25 86 19 69L22 31Z','var(--light)')+p('M61 17Q77 18 73 34L68 73Q53 88 49 69L54 29Z','var(--light)')+line('M23 31 41 48M21 49 40 32M54 33 72 50M51 52 72 33'),
 wings:()=>p('M45 46 30 24 11 17 17 43 29 63 42 71ZM51 46 66 24 85 17 79 43 67 63 54 71Z','var(--light)')+line('M19 29 41 57M22 46 41 64M77 29 55 57M74 46 55 64')+rect(41,34,14,42,5),
 gauntlet:()=>p('M31 79 24 56 15 43 23 34 33 42 31 21 41 18 45 34 45 16 55 16 57 34 60 20 69 24 67 42 75 33 82 40 72 60 69 79Z')+p('M30 61H70V80H30Z','var(--light)')+line('M34 49 42 43 59 43 67 50M40 64V76M59 64V76'),
 bracer:()=>p('M23 26 57 17 78 66 45 81Z')+p('M27 34 61 25 65 36 32 46ZM39 62 71 53 75 65 44 76Z','var(--light)')+line('M27 26 46 73'),
 claw:()=>p('M21 60 37 43 64 45 76 63 66 80 37 83Z')+p('M31 53 20 16 30 25 43 49ZM45 47 44 9 54 24 55 48ZM61 50 72 13 74 30 70 58Z','var(--light)'),
 rings:()=>circle(27,42,15,'var(--metal)')+circle(65,42,15,'var(--metal)')+circle(46,66,14,'var(--metal)')+circle(27,42,8,'var(--dark)')+circle(65,42,8,'var(--dark)')+circle(46,66,7,'var(--dark)'),
 blade:()=>p('M29 71 66 14 78 11 78 27 40 78Z','var(--light)')+p('M23 59 50 76 45 83 19 65Z')+p('M25 70 34 77 25 90 15 84Z','var(--dark)')+line('M72 20 37 69'),
 staff:()=>p('M25 86 19 82 64 14 70 18Z','var(--light)')+p('M53 20 50 11 61 7 77 11 84 23 75 34 60 32Z')+circle(68,21,8)+line('M29 64 37 70M34 56 42 62'),
 wand:()=>p('M26 82 20 78 62 28 68 33Z','var(--light)')+p('M55 18 75 12 83 33 63 40Z')+line('M18 18 25 25M40 9V18M80 55H88'),
 whip:()=>p('M27 81 19 75 38 52 45 59Z','var(--light)')+p('M40 54Q75 75 79 48Q85 15 56 17Q34 18 49 33Q61 44 66 28','none'),
 hammer:()=>p('M24 85 18 80 58 25 65 30Z','var(--light)')+p('M34 20 47 7 83 34 73 52Z')+line('M45 17 76 42M56 16 46 32'),
 book:()=>p('M21 18 67 13 78 23V77L31 84 19 75Z','var(--light)')+p('M20 18 65 13 68 68 22 76Z')+line('M29 20 31 71M27 78 70 72M70 22 76 24'),
 shield:()=>p('M48 13 78 25 75 57Q67 77 48 86Q29 77 21 57L18 25Z')+p('M48 23 68 31 65 55Q59 68 48 76Q37 68 31 55L28 31Z','var(--light)')+line('M48 24V75'),
 drone:()=>line('M32 37 19 25M64 37 77 25M32 61 19 73M64 61 77 73')+rect(26,32,44,34,10)+[ [18,23],[78,23],[18,74],[78,74]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="13" ry="5" fill="var(--light)"/>`).join('')+circle(48,48,11),
 halo:()=>`<ellipse cx="48" cy="28" rx="31" ry="12" fill="none" stroke="var(--glow)" stroke-width="7"/>`+p('M31 43 48 36 65 43 59 72H37Z')+line('M35 43 25 31M61 43 71 31M42 79H54'),
 charm:()=>circle(48,52,25,'var(--light)')+circle(48,52,18,'var(--metal)')+circle(48,19,7,'none')+line('M41 15 28 9M55 15 69 9'),
 gem:()=>p('M29 17H64L82 40 49 83 14 40Z','var(--glow)')+p('M29 17 37 40 49 83 62 40 64 17Z','var(--light)')+line('M14 40H82M37 40 47 17 62 40'),
 core:()=>p('M28 19H67L80 40V66L64 80H30L16 64V39Z')+circle(48,48,23,'var(--dark)')+circle(48,48,16)+line('M27 26 33 32M67 25 62 31M25 69 32 63M69 69 63 63'),
 radio:()=>rect(24,26,48,53,6)+line('M31 27 26 9M65 27V16')+rect(31,34,34,18,2,'var(--glow)')+line('M32 61H49M32 67H49')+circle(61,65,5,'var(--light)'),
 kit:()=>rect(14,32,68,44,8)+p('M34 31V20H62V31','none')+p('M41 41H55V48H62V62H55V69H41V62H34V48H41Z','var(--glow)')+line('M21 40V67M75 40V67'),
 harness:()=>p('M25 15H38L43 42H54L59 15H72L64 80H50L47 62 43 80H28Z')+line('M29 23 64 67M67 23 34 67')+rect(36,42,26,19,3,'var(--light)'),
 belt:()=>p('M12 35Q48 46 84 35V62Q48 71 12 62Z')+rect(36,34,25,35,4,'var(--light)')+rect(18,40,11,20,2)+rect(68,40,11,20,2),
 sash:()=>p('M22 16 39 12 72 71 54 83Z')+p('M49 56 74 49 82 66 59 74Z','var(--light)')+line('M31 24 57 71M59 77 58 88M66 74 70 85'),
 bag:()=>p('M26 32 30 15H62L72 30','none')+p('M18 32H76L81 74 69 82H25L14 72Z')+p('M17 32H77L69 53H25Z','var(--light)')+rect(43,44,12,20,2),
 lantern:()=>circle(48,18,9,'none')+p('M28 31H68L73 72 48 83 23 72Z')+p('M32 40H64L61 67 48 74 35 67Z','var(--glow)')+line('M48 33V78M24 71H72'),
 pendant:()=>p('M22 12Q48 60 74 12','none')+p('M48 37 68 56 48 83 28 56Z','var(--light)')+circle(48,56,10),
 bottle:()=>p('M37 12H59V29L71 40V73Q48 85 25 73V40L37 29Z','var(--light)')+p('M29 49Q48 55 67 49V70Q48 79 29 70Z','var(--glow)')+rect(35,12,26,12,2)+line('M33 38V46'),
 syringe:()=>p('M27 69 59 25 73 36 41 80Z','var(--light)')+p('M34 63 57 33 65 39 43 69Z','var(--glow)')+line('M28 76 15 91M57 16 82 34M69 26 77 15M70 11 84 22M39 53 46 58'),
 grenade:()=>p('M31 32H65L75 47 70 73 48 84 26 73 21 47Z')+rect(36,19,23,14,3,'var(--light)')+line('M55 20 70 17 79 46M30 45H66M27 59H72M40 34V76M55 34V76'),
 battery:()=>rect(25,21,46,62,6)+rect(38,12,20,9,2,'var(--light)')+rect(32,31,32,40,3,'var(--glow)')+line('M39 79H57'),
 gun:()=>p('M13 33 77 22 85 31 80 45 48 50 36 76 20 73 29 47 14 49Z')+p('M20 33 73 26 75 34 23 43Z','var(--light)')+line('M49 48 52 60 43 65M30 56 37 58'),
 hooks:()=>p('M26 16V58Q8 49 15 71Q33 88 39 64V18M64 16V58Q82 49 75 71Q57 88 51 64V18','none')+rect(19,13,24,12,3)+rect(47,13,24,12,3)
};
// Item-specific construction replaces generic forms where the fiction calls for it.
const bespoke={
 uplink:()=>p('M25 23Q39 61 77 49Z','var(--light)')+line('M48 46 61 24M60 25 65 17')+circle(65,17,4)+p('M41 55H53V75H68V82H27V75H41Z'),
 totem:()=>p('M33 14H63L69 77 48 86 27 77Z')+p('M29 26 48 33 67 26 64 44 48 50 32 44Z','var(--light)')+line('M33 62H63M37 70H59')+circle(39,38,3)+circle(57,38,3),
 c_charm:()=>p('M34 17 63 21 68 73 46 84 28 71Z','var(--light)')+line('M35 18 30 8M61 20 70 10M35 28H60'),
 cell:()=>rect(29,17,38,64,7)+rect(36,10,24,8,2,'var(--light)')+p('M30 31H66V63H30Z','var(--glow)')+line('M35 73H61'),
 senses:()=>p('M19 26 32 39H65L77 26 72 59 48 73 24 59Z')+p('M26 42H42L35 55ZM70 42H54L61 55Z','var(--glow)')+line('M13 14 24 21M83 14 72 21M8 43H16M80 43H88'),
 boneclub:()=>p('M24 83 19 78 49 38Q38 28 48 21Q44 9 56 12Q62 4 69 16Q84 13 81 27Q89 38 73 41L35 85Z','var(--light)')+line('M55 26 66 31M30 66 39 72'),
 quillguard:()=>p('M23 33 14 16 37 28 45 9 54 28 79 17 70 36 88 47 71 58 72 75 55 71 47 87 37 71 20 77 24 57 8 47Z','var(--light)')+circle(48,49,24)+circle(48,49,15,'var(--dark)'),
 ironbark:()=>p('M22 22 44 15 74 25 70 64 48 85 25 63Z','var(--metal)')+line('M34 24 30 56 42 75M52 22 45 36 56 55 50 77M64 30 59 42 66 55')+p('M34 39Q9 15 14 40Q16 54 34 49','var(--light)'),
 kinbuckler:()=>circle(48,48,33)+circle(48,48,23,'var(--light)')+circle(48,48,13)+line('M48 15V25M48 71V81M15 48H25M71 48H81'),
 moonslip:()=>p('M27 42 44 44 38 64Q55 66 51 78H14V69Z')+p('M56 39 73 42 66 64Q85 66 82 78H43V68Z','var(--light)')+line('M23 56 38 61M52 55 67 60'),
 aegisgen:()=>rect(27,34,41,42,6)+circle(48,48,14)+p('M15 31Q48 5 82 31M20 22Q48 1 76 22','none')+line('M32 77 24 85M63 77 71 85'),
 censer:()=>line('M48 10 28 48M48 10 68 48')+p('M22 49H74L63 72 48 80 33 72Z')+p('M30 43 48 32 66 43Z','var(--light)')+line('M45 28Q32 18 44 14M56 30Q68 18 57 12'),
 c_smoke:()=>[[-12,8],[14,8],[0,-14]].map(([x,y])=>`<g transform="translate(${x} ${y})">${circle(48,49,15)}${line('M42 44 48 41')}</g>`).join('')+p('M25 22Q10 9 25 7M76 36Q89 22 78 13','none'),
 c_flash:()=>rect(31,25,34,52,5)+line('M35 38H60M35 49H60M35 60H60')+rect(36,17,22,10,2,'var(--light)')+p('M48 5V10M18 20 25 25M78 20 71 25','none'),
 c_chaff:()=>p('M25 34 61 23 76 68 39 80Z')+rect(34,15,23,14,2,'var(--light)')+line('M19 23 13 14M74 26 85 17M78 45H89M10 43H20'),
 shadowpaw:()=>shapes.boots()+p('M39 73 34 84 46 80 49 72M59 74 56 86 68 80 71 74','var(--light)')+p('M16 21Q6 41 15 58M9 26Q2 42 9 51','none'),
 boots:()=>shapes.boots()+p('M19 80 27 92 33 80M49 81 56 94 64 81','var(--glow)')+rect(11,33,12,26,3,'var(--light)'),
 springboots:()=>shapes.boots()+line('M43 28 67 32 45 37 66 42 45 47 66 52'),
 stilts:()=>p('M23 12H42V42H35V85H23V41H16V31H23ZM56 12H75V42H68V85H56V41H49V31H56Z')+line('M19 54H39M19 68H39M52 54H72M52 68H72'),
 wyrm:()=>shapes.boots()+p('M47 23 54 30 61 23 68 30M47 35 54 42 61 35 67 42M47 47 54 54 61 47 66 54','none'),
 riotshield:()=>p('M24 16H71L78 26V76L66 85H29L18 75V27Z')+rect(28,25,39,22,3,'var(--glow)')+line('M28 64H67M29 72H66'),
 grimoire:()=>shapes.book()+p('M16 30 10 24 13 44 20 48M68 31 81 21 77 46 69 49','var(--light)'),
 journal:()=>shapes.book()+p('M51 17 58 16 61 78 54 83Z','var(--glow)')+line('M22 29H28M23 41H29M24 54H30'),
 wardtome:()=>shapes.book()+p('M54 31 72 36 69 55 57 65 45 55 43 38Z','var(--light)'),
 vest:()=>shapes.armor()+line('M20 43 33 46M63 46 75 43M30 57H38M58 57H67'),
 fusion:()=>shapes.armor()+circle(48,51,20,'var(--dark)')+circle(48,51,14,'var(--glow)'),
 dynamo:()=>shapes.armor()+rect(13,26,13,38,4,'var(--light)')+rect(70,26,13,38,4,'var(--light)')+line('M15 35H24M15 46H24M72 35H81M72 46H81'),
 quakelegs:()=>shapes.boots()+rect(39,64,45,17,2,'var(--light)')+line('M45 68V78M55 68V78M66 68V78M76 68V78'),
 talon:()=>shapes.claw()+p('M23 63 14 48 19 73 30 76Z','var(--glow)'),
 spellblade:()=>shapes.blade()+circle(33,67,9,'var(--glow)'),
 sigilblade:()=>shapes.blade()+line('M59 30 67 35M51 41 59 46M44 52 52 57'),
 oracle:()=>shapes.staff()+p('M53 21Q68 2 83 21Q68 40 53 21Z','var(--light)')+circle(68,21,6),
 grapbelt:()=>shapes.belt()+line('M26 44V64Q13 74 15 59')+circle(70,53,9,'var(--dark)'),
 bandolier:()=>shapes.belt()+rect(10,32,17,37,3,'var(--light)')+rect(69,32,17,37,3,'var(--light)'),
 scramblepad:()=>shapes.radio()+line('M18 37 10 43 18 49M78 37 86 43 78 49'),
 champ:()=>shapes.belt()+p('M28 44 35 30 47 35 61 30 68 44 65 60 48 73 30 60Z','var(--light)'),
 starsash:()=>shapes.sash()+circle(36,34,3)+circle(42,45,3)+circle(59,68,3)+line('M37 37 41 42'),
 c_adren:()=>shapes.syringe()+rect(11,13,22,18,2,'var(--glow)')+line('M16 22H28M22 17V27')
};

const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const metadata=[],symbols=[];let total=0;
for(const [k,g]of Object.entries(gear)){
 const f=family[k],m=motif[k]||'star',[metal,light,glow]=palette[g.type],accent=sets[g.set]||glow;
 const motifPos=['blade','staff','wand','hammer','syringe','whip'].includes(f)?[76,70,.58]:['boots','sandals'].includes(f)?[58,36,.5]:['visor','goggles','earpiece','monocle'].includes(f)?[48,70,.58]:['belt','sash'].includes(f)?[48,51,.65]:['crown','headband'].includes(f)?[48,48,.5]:[48,51,.72];
 const [x,y,scale]=motifPos;
 const art=`<g style="--metal:${metal};--light:${light};--glow:${accent};--dark:#202732" stroke="#151b25" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="48" cy="85" rx="29" ry="5" fill="#111923" opacity=".18" stroke="none"/><g>${(bespoke[k]||shapes[f])()}</g><g transform="translate(${x} ${y}) scale(${scale})" stroke-width="2.7">${motifsSvg[m]}</g></g>`;
 symbols.push(`<symbol id="equipment-${k}" viewBox="0 0 96 96">${art}</symbol>`);
 metadata.push({id:k,name:g.name,slot:g.slot,discipline:g.type,set:g.set||null,rank:g.req||0,family:f,motif:m});total+=art.length;
}
const bank=`<svg xmlns="http://www.w3.org/2000/svg" id="equipment-sprite-bank" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${symbols.join('')}</svg>`;
fs.mkdirSync(path.join(root,'assets/equipment'),{recursive:true});
fs.writeFileSync(path.join(root,'assets/equipment/equipment.svg'),`<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>\n`);
fs.writeFileSync(path.join(root,'assets/equipment/manifest.json'),JSON.stringify({version:1,size:96,items:metadata},null,2)+'\n');
fs.writeFileSync(path.join(root,'equipment-icons.js'),`/* Generated by tools/build-equipment-icons.cjs. Artwork and item mapping are editable there. */\nconst EQUIPMENT_ICONS=${JSON.stringify(metadata)};\nconst EQUIPMENT_ICON_IDS=new Set(EQUIPMENT_ICONS.map(g=>g.id));\nif(typeof document!=='undefined'&&document.currentScript&&!document.getElementById('equipment-sprite-bank'))document.currentScript.insertAdjacentHTML('beforebegin',${JSON.stringify(bank)});\nfunction equipmentIcon(k,size=48){if(!EQUIPMENT_ICON_IDS.has(k))return '';return '<svg class="equipment-icon" data-equipment="'+k+'" width="'+size+'" height="'+size+'" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><use href="#equipment-'+k+'"></use></svg>';}\n`);
console.log(`Built ${metadata.length} equipment sprites across ${Object.keys(groups).length} silhouettes (${Math.round(total/1024)} KiB artwork).`);
