import { createIcons, icons } from 'lucide';
import mermaid from 'mermaid';
import { concepts, modules } from './content/index.mjs';
import { comparisons } from './content/comparisons.mjs';
import { interviews } from './content/interviews.mjs';
import { labExamples, schema, schemaDiagram } from './content/lab.mjs';
import { blankProgress, validateProgress, reviewSchedule } from './progress.mjs';

const byId = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const number = value => String(value).padStart(2, '0');
const conceptIds = new Set(concepts.map(item => item.id));
const questionIds = new Set(interviews.map(item => item.id));
const itemById = id => concepts.find(item => item.id === id);
const moduleById = id => modules.find(item => item.id === id);
const storageKey = 'sql-field-guide-progress-v1';
let progress = blankProgress();
let persistent = true;
try {
    const stored = localStorage.getItem(storageKey);
    if (stored) progress = validateProgress(JSON.parse(stored), conceptIds, questionIds);
    localStorage.setItem(storageKey, JSON.stringify(progress));
} catch { persistent = false; }

const state = {
    view: 'roadmap', lessonId: null, module: '', query: '', level: '', bookmarkedOnly: false,
    comparison: comparisons[0].id, roadmapTab: 'path', reviewMode: 'due', reviewModule: '',
    reviewIndex: 0, reviewRevealed: false, interviewMode: 'quiz', interviewModule: '', interviewIndex: 0,
    choice: null, submitted: false, codingIndex: 0, codingRevealed: false,
    labExample: labExamples[0].id, sql: labExamples[0].sql, labReady: false, labBusy: false,
    labMessage: '', labResults: null, dbVersion: '', diagramVersion: 0
};
let worker;
let queryTimeout;
let toastTimeout;

const pages = [
    ['roadmap', 'Learning path', 'route', '12'], ['library', 'Concept library', 'library', String(concepts.length)],
    ['compare', 'Compare concepts', 'columns-3', String(comparisons.length)], ['revision', 'Revision cards', 'layers-2', ''],
    ['interview', 'Interview practice', 'messages-square', String(interviews.length)], ['reference', 'Quick reference', 'notebook-tabs', ''],
    ['lab', 'SQL playground', 'terminal', '']
];

function refreshIcons() { createIcons({ icons, attrs: { 'aria-hidden': 'true' } }); }
function toast(message) {
    clearTimeout(toastTimeout);
    byId('toast').textContent = message;
    byId('toast').hidden = false;
    toastTimeout = setTimeout(() => { byId('toast').hidden = true; }, 3200);
}
function saveProgress() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); persistent = true; }
    catch { persistent = false; }
    renderProgress();
}
function renderProgress() {
    byId('progress-count').textContent = `${progress.known.length}/${concepts.length}`;
    byId('course-progress').value = progress.known.length / concepts.length * 100;
    byId('save-status').textContent = persistent ? 'Saved on this device' : 'Session-only progress';
}

function renderNavigation() {
    byId('navigation').innerHTML = pages.map(([id, title, symbol, count]) => `<a class="nav-item" href="#/${id}" ${state.view === id ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${title}</span><span class="nav-count">${count}</span></a>`).join('');
    byId('module-navigation').innerHTML = modules.map(module => `<button class="module-link" data-module="${module.id}"><span>${module.chapter}</span><span>${escape(module.title)}</span></button>`).join('');
    renderProgress();
}
function heading(eyebrow, title, description, extra = '') {
    return `<header class="page-heading"><div class="eyebrow">${eyebrow}</div><div class="heading-row"><h1>${title}</h1>${extra}</div><p>${description}</p></header>`;
}
function moduleOptions(selected = '') {
    return `<option value="">All modules</option>` + modules.map(module => `<option value="${module.id}" ${selected === module.id ? 'selected' : ''}>${module.chapter} / ${escape(module.title)}</option>`).join('');
}
function highlight(sql) {
    const tokens = /--[^\n]*|'(?:''|[^'])*'|\b(?:SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|CROSS|APPLY|ON|AND|OR|NOT|IN|IS|NULL|AS|WITH|RECURSIVE|GROUP|BY|HAVING|ORDER|ASC|DESC|DISTINCT|TOP|OFFSET|FETCH|NEXT|ROWS|ONLY|UNION|ALL|INTERSECT|EXCEPT|CASE|WHEN|THEN|ELSE|END|CREATE|ALTER|DROP|TABLE|VIEW|FUNCTION|PROCEDURE|INDEX|UNIQUE|PRIMARY|FOREIGN|KEY|REFERENCES|CHECK|DEFAULT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|TRUNCATE|BEGIN|COMMIT|ROLLBACK|TRANSACTION|OVER|PARTITION|BETWEEN|UNBOUNDED|PRECEDING|FOLLOWING|CURRENT|RETURN|RETURNS|DECLARE|EXEC|TRY|CATCH|THROW|IF|EXISTS|GO|COUNT|SUM|AVG|MAX|MIN|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD)\b|\b\d+(?:\.\d+)?\b/gi;
    let result = '';
    let end = 0;
    for (const token of sql.matchAll(tokens)) {
        result += escape(sql.slice(end, token.index));
        const value = token[0];
        const kind = value.startsWith('--') ? 'comment' : value.startsWith("'") ? 'string' : /^\d/.test(value) ? 'number' : 'keyword';
        result += `<span class="token-${kind}">${escape(value)}</span>`;
        end = token.index + value.length;
    }
    return result + escape(sql.slice(end));
}
function codeBlock(sql, id, dialect = 'T-SQL / SQL SERVER') {
    return `<div class="code-frame"><div class="code-title"><span>${dialect}</span><button class="icon-button" data-copy="${id}" aria-label="Copy SQL" title="Copy SQL">${icon('copy')}</button></div><pre><code id="${id}">${highlight(sql)}</code></pre></div>`;
}
async function drawDiagrams() {
    const version = ++state.diagramVersion;
    for (const [index, element] of [...document.querySelectorAll('[data-mermaid]')].entries()) {
        const source = element.dataset.mermaid;
        delete element.dataset.mermaid;
        try {
            const { svg } = await mermaid.render(`study-diagram-${version}-${index}`, source);
            if (element.isConnected) element.innerHTML = svg;
        } catch { if (element.isConnected) element.textContent = 'Diagram unavailable. The accompanying explanation remains available.'; }
    }
}
function diagram(source) { return `<div class="diagram-surface" data-mermaid="${escape(source)}" aria-label="SQL concept flow diagram">Loading diagram</div>`; }
function empty(title, message, action = '') { return `<div class="empty-state">${icon('book-open-check')}<h2>${title}</h2><p>${message}</p>${action}</div>`; }

