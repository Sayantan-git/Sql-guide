import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';
import { unzipSync, strFromU8 } from 'fflate';

for (const edition of ['Windows', 'Android']) {
    test(`${edition} archive embeds the app, guide, SQLite engine, notices, and only educational source`, async () => {
        const root = `SQL-Preparation-${edition}/`;
        const files = unzipSync(await readFile(new URL(`../dist/SQL-Preparation-${edition}.zip`, import.meta.url)));
        const html = strFromU8(files[root + 'OPEN-SQL.html']);
        assert.ok(html.includes('window.SQL_STUDIO_ASSETS='));
        assert.ok(html.includes('data:font/woff2;base64,'));
        assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=/i);
        const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
        assert.equal(scripts.length, 2);
        for (const script of scripts) new Script(script[1]);
        assert.ok(strFromU8(files[root + 'README.md']).includes(edition));
        assert.ok(strFromU8(files[root + 'THIRD-PARTY-NOTICES.txt']).includes('sql.js'));
        assert.ok(files[root + 'project/content/comparisons.mjs']);
        const inventory = strFromU8(files[root + 'SHA256SUMS.txt']).trim().split('\n');
        assert.equal(inventory.length, Object.keys(files).length - 1);
        for (const line of inventory) {
            const [expected, name] = line.split('  ');
            assert.equal(createHash('sha256').update(files[root + name]).digest('hex'), expected, name);
        }
        for (const path of Object.keys(files)) {
            assert.ok(path.startsWith(root));
            assert.doesNotMatch(path, /node_modules|appsettings|local\.settings|\.env|MM2_ARCHITECTURE|\.git\//);
        }
    });
}