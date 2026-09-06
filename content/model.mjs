export const modules = [
    { id: 'foundations', title: 'Relational foundations', icon: 'database', level: 'Foundation', purpose: 'Tables, types, NULL, and how a query is understood.', chapter: '01' },
    { id: 'design', title: 'Keys & data design', icon: 'key-round', level: 'Foundation', purpose: 'Reliable data through keys, constraints, and normalization.', chapter: '02' },
    { id: 'query', title: 'Query essentials', icon: 'list-filter', level: 'Foundation', purpose: 'Select, filter, sort, and transform rows with precise semantics.', chapter: '03' },
    { id: 'joins', title: 'Joins & set reasoning', icon: 'git-merge', level: 'Intermediate', purpose: 'Predict which rows survive and when joins multiply rows.', chapter: '04' },
    { id: 'aggregation', title: 'Groups & analytics', icon: 'chart-no-axes-combined', level: 'Intermediate', purpose: 'Group totals, rankings, running totals, and neighboring rows.', chapter: '05' },
    { id: 'reuse', title: 'Queries into objects', icon: 'blocks', level: 'Intermediate', purpose: 'Choose subqueries, CTEs, views, functions, procedures, and temp objects.', chapter: '06' },
    { id: 'changes', title: 'Changing data', icon: 'square-pen', level: 'Intermediate', purpose: 'Insert, update, delete, and capture changes deliberately.', chapter: '07' },
    { id: 'transactions', title: 'Transactions & concurrency', icon: 'lock-keyhole', level: 'Advanced', purpose: 'Atomicity, isolation, locks, deadlocks, and recovery.', chapter: '08' },
    { id: 'performance', title: 'Indexes & query plans', icon: 'gauge', level: 'Advanced', purpose: 'Measure access paths, estimates, and indexing tradeoffs.', chapter: '09' },
    { id: 'programmability', title: 'T-SQL programmability', icon: 'braces', level: 'Advanced', purpose: 'Parameterized routines, dynamic SQL, triggers, and errors.', chapter: '10' },
    { id: 'production', title: 'Production SQL', icon: 'shield-check', level: 'Advanced', purpose: 'Security, maintenance, backup, and modern data features.', chapter: '11' },
    { id: 'patterns', title: 'Interview patterns', icon: 'graduation-cap', level: 'Interview', purpose: 'Repeatable query patterns with edge cases and explanations.', chapter: '12' }
];

export function concept(id, module, title, definition, when, why, useCase, syntax, pitfall, question, answer, extra = {}) {
    return { id, module, title, definition, when, why, useCase, syntax, pitfall, question, answer, dialect: 'T-SQL', ...extra };
}

export function validateCurriculum(concepts) {
    const ids = new Set();
    for (const item of concepts) {
        if (ids.has(item.id)) throw new Error(`Duplicate concept: ${item.id}`);
        ids.add(item.id);
        if (!modules.some(module => module.id === item.module)) throw new Error(`Unknown module: ${item.module}`);
        for (const field of ['id', 'title', 'definition', 'when', 'why', 'useCase', 'syntax', 'pitfall', 'question', 'answer', 'dialect']) {
            if (typeof item[field] !== 'string' || !item[field].trim()) throw new Error(`Missing ${field}: ${item.id}`);
        }
    }
    return ids;
}