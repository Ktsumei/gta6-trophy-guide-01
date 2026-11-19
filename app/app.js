// Leonida Trophy Guide — offline checklist + tracker for GTA VI's 55 PS5 trophies.
// Loads app/data/trophies.json (a local file, nothing over the network), renders the
// checklist, the roadmap and one trophy's guide at a time, and saves progress in
// localStorage. Query params are only for reproducible screenshot scenes:
//   ?shot=checklist | roadmap | guide | filters
//   ?id=28            open one trophy's guide (with shot=guide)
//   ?grade=silver     pre-apply a grade filter
//   ?kind=story       pre-apply a kind filter
//   ?spoilers=on      turn spoiler-safe on
//   ?earned=2,3,8     pre-tick trophies (screenshot scenes only)
//   ?scroll=1200      scroll to a pixel offset after painting

const STORE_KEY = 'leonida-trophy-guide-v1';
const UNCONFIRMED_PHRASE = 'not yet confirmed by the trophy guides';

const KIND_LABELS = {
  story: 'Story',
  character: 'Character quest',
  collectible: 'Collectible',
  activity: 'Activity',
  robbery: 'Robbery',
  completion: '100% completion',
  misc: 'One-off',
  platinum: 'Platinum',
};

const STAGES = [
  {
    n: 1,
    title: 'Play the story',
    hours: 'Chapters 1–5 · about 60–80 hours',
    blurb: 'Finish the story and do the optional missions as they appear. Scan vehicles and study animals as you pass them — that progress already counts toward 100%.',
    notes: ['All 12 story trophies pop on their own', 'Character questlines start by phone call or text', 'Do the one missable meditation in Chapter 1'],
  },
  {
    n: 2,
    title: 'The 100% checklist',
    hours: 'After the story · about 100 hours',
    blurb: 'The checklist unlocks under Progress > Stats > 100% Completion. It is lenient — closer to 60% true completion — and nothing on it can be missed.',
    notes: ['200 of 277 base-model vehicles scanned', '100 of 255 animals studied', '300 stunts · 70 of 80 challenges', 'All robberies, ranges, drone races and Bret quests'],
  },
  {
    n: 3,
    title: 'Strangers & cleanup',
    hours: 'Free roam · about 10 hours',
    blurb: 'Finish the stranger strands, the partner robberies and the one-off stunts. The platinum pops when the last of these is done.',
    notes: ['8 stranger strands (Yago’s race is time-sensitive)', 'Partner robberies need both characters free', 'The 5 unconfirmed trophies, as guides pin them down'],
  },
];

const state = {
  trophies: [],
  earned: new Set(),
  spoilers: false,
  search: '',
  grade: 'all',
  kind: 'all',
  status: 'all',
  selected: null,
};

const $ = (id) => document.getElementById(id);

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned.filter(Number.isInteger));
    if (typeof saved.spoilers === 'boolean') state.spoilers = saved.spoilers;
  } catch (_) {
    // A corrupt saved file just means we start fresh.
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: [...state.earned].sort((a, b) => a - b),
      spoilers: state.spoilers,
    }));
  } catch (_) {
    // Private mode or a full store: the page still works, it just won't remember.
  }
}

function isUnconfirmed(t) {
  return t.guide.includes(UNCONFIRMED_PHRASE);
}

function isMasked(t) {
  return state.spoilers && !state.earned.has(t.id) && (t.hidden || t.kind === 'story');
}