function renderRoadmap() {
    let html = heading('THE SQL PREPARATION ATLAS', 'A clear path through SQL.', 'From your first SELECT to query plans and production decisions. Learn the idea, compare the alternatives, then test your reasoning.', `<span class="heading-stat">${concepts.length} concepts / 12 stages</span>`);
    html += `<div class="page-tabs" role="tablist" aria-label="Learning path view"><button data-roadmap-tab="path" role="tab" aria-selected="${state.roadmapTab === 'path'}">Learning path</button><button data-roadmap-tab="schema" role="tab" aria-selected="${state.roadmapTab === 'schema'}">Example database</button></div>`;
    if (state.roadmapTab === 'schema') {
        html += `<h2>One small shop. Many SQL questions.</h2><p class="lab-info">Fictional Customers, Orders, Products, OrderItems, and Employees are used throughout. One order has an unknown customer, two customers have no orders, and salaries include ties.</p>${diagram(schemaDiagram)}<div class="schema-list">${schema.map(([title, columns]) => `<div class="schema-item"><strong>${title}</strong><p>${columns}</p></div>`).join('')}</div><div class="button-row" style="margin-top:22px"><button class="button" data-lab="first-query">${icon('play')}Open sample data</button></div>`;
    } else {
        const phases = [['01', 'Build the foundation', 'Model data and select the right rows'], ['02', 'Think in sets', 'Analyze, reuse, change, and coordinate'], ['03', 'Make it production-ready', 'Measure, protect, explain, and practice']];
        phases.forEach(([phase, title, description], phaseIndex) => {
            html += `<section class="path-phase"><div class="phase-heading"><span>${phase}</span><h2>${title}</h2><span>${description}</span><span class="phase-rule"></span></div><div class="roadmap-grid">`;
            modules.slice(phaseIndex * 4, phaseIndex * 4 + 4).forEach((module, index) => {
                const items = concepts.filter(item => item.module === module.id);
                const known = items.filter(item => progress.known.includes(item.id)).length;
                html += `<button class="module-card" data-module="${module.id}" data-tooltip-module="${module.id}" data-tone="${['green', 'blue', 'amber', 'coral'][index]}"><div class="module-top"><span class="module-icon">${icon(module.icon)}</span><span class="module-number">${module.chapter}</span></div><h3>${escape(module.title)}</h3><p>${escape(module.purpose)}</p><div class="module-bottom"><span>${items.length} concepts</span><progress aria-label="${escape(module.title)} progress" value="${known}" max="${items.length}"></progress><span>${known}/${items.length}</span></div>${index < 3 ? `<span class="arrow-next">${icon('chevron-right')}</span>` : ''}</button>`;
            });
            html += '</div></section>';
        });
        html += `<div class="path-note">${icon('git-compare-arrows')}<div><h3>Know why two similar tools are different.</h3><p>Primary and composite keys, LEFT and INNER joins, functions and procedures, CTEs and views. The comparison desk connects definitions to syntax, tradeoffs, and result semantics.</p><button class="text-link" data-compare="keys">Explore the comparisons</button></div></div>`;
    }
    byId('main').innerHTML = html;
}

function filteredConcepts() {
    const query = state.query.toLowerCase().trim();
    return concepts.filter(item => (!state.module || item.module === state.module) && (!state.level || moduleById(item.module).level === state.level) && (!state.bookmarkedOnly || progress.bookmarks.includes(item.id)) && (!query || `${item.title} ${item.definition} ${item.syntax} ${item.question}`.toLowerCase().includes(query)));
}
function conceptToolbar() {
    return `<div class="toolbar"><label class="field search-field">${icon('search')}<input id="concept-search" type="search" placeholder="Find a concept or SQL keyword" aria-label="Filter concepts" value="${escape(state.query)}"></label><select id="module-filter" aria-label="Filter by module">${moduleOptions(state.module)}</select><select id="level-filter" aria-label="Filter by level"><option value="">All levels</option>${['Foundation', 'Intermediate', 'Advanced', 'Interview'].map(level => `<option ${state.level === level ? 'selected' : ''}>${level}</option>`).join('')}</select><button class="icon-button ${state.bookmarkedOnly ? 'active' : ''}" id="bookmark-filter" aria-label="Show bookmarked topics" aria-pressed="${state.bookmarkedOnly}" title="Bookmarked topics">${icon('bookmark')}</button><span id="result-count" class="result-count"></span></div>`;
}
function renderLibrary(reference = false) {
    byId('main').innerHTML = heading(reference ? 'SYNTAX AT A GLANCE' : 'THE CONCEPT LIBRARY', reference ? 'Quick reference' : 'Small definitions. Clear decisions.', reference ? 'Compact syntax, a crisp meaning, and the caveat worth remembering. Expand a concept for its example.' : 'Every lesson includes when, why, a real-world case, syntax, a pitfall, and a recall question.') + conceptToolbar() + '<div class="concept-list" id="concept-list"></div>';
    renderConceptRows(reference);
}
function renderConceptRows(reference = state.view === 'reference') {
    const items = filteredConcepts();
    if (!byId('concept-list')) return;
    byId('result-count').textContent = `${items.length} ${items.length === 1 ? 'concept' : 'concepts'}`;
    byId('concept-list').innerHTML = items.length ? items.map(item => {
        const module = moduleById(item.module);
        if (reference) return `<details class="quick-item"><summary><span class="row-index">${module.chapter}</span>${escape(item.title)}${icon('chevron-down')}</summary><div><p>${escape(item.definition)}</p>${codeBlock(item.syntax, `quick-${item.id}`)}<p><strong>Watch for:</strong> ${escape(item.pitfall)}</p><button class="text-link" data-open="${item.id}">Open full lesson</button></div></details>`;
        return `<article class="concept-row"><span class="row-index">${module.chapter}</span><button class="concept-open" data-open="${item.id}"><strong>${escape(item.title)}</strong><p>${escape(item.definition)}</p><div class="row-meta"><span>${escape(module.title)}</span><span>/</span><span>${module.level}</span></div></button>${progress.known.includes(item.id) ? `<span class="known-mark" aria-label="Known">${icon('circle-check')}</span>` : ''}<button class="icon-button ${progress.bookmarks.includes(item.id) ? 'active' : ''}" data-bookmark="${item.id}" aria-label="Bookmark ${escape(item.title)}" aria-pressed="${progress.bookmarks.includes(item.id)}" title="Bookmark">${icon('bookmark')}</button><button class="icon-button" data-open="${item.id}" aria-label="Open ${escape(item.title)}" title="Open lesson">${icon('arrow-up-right')}</button></article>`;
    }).join('') : empty('No matching concepts', 'Change the filters or search terms.');
    refreshIcons();
}

