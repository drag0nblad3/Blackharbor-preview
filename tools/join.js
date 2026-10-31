#!/usr/bin/env node
// Join the game at the repo root back into one self-contained .html (for a claude.ai artifact, an archive copy, or a
// before/after sim with --html). The game files stay the source: never edit the joined file.
//   node tools/join.js [out.html]        default: ./blackharbor-joined.html (git-ignored)
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');
const OUT = path.resolve(process.argv[2] || 'blackharbor-joined.html');
const read = f => fs.readFileSync(path.join(DIR, f), 'utf8');
let page = read('index.html').replace(/^<meta charset="utf-8">\n/, '');
page = page.replace(/<link rel="stylesheet" href="([\w-]+\.css)">/g, (m, f) => '<style>\n' + read(f).replace(/\n?$/, '\n') + '</style>');
// The sprite goes back in as plain SVG so the sim tools, which run every inline script, never see it.
page = page.replace('<script src="src/art/sprite.js"></script>', () => read('src/art/sprite.js').match(/`([\s\S]*)`/)[1]);
page = page.replace(/<script src="([\w\/-]+\.js)"><\/script>/g, (m, f) => '<script>\n' + read(f).replace(/\n?$/, '\n') + '</script>');
fs.writeFileSync(OUT, page);
console.log(Buffer.byteLength(page), 'bytes ->', OUT);
