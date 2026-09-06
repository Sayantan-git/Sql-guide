import test from 'node:test';
import assert from 'node:assert/strict';
import { concepts, modules } from '../content/index.mjs';
import { comparisons } from '../content/comparisons.mjs';
import { interviews } from '../content/interviews.mjs';
import { labExamples, seed } from '../content/lab.mjs';
import initSqlJs from 'sql.js';
import { readFile } from 'node:fs/promises';

const ids = new Set(concepts.map(item => item.id));
test('all modules are populated and cross-references are valid', () => {
    assert.ok(concepts.length >= 90);
    for (const module of modules) assert.ok(concepts.filter(item => item.module === module.id).length >= 5, module.id);
    for (const comparison of comparisons) {
        for (const id of comparison.concepts) assert.ok(ids.has(id), id);
        for (const row of comparison.rows) assert.equal(row.length, comparison.columns.length + 1, comparison.id);
        if (comparison.lab) assert.ok(labExamples.some(item => item.id === comparison.lab));
    }
    for (const question of interviews) {
        assert.ok(ids.has(question.concept));
        assert.ok(question.options[question.correct]);
        assert.equal(new Set(question.options).size, question.options.length);
    }
});

const SQL = await initSqlJs({ wasmBinary: await readFile(new URL('../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url)) });
test('every lab example executes on the real SQLite fixture with expected row counts', () => {
    for (const example of labExamples) {
        const db = new SQL.Database();
        try {
            db.exec(seed);
            const counts = [];
            for (const statement of db.iterateStatements(example.sql)) {
                let count = 0;
                const columns = statement.getColumnNames();
                while (statement.step()) count++;
                if (columns.length) counts.push(count);
            }
            assert.deepEqual(counts, example.expected, example.id);
        } finally { db.close(); }
    }
});

test('fixture totals, NULL semantics, and rollback are meaningful', () => {
    const db = new SQL.Database();
    db.exec(seed);
    assert.equal(db.exec('SELECT SUM(Total) FROM Orders')[0].values[0][0], 285);
    assert.equal(db.exec('SELECT SUM(orders.Total) FROM Orders orders JOIN OrderItems items ON orders.OrderID=items.OrderID')[0].values[0][0], 365);
    assert.deepEqual(db.exec('SELECT COUNT(*), COUNT(Email) FROM Customers')[0].values[0], [5, 3]);
    assert.throws(() => db.exec("INSERT INTO Orders VALUES(999,999,'2026-01-01','Paid',1)"), /FOREIGN KEY/);
    db.close();
});