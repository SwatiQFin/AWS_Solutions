// Builds an Iconify icon pack ("aws") from the official AWS Architecture Icons shipped in the
// aws-icons npm package. Icon names are the lower-cased file names; resource icons are prefixed
// "res-" and group icons "grp-" (e.g. aws:awslambda, aws:res-amazonvpcnatgateway).
const fs = require('fs');
const path = require('path');
const root = path.join(path.dirname(require.resolve('aws-icons/package.json')), 'icons');
const pack = { prefix: 'aws', icons: {} };
const prefixes = { 'architecture-service': '', resource: 'res-', 'architecture-group': 'grp-' };
for (const [dir, prefix] of Object.entries(prefixes)) {
  for (const file of fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(root, dir, file), 'utf8');
    const viewBox = svg.match(/viewBox="([\d.\s-]+)"/);
    if (!viewBox) continue;
    const [, , width, height] = viewBox[1].trim().split(/\s+/).map(Number);
    const body = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[\s\S]*?<\/title>/, '');
    pack.icons[prefix + file.replace('.svg', '').toLowerCase()] = { body, width, height };
  }
}
fs.writeFileSync(path.join(__dirname, 'aws-icon-pack.json'), JSON.stringify(pack));
console.log(`aws-icon-pack.json: ${Object.keys(pack.icons).length} icons`);
