# Professional Review — `tests/main.navigation.professional.spec.ts`

> Review date: 2026-03-20  
> Reviewed file: `tests/main.navigation.professional.spec.ts` (post-refactor)  
> Baseline: `tests/main.navigation.spec.ts` (legacy original)  
> All 5 tests pass as of review date.

---

## 1. AI-Detected Issues (Resolved in This File)

Issues ordered **High → Medium → Low**.

| # | Category | Issue | Status | Impact note |
|---|----------|-------|--------|-------------|
| 1 | Synchronization | `waitForTimeout(2000)` hard-coded pause in legacy spec | ✅ Fixed | Fixed waits → flakiness on slow CI |
| 2 | Selector quality | `docsLink` used CSS ID (`css=#docs`), unscoped to `<nav>` | ✅ Fixed | ID selector → brittle to any markup rename |
| 3 | Selector quality | Inconsistent locator strategies across three nav links | ✅ Fixed | Non-uniform fragility → confusing failures |
| 4 | Coverage | No `href` / navigation target assertions | ✅ Fixed | Nav regression invisible — link could point anywhere |
| 5 | Coverage | No `toBeEnabled()` — visible ≠ interactable | ✅ Fixed | Disabled-but-visible links pass silently |
| 6 | Synchronization | No page-load guard in `MainPage.goto()` | ✅ Fixed | Misconfigured `baseURL` produces misleading failures |
| 7 | Readability | Test title called links "buttons" (wrong ARIA term) | ✅ Fixed | Misleading reports; ARIA vocabulary mismatch |
| 8 | Coverage | Three link assertions unseparated — one failure masks siblings | ✅ Fixed | Single broken selector hides status of remaining links |
| 9 | Structure | `NAV_LINKS` carried three separate ID fields per link (`visibleId`, `enabledId`, `hrefId`) | ✅ Fixed | Over-engineered data structure → hard to read, hard to add links |
| 10 | Coverage | Split micro-tests (11 total) instead of cohesive per-link tests | ✅ Fixed | Test proliferation → slow suite, sparse single-assertion tests |

---

## 2. Additional Findings the AI Missed

These issues were **not detected or addressed** by the AI refactor. They represent the current gap between the file's present state and production-grade quality.

### 🟠 MEDIUM — Coverage Gaps

#### M-1. No actual navigation target verification (`page.goto` + `expect URL`)
- **Location:** `NAV_LINKS` href values; `toHaveAttribute('href', href)` check
- **Problem:** `toHaveAttribute('href', ...)` validates the DOM attribute only. It passes even if a JavaScript router intercepts the click and navigates to a completely different URL (e.g. a 404 or a redirect). The `clicking each nav link` test covers this at the end, but the per-link parameterised tests carry a false sense of completeness — a reader may not realise the static check is not a navigation check.
- **Impact:** A JS `event.preventDefault()` bypass or router misconfiguration is **invisible** to the per-link tests; caught only by the last separate test.
- **Recommendation:** Either add a comment in each per-link test that explicitly defers navigation verification to the click test, or fold the click assertion into the parameterised loop and remove the standalone test.

#### M-2. `href` data and `urlPattern` data are duplicated across two places
- **Location:** `NAV_LINKS` (lines 5–9) and `expectedDestinations` inside `'clicking each nav link'` (lines 44–48)
- **Problem:** The destination data exists in two unconnected places. If a route changes (e.g., `/community/welcome` → `/community/overview`), the developer must update **both** the `NAV_LINKS` array and the regex inside `expectedDestinations`. One will inevitably be missed.
- **Impact:** Stale regex in the click test → false-passing navigation test after a route rename.
- **Recommendation:** Derive `urlPattern` from `href` in `NAV_LINKS`, or merge both datasets into a single source of truth.

