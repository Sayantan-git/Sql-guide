import test from 'node:test';
import assert from 'node:assert/strict';
import { concepts, modules } from '../content/index.mjs';
import { validateCurriculum } from '../content/model.mjs';

test('every concept has its complete learning contract and valid module', () => {
    assert.equal(validateCurriculum(concepts).size, concepts.length);
    assert.equal(new Set(modules.map(module => module.id)).size, modules.length);
});
test('logical processing differentiates semantics from physical execution', () => {
    const item = concepts.find(concept => concept.id === 'logical-order');
    assert.match(item.definition, /physical/);
    assert.match(item.syntax, /HAVING/);
    assert.ok(item.diagram);
});