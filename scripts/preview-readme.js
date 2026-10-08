/**
 * Shows README.md the way the GitHub profile page will. The GitHub Markdown API renders it
 * with the same sanitizer the profile uses (it strips style attributes, so what you see here
 * is what ships). Screenshots light + dark at desktop and phone width into .preview/.
 * Needs `gh` signed in. Run: `npm run preview`.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.preview');
const THEMES = { light: '#ffffff', dark: '#0d1117' };
// ~830px is the README column on a desktop profile page; 390px is a phone.
const WIDTHS = { desktop: 880, mobile: 390 };

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

function page(body, theme, width) {
    return `<!doctype html><html><head><meta charset="utf-8">
<base href="${pathToFileURL(ROOT).href}/">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown-${theme}.css">
<style>
body { margin: 0; background: ${THEMES[theme]}; }
.markdown-body { box-sizing: border-box; max-width: ${width}px; margin: 0 auto; padding: ${width > 500 ? 24 : 16}px; }
</style></head><body><article class="markdown-body">${body}</article></body></html>`;
}

async function main() {
    const body = execFileSync('gh', [
        'api', '-X', 'POST', 'markdown',
        '-F', `text=@${path.join(ROOT, 'README.md')}`,
        '-f', 'mode=gfm',
        '-f', 'context=rjlsoftware/rjlsoftware'
    ], { encoding: 'utf8' });
    fs.mkdirSync(OUT, { recursive: true });

    const browser = await chromium.launch();
    try {
        for (const theme of Object.keys(THEMES)) {
            for (const [name, width] of Object.entries(WIDTHS)) {
                const html = path.join(OUT, `${theme}-${name}.html`);
                const png = path.join(OUT, `${theme}-${name}.png`);
                fs.writeFileSync(html, page(body, theme, width));
                const tab = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });
                await tab.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
                await tab.screenshot({ path: png, fullPage: true });
                await tab.close();
                console.log(`${green('✅')} ${path.relative(ROOT, png)}`);
            }
        }
    } finally {
        await browser.close();
    }
}

main().catch((err) => {
    console.error(`${red('❌')} ${err.message}`);
    process.exit(1);
});
