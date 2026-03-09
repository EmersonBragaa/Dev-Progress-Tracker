/* =====================================================
   app.js — Progresso do Dev Xodozada
   Pure Vanilla JS — no frameworks
   ===================================================== */

const STORAGE_KEY = 'devXodozada_v1';

const LEVELS = [
  { min: 0,  max: 20,  number: 1, title: 'Beginner'  },
  { min: 20, max: 40,  number: 2, title: 'Explorer'  },
  { min: 40, max: 60,  number: 3, title: 'Developer' },
  { min: 60, max: 80,  number: 4, title: 'Builder'   },
  { min: 80, max: 101, number: 5, title: 'Master'    },
];


/* ── SAVE & LOAD ──────────────────────────────────── */

function saveState() {
  const checkboxes = document.querySelectorAll('.subtopic-check');
  const state = {};
  checkboxes.forEach(cb => {
    state[cb.dataset.subtopicId] = cb.checked;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}


/* ── TOPIC PROGRESS ───────────────────────────────── */

function updateTopicProgress(topicId) {
  const all     = document.querySelectorAll(`.subtopic-check[data-topic-id="${topicId}"]`);
  const checked = document.querySelectorAll(`.subtopic-check[data-topic-id="${topicId}"]:checked`);

  const total   = all.length;
  const done    = checked.length;
  const pct     = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = pct === 100;

  // Text: "2/4"
  const progressText = document.getElementById(`topic-${topicId}-progress`);
  if (progressText) progressText.textContent = `${done}/${total}`;

  // Bar width
  const bar = document.getElementById(`topic-${topicId}-bar`);
  if (bar) {
    bar.style.width = `${pct}%`;
    bar.classList.toggle('is-complete', complete);
  }

  // Status dot
  const dot = document.getElementById(`topic-${topicId}-dot`);
  if (dot) {
    dot.classList.toggle('is-complete', complete);
    // Also support class name 'complete' as requested in prompt
    dot.classList.toggle('complete', complete);
  }
}


/* ── GLOBAL PROGRESS ──────────────────────────────── */

function updateGlobalProgress() {
  const all     = document.querySelectorAll('.subtopic-check');
  const checked = document.querySelectorAll('.subtopic-check:checked');

  const total = all.length;
  const done  = checked.length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  // Percentage text
  const pctEl = document.getElementById('progress-percent');
  if (pctEl) pctEl.textContent = `${pct}%`;

  // Progress bar fill
  const fill = document.getElementById('progress-bar-fill');
  if (fill) {
    fill.style.width = `${pct}%`;
  }

  // aria-valuenow on the track
  const track = document.getElementById('progress-bar-track');
  if (track) track.setAttribute('aria-valuenow', pct);

  updateLevel(pct);
}


/* ── LEVEL SYSTEM ─────────────────────────────────── */

function updateLevel(pct) {
  const level = LEVELS.find(l => pct >= l.min && pct < l.max)
             || LEVELS[LEVELS.length - 1];

  const numEl   = document.getElementById('level-number');
  const titleEl = document.getElementById('level-title');

  if (numEl && numEl.textContent !== String(level.number)) {
    numEl.textContent = level.number;
    // Brief flash animation
    numEl.classList.remove('level-change');
    void numEl.offsetWidth; // reflow
    numEl.classList.add('level-change');
  }

  if (titleEl) titleEl.textContent = level.title;
}


/* ── STATISTICS ───────────────────────────────────── */

function updateStats() {
  // Collect all unique topic IDs
  const topicIds = new Set(
    [...document.querySelectorAll('.subtopic-check')]
      .map(cb => cb.dataset.topicId)
  );

  let done = 0;
  let pending = 0;

  topicIds.forEach(id => {
    const all     = document.querySelectorAll(`.subtopic-check[data-topic-id="${id}"]`);
    const checked = document.querySelectorAll(`.subtopic-check[data-topic-id="${id}"]:checked`);
    if (all.length > 0 && all.length === checked.length) {
      done++;
    } else {
      pending++;
    }
  });

  const doneEl    = document.getElementById('stat-topics-done');
  const pendingEl = document.getElementById('stat-topics-pending');

  if (doneEl)    doneEl.textContent    = done;
  if (pendingEl) pendingEl.textContent = pending;

  updateDonut(done, done + pending);
}


/* ── DONUT CHART ──────────────────────────────────── */

function updateDonut(done, total) {
  const fill  = document.getElementById('donut-fill-topics');
  const label = document.getElementById('donut-label-topics');
  if (!fill || !label) return;

  const pct  = total === 0 ? 0 : Math.round((done / total) * 100);
  const circ = 100; // stroke-dasharray reference (viewBox-relative)

  fill.setAttribute('stroke-dasharray', `${pct} ${circ - pct}`);
  label.textContent = `${pct}%`;
}


/* ── RECALCULATE ALL ──────────────────────────────── */

function recalculateAll() {
  const topicIds = new Set(
    [...document.querySelectorAll('.subtopic-check')]
      .map(cb => cb.dataset.topicId)
  );
  topicIds.forEach(id => updateTopicProgress(id));
  updateGlobalProgress();
  updateStats();
}


/* ── EVENT LISTENERS ──────────────────────────────── */

function bindEvents() {
  // Use event delegation on the topics list for performance
  const topicsList = document.getElementById('topics-list');
  if (!topicsList) return;

  topicsList.addEventListener('change', e => {
    if (!e.target.classList.contains('subtopic-check')) return;

    const topicId = e.target.dataset.topicId;

    updateTopicProgress(topicId);
    updateGlobalProgress();
    updateStats();
    saveState();

    // Announce change to screen readers
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
      const label  = e.target.closest('.subtopic-label')
                              ?.querySelector('.subtopic-text')
                              ?.textContent || '';
      const status = e.target.checked ? 'concluído' : 'pendente';
      announcer.textContent = `${label}: ${status}`;
    }
  });
}


/* ── INIT ─────────────────────────────────────────── */

function init() {
  // 1. Restore checkbox states from localStorage
  const state = loadState();
  const checkboxes = document.querySelectorAll('.subtopic-check');

  checkboxes.forEach(cb => {
    const saved = state[cb.dataset.subtopicId];
    if (typeof saved === 'boolean') cb.checked = saved;
  });

  // 2. Recalculate all progress from restored state
  recalculateAll();

  // 3. Bind interaction events
  bindEvents();
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}