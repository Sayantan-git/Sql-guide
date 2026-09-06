import { build } from 'esbuild';
import { zipSync, strToU8 } from 'fflate';
import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { concepts, modules } from './content/index.mjs';
import { comparisons } from './content/comparisons.mjs';
import { interviews } from './content/interviews.mjs';
import { labExamples, seed } from './content/lab.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
const bundleOptions = { absWorkingDir: root, bundle: true, write: false, minify: true, format: 'iife', platform: 'browser', target: 'chrome110', charset: 'ascii', legalComments: 'inline', metafile: true };
const [main, worker] = await Promise.all([
    build({ ...bundleOptions, entryPoints: ['app.mjs'] }),
    build({ ...bundleOptions, entryPoints: ['worker.mjs'], external: ['fs', 'path', 'crypto'] })
]);

const faces = [];
for (const family of [{ name: 'IBM Plex Sans', path: 'ibm-plex-sans', weights: [400, 500, 600] }, { name: 'Manrope', path: 'manrope', weights: [500, 600, 700] }]) {
    for (const weight of family.weights) {
        const font = await readFile(join(root, 'node_modules', '@fontsource', family.path, 'files', `${family.path}-latin-${weight}-normal.woff2`));
        faces.push(`@font-face{font-family:'${family.name}';font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');}`);
    }
}
const assets = {
    worker: worker.outputFiles[0].text,
    wasm: (await readFile(join(root, 'node_modules/sql.js/dist/sql-wasm.wasm'))).toString('base64')
};
const embed = source => source.replace(/<\/script/gi, '<\\/script');
const serialized = JSON.stringify(assets).replaceAll('<', '\\u003c');
const template = await readFile(join(root, 'index.html'), 'utf8');
const styles = faces.join('\n') + '\n' + await readFile(join(root, 'styles.css'), 'utf8');
const html = template.replace('<!-- STYLES -->', () => `<style>${styles}</style>`).replace('<!-- BUNDLE -->', () => `<script>window.SQL_STUDIO_ASSETS=${serialized};</script>\n<script>${embed(main.outputFiles[0].text)}</script>`);

const packagePaths = new Set();
for (const input of [...Object.keys(main.metafile.inputs), ...Object.keys(worker.metafile.inputs), 'node_modules/@fontsource/ibm-plex-sans/package.json', 'node_modules/@fontsource/manrope/package.json']) {
    const parts = input.replaceAll('\\', '/').split('/');
    const start = parts.lastIndexOf('node_modules');
    if (start >= 0) packagePaths.add(resolve(root, parts.slice(0, start + (parts[start + 1].startsWith('@') ? 3 : 2)).join('/')));
}
const notices = [];
for (const folder of packagePaths) {
    const manifest = JSON.parse(await readFile(join(folder, 'package.json'), 'utf8'));
    const files = (await readdir(folder)).filter(file => /^(licen[cs]e|copying|notice|ofl)(\.|$)/i.test(file));
    const texts = await Promise.all(files.map(file => readFile(join(folder, file), 'utf8')));
    notices.push(`${manifest.name} ${manifest.version}\nLicense: ${JSON.stringify(manifest.license || 'See upstream package')}\n${texts.join('\n\n')}`);
}
const legal = 'THIRD-PARTY NOTICES\n\nLibrary legal comments are retained in the embedded code.\n\n' + notices.sort().join('\n\n' + '='.repeat(72) + '\n\n');

const guide = `# SQL Preparation Field Guide\n\n${concepts.length} concepts, ${comparisons.length} comparisons, ${interviews.length} interview questions, and ${labExamples.length} runnable SQLite exercises.\n\nThe lesson snippets target SQL Server/T-SQL. The embedded playground executes SQLite, not SQL Server. No PDF was available during this edition's creation; content is original supplemental study material based on the requested scope and public vendor references. Never run destructive examples on a production database.\n\n` + modules.map(module => `## ${module.chapter}. ${module.title}\n\n${module.purpose}\n\n` + concepts.filter(item => item.module === module.id).map(item => `### ${item.title}\n\n**Definition:** ${item.definition}\n\n**When:** ${item.when}\n\n**Why:** ${item.why}\n\n**Use case:** ${item.useCase}\n\n\`\`\`sql\n${item.syntax}\n\`\`\`\n\n**Pitfall:** ${item.pitfall}\n\n**Recall:** ${item.question}\n\n**Answer:** ${item.answer}\n`).join('\n')).join('\n');
const sourceFiles = ['index.html', 'styles.css', 'app.mjs', 'worker.mjs', 'progress.mjs', 'build.mjs', 'server.mjs', 'package.json', 'package-lock.json', '.gitignore', 'README.md', 'GITHUB-SETUP.md', '.github/workflows/deploy-pages.yml'];
for (const folder of ['content', 'tests']) for (const file of await readdir(join(root, folder))) if (file.endsWith('.mjs')) sourceFiles.push(`${folder}/${file}`);
const source = {};
for (const filename of sourceFiles) source[`project/${filename}`] = await readFile(join(root, filename));

