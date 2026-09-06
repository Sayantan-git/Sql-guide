import initSqlJs from 'sql.js';
import { seed } from './content/lab.mjs';
let SQL;
let database;

self.onmessage = async ({ data }) => {
    try {
        if (data.type === 'init') {
            SQL = await initSqlJs({ wasmBinary: data.wasm });
            database = new SQL.Database();
            database.exec(seed);
            self.postMessage({ type: 'ready', version: database.exec('SELECT sqlite_version()')[0].values[0][0] });
            return;
        }
        if (data.type === 'reset') {
            database.close();
            database = new SQL.Database();
            database.exec(seed);
            self.postMessage({ type: 'reset' });
            return;
        }
        if (data.type === 'run') {
            if (!database) throw new Error('The local database is not ready.');
            if (typeof data.sql !== 'string' || data.sql.length > 100000) throw new Error('Query text must be shorter than 100,000 characters.');
            const start = performance.now();
            const results = [];
            for (const statement of database.iterateStatements(data.sql)) {
                const columns = statement.getColumnNames();
                const values = [];
                let rowCount = 0;
                while (statement.step()) {
                    if (rowCount < 300) values.push(statement.get());
                    rowCount++;
                }
                if (columns.length) results.push({ columns, values, rowCount });
                if (results.length >= 15) throw new Error('Run at most 15 result-producing statements at a time.');
            }
            self.postMessage({ type: 'result', results, milliseconds: performance.now() - start });
        }
    } catch (error) {
        try { database?.exec('ROLLBACK'); } catch {}
        self.postMessage({ type: 'error', message: String(error.message || error) });
    }
};