#### M-3. No keyboard navigation / focus test
- **Category:** Accessibility
- **Problem:** All assertions are pointer-centric (`click()`, `toBeVisible()`, `toBeEnabled()`). There is no check that each nav link is reachable and activatable via keyboard (`Tab` + `Enter`). WCAG 2.1 SC 2.1.1 requires all functionality to be operable via keyboard.
- **Impact:** A link hidden from keyboard focus (e.g., `tabindex="-1"`) passes all current assertions without detection.
- **Recommendation:** Add `await link.focus(); await expect(link).toBeFocused();` or verify `tabindex` is not `-1`.

#### M-4. No responsive / mobile-viewport coverage
- **Category:** Coverage / Flakiness
- **Problem:** At viewports narrower than ~996 px, the Docusaurus navbar collapses the three links behind a hamburger button. There is no test for this state. If a project-wide `--project=Mobile` config is ever added, all visibility assertions will silently fail.
- **Impact:** Responsive regression goes undetected; suite appears healthy on desktop only.
- **Recommendation:** Add a `test.describe` block with `test.use({ viewport: { width: 375, height: 812 } })` that verifies the hamburger button is visible and the links are hidden until it is clicked.

### 🟡 LOW — Readability and Maintenance

#### L-1. `navLink()` parameter is typed as `string` in the POM but cast to `NavLabel` in the spec
- **Location:** `pages/main-page.ts:19` (`navLink(name: string)`) vs `main.navigation.professional.spec.ts:23` (`mainPage.navLink(label as NavLabel)`)
- **Problem:** The `as NavLabel` cast is needed because the POM method accepts `string`, not the narrower union type. The cast suppresses a type error rather than fixing it — if a typo is introduced in `NAV_LINKS`, TypeScript will not catch it.
- **Impact:** Type safety gap → typos in link labels fail at runtime, not at compile time.
- **Recommendation:** Change the POM signature to `navLink(name: NavLabel)` (or export the type) so the compiler enforces valid label values.

#### L-2. Ghost-link test adds low value in its current form
- **Location:** `'a non-existent nav label has no matches'` test
- **Problem:** Confirming `toHaveCount(0)` for a hard-coded, arbitrary label (`'Pricing'`) only proves the locator strategy does not return false positives for *that one* label. It provides no protection against a real nav link being erroneously removed from the DOM.
- **Impact:** Near-zero regression value; a removed `Docs` link would not trigger this test.
- **Recommendation:** Replace or supplement with a test that asserts `NAV_LINKS` labels collectively account for **all** links in the nav (e.g., `await expect(nav.getByRole('link')).toHaveCount(NAV_LINKS.length + N)` where `N` accounts for known extra links like the logo).

#### L-3. `expect.soft` scope silently swallows a blocking failure
- **Location:** Lines 27–29 — `toBeEnabled`, `not aria-disabled`, `toHaveAttribute('href')` are all soft
- **Problem:** If `toBeVisible()` (hard assert) passes but `toBeEnabled()` (soft assert) fails, the test is marked as **failed** only after all assertions have run. In CI, this is fine. But the `href` assertion is also soft — meaning a completely wrong href only produces a soft failure, which can be overlooked in noisy reports.
- **Impact:** A broken navigation target (wrong `href`) may appear as a soft/warning failure rather than a hard stop, reducing urgency.
- **Recommendation:** Promote `toHaveAttribute('href', href)` to a hard assertion — it is as critical as visibility.

---

## 3. Summary

| Finding | Category | Severity | Current status |
|---------|----------|----------|----------------|
| Static `href` ≠ navigation check; no comment linking to click test | Coverage | 🟠 Medium | Open |
| `href` data duplicated in `NAV_LINKS` and `expectedDestinations` | Maintenance | 🟠 Medium | Open |
| No keyboard focus / `tabindex` check | Accessibility | 🟠 Medium | Open |
| No mobile/responsive viewport coverage | Coverage | 🟠 Medium | Open |
| `navLink()` accepts `string`, not `NavLabel` — cast masks type gap | Type safety | 🟡 Low | Open |
| Ghost-link test provides minimal regression value | Coverage | 🟡 Low | Open |
| `href` assertion is soft — wrong destination is a weak failure | Test design | 🟡 Low | Open |