function gradeWord(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function visibleTrophies() {
  const q = state.search.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.kind === 'missable') {
      if (!t.missable) return false;
    } else if (state.kind !== 'all' && t.kind !== state.kind) {
      return false;
    }
    if (state.status === 'earned' && !state.earned.has(t.id)) return false;
    if (state.status === 'unearned' && state.earned.has(t.id)) return false;
    if (q) {
      const hay = [t.name, t.description, t.guide, KIND_LABELS[t.kind] || t.kind, t.chapter ? 'chapter ' + t.chapter : ''].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderProgress() {
  const earned = state.earned.size;
  const total = state.trophies.length || 55;
  const pct = Math.round((earned / total) * 100);
  $('earned-count').textContent = earned;
  $('earned-pct').textContent = pct + '%';
  $('progress-fill').style.width = pct + '%';
  $('progress-bar').setAttribute('aria-valuenow', String(earned));

  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  $('grade-chips').innerHTML = grades.map((g) => {
    const got = state.trophies.filter((t) => t.grade === g && state.earned.has(t.id)).length;
    const all = state.trophies.filter((t) => t.grade === g).length;
    return '<span class="grade-chip"><span class="dot dot-' + g + '"></span>' + gradeWord({ grade: g }) + ' ' + got + ' / ' + all + '</span>';
  }).join('');
}

function renderRoadmap() {
  $('roadmap-stages').innerHTML = STAGES.map((s) => {
    const inStage = state.trophies.filter((t) => t.roadmap === s.n);
    const done = inStage.filter((t) => state.earned.has(t.id)).length;
    const items = s.notes.map((n) => '<li>' + n + '</li>').join('');
    return '<article class="stage"><span class="stage-num">Stage ' + s.n + '</span>' +
      '<h3>' + s.title + '</h3><p>' + s.hours + '</p><p>' + s.blurb + '</p>' +
      '<ul>' + items + '</ul>' +
      '<p><strong>' + done + ' / ' + inStage.length + '</strong> trophies in this stage</p></article>';
  }).join('');
}

function cardHtml(t) {
  const earned = state.earned.has(t.id);
  const masked = isMasked(t);
  const name = masked ? 'Hidden trophy' : t.name;
  const desc = masked
    ? 'A story trophy PlayStation hides until it is earned. Tick it off once you have it.'
    : t.description;
  const tags = [];
  tags.push('<span class="tag tag-grade-' + t.grade + '">' + gradeWord(t) + '</span>');
  tags.push('<span class="tag">' + (KIND_LABELS[t.kind] || t.kind) + '</span>');
  if (t.chapter) tags.push('<span class="tag">Chapter ' + t.chapter + '</span>');
  if (t.count != null) tags.push('<span class="tag">' + t.count.toLocaleString('en-US') + ' needed</span>');
  if (t.missable) tags.push('<span class="tag tag-missable">Missable — do it in time</span>');
  if (t.hidden) tags.push('<span class="tag tag-hidden">Hidden</span>');
  if (isUnconfirmed(t)) tags.push('<span class="tag tag-unconfirmed">Method unconfirmed</span>');
  return '<li><button type="button" class="trophy-card' + (earned ? ' earned' : '') + (state.selected === t.id ? ' selected' : '') + '" data-id="' + t.id + '" aria-pressed="' + earned + '">' +
    '<span class="check" aria-hidden="true">' + (earned ? '✓' : '') + '</span>' +
    '<span><span class="trophy-name' + (masked ? ' spoiler-mask' : '') + '">' + name + '</span>' +
    '<span class="trophy-desc' + (masked ? ' spoiler-mask' : '') + '">' + desc + '</span>' +
    '<span class="trophy-meta">' + tags.join('') + '</span></span>' +
    '<span class="trophy-grade-mark mark-' + t.grade + '" aria-hidden="true"></span>' +
    '</button></li>';
}

function renderList() {
  const list = visibleTrophies();
  $('trophy-list').innerHTML = list.map(cardHtml).join('');
  $('empty-state').hidden = list.length > 0;
  $('shown-count').textContent = 'Showing ' + list.length + ' of ' + state.trophies.length + ' trophies';
  const earned = state.earned.size;
  $('list-sub').textContent = '— ' + earned + ' earned, ' + (state.trophies.length - earned) + ' to go';
}

function renderDetail() {
  const box = $('detail');
  const t = state.trophies.find((x) => x.id === state.selected);
  if (!t) {
    box.innerHTML = '<p class="detail-empty">Pick a trophy from the checklist to read its full guide, with the source each fact comes from.</p>';
    return;
  }
  const earned = state.earned.has(t.id);
  const masked = isMasked(t);
  const name = masked ? 'Hidden trophy' : t.name;
  const desc = masked
    ? 'This trophy is hidden on PlayStation until it is earned. Turn spoiler-safe off, or tick it off once you have it, to read the guide.'
    : t.description;
  const tags = [];
  tags.push('<span class="tag tag-grade-' + t.grade + '">' + gradeWord(t) + '</span>');
  tags.push('<span class="tag">' + (KIND_LABELS[t.kind] || t.kind) + '</span>');
  if (t.chapter) tags.push('<span class="tag">Chapter ' + t.chapter + '</span>');
  if (t.count != null) tags.push('<span class="tag">' + t.count.toLocaleString('en-US') + ' needed</span>');
  if (t.hidden) tags.push('<span class="tag tag-hidden">Hidden</span>');

  let warn = '';
  if (t.missable) {
    warn += '<p class="detail-warning"><strong>Missable — do it in time.</strong> ' +
      'This is the one trophy that can be missed: the first meditation is Lucia on the balcony at Jason’s house in Chapter 1, after Down to Earth. Keep a Chapter 1 save.</p>';
  }
  if (isUnconfirmed(t)) {
    warn += '<p class="detail-warning unconfirmed"><strong>Method not yet confirmed.</strong> ' +
      'The trophy guides have not pinned down the exact requirement yet. This guide says so honestly rather than guessing — check the source link for updates.</p>';
  }

  const guide = masked ? '' : '<h3>How to earn it</h3><p class="guide-text">' + t.guide + '</p>';
  const sources = masked ? '' : '<h3>Sources</h3><ul class="sources">' +
    t.sources.map((s) => '<li><a href="' + s.url + '" target="_blank" rel="noopener">' + s.name + '</a></li>').join('') + '</ul>';

  box.innerHTML = '<h2>' + name + '</h2><p class="trophy-desc">' + desc + '</p>' +
    '<div class="trophy-meta">' + tags.join('') + '</div>' + warn + guide + sources +
    '<div class="detail-actions"><button type="button" class="btn btn-earned" id="detail-toggle" aria-pressed="' + earned + '">' +
    (earned ? '✓ Earned — tap to untick' : 'Mark as earned') + '</button></div>';

  $('detail-toggle').addEventListener('click', () => {
    toggleEarned(t.id);
    renderDetail();
  });
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
  renderDetail();
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveProgress();
  renderProgress();
  renderRoadmap();
  renderList();
}

function applyScene() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot') || 'checklist';

  if (params.get('grade')) {
    state.grade = params.get('grade');
    $('filter-grade').value = state.grade;
  }
  if (params.get('kind')) {
    state.kind = params.get('kind');
    $('filter-kind').value = state.kind;
  }
  if (params.get('status')) {
    state.status = params.get('status');
    $('filter-status').value = state.status;
  }
  if (params.get('spoilers') === 'on') {
    state.spoilers = true;
    $('spoiler-toggle').checked = true;
  }
  if (params.get('spoilers') === 'off') {
    state.spoilers = false;
    $('spoiler-toggle').checked = false;
  }
  if (params.get('earned')) {
    params.get('earned').split(',').map((s) => parseInt(s, 10)).filter(Number.isInteger).forEach((id) => state.earned.add(id));
  }
  if (params.get('search')) {
    state.search = params.get('search');
    $('search').value = state.search;
  }

  if (shot === 'guide' && params.get('id')) {
    const id = parseInt(params.get('id'), 10);
    if (state.trophies.some((t) => t.id === id)) state.selected = id;
    // Compact the masthead so more of the open guide — and its sources —
    // fits in the frame.
    document.body.classList.add('shot-guide');
  } else if (shot === 'roadmap') {
    // Put the roadmap at the top of the page for this scene, so it renders
    // fully without relying on a scroll (the headless shell does not reliably
    // repaint a page scrolled far down before a screenshot). Compact the
    // masthead too, so the three stage cards fit in the frame.
    state.selected = null;
    document.body.classList.add('shot-roadmap');
    const main = document.querySelector('main');
    const content = document.querySelector('.content');
    main.insertBefore($('roadmap'), content);
  } else if (shot === 'filters') {
    if (!params.get('grade')) { state.grade = 'silver'; $('filter-grade').value = 'silver'; }
    if (params.get('spoilers') !== 'off') { state.spoilers = true; $('spoiler-toggle').checked = true; }
  }

  renderAll();

  // Let the layout settle, then honour a scene scroll. The scroll is instant:
  // a smooth scroll would still be animating when a screenshot is taken.
  const scroll = parseInt(params.get('scroll') || '', 10);
  requestAnimationFrame(() => {
    if (Number.isInteger(scroll) && scroll > 0) {
      window.scrollTo({ top: scroll, behavior: 'instant' });
    }
    window.__shotReady = true;
  });
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    guide: 'Leonida Trophy Guide',
    exported_at: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    spoilers: state.spoilers,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!Array.isArray(data.earned)) throw new Error('no earned list');
      const valid = new Set(state.trophies.map((t) => t.id));
      state.earned = new Set(data.earned.filter((id) => valid.has(id)));
      if (typeof data.spoilers === 'boolean') {
        state.spoilers = data.spoilers;
        $('spoiler-toggle').checked = state.spoilers;
      }
      saveProgress();
      renderAll();
    } catch (_) {
      alert('That file is not a trophy progress export from this guide.');
    }
  };
  reader.readAsText(file);
}

