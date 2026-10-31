/* Rebuild the painted icon renderer from the authoritative artwork manifest. */
const fs=require('node:fs'),path=require('node:path'),bh=require('./bh');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/equipment/manifest.json')));
const game=bh.load({html:root}),keys=Array.from(game.get('Object.keys(GEAR)'));
if(keys.length!==manifest.items.length||keys.some(k=>!manifest.items.find(g=>g.id===k)))throw Error('Equipment art mapping does not match GEAR');
for(const g of manifest.items)for(const key of ['thumbnail','image'])if(!fs.existsSync(path.join(root,g[key])))throw Error('Missing artwork: '+g.id);
fs.writeFileSync(path.join(root,'src/art/equipment-icons.js'),'/* Painted equipment artwork. Mapping: assets/equipment/manifest.json. */\nconst EQUIPMENT_ICONS='+JSON.stringify(manifest.items)+';\n'+"const EQUIPMENT_ICON_MAP=new Map(EQUIPMENT_ICONS.map(g=>[g.id,g]));\nfunction equipmentIcon(k,size=48){\n const g=EQUIPMENT_ICON_MAP.get(k);if(!g)return '';\n const n=Number.isFinite(Number(size))?Math.max(1,Math.min(512,Number(size))):48;\n return '<img class=\"equipment-icon\" data-equipment=\"'+g.id+'\" src=\"'+(n>64?g.image:g.thumbnail)+'\" width=\"'+n+'\" height=\"'+n+'\" alt=\"\" aria-hidden=\"true\" decoding=\"async\" loading=\"lazy\">';\n}\n");
console.log('Built '+manifest.items.length+' painted equipment mappings.');
