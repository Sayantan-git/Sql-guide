import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const routes = new Map([
    ['/', ['dist/index.html', 'text/html']],
    ['/index.html', ['dist/index.html', 'text/html']],
    ['/hosted/', ['dist/site/index.html', 'text/html']],
    ['/hosted/index.html', ['dist/site/index.html', 'text/html']],
    ['/hosted/downloads/SQL-Preparation-Windows.zip', ['dist/SQL-Preparation-Windows.zip', 'application/zip', 'SQL-Preparation-Windows.zip']],
    ['/hosted/downloads/SQL-Preparation-Android.zip', ['dist/SQL-Preparation-Android.zip', 'application/zip', 'SQL-Preparation-Android.zip']],
    ['/downloads/SQL-Preparation-GitHub.zip', ['dist/SQL-Preparation-GitHub.zip', 'application/zip', 'SQL-Preparation-GitHub.zip']],
    ['/downloads/SQL-Preparation-Windows.zip', ['dist/SQL-Preparation-Windows.zip', 'application/zip', 'SQL-Preparation-Windows.zip']],
    ['/downloads/SQL-Preparation-Android.zip', ['dist/SQL-Preparation-Android.zip', 'application/zip', 'SQL-Preparation-Android.zip']]
]);
const server = createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
    const route = routes.get(new URL(request.url, 'http://localhost').pathname);
    if (!route) { response.writeHead(404); response.end('Not found'); return; }
    try {
        const content = await readFile(new URL(route[0], import.meta.url));
        const headers = { 'Content-Type': route[1] === 'text/html' ? 'text/html; charset=utf-8' : route[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
        if (route[2]) headers['Content-Disposition'] = `attachment; filename="${route[2]}"`;
        response.writeHead(200, headers);
        response.end(request.method === 'HEAD' ? undefined : content);
    } catch { response.writeHead(503); response.end('Run npm run build in the SQL preparation project first.'); }
});
server.on('error', error => { if (error.code === 'EADDRINUSE') server.listen(0, '127.0.0.1'); else throw error; });
server.listen(Number(process.env.PORT || 4180), '127.0.0.1', () => console.log(`SQL Preparation Studio: http://127.0.0.1:${server.address().port}`));