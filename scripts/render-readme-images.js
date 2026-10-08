/**
 * Renders every image the profile README uses. Run by hand: `npm run images`, which then
 * runs RJ's Compress-PNG.ps1 over assets/. Tests never call this.
 *
 *   assets/header.png        <- scripts/readme-images/header.html (1280x400 CSS px at 1.5x)
 *   assets/cards/<slug>.png  <- each source OG image in scripts/readme-images/cards.json,
 *                               fitted to the 1200x630 aspect with rounded, transparent corners
 *
 * Sources stay in C:\WebSites. Re-run after any site's OG image changes. Pass slugs (or
 * "header") to render only those, e.g. `node scripts/render-readme-images.js header rjl-ai`,
 * then `npm run compress`.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const HERE = path.join(__dirname, 'readme-images');
const OUT = path.join(ROOT, 'assets');
const ASPECT = 1200 / 630;
const HEADER = { width: 1280, height: 400, scale: 1.5 };

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

function dataUri(file) {
    return `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
}

function describe(file) {
    const b = fs.readFileSync(file);
    return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}, ${Math.round(b.length / 1024)} KB`;
}

// The ::after ring keeps light cards (rjl.bio, techdebt.guru) from melting into GitHub's
// white theme and reads as a soft edge on the dark theme.
function cardHtml(src, width, height) {
    const radius = Math.round(width * 0.018);
    const ring = Math.max(1, Math.round(width / 500));
    return `<!doctype html><html><head><meta charset="utf-8"><style>
html, body { margin: 0; background: transparent; }
.card { position: relative; width: ${width}px; height: ${height}px; border-radius: ${radius}px; overflow: hidden; }
.card img { display: block; width: 100%; height: 100%; object-fit: cover; }
.card::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 ${ring}px rgba(127, 127, 127, 0.28); }
</style></head><body><div class="card"><img src="${dataUri(src)}" alt=""></div></body></html>`;
}

async function shoot(browser, html, width, height, scale, out) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => null)));
    });
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width, height }, omitBackground: true, type: 'png' });
    await page.close();
    console.log(`${green('\u2705')} ${path.relative(ROOT, out)} ${dim(describe(out))}`);
}

async function main() {
    const only = process.argv.slice(2);
    const all = JSON.parse(fs.readFileSync(path.join(HERE, 'cards.json'), 'utf8')).cards;
    const unknown = only.filter((s) => s !== 'header' && !all.some((c) => c.slug === s));
    if (unknown.length) throw new Error(`unknown slug(s): ${unknown.join(', ')}`);
    const withHeader = !only.length || only.includes('header');
    const cards = only.length ? all.filter((c) => only.includes(c.slug)) : all;
    const missing = cards.filter((c) => !fs.existsSync(c.src));
    if (missing.length) throw new Error(`missing source images:\n  ${missing.map((c) => c.src).join('\n  ')}`);
    fs.mkdirSync(path.join(OUT, 'cards'), { recursive: true });

    console.log(`\u{1F5BC}\uFE0F  Rendering ${withHeader ? 'header + ' : ''}${cards.length} card(s)`);
    const browser = await chromium.launch();
    try {
        if (withHeader) {
            const header = fs.readFileSync(path.join(HERE, 'header.html'), 'utf8')
                .replace(/__PHOTO__/g, () => dataUri(path.join(HERE, 'rj.png')));
            await shoot(browser, header, HEADER.width, HEADER.height, HEADER.scale, path.join(OUT, 'header.png'));
        }

        for (const c of cards) {
            const height = Math.round(c.width / ASPECT);
            await shoot(browser, cardHtml(c.src, c.width, height), c.width, height, 1, path.join(OUT, 'cards', `${c.slug}.png`));
        }
    } finally {
        await browser.close();
    }
}

main().catch((err) => {
    console.error(`${red('\u274C')} ${err.message}`);
    process.exit(1);
});
