import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';

test('GitHub Pages opens the same local app without cloud configuration', async () => {
    const site = await readFile(new URL('../dist/site/index.html', import.meta.url), 'utf8');
    const offline = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
    assert.equal(site, offline);
    assert.doesNotMatch(site, /supabase|api\.github\.com|Continue with GitHub|id="account-button"|id="github-backup-button"|site-config\.json/i);
    assert.match(site, /Saved on this device/);
    assert.deepEqual((await readdir(new URL('../dist/site/', import.meta.url))).sort(), ['.nojekyll', 'downloads', 'index.html']);
});

test('GitHub ZIP has standalone sources and a secret-free Pages workflow without cloud files', async () => {
    const files = unzipSync(await readFile(new URL('../dist/SQL-Preparation-GitHub.zip', import.meta.url)));
    const root = 'SQL-Preparation-GitHub/';
    for (const required of ['package.json', 'package-lock.json', '.github/workflows/deploy-pages.yml', 'GITHUB-SETUP.md', 'app.mjs', 'progress.mjs']) {
        assert.ok(files[root + required], required);
    }
    for (const filename of Object.keys(files)) {
        assert.ok(filename.startsWith(root));
        assert.doesNotMatch(filename, /node_modules|\/dist\/|\.env|appsettings|MM2_ARCHITECTURE|site-config|supabase|cloud-(?:client|config|progress)|github-(?:repository|backup)|auth\.css|database-access/);
    }
    const workflow = strFromU8(files[root + '.github/workflows/deploy-pages.yml']);
    assert.match(workflow, /path: dist\/site/);
    assert.match(workflow, /needs: build/);
    assert.match(workflow, /npm test/);
    assert.doesNotMatch(workflow, /SUPABASE|CLIENT_SECRET|SERVICE_ROLE|vars\./);
    const manifest = JSON.parse(strFromU8(files[root + 'package.json']));
    const lock = JSON.parse(strFromU8(files[root + 'package-lock.json']));
    assert.doesNotMatch(JSON.stringify(manifest.dependencies), /supabase/);
    assert.doesNotMatch(JSON.stringify(manifest.devDependencies), /pglite/);
    assert.doesNotMatch(JSON.stringify(lock.packages), /@supabase|@electric-sql/);
});