async function init() {
  loadProgress();
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  state.trophies = data.trophies;

  $('search').addEventListener('input', (e) => { state.search = e.target.value; renderList(); });
  $('filter-grade').addEventListener('change', (e) => { state.grade = e.target.value; renderList(); });
  $('filter-kind').addEventListener('change', (e) => { state.kind = e.target.value; renderList(); });
  $('filter-status').addEventListener('change', (e) => { state.status = e.target.value; renderList(); });
  $('spoiler-toggle').addEventListener('change', (e) => {
    state.spoilers = e.target.checked;
    saveProgress();
    renderList();
    renderDetail();
  });

  $('trophy-list').addEventListener('click', (e) => {
    const card = e.target.closest('.trophy-card');
    if (!card) return;
    const id = parseInt(card.dataset.id, 10);
    if (e.target.closest('.check')) {
      toggleEarned(id);
      renderDetail();
      return;
    }
    state.selected = id;
    renderList();
    renderDetail();
  });

  $('export-btn').addEventListener('click', exportProgress);
  $('import-file').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  $('reset-btn').addEventListener('click', () => {
    if (state.earned.size === 0) return;
    if (!confirm('Clear all earned trophies?')) return;
    state.earned.clear();
    saveProgress();
    renderAll();
  });

  applyScene();
}

init();
