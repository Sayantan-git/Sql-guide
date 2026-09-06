import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const root = css.match(/:root\s*\{([^}]+)\}/)[1];
const tokens = Object.fromEntries([...root.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));

function luminance(hex) {
    const channels = [1, 3, 5].map(offset => {
        const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

test('the black theme changes colors without overriding typography or layout', () => {
    assert.match(root, /color-scheme\s*:\s*dark/);
    assert.equal(tokens.ground, '#000000');
    assert.equal(tokens.header, '68px');
    const start = css.indexOf('\n::selection');
    assert.ok(start > 0);
    const allowed = new Set(['color', 'background', 'background-color', 'background-image', 'border-color', 'outline-color', 'box-shadow', 'caret-color', 'scrollbar-color', '--accent', '--wash']);
    for (const rule of css.slice(start).matchAll(/\{([^{}]*)\}/g)) {
        for (const declaration of rule[1].split(';').filter(Boolean)) {
            const property = declaration.slice(0, declaration.indexOf(':')).trim();
            assert.ok(allowed.has(property), `Not a color-only override: ${property}`);
        }
    }
});

test('reading, syntax, and primary-action color tokens meet WCAG AA contrast', () => {
    const pairs = [
        ['ink', 'ground'], ['muted', 'ground'], ['subtle', 'surface'],
        ['ink', 'surface'], ['muted', 'surface'], ['green', 'surface'],
        ['blue', 'code-surface'], ['amber', 'code-surface'], ['coral', 'code-surface'],
        ['code-text', 'code-surface'], ['code-comment', 'code-surface'],
        ['button-ink', 'green'], ['ink', 'deep']
    ];
    for (const [foreground, background] of pairs) {
        const first = luminance(tokens[foreground]);
        const second = luminance(tokens[background]);
        const contrast = (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
        assert.ok(contrast >= 4.5, `${foreground} on ${background}: ${contrast.toFixed(2)}:1`);
    }
});