function openLesson(id, updateHash = true) {
    const item = itemById(id);
    if (!item) return;
    hideTooltip();
    state.lessonId = id;
    const module = moduleById(item.module);
    const index = concepts.indexOf(item);
    const related = comparisons.filter(comparison => comparison.concepts.includes(id));
    const example = labExamples.find(example => example.concept === id);
    byId('lesson-content').innerHTML = `<header class="lesson-header"><span class="crumb">${module.chapter} / ${escape(module.title)}</span><button class="icon-button ${progress.bookmarks.includes(id) ? 'active' : ''}" data-bookmark="${id}" aria-label="Bookmark lesson" aria-pressed="${progress.bookmarks.includes(id)}" title="Bookmark">${icon('bookmark')}</button><button class="icon-button" data-close="lesson-dialog" aria-label="Close lesson" title="Close lesson">${icon('x')}</button></header><article class="lesson-body"><span class="badge ${module.level === 'Advanced' ? 'blue' : ''}">${module.level}</span><h2 id="lesson-title" tabindex="-1">${escape(item.title)}</h2><p class="definition">${escape(item.definition)}</p><nav class="lesson-index" aria-label="Lesson index"><a href="#lesson-use">When &amp; why</a><a href="#lesson-syntax">Syntax</a><a href="#lesson-pitfall">Pitfall</a><a href="#lesson-recall">Recall</a></nav><section id="lesson-use" class="why-when"><div><h3>When to use it</h3><p>${escape(item.when)}</p></div><div><h3>Why it matters</h3><p>${escape(item.why)}</p></div></section><h3>Real-world case</h3><p>${escape(item.useCase)}</p>${item.diagram ? diagram(item.diagram) : ''}<h3 id="lesson-syntax">Syntax &amp; example</h3>${codeBlock(item.syntax, `lesson-code-${id}`)}${example ? `<button class="button secondary" data-lab="${example.id}">${icon('terminal')}Try the SQLite example</button>` : '<p class="lab-info">SQL Server example. Some snippets create objects or require parameters, permissions, and setup. Use a disposable training database.</p>'}<section class="pitfall" id="lesson-pitfall"><h3>The detail people miss</h3><p>${escape(item.pitfall)}</p></section><section class="recall-block" id="lesson-recall"><h3>Check your understanding</h3><p>${escape(item.question)}</p><details><summary>Reveal answer</summary><p>${escape(item.answer)}</p></details></section>${related.length ? `<h3>Compare with related concepts</h3><div class="related-links">${related.map(comparison => `<button data-compare="${comparison.id}">${escape(comparison.title)} &rarr;</button>`).join('')}</div>` : ''}<h3>My notes</h3><textarea class="lesson-notes" id="lesson-notes" maxlength="5000" aria-label="Personal notes for this topic" placeholder="Your own example or reminder">${escape(progress.notes[id] || '')}</textarea><span class="note-status">${persistent ? 'Stored in this browser' : 'Session only; export to keep your notes'}</span><div class="lesson-footer"><button class="icon-button" data-lesson-offset="-1" aria-label="Previous concept" ${index === 0 ? 'disabled' : ''}>${icon('arrow-left')}</button><button class="button ${progress.known.includes(id) ? 'secondary' : ''}" data-known="${id}">${icon(progress.known.includes(id) ? 'circle-check' : 'check')} ${progress.known.includes(id) ? 'Marked as known' : 'Mark as known'}</button><span>${index + 1} / ${concepts.length}</span><button class="icon-button" data-lesson-offset="1" aria-label="Next concept" ${index === concepts.length - 1 ? 'disabled' : ''}>${icon('arrow-right')}</button></div></article>`;
    if (!byId('lesson-dialog').open) byId('lesson-dialog').showModal();
    byId('lesson-dialog').scrollTop = 0;
    byId('lesson-title').focus({ preventScroll: true });
    if (updateHash) history.replaceState(null, '', `#/${state.view}/${id}`);
    refreshIcons();
    drawDiagrams();
}

