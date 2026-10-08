// Guards for the profile README: every image it shows exists, is light enough for the profile
// page, has alt text, and (for cards) links somewhere. Pure file checks - no browser, no network.
'use strict';

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const README = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const { cards } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'readme-images', 'cards.json'), 'utf8'));

const IMG_TAGS = [...README.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1];
const localSrcs = IMG_TAGS.map((t) => attr(t, 'src')).filter((s) => s && !/^https?:/.test(s));
const pngSize = (file) => {
    const b = fs.readFileSync(file);
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), kb: b.length / 1024 };
};

// Budgets after Compress-PNG.ps1. The header and the full-width card are the big ones.
const MAX_KB = { 'assets/header.png': 600, 'assets/cards/rjl-pub.png': 500, card: 350 };

test('README is plain ASCII', () => {
    const bad = [...README].filter((ch) => ch.charCodeAt(0) > 127);
    expect(bad, `non-ASCII characters: ${[...new Set(bad)].join(' ')}`).toEqual([]);
});

test('every image has alt text', () => {
    const missing = IMG_TAGS.filter((t) => !(attr(t, 'alt') || '').trim());
    expect(missing).toEqual([]);
});

test('external images come only from img.shields.io', () => {
    const external = IMG_TAGS.map((t) => attr(t, 'src')).filter((s) => /^https?:/.test(s));
    expect(external.length).toBeGreaterThan(0);
    for (const src of external) expect(new URL(src).host).toBe('img.shields.io');
});

test('every local image exists and stays under its size budget', () => {
    expect(localSrcs.length).toBeGreaterThan(0);
    for (const src of localSrcs) {
        const file = path.join(ROOT, src);
        expect(fs.existsSync(file), `${src} is missing - run npm run images`).toBe(true);
        const { kb } = pngSize(file);
        const budget = MAX_KB[src] || MAX_KB.card;
        expect(kb, `${src} is ${Math.round(kb)} KB (budget ${budget} KB) - run npm run compress`).toBeLessThanOrEqual(budget);
    }
});

test('every card is wrapped in an https link', () => {
    const cardTags = IMG_TAGS.filter((t) => (attr(t, 'src') || '').startsWith('assets/cards/'));
    const linked = [...README.matchAll(/<a href="https:\/\/[^"]+"><img src="(assets\/cards\/[^"]+)"/g)].map((m) => m[1]);
    expect(linked.sort()).toEqual(cardTags.map((t) => attr(t, 'src')).sort());
});

test('cards.json and README agree, and each card has its rendered size', () => {
    const used = localSrcs.filter((s) => s.startsWith('assets/cards/')).map((s) => path.basename(s, '.png'));
    expect(used.sort()).toEqual(cards.map((c) => c.slug).sort());
    for (const c of cards) {
        const { width, height } = pngSize(path.join(ROOT, 'assets', 'cards', `${c.slug}.png`));
        expect(width, c.slug).toBe(c.width);
        expect(height, c.slug).toBe(Math.round(c.width / (1200 / 630)));
    }
});

test('grid rows use matching widths', () => {
    const widths = new Set(IMG_TAGS.filter((t) => (attr(t, 'src') || '').startsWith('assets/')).map((t) => attr(t, 'width')));
    expect([...widths].sort()).toEqual(['100%', '32%', '49%']);
});
