/* =========================================================
   AI Resource Library — rendering, filtering, search.
   Reads /data/resources.json and drives resources.html.
   Views:
     - landing      : no ?category and no ?q  → category tile grid
     - search-all   : no ?category but ?q     → search across all resources
     - category     : ?category=<id>          → filter sidebar + cards
   ========================================================= */

(function () {
  'use strict';

  const DATA_URL = './data/resources.json';

  // TODO: Replace mailto-based actions with Google Form URLs once Claire
  // provides them. Until then, every submit/edit/review action opens a
  // pre-filled email to the affinity group inbox.
  const CONTACT_EMAIL = 'aipolicyag@gmail.com';
  const SUBMIT_URL = `mailto:${CONTACT_EMAIL}?subject=Resource%20submission`;

  // Build a mailto: URL with a properly-encoded subject and body.
  function mailtoLink(subject, body) {
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const FILTER_DIMENSIONS = ['format', 'level', 'cost', 'topic'];

  const FILTER_LABELS = {
    format: 'Format',
    level: 'Level',
    cost: 'Cost',
    topic: 'Topic',
  };

  // Inline Lucide SVGs for the 7 category icons (kept inline so we don't
  // depend on a CDN at runtime). All 24x24, currentColor stroke.
  const ICONS = {
    compass:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"/></svg>',
    newspaper:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8z"/></svg>',
    telescope:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/></svg>',
    'graduation-cap':
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>',
    wrench:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    calendar:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
    code:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    'scroll-text':
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>',
    'shield-check':
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
    'book-open':
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
  };

  // Look up the human-readable definition for a tag value from
  // tagTaxonomy.definitions[dim][value]. Returns null if missing.
  function getDefinition(dim, value) {
    const defs = data && data.tagTaxonomy && data.tagTaxonomy.definitions;
    if (!defs || !defs[dim]) return null;
    return defs[dim][value] || null;
  }

  // Normalize a tag field that may be a string, an array, or absent.
  // Used for format/level/cost which now accept either shape.
  function toArray(v) {
    if (Array.isArray(v)) return v.filter(Boolean);
    if (v == null || v === '') return [];
    return [v];
  }

  // Pretty-print a tag value: "ai-policy" → "AI policy"; "all-levels" → "All levels".
  function prettify(value) {
    if (!value) return '';
    const overrides = {
      'ai-policy': 'AI policy',
      'ai-governance': 'AI governance',
      'ai-safety': 'AI safety',
      'ai-ethics': 'AI ethics',
      'all-levels': 'All levels',
      'us': 'US',
      'use-cases': 'Use cases',
      'use-case': 'Use case',
      'agentic-ai': 'Agentic AI',
      'responsible-ai': 'Responsible AI',
      'developer-tools': 'Developer tools',
      'data-centers': 'Data centers',
      'national-security': 'National security',
      'materials-science': 'Materials science',
      'diversity-equity': 'Diversity & equity',
      'industry-strategy': 'Industry & strategy',
    };
    if (overrides[value]) return overrides[value];
    return value
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  // ---------- State ----------
  // category === null  →  landing (or search-all if q is set)
  const state = {
    category: null,
    filters: { format: [], level: [], cost: [], topic: [] },
    q: '',
  };

  let data = null;
  let categoryById = new Map();
  let countsByCategory = new Map();

  // ---------- DOM refs ----------
  const $ = sel => document.querySelector(sel);
  const els = {};

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    Object.assign(els, {
      heroMeta: $('#hero-meta'),

      landingView: $('#landing-view'),
      tiles: $('#category-tiles'),

      libraryView: $('#library-view'),
      breadcrumb: $('#breadcrumb-link'),
      libraryContext: $('#library-context'),

      filterGroups: $('#filter-groups'),
      cards: $('#resource-cards'),
      empty: $('#empty-state'),
      loading: $('#loading-state'),
      error: $('#error-state'),
      matchCount: $('#match-count'),
      activeFilters: $('#active-filters'),
      search: $('#resources-search'),
      clearBtn: $('#clear-filters'),

      filterOpen: $('#filter-open'),
      filterClose: $('#filter-close'),
      filterActiveCount: $('#filter-active-count'),
      filterSidebar: $('#filter-sidebar'),
      backdrop: $('#filter-backdrop'),

      submitCta: $('#submit-resource-cta'),
      emptyClear: $('#empty-state-clear'),
      emptySubmit: $('#empty-state-submit'),
    });

    // Wire up Submit links to the configured URL.
    [els.submitCta, els.emptySubmit].forEach(a => {
      if (a) a.href = SUBMIT_URL;
    });

    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      console.error('Failed to load resources:', err);
      els.loading.hidden = true;
      els.error.hidden = false;
      return;
    }

    categoryById = new Map(data.categories.map(c => [c.id, c]));
    countsByCategory = new Map();
    for (const r of data.resources) {
      countsByCategory.set(r.category, (countsByCategory.get(r.category) || 0) + 1);
    }

    if (data.lastUpdated && els.heroMeta) {
      els.heroMeta.textContent = `Last updated: ${formatDate(data.lastUpdated)}`;
    }

    els.loading.hidden = true;

    readStateFromURL();
    buildCategoryTiles();
    bindEvents();
    render();
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  // ---------- URL ↔ state ----------
  function readStateFromURL() {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    // Treat legacy ?category=all as "no category" so old shared links still work.
    state.category = cat && cat !== 'all' && categoryById.has(cat) ? cat : null;
    state.q = params.get('q') || '';
    for (const dim of FILTER_DIMENSIONS) {
      const v = params.get(dim);
      state.filters[dim] = v ? v.split(',').filter(Boolean) : [];
    }
    if (els.search) els.search.value = state.q;
  }

  function buildURL() {
    const params = new URLSearchParams();
    if (state.category) params.set('category', state.category);
    if (state.q) params.set('q', state.q);
    for (const dim of FILTER_DIMENSIONS) {
      if (state.filters[dim].length) params.set(dim, state.filters[dim].join(','));
    }
    const qs = params.toString();
    return qs ? `${location.pathname}?${qs}` : location.pathname;
  }

  function syncURL(replace = true) {
    const url = buildURL();
    const method = replace ? 'replaceState' : 'pushState';
    history[method](null, '', url);
  }

  // ---------- View routing ----------
  function getView() {
    if (state.category) return 'category';
    if (state.q.trim()) return 'search-all';
    return 'landing';
  }

  // ---------- Category tile grid ----------
  function buildCategoryTiles() {
    els.tiles.innerHTML = '';
    for (const cat of data.categories) {
      const tile = document.createElement('a');
      tile.className = 'category-tile';
      tile.href = `?category=${encodeURIComponent(cat.id)}`;
      tile.dataset.categoryId = cat.id;
      tile.setAttribute('role', 'listitem');

      const count = countsByCategory.get(cat.id) || 0;
      const iconSvg = ICONS[cat.icon] || '';
      const word = count === 1 ? 'resource' : 'resources';

      tile.innerHTML = `
        <span class="tile-icon" aria-hidden="true">${iconSvg}</span>
        <h2>${escapeHTML(cat.name)}</h2>
        <p class="tile-description">${escapeHTML(cat.description)}</p>
        <span class="tile-count">${count} ${word}</span>
      `;

      tile.addEventListener('click', e => {
        // Allow modifier-clicks / middle-click to open in new tab as a real link.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        goToCategory(cat.id);
      });

      els.tiles.appendChild(tile);
    }
  }

  function goToCategory(id) {
    state.category = id;
    state.filters = { format: [], level: [], cost: [], topic: [] };
    state.q = '';
    if (els.search) els.search.value = '';
    syncURL(false); // pushState so back returns to landing
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToLanding() {
    state.category = null;
    state.filters = { format: [], level: [], cost: [], topic: [] };
    state.q = '';
    if (els.search) els.search.value = '';
    syncURL(false); // pushState
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- Library context (breadcrumb subtitle) ----------
  function renderLibraryContext() {
    const view = getView();
    if (view === 'category') {
      const cat = categoryById.get(state.category);
      els.libraryContext.innerHTML = `
        <h2>${escapeHTML(cat.name)}</h2>
        <p>${escapeHTML(cat.description)}</p>
      `;
    } else if (view === 'search-all') {
      els.libraryContext.innerHTML = `
        <span class="search-indicator">
          <i class="fas fa-search" aria-hidden="true"></i> Searching all resources
        </span>
        <h2>Results for "${escapeHTML(state.q)}"</h2>
      `;
    } else {
      els.libraryContext.innerHTML = '';
    }
  }

  // ---------- Filters ----------
  function getCategoryResources() {
    if (!state.category) return data.resources;
    return data.resources.filter(r => r.category === state.category);
  }

  function getDimensionOptions(dim, baseList) {
    const seen = new Map();
    for (const r of baseList) {
      const values = toArray(r[dim]);
      for (const v of values) {
        if (!v) continue;
        seen.set(v, (seen.get(v) || 0) + 1);
      }
    }
    return [...seen.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, count }));
  }

  function buildFilters() {
    const baseList = getCategoryResources();
    els.filterGroups.innerHTML = '';

    for (const dim of FILTER_DIMENSIONS) {
      const opts = getDimensionOptions(dim, baseList);
      if (!opts.length) continue;

      const group = document.createElement('div');
      group.className = 'filter-group';
      group.dataset.dim = dim;

      const title = document.createElement('h3');
      title.className = 'filter-group-title';
      title.textContent = FILTER_LABELS[dim];
      group.appendChild(title);

      const list = document.createElement('div');
      list.className = 'filter-options';
      group.appendChild(list);

      for (const { value, count } of opts) {
        const checked = state.filters[dim].includes(value);
        const definition = getDefinition(dim, value);
        const label = document.createElement('label');
        label.className = 'filter-option' + (checked ? ' checked' : '') + (definition ? ' has-definition' : '');
        if (definition) label.dataset.tooltip = definition;
        label.innerHTML = `
          <input
            type="checkbox"
            value="${escapeAttr(value)}"
            ${checked ? 'checked' : ''}
          />
          <span class="opt-text">${escapeHTML(prettify(value))}</span>
          <span class="opt-count" aria-hidden="true">${count}</span>
        `;
        const input = label.querySelector('input');
        input.addEventListener('change', () => toggleFilter(dim, value));
        list.appendChild(label);
      }

      els.filterGroups.appendChild(group);
    }
  }

  function toggleFilter(dim, value) {
    const arr = state.filters[dim];
    const idx = arr.indexOf(value);
    if (idx === -1) arr.push(value);
    else arr.splice(idx, 1);
    render();
  }

  function clearAllFilters() {
    state.filters = { format: [], level: [], cost: [], topic: [] };
    state.q = '';
    if (els.search) els.search.value = '';
    render();
  }

  function activeFilterCount() {
    return FILTER_DIMENSIONS.reduce((n, d) => n + state.filters[d].length, 0);
  }

  function buildActiveFilterChips() {
    els.activeFilters.innerHTML = '';
    const total = activeFilterCount();

    if (state.q && getView() === 'category') {
      // In search-all view the search query is already in the page heading,
      // so don't double up. In category view, show it as a chip.
      els.activeFilters.appendChild(makeChip(`Search: "${state.q}"`, () => {
        state.q = '';
        if (els.search) els.search.value = '';
        render();
      }));
    }

    for (const dim of FILTER_DIMENSIONS) {
      for (const v of state.filters[dim]) {
        els.activeFilters.appendChild(
          makeChip(`${FILTER_LABELS[dim]}: ${prettify(v)}`, () => toggleFilter(dim, v))
        );
      }
    }

    if (total > 0) {
      els.filterActiveCount.textContent = String(total);
      els.filterActiveCount.hidden = false;
    } else {
      els.filterActiveCount.hidden = true;
    }
  }

  function makeChip(text, onRemove) {
    const chip = document.createElement('span');
    chip.className = 'active-filter-chip';
    chip.innerHTML = `${escapeHTML(text)} <button type="button" aria-label="Remove filter">&times;</button>`;
    chip.querySelector('button').addEventListener('click', onRemove);
    return chip;
  }

  // ---------- Filtering / search ----------
  function getFilteredResources() {
    let list = getCategoryResources();

    // OR-within-dimension: a resource matches if any of its values for this
    // dim is in the selected set. format/level/cost now accept arrays too.
    for (const dim of ['format', 'level', 'cost', 'topic']) {
      const sel = state.filters[dim];
      if (!sel.length) continue;
      list = list.filter(r => toArray(r[dim]).some(v => sel.includes(v)));
    }

    const q = state.q.trim().toLowerCase();
    if (q) {
      list = list.filter(r => {
        if ((r.title || '').toLowerCase().includes(q)) return true;
        if ((r.description || '').toLowerCase().includes(q)) return true;
        if ((r.author || '').toLowerCase().includes(q)) return true;
        if (Array.isArray(r.topic) && r.topic.some(t => t.toLowerCase().includes(q))) return true;
        return false;
      });
    }

    return list;
  }

  // ---------- Card rendering ----------
  function renderCards(list) {
    els.cards.innerHTML = '';
    if (!list.length) {
      els.empty.hidden = false;
      return;
    }
    els.empty.hidden = true;

    const frag = document.createDocumentFragment();
    for (const r of list) frag.appendChild(buildCard(r));
    els.cards.appendChild(frag);
  }

  function buildCard(r) {
    const card = document.createElement('article');
    card.className = 'resource-card';
    if (r.featured) card.classList.add('featured');
    if (r.category === 'tools-tested') card.classList.add('is-tool');

    const top = document.createElement('div');
    top.className = 'card-top';

    const h3 = document.createElement('h3');
    const a = document.createElement('a');
    a.href = r.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = r.title;
    h3.appendChild(a);
    top.appendChild(h3);

    if (r.featured) {
      const star = document.createElement('span');
      star.className = 'featured-star';
      star.innerHTML = `<i class="fas fa-star" aria-hidden="true"></i> Featured`;
      star.setAttribute('title', 'Featured resource');
      top.appendChild(star);
    }
    card.appendChild(top);

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    for (const v of toArray(r.format)) meta.appendChild(badge('format', v));
    for (const v of toArray(r.level)) meta.appendChild(badge('level', v));
    for (const v of toArray(r.cost)) meta.appendChild(badge('cost', v));
    card.appendChild(meta);

    const p = document.createElement('p');
    p.className = 'card-description';
    p.textContent = r.description || '';
    card.appendChild(p);

    const fieldNotes = buildFieldNotes(r);
    if (fieldNotes) card.appendChild(fieldNotes);

    if (Array.isArray(r.topic) && r.topic.length) {
      const topics = document.createElement('div');
      topics.className = 'card-topics';
      const visible = r.topic.slice(0, 3);
      const extra = r.topic.length - visible.length;
      for (const t of visible) {
        const chip = document.createElement('span');
        chip.className = 'topic-chip';
        chip.textContent = prettify(t);
        const def = getDefinition('topic', t);
        if (def) chip.dataset.tooltip = def;
        topics.appendChild(chip);
      }
      if (extra > 0) {
        const more = document.createElement('span');
        more.className = 'topic-chip more';
        more.textContent = `+${extra} more`;
        more.dataset.tooltip = r.topic.slice(3).map(prettify).join(', ');
        topics.appendChild(more);
      }
      card.appendChild(topics);
    }

    const attribution = buildAttribution(r);
    if (attribution) card.appendChild(attribution);

    const actions = buildCardActions(r);
    if (actions) card.appendChild(actions);

    return card;
  }

  // Per-card action links: "Suggest edit" + "Submit a review".
  // Each opens a pre-filled email referencing the specific resource.
  // The data-form-link attribute is kept as a hook for swapping in a
  // Google Form URL later without touching this logic.
  function suggestEditHref(r) {
    return mailtoLink(
      `Suggested edit: ${r.title}`,
      `Resource: ${r.title}\nLink: ${r.url}\nID: ${r.id}\n\n` +
      `What should change? (tags, description, category, level, cost, broken link, etc.)\n\n`
    );
  }
  function submitReviewHref(r) {
    return mailtoLink(
      `Review submission: ${r.title}`,
      `Resource: ${r.title}\nLink: ${r.url}\nID: ${r.id}\n\n` +
      `Your review:\n\n\nYour name (optional, for attribution):\n`
    );
  }

  function buildCardActions(r) {
    const wrap = document.createElement('div');
    wrap.className = 'card-actions';

    const edit = document.createElement('a');
    edit.href = suggestEditHref(r);
    edit.dataset.formLink = 'suggest-edit';
    edit.dataset.resourceId = r.id;
    edit.innerHTML = `<i class="fas fa-pen-to-square" aria-hidden="true"></i> Suggest edit`;

    const review = document.createElement('a');
    review.href = submitReviewHref(r);
    review.dataset.formLink = 'submit-review';
    review.dataset.resourceId = r.id;
    review.innerHTML = `<i class="fas fa-comment-dots" aria-hidden="true"></i> Submit a review`;

    wrap.appendChild(edit);
    wrap.appendChild(review);
    return wrap;
  }

  // Look up a curator's display name. For community submissions, prefer the
  // submitter's name on the resource (`submittedBy`). Otherwise fall back to
  // the sourceDisplay mapping, then the raw source value.
  function getCuratorDisplay(r) {
    if (!r.source) return null;
    if (r.source === 'community' && r.submittedBy && String(r.submittedBy).trim()) {
      return String(r.submittedBy).trim();
    }
    const map = data.sourceDisplay || {};
    return map[r.source] || r.source;
  }

  // "Added by <curator>" attribution at the bottom of a card.
  function buildAttribution(r) {
    const curator = getCuratorDisplay(r);
    if (!curator) return null;

    const wrap = document.createElement('p');
    wrap.className = 'card-attribution';

    const span = document.createElement('span');
    span.className = 'attribution-item attribution-curator';
    span.innerHTML = `<i class="fas fa-thumbtack" aria-hidden="true"></i> Added by ${escapeHTML(curator)}`;
    wrap.appendChild(span);

    return wrap;
  }

  // Field Notes: optional internal practitioner take + external reviews link.
  // - r.review (non-empty)         → render review text + curator attribution
  // - r.needsReview && !review     → "Review coming — submit yours" placeholder
  // - r.reviewExternalUrl          → "View external reviews" link
  // - none of the above            → no section at all
  function buildFieldNotes(r) {
    const hasReview = !!(r.review && String(r.review).trim());
    const hasExternal = !!(r.reviewExternalUrl && String(r.reviewExternalUrl).trim());
    const showPlaceholder = !hasReview && !!r.needsReview;
    if (!hasReview && !hasExternal && !showPlaceholder) return null;

    const wrap = document.createElement('div');
    wrap.className = 'field-notes';

    const header = document.createElement('h4');
    header.className = 'field-notes-header';
    header.innerHTML = `<i class="fas fa-quote-left" aria-hidden="true"></i> Field Notes`;
    wrap.appendChild(header);

    if (hasReview) {
      const body = document.createElement('p');
      body.className = 'field-notes-body';
      body.textContent = r.review;
      wrap.appendChild(body);

      const curator = getCuratorDisplay(r);
      if (curator) {
        const attr = document.createElement('p');
        attr.className = 'field-notes-attribution';
        attr.textContent = `— ${curator}`;
        wrap.appendChild(attr);
      }
    } else if (showPlaceholder) {
      const placeholder = document.createElement('p');
      placeholder.className = 'field-notes-placeholder';
      const link = document.createElement('a');
      link.href = submitReviewHref(r);
      link.dataset.formLink = 'submit-review';
      link.dataset.resourceId = r.id;
      link.textContent = 'submit yours';
      const em = document.createElement('em');
      em.append('Review coming — ', link);
      placeholder.appendChild(em);
      wrap.appendChild(placeholder);
    }

    if (hasExternal) {
      const ext = document.createElement('a');
      ext.className = 'field-notes-external';
      ext.href = r.reviewExternalUrl;
      ext.target = '_blank';
      ext.rel = 'noopener noreferrer';
      ext.innerHTML = `<i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i> View external reviews`;
      wrap.appendChild(ext);
    }

    return wrap;
  }

  function badge(kind, value) {
    const span = document.createElement('span');
    span.className = `badge badge-${kind} ${kind === 'cost' ? 'cost-' + value : ''}`.trim();
    span.textContent = prettify(value);
    const definition = getDefinition(kind, value);
    if (definition) span.dataset.tooltip = definition;
    return span;
  }

  // ---------- Render orchestration ----------
  function render() {
    syncURL(true);
    const view = getView();
    document.body.classList.toggle('view-landing', view === 'landing');

    if (view === 'landing') {
      els.landingView.hidden = false;
      els.libraryView.hidden = true;
      // Reset any open mobile filter sheet so it doesn't linger.
      openFilterSheet(false);
      return;
    }

    els.landingView.hidden = true;
    els.libraryView.hidden = false;

    renderLibraryContext();
    buildFilters();
    buildActiveFilterChips();
    const list = getFilteredResources();
    renderCards(list);
    updateMatchCount(list.length);
  }

  function updateMatchCount(n) {
    const word = n === 1 ? 'resource' : 'resources';
    els.matchCount.textContent = `${n} ${word} match`;
  }

  // ---------- Events ----------
  function bindEvents() {
    // Search (debounced)
    let searchTimer = null;
    els.search.addEventListener('input', e => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.q = e.target.value;
        render();
      }, 150);
    });

    // Breadcrumb back to landing
    els.breadcrumb.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      goToLanding();
    });

    // Clear filters
    els.clearBtn.addEventListener('click', clearAllFilters);
    els.emptyClear.addEventListener('click', clearAllFilters);

    // Mobile filter sheet
    els.filterOpen.addEventListener('click', () => openFilterSheet(true));
    els.filterClose.addEventListener('click', () => openFilterSheet(false));
    els.backdrop.addEventListener('click', () => openFilterSheet(false));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && els.filterSidebar.classList.contains('open')) {
        openFilterSheet(false);
      }
    });

    // Browser back/forward
    window.addEventListener('popstate', () => {
      readStateFromURL();
      render();
    });
  }

  function openFilterSheet(open) {
    els.filterSidebar.classList.toggle('open', open);
    els.filterOpen.setAttribute('aria-expanded', open ? 'true' : 'false');
    els.backdrop.hidden = !open;
    document.body.classList.toggle('filters-open', open);
    if (open) requestAnimationFrame(() => els.backdrop.classList.add('visible'));
    else els.backdrop.classList.remove('visible');
  }

  // ---------- Helpers ----------
  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHTML(s); }
})();
