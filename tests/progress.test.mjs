import test from 'node:test';
import assert from 'node:assert/strict';
import { blankProgress, reviewSchedule, validateProgress } from '../progress.mjs';

test('remembered cards follow review intervals and missed cards return in five minutes', () => {
    const now = 1000;
    const first = reviewSchedule(null, true, now);
    assert.equal(first.stage, 0);
    assert.equal(first.due, now + 86400000);
    const second = reviewSchedule(first, true, now);
    assert.equal(second.due, now + 3 * 86400000);
    assert.equal(reviewSchedule(second, false, now).due, now + 300000);
    assert.equal(reviewSchedule({ stage: 4 }, true, now).stage, 4);
});
test('progress import validates version and drops unknown or invalid records', () => {
    const input = { ...blankProgress(), known: ['null', 'null', 'unknown'], bookmarks: ['null'], reviews: { null: { stage: 1, due: 99, reviewed: 10 }, bad: { stage: 900 } }, attempts: { quiz: { choice: 1, correct: true }, nope: { choice: 8, correct: true } }, notes: { null: 'Remember UNKNOWN', unknown: 'Discard' } };
    const normalized = validateProgress(input, new Set(['null']), new Set(['quiz']));
    assert.deepEqual(normalized.known, ['null']);
    assert.deepEqual(Object.keys(normalized.reviews), ['null']);
    assert.deepEqual(Object.keys(normalized.attempts), ['quiz']);
    assert.equal(normalized.notes.null, 'Remember UNKNOWN');
    assert.throws(() => validateProgress({ version: 9 }, new Set(), new Set()));
});