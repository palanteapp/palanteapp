#!/usr/bin/env node
/**
 * Patches ios/App/App/capacitor.config.json after `cap sync ios` to re-add
 * app-local Capacitor plugins (not npm packages, so cap sync strips them out).
 *
 * Run via: npm run sync:ios
 * Or call directly: node scripts/patch-capacitor-config.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../ios/App/App/capacitor.config.json');

const LOCAL_PLUGINS = [
    'PalanteHealthBridgePlugin',
    'PalanteAudioBridgePlugin',
    'PalanteWidgetBridgePlugin',
    'PalanteAgeRangeBridgePlugin',
];

try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(raw);

    const existing = config.packageClassList ?? [];
    const merged = [...new Set([...existing, ...LOCAL_PLUGINS])];
    config.packageClassList = merged;

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, '\t'), 'utf8');
    console.log('✓ capacitor.config.json patched with local plugins:', LOCAL_PLUGINS.join(', '));
} catch (err) {
    console.error('✗ patch-capacitor-config failed:', err.message);
    process.exit(1);
}
