'use strict';

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: 'tests',
    reporter: 'list',
    projects: [{ name: 'chromium', use: { browserName: 'chromium' } }]
});
