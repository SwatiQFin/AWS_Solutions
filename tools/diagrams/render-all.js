// Renders every <solution>/architecture.mmd to architecture.png using headless Chrome.
// Set CHROME_PATH to use a system browser instead of Puppeteer's bundled one.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const repo = path.resolve(__dirname, '..', '..');
const pack = JSON.parse(fs.readFileSync(path.join(__dirname, 'aws-icon-pack.json'), 'utf8'));
const mermaidJs = require.resolve('mermaid/dist/mermaid.min.js');
const config = {
  startOnLoad: false,
  theme: 'default',
  flowchart: { htmlLabels: true, curve: 'basis', nodeSpacing: 45, rankSpacing: 60, padding: 12 },
  themeVariables: {
    fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '14px', clusterBkg: '#ffffff', clusterBorder: '#232F3E',
    lineColor: '#545B64', mainBkg: '#ffffff', tertiaryColor: '#ffffff', labelBackground: '#ffffff', edgeLabelBackground: '#ffffff',
  },
  themeCSS: '.cluster-label { font-weight: bold; }',
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
  const dirs = fs.readdirSync(repo).filter((d) => fs.existsSync(path.join(repo, d, 'architecture.mmd')));
  for (const dir of dirs) {
    const src = fs.readFileSync(path.join(repo, dir, 'architecture.mmd'), 'utf8');
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
    await page.setContent('<html><body style="margin:0;background:#fff"><div id="c"></div></body></html>');
    await page.addScriptTag({ path: mermaidJs });
    const error = await page.evaluate(async (src, pack, config) => {
      try {
        mermaid.registerIconPacks([{ name: 'aws', icons: pack }]);
        mermaid.initialize(config);
        document.getElementById('c').innerHTML = (await mermaid.render('d', src)).svg;
        return null;
      } catch (e) { return String((e && e.message) || e); }
    }, src, pack, config);
    if (error) throw new Error(`${dir}: ${error}`);
    const svg = await page.$('#c svg');
    const box = await svg.boundingBox();
    await page.setViewport({ width: Math.ceil(box.width) + 40, height: Math.ceil(box.height) + 40, deviceScaleFactor: 2 });
    await (await page.$('#c svg')).screenshot({ path: path.join(repo, dir, 'architecture.png') });
    console.log(`rendered ${dir}/architecture.png`);
    await page.close();
  }
  await browser.close();
})();
