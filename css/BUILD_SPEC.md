# AI Resource Library — Build Spec

**For:** Claude Code, working in the `aaas-stpf-ai-affinity-group/aaas-stpf-ai-ag.github.io` repo
**Owner:** Claire Lunde + AAAS STPF AI Policy Affinity Group co-chairs
**Launch:** May 19, 2026 (AI Resource Fiesta event)
**Updated:** May 9, 2026

---

## What we're building

An interactive, filterable resource library at `resources.html` on the existing affinity group site. The current page is a near-empty shell with one external link (Nick Wagner's GitHub reading list). We're replacing that shell with a fully-functional library of ~114 curated resources organized into 7 categories, with multi-tag filtering, search, and a submission CTA.

The library's distinguishing feature vs. other AI reading lists: it's curated by AAAS Science & Technology Policy Fellows working *inside* the federal government, with hands-on tool reviews from the field — not just academic or industry recommendations.

---

## Constraints and context

- **Site is GitHub Pages** (static HTML, no backend, no build step)
- **Vanilla JavaScript only** — no React, Vue, or build tooling. Keep the deployment simple so co-chairs can maintain it.
- **Data lives in `data/resources.json`** (provided alongside this spec). Co-chairs add new resources by editing the JSON via PR.
- **Existing site visual style** must be preserved — match existing fonts, colors, header/footer, navigation. Inspect the current site for tokens.
- **Mobile responsive** is required — many users will hit this from phones during the launch event.
- **Accessibility:** keyboard navigation, semantic HTML, alt text, sufficient contrast. Aim for WCAG AA.
- **No analytics or trackers** — this is a public-service resource for fellows, keep it clean.

---

## Tier 1: Must ship by May 19

### 1.1 Render the resource cards
- Read `data/resources.json` on page load (`fetch('./data/resources.json')`)
- Render each resource as a card with:
  - Title (linked to URL, opens in new tab with `rel="noopener noreferrer"`)
  - 1–2 sentence description
  - Format badge (newsletter, course, podcast, tool, etc.)
  - Topic tag chips (max 3 visible, "+N more" if exceeded)
  - Cost indicator (free / paid / freemium / varies)
  - Level badge (beginner / intermediate / advanced / all levels)
  - Author/source line if present
  - "Featured" star/badge if `featured: true`

### 1.2 Category navigation
- Tabs or sticky nav at top showing the 7 categories with resource counts
  - Get Oriented (15)
  - Stay Current (31)
  - Go Deep on a Sector (46)
  - Build Skills & Credentials (6)
  - AI Tools We've Tested (5)
  - Events & Conferences (3)
  - For Builders & Developers (8)
- "All" option that shows everything
- Selecting a category filters the visible resources

### 1.3 Multi-tag filtering
A filter sidebar (or collapsible filter row on mobile) with these dimensions:

| Filter | Source field | Behavior |
|---|---|---|
| Format | `format` | Multi-select. Show all values present in current category. |
| Level | `level` | Multi-select. |
| Cost | `cost` | Multi-select. |
| Topic | `topic` (array) | Multi-select. Resource matches if ANY tag matches selected. |

- Filters are AND across dimensions, OR within a dimension
- Show "X resources match" live as filters change
- "Clear all filters" button
- Filter state should persist via URL query params so users can share filtered views (e.g., `?category=stay-current&topic=china`)

### 1.4 Search
- Live search bar at the top
- Searches across `title`, `description`, `author`, and `topic` tags
- Case-insensitive substring match (no fuzzy matching — keep it predictable)
- Search combines with active filters (search within filtered set)

### 1.5 Tool reviews (special card variant)
Resources in `tools-tested` category have an additional `review` field. When present, render a longer card layout:
- Standard card content, plus
- "Our review" section with the review text
- Reviewer attribution (if provided)
- "Best for" / "Watch out for" if structured (TBD by team — for v1, just show review text)

For v1 launch: 5 tool entries are seeded with `needsReview: true` — render these with a "Review coming soon — submit yours" CTA pointing to the Google Form.

### 1.6 "Submit a resource" CTA
- Prominent button in the page header and at the bottom of the resource list
- Links to the Google Form (URL TBD — Claire will provide)
- Form covers: submit a new resource, give feedback on an existing entry, share a tool review

### 1.7 Empty states
- If filters return zero results: "No resources match your filters. Try removing one, or [submit a resource you'd recommend]."
- If a category has zero entries: graceful empty card.

### 1.8 Footer / context
- Brief intro at the top: "Curated by AAAS STPF Fellows for anyone navigating AI policy. Hand-picked resources from people working inside government on AI."
- Existing site disclaimer language must be preserved.
- Last updated date pulled from `data.lastUpdated`.

---

## Tier 2: Ship if time permits before May 19, otherwise post-launch

### 2.1 "Recently added" strip
- Top of page, horizontal scroll on mobile
- Shows the 5 most recently added resources (need a `dateAdded` field — add to schema if pursuing)
- Helps the page feel alive after launch

### 2.2 "Curator's pick" section
- Each co-chair can flag 3 resources as their picks (`curatorPicks: ["claire", "nick", ...]` field on resources)
- Show a small "Picked by [name]" callout on those cards
- Optional: dedicated section showing each curator's picks together

### 2.3 Time-to-consume estimates
- Add `timeCommitment` field to schema: "5 min read", "weekly", "6-week course", etc.
- Display as a small icon + label on cards

### 2.4 "Start here" path for newcomers
- Curated 3–5 item starter sequence
- Linked from the page header for first-time visitors
- Could be a simple ordered list at the top of "Get Oriented" or its own callout

### 2.5 Featured-only view toggle
- Switch to show only `featured: true` resources
- Useful for the launch event when presenting "best of"

---

## Architecture

### File structure (suggested)
```
/data/resources.json        ← seed data (provided)
/css/resources.css          ← page-specific styles
/js/resources.js            ← rendering, filtering, search logic
/resources.html             ← page itself (replace existing)
```

Keep it three files plus the data. No bundlers, no transpilation. Vanilla ES2020+ is fine — modern browsers only.

### Data schema
See `resources.json`. Key fields:

```ts
type Resource = {
  id: string                    // slug, must be unique
  title: string
  url: string
  description: string           // 1-2 sentences
  category: CategoryId          // one of 7 buckets
  format: Format                // single value
  level: Level                  // single value
  cost: Cost                    // single value
  topic: Topic[]                // array, 1+ values
  author?: string
  source?: 'nick-list' | 'claire-list' | 'community'
  featured?: boolean
  needsReview?: boolean         // shows "review coming" placeholder
  review?: string | null        // long-form review for tools-tested
}
```

The `categories` array and `tagTaxonomy` object in the JSON are the source of truth for valid values. The site should derive its filter options from these dynamically — don't hard-code category lists in HTML/JS.

### State management
- Single source of truth: a `state` object in JS with `{category, filters, searchQuery}`
- All renders driven from filtering the resources array against `state`
- URL query params reflect state (use `URLSearchParams`)
- `popstate` handler updates state on back/forward navigation

### Performance notes
- 114 resources is small — no virtualization needed
- Render all matching cards on filter change; don't paginate for v1
- Debounce search input by 150ms

---

## Visual / UX direction

**Reference for tone:** the site should feel like a trusted resource — clean, scannable, professional. NOT a slick AI-startup landing page, NOT a sterile government doc. Think "Stratechery meets a federal advisory committee report."

**Key UI moves:**
- Cards should be scannable — title + description + 2-3 visual badges. Don't overstuff.
- Topic tag chips should be visually distinct from format badges (different shape or color treatment)
- Featured resources get a subtle visual lift — small star icon, accent border, or similar
- "Tools We've Tested" cards should feel slightly different (maybe a different background tint) since they're the unique value-add
- Filter sidebar collapses to a "Filters" button on mobile that opens a sheet/modal

**Avoid:**
- Excessive animations or transitions
- Hero sections that take up the whole viewport
- Stock photography or generic AI imagery
- Auto-playing anything

---

## Acceptance criteria for May 19 launch

- [ ] Page loads in <2 seconds on a typical connection
- [ ] All 114 resources render correctly
- [ ] Category navigation works and shows correct counts
- [ ] All four filter dimensions work, combine correctly, and persist via URL
- [ ] Search works and combines with filters
- [ ] All resource links open in new tabs without referrer leaks
- [ ] Submit-a-resource button is present and links to the Google Form
- [ ] Mobile layout is usable on a 375px-wide viewport
- [ ] Keyboard navigation works for all interactive elements
- [ ] Existing site header, footer, and disclaimer language are preserved
- [ ] No console errors on load or interaction
- [ ] Tool review cards correctly show "review coming" placeholders for the 5 seeded tools

---

## Things Claire still needs to provide

1. **Google Form URL** for the "Submit a resource" CTA
2. **Tool reviews** for: Manus AI, Open Evidence, Gamma, Owl.ai, Claude Code (at least 1–2 by launch; rest can ship as placeholders)
3. **Decisions on Tier 2:** which features (if any) to attempt before launch
4. **Decision on `dcai.guide`, `aiproductivitysecrets.com`, `dh-connect`, `ai-table`, `ai-secret`** — these are flagged `needsReview: true` because descriptions are thin. Either expand or remove before launch.

---

## Things to flag for the team after build

- The 10 resources flagged with `needsReview: true` — descriptions need expansion or items should be cut
- Whether `agentic-ai-deeplearning` belongs in `for-builders` or also surfaces in `build-skills`
- Whether to add a small set of academic papers/case studies (the existing page had those filter categories but no items)
- Whether to add an RSS feed of new additions

---

## Out of scope for v1

- User accounts, ratings, or comments (would need a backend)
- Auto-syncing from Nick's GitHub repo (cool but fragile)
- Email digest of new additions
- Personalized recommendations
- Translation / i18n
- Search filters on tools-tested reviewer name (not enough data)