function renderComparisons() {
    const item = comparisons.find(item => item.id === state.comparison) || comparisons[0];
    byId('main').innerHTML = heading('THE COMPARISON DESK', 'Similar names. Different jobs.', 'Choose by behavior, result shape, scope, and tradeoffs. Each comparison links back to full definitions and syntax.') + `<div class="comparison-layout"><nav class="comparison-nav" aria-label="Concept comparisons">${comparisons.map(comparison => `<button data-compare="${comparison.id}" aria-current="${comparison.id === item.id}">${escape(comparison.title)}</button>`).join('')}</nav><section class="comparison-content"><select id="comparison-select" class="mobile-comparison" aria-label="Choose comparison">${comparisons.map(comparison => `<option value="${comparison.id}" ${comparison.id === item.id ? 'selected' : ''}>${escape(comparison.title)}</option>`).join('')}</select><h2>${escape(item.title)}</h2><p class="comparison-rule">${escape(item.rule)}</p><div class="table-scroll"><table><thead><tr><th scope="col">Dimension</th>${item.columns.map(column => `<th scope="col">${escape(column)}</th>`).join('')}</tr></thead><tbody>${item.rows.map(row => `<tr>${row.map(value => `<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${item.diagram ? diagram(item.diagram) : ''}${item.lab ? `<button class="button secondary" data-lab="${item.lab}">${icon('terminal')}Compare the actual results</button>` : ''}<div class="mini-label">Definitions &amp; syntax</div>${item.concepts.map(id => { const concept = itemById(id); return `<details class="quick-item"><summary>${escape(concept.title)}${icon('chevron-down')}</summary><div><p>${escape(concept.definition)}</p>${codeBlock(concept.syntax, `compare-${id}`)}<button class="text-link" data-open="${id}">Full lesson: when, why, and pitfalls</button></div></details>`; }).join('')}</section></div>`;
}

function reviewCards() {
    return concepts.filter(item => (!state.reviewModule || item.module === state.reviewModule) && (state.reviewMode !== 'bookmarks' || progress.bookmarks.includes(item.id)) && (state.reviewMode !== 'due' || !progress.reviews[item.id] || progress.reviews[item.id].due <= Date.now()));
}
function renderRevision() {
    const cards = reviewCards();
    if (state.reviewIndex >= cards.length) state.reviewIndex = 0;
    const item = cards[state.reviewIndex];
    let html = heading('ACTIVE RECALL', 'Make it stick.', 'Recall the answer before revealing it. Remembered cards return after 1, 3, 7, 14, then 30 days; missed cards return after five minutes.');
    html += `<div class="toolbar"><select id="review-mode" aria-label="Revision deck"><option value="due" ${state.reviewMode === 'due' ? 'selected' : ''}>Due &amp; new cards</option><option value="all" ${state.reviewMode === 'all' ? 'selected' : ''}>All concepts</option><option value="bookmarks" ${state.reviewMode === 'bookmarks' ? 'selected' : ''}>Bookmarked concepts</option></select><select id="review-module" aria-label="Revision module">${moduleOptions(state.reviewModule)}</select><span class="result-count">${cards.length} cards in this deck</span></div>`;
    if (!item) html += empty('This deck is clear', 'No cards match the current review filters.', '<button class="button secondary" data-action="review-all">Review all concepts</button>');
    else html += `<section class="study-surface"><div class="study-meta"><span>${escape(moduleById(item.module).title)}</span><span>${number(state.reviewIndex + 1)} / ${number(cards.length)}</span></div><h2>${escape(item.question)}</h2><span class="badge">${escape(item.title)}</span>${state.reviewRevealed ? `<div class="answer">${escape(item.answer)}<p class="lab-info">${escape(item.pitfall)}</p><button class="text-link" data-open="${item.id}">Read the full lesson</button></div>` : ''}<div class="study-footer">${state.reviewRevealed ? `<div class="button-row"><button class="button secondary" data-grade="again">${icon('rotate-ccw')}Review again</button><button class="button" data-grade="remembered">${icon('check')}Remembered</button></div>` : '<button class="button" data-action="reveal-card">Show answer</button>'}<button class="icon-button" data-action="skip-card" aria-label="Skip this review card" title="Skip card">${icon('arrow-right')}</button></div></section>`;
    byId('main').innerHTML = html;
}

function quizQuestions() { return interviews.filter(item => !state.interviewModule || item.module === state.interviewModule); }
function renderInterview() {
    const results = Object.values(progress.attempts);
    let html = heading('INTERVIEW PRACTICE', 'Explain the decision.', 'Concept questions test correctness and tradeoffs. Coding prompts focus on ties, NULLs, row grain, and deterministic results.', `<span class="heading-stat">${results.filter(result => result.correct).length} correct / ${results.length} attempted</span>`);
    html += `<div class="page-tabs" role="tablist" aria-label="Interview mode"><button data-interview-mode="quiz" role="tab" aria-selected="${state.interviewMode === 'quiz'}">Concept questions</button><button data-interview-mode="coding" role="tab" aria-selected="${state.interviewMode === 'coding'}">Query challenges</button></div>`;
    if (state.interviewMode === 'coding') {
        const patterns = concepts.filter(item => item.module === 'patterns');
        const item = patterns[state.codingIndex % patterns.length];
        const exercise = labExamples.find(example => example.concept === item.id);
        html += `<section class="study-surface"><div class="study-meta"><span>QUERY CHALLENGE</span><span>${number(state.codingIndex % patterns.length + 1)} / ${patterns.length}</span></div><h2>${escape(item.useCase)}</h2><p class="lab-info">${escape(item.when)} State your output grain, tie rule, and missing-data behavior before writing SQL.</p>${state.codingRevealed ? `${codeBlock(item.syntax, `coding-${item.id}`)}<p>${escape(item.answer)}</p><div class="pitfall"><p>${escape(item.pitfall)}</p></div>${exercise ? `<button class="text-link" data-lab="${exercise.id}">Try the SQLite counterpart</button>` : ''}` : ''}<div class="study-footer"><button class="button" data-action="reveal-coding">${state.codingRevealed ? 'Answer shown' : 'Reveal worked solution'}</button><button class="button secondary" data-action="next-coding">Next challenge${icon('arrow-right')}</button></div></section>`;
    } else {
        const questions = quizQuestions();
        if (state.interviewIndex >= questions.length) state.interviewIndex = 0;
        const item = questions[state.interviewIndex];
        html += `<div class="toolbar"><select id="interview-module" aria-label="Interview module">${moduleOptions(state.interviewModule)}</select><span class="result-count">${questions.length} questions</span></div>`;
        if (!item) html += empty('No questions in this module', 'Choose another module or all modules.');
        else html += `<section class="study-surface"><div class="study-meta"><span>${escape(moduleById(item.module).title)}</span><span>${number(state.interviewIndex + 1)} / ${number(questions.length)}</span></div><h2>${escape(item.question)}</h2><fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Choose the best answer</legend>${item.options.map((option, index) => `<label class="choice ${state.submitted && index === item.correct ? 'correct' : state.submitted && index === state.choice ? 'incorrect' : ''}"><input type="radio" name="quiz-answer" value="${index}" ${state.choice === index ? 'checked' : ''} ${state.submitted ? 'disabled' : ''}><span>${escape(option)}</span></label>`).join('')}</fieldset>${state.submitted ? `<div class="feedback ${state.choice === item.correct ? '' : 'wrong'}"><strong>${state.choice === item.correct ? 'Correct' : 'Review this distinction'}</strong><p>${escape(item.explanation)}</p><button class="text-link" data-open="${item.concept}">Open the related lesson</button></div>` : ''}<div class="study-footer"><button class="button" id="check-answer" data-action="check-answer" ${state.choice === null || state.submitted ? 'disabled' : ''}>Check answer</button><button class="button secondary" data-action="next-question">Next question${icon('arrow-right')}</button></div></section>`;
    }
    byId('main').innerHTML = html;
}

function startDatabase(reason = '') {
    worker?.terminate();
    clearTimeout(queryTimeout);
    state.labReady = false;
    state.labBusy = false;
    state.labMessage = reason || 'Starting the local SQLite engine';
    try {
        const bundle = window.SQL_STUDIO_ASSETS;
        const url = URL.createObjectURL(new Blob([bundle.worker], { type: 'text/javascript' }));
        worker = new Worker(url);
        URL.revokeObjectURL(url);
        worker.onmessage = ({ data }) => {
            if (data.type === 'ready') { state.labReady = true; state.dbVersion = data.version; state.labMessage = reason || `SQLite ${data.version} / local sample database ready`; }
            if (data.type === 'result') { clearTimeout(queryTimeout); state.labBusy = false; state.labResults = data.results; state.labMessage = `Completed in ${data.milliseconds.toFixed(1)} ms. ${data.results.length} result set(s).`; }
            if (data.type === 'error') { clearTimeout(queryTimeout); state.labBusy = false; state.labMessage = `SQL error: ${data.message}`; state.labResults = null; }
            if (data.type === 'reset') { state.labResults = null; state.labMessage = 'Sample database restored.'; }
            if (state.view === 'lab') renderLabResults();
        };
        worker.onerror = event => { clearTimeout(queryTimeout); state.labBusy = false; state.labReady = false; state.labMessage = `Engine unavailable: ${event.message}. Use a modern browser with WebAssembly and Web Workers enabled.`; if (state.view === 'lab') renderLabResults(); };
        const bytes = Uint8Array.from(atob(bundle.wasm), character => character.charCodeAt(0));
        worker.postMessage({ type: 'init', wasm: bytes }, [bytes.buffer]);
    } catch (error) { state.labMessage = `Engine unavailable: ${error.message}`; }
}
function renderLab() {
    const example = labExamples.find(item => item.id === state.labExample);
    byId('main').innerHTML = heading('LOCAL SQL PLAYGROUND', 'Turn syntax into results.', 'A real SQLite engine with fictional shop data. The lesson library uses T-SQL; SQL Server routines, hints, isolation, and execution plans require SQL Server.', '<span class="badge blue">SQLite / offline</span>') + `<div class="toolbar"><select id="lab-example" aria-label="Choose SQL exercise">${labExamples.map(item => `<option value="${item.id}" ${item.id === state.labExample ? 'selected' : ''}>${escape(item.title)}</option>`).join('')}</select><button class="text-link" data-open="${example.concept}">Related T-SQL lesson</button></div><p class="lab-info" id="lab-prompt">${escape(example.prompt)}</p><div class="lab-layout"><section><label class="sr-only" for="sql-editor">SQLite query editor</label><textarea id="sql-editor" class="sql-editor" spellcheck="false" autocapitalize="off" autocomplete="off">${escape(state.sql)}</textarea><div class="toolbar"><button class="button" id="run-sql" data-action="run-sql">${icon('play')}Run SQL</button><button class="icon-button" id="cancel-sql" data-action="cancel-sql" aria-label="Cancel running query" title="Cancel query">${icon('square')}</button><button class="button secondary" data-action="reset-db">${icon('rotate-ccw')}Reset sample data</button></div><div class="lab-status" id="lab-status" role="status"></div><div id="lab-results"></div><p class="lab-info">Only this disposable in-memory database is changed. Queries stop after four seconds; cancellation recreates the sample data. A SQL error rolls back any open transaction, not earlier autocommits. Up to 300 rows per result are displayed.</p></section><aside class="schema-list" aria-label="Sample database schema">${schema.map(([name, columns]) => `<div class="schema-item"><strong>${name}</strong><p>${columns}</p></div>`).join('')}</aside></div>`;
    if (!worker) startDatabase();
    renderLabResults();
}
function renderLabResults() {
    if (!byId('lab-status')) return;
    byId('lab-status').textContent = state.labMessage;
    byId('lab-status').classList.toggle('error', /error|unavailable|cancelled/i.test(state.labMessage));
    byId('run-sql').disabled = !state.labReady || state.labBusy;
    byId('cancel-sql').disabled = !state.labBusy;
    byId('lab-results').innerHTML = state.labResults ? state.labResults.length ? state.labResults.map((result, index) => `<section class="query-result"><h3>Result ${index + 1} / ${result.rowCount} rows${result.rowCount > 300 ? ' (first 300 displayed)' : ''}</h3><div class="table-scroll"><table><thead><tr>${result.columns.map(column => `<th>${escape(column)}</th>`).join('')}</tr></thead><tbody>${result.values.length ? result.values.map(row => `<tr>${row.map(value => `<td class="${value === null ? 'null' : ''}">${value === null ? 'NULL' : escape(value instanceof Uint8Array ? Array.from(value).join(',') : value)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${result.columns.length}">No rows</td></tr>`}</tbody></table></div></section>`).join('') : '<p class="lab-info">Statement completed without a result set.</p>' : '';
}
function runSQL() {
    if (!state.labReady || state.labBusy) return;
    state.sql = byId('sql-editor').value;
    if (!state.sql.trim()) { toast('Enter a SQL statement first.'); return; }
    state.labBusy = true;
    state.labMessage = 'Running on the local sample database';
    state.labResults = null;
    worker.postMessage({ type: 'run', sql: state.sql });
    queryTimeout = setTimeout(() => { state.labResults = null; startDatabase('Query cancelled after four seconds; sample data reset.'); renderLabResults(); }, 4000);
    renderLabResults();
}

function renderSources() {
    const sources = [
        ['T-SQL language reference', 'https://learn.microsoft.com/en-us/sql/t-sql/language-reference'],
        ['Primary and foreign key constraints', 'https://learn.microsoft.com/en-us/sql/relational-databases/tables/primary-and-foreign-key-constraints'],
        ['CTE semantics and scope', 'https://learn.microsoft.com/en-us/sql/t-sql/queries/with-common-table-expression-transact-sql'],
        ['User-defined function restrictions', 'https://learn.microsoft.com/en-us/sql/relational-databases/user-defined-functions/create-user-defined-functions-database-engine'],
        ['SQL Server locking and row versioning', 'https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide'],
        ['Index design guide', 'https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-index-design-guide'],
        ['SQLite SQL language and differences', 'https://www.sqlite.org/lang.html'],
        ['SQL.js in-browser engine', 'https://sql.js.org/']
    ];
    const downloads = location.protocol.startsWith('http') ? `<h2>Offline editions</h2><div class="button-row"><a class="button secondary" href="./downloads/SQL-Preparation-Windows.zip" download>${icon('monitor-down')}Windows ZIP</a><a class="button secondary" href="./downloads/SQL-Preparation-Android.zip" download>${icon('smartphone')}Android ZIP</a></div><p>Each ZIP contains a separate folder with the self-contained app, text guide, source files, and its opening instructions. These editions save locally without GitHub sign-in. Android requires a browser or approved HTML viewer that runs JavaScript, WebAssembly, and Web Workers; it is not an APK.</p>` : '';
    byId('main').innerHTML = `<article class="sources-page">${heading('SCOPE & EVIDENCE', 'A field guide, not a black box.', 'Core-to-advanced SQL preparation with deliberate dialect boundaries and a reproducible sample database.')}<h2>What is included</h2><p>${concepts.length} original lessons across ${modules.length} stages, ${comparisons.length} comparison tables, ${interviews.length} scored questions, seven worked query challenges, and ${labExamples.length} tested SQLite examples. Every lesson includes a definition, when, why, use case, syntax, pitfall, and recall answer.</p><h2>Dialect and execution</h2><p>The learning snippets target SQL Server/T-SQL concepts, using SQL Server 2022 as the baseline and noting selected version requirements. They are educational examples, not scripts to run indiscriminately in production. Some create objects or require a parameter, principal, index, or database setup. The playground actually executes SQLite via SQL.js, not SQL Server. It cannot validate T-SQL stored procedures, SQL Server plans, isolation levels, or permissions.</p><h2>Beyond the starting material</h2><p>The curriculum includes supplemental explanations, edge cases, production tradeoffs, and original examples based on your requirements and public vendor references. No PDF was accessible in the workspace during creation; this edition does not claim to reproduce or exhaustively cover an unseen PDF. The field guide is broad preparation, not an encyclopedia of every database vendor or specialist feature.</p><h2>Study data and privacy</h2><p>All sample people, orders, and products are fictional. SQL runs in a disposable browser-local database with no backend connection. Study progress and notes use browser-local storage when available. File location, browser, profile, or clearing site data may change that storage; export/import preserves your progress between packages. The package contains no MM2 source, environment variables, or credentials.</p>${downloads}<h2>Further reading</h2><ul>${sources.map(([title, url]) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></li>`).join('')}</ul><h2>Local study data</h2><div class="button-row"><button class="button secondary" data-action="export-progress">${icon('download')}Export progress</button><button class="button secondary" data-action="import-progress">${icon('upload')}Import progress</button><button class="button secondary" data-action="reset-progress">${icon('rotate-ccw')}Reset progress</button></div><p>Review schedule: 1, 3, 7, 14, and 30 days after a remembered card; five minutes after a missed card. This is a simple study schedule, not a prediction of memory performance.</p></article>`;
}

function closeMenu() { byId('sidebar').classList.remove('open'); byId('menu-button').setAttribute('aria-expanded', 'false'); byId('nav-scrim').hidden = true; }
function hideTooltip() { byId('tooltip').hidden = true; document.querySelectorAll('[aria-describedby="tooltip"]').forEach(element => element.removeAttribute('aria-describedby')); }
function showTooltip(button) {
    const module = moduleById(button.dataset.tooltipModule);
    if (!module || innerWidth < 700) return;
    const tooltip = byId('tooltip');
    tooltip.innerHTML = `<strong>${module.chapter} / ${escape(module.title)}</strong><p>${escape(module.purpose)}</p>`;
    tooltip.hidden = false;
    button.setAttribute('aria-describedby', 'tooltip');
    const box = button.getBoundingClientRect();
    const bounds = tooltip.getBoundingClientRect();
    tooltip.style.left = `${Math.max(10, Math.min(box.left, innerWidth - bounds.width - 12))}px`;
    tooltip.style.top = `${Math.max(10, box.top > bounds.height + 15 ? box.top - bounds.height - 9 : Math.min(box.bottom + 10, innerHeight - bounds.height - 12))}px`;
}
function renderPage() {
    hideTooltip();
    renderNavigation();
    if (state.view === 'roadmap') renderRoadmap();
    else if (state.view === 'library') renderLibrary();
    else if (state.view === 'reference') renderLibrary(true);
    else if (state.view === 'compare') renderComparisons();
    else if (state.view === 'revision') renderRevision();
    else if (state.view === 'interview') renderInterview();
    else if (state.view === 'lab') renderLab();
    else renderSources();
    closeMenu();
    document.querySelectorAll('[role="tab"]').forEach(tab => { tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1; });
    refreshIcons();
    drawDiagrams();
}
function go(view, id = '') {
    if (byId('lesson-dialog').open) byId('lesson-dialog').close();
    const hash = `#/${view}${id ? '/' + id : ''}`;
    if (location.hash === hash) applyRoute(); else location.hash = hash;
}
function applyRoute() {
    const [view, id] = location.hash.replace(/^#\/?/, '').split('/');
    state.view = [...pages.map(page => page[0]), 'sources'].includes(view) ? view : 'roadmap';
    if (state.view === 'compare' && comparisons.some(item => item.id === id)) state.comparison = id;
    renderPage();
    if (id && itemById(id) && state.view !== 'compare') openLesson(id, false);
    document.title = `SQL Field Guide | ${pages.find(page => page[0] === state.view)?.[1] || 'Scope & references'}`;
}
function openLab(id) {
    const item = labExamples.find(item => item.id === id);
    if (!item) return;
    state.labExample = id;
    state.sql = item.sql;
    state.labResults = null;
    go('lab');
}
function exportProgress() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SQL-study-progress.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function openSearch() { hideTooltip(); byId('search-input').value = ''; renderSearch(); byId('search-dialog').showModal(); byId('search-input').focus(); }
function renderSearch() {
    const query = byId('search-input').value.toLowerCase().trim();
    const items = concepts.filter(item => !query || `${item.title} ${item.definition} ${item.syntax}`.toLowerCase().includes(query));
    const compareItems = query ? comparisons.filter(item => item.title.toLowerCase().includes(query)) : [];
    byId('search-results').innerHTML = [...compareItems.slice(0, 5).map(item => `<button class="search-result" data-search-compare="${item.id}">${icon('columns-3')}<span><strong>${escape(item.title)}</strong><small>Comparison</small></span></button>`), ...items.slice(0, 20).map(item => `<button class="search-result" data-search-open="${item.id}">${icon(moduleById(item.module).icon)}<span><strong>${escape(item.title)}</strong><small>${escape(moduleById(item.module).title)}</small></span></button>`)].join('') || '<div class="empty-state">No matching topics</div>';
    byId('search-status').textContent = `${items.length} matching concepts / ${compareItems.length} comparisons`;
    refreshIcons();
}
async function copySQL(id) {
    const text = byId(id)?.textContent;
    if (!text) return;
    try { await navigator.clipboard.writeText(text); toast('SQL copied'); }
    catch {
        const input = document.createElement('textarea');
        input.value = text;
        input.style.cssText = 'position:fixed;left:-9999px;top:0';
        (byId('lesson-dialog').open ? byId('lesson-dialog') : document.body).append(input);
        input.select();
        const copied = document.execCommand('copy');
        input.remove();
        toast(copied ? 'SQL copied' : 'Clipboard unavailable; select the SQL text to copy.');
    }
}

document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const data = button.dataset;
    if (data.close) byId(data.close).close();
    if (data.open) openLesson(data.open);
    if (data.module) { state.module = data.module; state.query = ''; state.level = ''; state.bookmarkedOnly = false; go('library'); }
    if (data.compare) go('compare', data.compare);
    if (data.lab) openLab(data.lab);
    if (data.copy) copySQL(data.copy);
    if (data.bookmark) {
        progress.bookmarks = progress.bookmarks.includes(data.bookmark) ? progress.bookmarks.filter(id => id !== data.bookmark) : [...progress.bookmarks, data.bookmark];
        saveProgress();
        button.classList.toggle('active', progress.bookmarks.includes(data.bookmark));
        button.setAttribute('aria-pressed', String(progress.bookmarks.includes(data.bookmark)));
        renderConceptRows();
    }
    if (data.known) {
        progress.known = progress.known.includes(data.known) ? progress.known.filter(id => id !== data.known) : [...progress.known, data.known];
        saveProgress();
        openLesson(data.known);
        if (state.view === 'roadmap') renderRoadmap();
        renderConceptRows();
        refreshIcons();
    }
    if (data.lessonOffset) { const target = concepts[concepts.findIndex(item => item.id === state.lessonId) + Number(data.lessonOffset)]; if (target) openLesson(target.id); }
    if (data.roadmapTab) { state.roadmapTab = data.roadmapTab; renderPage(); }
    if (data.interviewMode) { state.interviewMode = data.interviewMode; renderPage(); }
    if (data.grade) {
        const item = reviewCards()[state.reviewIndex];
        if (item) { progress.reviews[item.id] = reviewSchedule(progress.reviews[item.id], data.grade === 'remembered'); saveProgress(); state.reviewRevealed = false; if (state.reviewMode !== 'due') state.reviewIndex++; renderPage(); }
    }
    if (data.searchOpen) { byId('search-dialog').close(); openLesson(data.searchOpen); }
    if (data.searchCompare) { byId('search-dialog').close(); go('compare', data.searchCompare); }
    const action = data.action;
    if (action === 'reveal-card') { state.reviewRevealed = true; renderPage(); }
    if (action === 'skip-card') { state.reviewIndex++; state.reviewRevealed = false; renderPage(); }
    if (action === 'review-all') { state.reviewMode = 'all'; state.reviewModule = ''; state.reviewIndex = 0; renderPage(); }
    if (action === 'check-answer' && state.choice !== null) {
        const item = quizQuestions()[state.interviewIndex];
        progress.attempts[item.id] = { choice: state.choice, correct: state.choice === item.correct };
        state.submitted = true; saveProgress(); renderPage();
    }
    if (action === 'next-question') { state.interviewIndex = (state.interviewIndex + 1) % Math.max(1, quizQuestions().length); state.choice = null; state.submitted = false; renderPage(); }
    if (action === 'reveal-coding') { state.codingRevealed = true; renderPage(); }
    if (action === 'next-coding') { state.codingIndex++; state.codingRevealed = false; renderPage(); }
    if (action === 'run-sql') runSQL();
    if (action === 'cancel-sql') { state.labResults = null; startDatabase('Query cancelled; sample data reset.'); renderLabResults(); }
    if (action === 'reset-db') { state.labResults = null; startDatabase('Sample database restored.'); renderLabResults(); }
    if (action === 'export-progress') exportProgress();
    if (action === 'import-progress') byId('import-file').click();
    if (action === 'reset-progress') byId('confirm-dialog').showModal();
    if (button.id === 'bookmark-filter') { state.bookmarkedOnly = !state.bookmarkedOnly; button.classList.toggle('active', state.bookmarkedOnly); button.setAttribute('aria-pressed', String(state.bookmarkedOnly)); renderConceptRows(); }
});
document.addEventListener('input', event => {
    if (event.target.id === 'concept-search') { state.query = event.target.value; renderConceptRows(); }
    if (event.target.id === 'lesson-notes' && state.lessonId) { progress.notes[state.lessonId] = event.target.value; saveProgress(); }
    if (event.target.id === 'sql-editor') state.sql = event.target.value;
});
document.addEventListener('change', event => {
    const { id, value, name } = event.target;
    if (id === 'module-filter') { state.module = value; renderConceptRows(); }
    if (id === 'level-filter') { state.level = value; renderConceptRows(); }
    if (id === 'comparison-select') go('compare', value);
    if (id === 'review-mode') { state.reviewMode = value; state.reviewIndex = 0; state.reviewRevealed = false; renderPage(); }
    if (id === 'review-module') { state.reviewModule = value; state.reviewIndex = 0; state.reviewRevealed = false; renderPage(); }
    if (id === 'interview-module') { state.interviewModule = value; state.interviewIndex = 0; state.choice = null; state.submitted = false; renderPage(); }
    if (name === 'quiz-answer') { state.choice = Number(value); byId('check-answer').disabled = false; }
    if (id === 'lab-example') { state.labExample = value; state.sql = labExamples.find(item => item.id === value).sql; state.labResults = null; renderPage(); }
});
byId('lesson-content').addEventListener('click', event => {
    const link = event.target.closest('.lesson-index a');
    if (!link) return;
    event.preventDefault();
    byId(link.hash.slice(1)).scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});
byId('lesson-dialog').addEventListener('close', () => {
    const previous = state.lessonId;
    state.lessonId = null;
    if (location.hash === `#/${state.view}/${previous}`) history.replaceState(null, '', `#/${state.view}`);
});
byId('menu-button').addEventListener('click', () => { const open = byId('sidebar').classList.toggle('open'); byId('menu-button').setAttribute('aria-expanded', String(open)); byId('nav-scrim').hidden = !open; });
byId('nav-scrim').addEventListener('click', closeMenu);
byId('search-button').addEventListener('click', openSearch);
byId('search-input').addEventListener('input', renderSearch);
byId('search-input').addEventListener('keydown', event => { if (event.key === 'ArrowDown') { event.preventDefault(); byId('search-results').querySelector('button')?.focus(); } if (event.key === 'Enter') byId('search-results').querySelector('button')?.click(); });
byId('search-results').addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...byId('search-results').querySelectorAll('button')];
    buttons[(buttons.indexOf(document.activeElement) + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
});
byId('export-button').addEventListener('click', exportProgress);
byId('import-button').addEventListener('click', () => byId('import-file').click());
byId('import-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    try {
        if (!file || file.size > 1000000) throw new Error('Choose a study progress JSON file under 1 MB.');
        progress = validateProgress(JSON.parse(await file.text()), conceptIds, questionIds);
        saveProgress(); renderPage(); toast('Study progress imported');
    } catch (error) { toast(error.message); }
    event.target.value = '';
});
byId('confirm-reset').addEventListener('click', () => { progress = blankProgress(); saveProgress(); byId('confirm-dialog').close(); renderPage(); toast('Study progress reset'); });
document.addEventListener('mouseover', event => { const button = event.target.closest('[data-tooltip-module]'); if (button) showTooltip(button); });
document.addEventListener('mouseout', event => { if (event.target.closest('[data-tooltip-module]')) hideTooltip(); });
document.addEventListener('focusin', event => { if (event.target.matches('[data-tooltip-module]')) showTooltip(event.target); });
document.addEventListener('focusout', hideTooltip);
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); byId('main').focus(); });
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { hideTooltip(); closeMenu(); }
    const list = event.target.closest('[role="tablist"]');
    if (list && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const tabs = [...list.querySelectorAll('[role="tab"]')];
        const index = tabs.indexOf(event.target);
        const targetIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        const target = tabs[targetIndex];
        const attribute = target.dataset.roadmapTab ? 'data-roadmap-tab' : 'data-interview-mode';
        const value = target.getAttribute(attribute);
        target.click();
        document.querySelector(`[${attribute}="${value}"]`)?.focus();
    }
});
window.addEventListener('resize', hideTooltip);
window.addEventListener('hashchange', applyRoute);
window.addEventListener('beforeunload', () => { worker?.terminate(); });
mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: {
        darkMode: true,
        background: '#080c0e',
        fontFamily: 'IBM Plex Sans',
        primaryColor: '#17251d',
        primaryBorderColor: '#93c6a4',
        primaryTextColor: '#f1f5f2',
        secondaryColor: '#1b2735',
        secondaryBorderColor: '#8ab4dd',
        secondaryTextColor: '#f1f5f2',
        tertiaryColor: '#302718',
        tertiaryBorderColor: '#c5a367',
        tertiaryTextColor: '#f1f5f2',
        textColor: '#f1f5f2',
        titleColor: '#f1f5f2',
        lineColor: '#bac5be',
        edgeLabelBackground: '#111613',
        nodeTextColor: '#f1f5f2',
        clusterBkg: '#111613',
        clusterBorder: '#65776b',
        attributeBackgroundColorOdd: '#111613',
        attributeBackgroundColorEven: '#1b2921'
    }
});
document.fonts.ready.then(applyRoute);