function instructions(edition) {
    return `# SQL Preparation Studio - ${edition}\n\n## Open\n\nExtract this entire folder first. ${edition === 'Windows' ? 'Double-click OPEN-SQL.html or open it with a current Chrome or Microsoft Edge browser.' : 'Transfer the ZIP using an approved method, extract it in Files, then open OPEN-SQL.html in a current browser or approved offline HTML viewer with JavaScript, WebAssembly, and Web Workers enabled.'}\n\nThe app, icons, fonts, diagrams, content, and SQLite engine are embedded in that single file. No internet, laptop server, Node.js, or npm is needed to study after transfer.\n\n${edition === 'Windows' ? 'Hover or focus a module for its description; open it for the concept index.' : 'Tap modules and concepts to open them. Some Android Files/Chrome combinations only preview local HTML or do not grant the browser access. Use Open with a compatible approved viewer. Do not disable security controls. This is a portable web application, not an APK or native installation.'}\n\n## Study tools\n\n- Twelve-stage learning path and searchable concept library.\n- Definitions, when/why, real-world cases, syntax, pitfalls, and recall for every topic.\n- Side-by-side comparisons including keys, joins, functions, procedures, views, and CTEs.\n- Revision cards, bookmarks, notes, scored interview questions, and worked query challenges.\n- Real local SQLite playground with sample queries and reset/cancel controls.\n- Progress import/export for moving between browsers or editions.\n\n## Dialect and safety\n\nThe learning library uses SQL Server/T-SQL, with SQL Server 2022 as its baseline and version notes where relevant. The playground runs SQLite only; it cannot execute SQL Server procedures, permissions, isolation options, or plans. SQL examples may require their documented setup. All sample data is fictional. The app never connects to a real database or MM2.\n\nProgress is stored in the browser when local storage is available. File location, browser profiles, or clearing browser data can affect storage. Export progress to preserve it. Editing project source requires a rebuild; it does not modify OPEN-SQL.html automatically.\n\n## Contents\n\n- OPEN-SQL.html: complete offline app.\n- README.md: these opening instructions.\n- SQL-STUDY-GUIDE.md: complete text lessons.\n- sample-sqlite.sql: playground setup data (SQLite dialect).\n- THIRD-PARTY-NOTICES.txt and SHA256SUMS.txt: notices and integrity inventory.\n- project/: editable source, tests, and locked build dependencies; node_modules is excluded.\n\n## Rebuild on a computer\n\nWith Node.js 20+, run from project/:\n\n\`\`\`powershell\nnpm ci\nnpm run build\nnpm test\nnpm start\n\`\`\`\n\nInstallation needs internet access. The build creates separate Windows and Android folders/ZIPs in dist/. The optional server binds only to the computer's loopback address; a phone cannot reach the laptop using its own 127.0.0.1 address. The offline file avoids that dependency.\n`;
}

await mkdir(output, { recursive: true });
await writeFile(join(output, 'index.html'), html);
await rm(join(output, 'site'), { recursive: true, force: true });
await mkdir(join(output, 'site', 'downloads'), { recursive: true });
await writeFile(join(output, 'site', 'index.html'), html);
await writeFile(join(output, 'site', '.nojekyll'), '');
for (const edition of ['Windows', 'Android']) {
    const name = `SQL-Preparation-${edition}`;
    await rm(join(output, name), { recursive: true, force: true });
    const entries = {
        'OPEN-SQL.html': strToU8(html), 'README.md': strToU8(instructions(edition)),
        'SQL-STUDY-GUIDE.md': strToU8(guide), 'sample-sqlite.sql': strToU8(seed),
        'THIRD-PARTY-NOTICES.txt': strToU8(legal), ...source
    };
    entries['SHA256SUMS.txt'] = strToU8(Object.entries(entries).map(([filename, bytes]) => `${createHash('sha256').update(bytes).digest('hex')}  ${filename}`).join('\n') + '\n');
    const zipEntries = {};
    for (const [filename, bytes] of Object.entries(entries)) {
        const destination = join(output, name, filename);
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, bytes);
        zipEntries[`${name}/${filename}`] = bytes;
    }
    const zip = zipSync(zipEntries, { level: 9 });
    await writeFile(join(output, `${name}.zip`), zip);
    await writeFile(join(output, 'site', 'downloads', `${name}.zip`), zip);
    console.log(`${name}: ${(zip.length / 1048576).toFixed(2)} MiB ZIP, ${Object.keys(entries).length} files`);
}
const githubRoot = 'SQL-Preparation-GitHub';
const githubEntries = {};
await rm(join(output, githubRoot), { recursive: true, force: true });
for (const filename of sourceFiles) {
    const bytes = await readFile(join(root, filename));
    const destination = join(output, githubRoot, filename);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
    githubEntries[`${githubRoot}/${filename}`] = bytes;
}
await writeFile(join(output, `${githubRoot}.zip`), zipSync(githubEntries, { level: 9 }));
console.log('GitHub upload project: dist/SQL-Preparation-GitHub.zip; Pages artifact: dist/site');
console.log(`${concepts.length} concepts, ${comparisons.length} comparisons, ${interviews.length} questions, ${labExamples.length} labs; offline app ${(Buffer.byteLength(html) / 1048576).toFixed(2)} MiB.`);