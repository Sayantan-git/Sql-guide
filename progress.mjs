export const intervals = [1, 3, 7, 14, 30];
export function blankProgress() {
    return { version: 1, known: [], bookmarks: [], reviews: {}, attempts: {}, notes: {} };
}
export function reviewSchedule(previous, remembered, now = Date.now()) {
    const stage = remembered ? Math.min((previous?.stage ?? -1) + 1, intervals.length - 1) : -1;
    return { stage, due: now + (remembered ? intervals[stage] * 86400000 : 300000), reviewed: now };
}
export function validateProgress(input, conceptIds, questionIds) {
    if (!input || input.version !== 1 || !Array.isArray(input.known) || !Array.isArray(input.bookmarks)) throw new Error('Not a supported SQL study progress file.');
    const output = blankProgress();
    output.known = [...new Set(input.known.filter(id => conceptIds.has(id)))];
    output.bookmarks = [...new Set(input.bookmarks.filter(id => conceptIds.has(id)))];
    for (const [id, value] of Object.entries(input.reviews || {})) {
        if (conceptIds.has(id) && Number.isInteger(value?.stage) && value.stage >= -1 && value.stage < intervals.length && Number.isFinite(value.due) && Number.isFinite(value.reviewed)) output.reviews[id] = { stage: value.stage, due: value.due, reviewed: value.reviewed };
    }
    for (const [id, value] of Object.entries(input.attempts || {})) {
        if (questionIds.has(id) && Number.isInteger(value?.choice) && value.choice >= 0 && value.choice < 4 && typeof value.correct === 'boolean') output.attempts[id] = { choice: value.choice, correct: value.correct };
    }
    for (const [id, value] of Object.entries(input.notes || {})) if (conceptIds.has(id) && typeof value === 'string') output.notes[id] = value.slice(0, 5000);
    return output;
}