# Legacy Test Analysis — `tests/main.navigation.spec.ts`
No code changes applied in Chapter 2.
> Analysis date: 2026-03-20  
> Files reviewed: `tests/main.navigation.spec.ts`, `pages/main-page.ts`  
> Playwright version: 1.58.2

---

## Prioritized Checklist of Issues

Issues are ordered **High → Medium → Low** by impact on flakiness and maintenance cost.

---

### 🔴 HIGH — Flakiness / Correctness

#### 1. Hard-coded `waitForTimeout` (synchronization anti-pattern)
- **Location:** `tests/main.navigation.spec.ts:7`  
  ```ts
  await page.waitForTimeout(2000);
  ```
- **Category:** Synchronization  
- **Problem:** A fixed 2-second pause is unconditional — it always adds 2 s to the test even when the page is ready in 200 ms, and it can still fail on a slow CI machine if 2 s is not enough. Playwright's web-first assertions (`toBeVisible`, etc.) already include auto-retry with a configurable timeout; the `waitForTimeout` is both redundant and dangerous.  
- **Impact:** Slower tests + CI flakiness if load exceeds 2 s → **fixed waits = flakiness**.

---

#### 2. `docsLink` uses a raw CSS ID selector, **not scoped to the nav**
- **Location:** `pages/main-page.ts:13`  
  ```ts
  this.docsLink = page.locator("css=#docs");
  ```
- **Category:** Selector quality  
- **Problem (two sub-issues):**
  - **Brittle selector:** An `#id` selector is tightly coupled to the DOM implementation. Docusaurus (or any future site rewrite) can rename, remove, or move the `#docs` element at any time without breaking the semantic navigation.
  - **Unscoped root:** Uses `page.locator(...)` instead of `this.nav.locator(...)`. If the same ID appears elsewhere on the page (footer deep-link, hidden duplicate) it will match the wrong element. The other two locators — `apiLink`, `communityLink` — are correctly scoped inside `this.nav`.
- **Impact:** Selector breaks on any DOM refactor → **ID selector = brittle to markup changes**; unscoped locator = silent wrong-element match.

---

#### 3. Selector strategy is **inconsistent** across the three nav links
- **Location:** `pages/main-page.ts:13–15`
- **Category:** Selector quality / Accessibility  
- **Problem:** `docsLink` uses CSS ID; `apiLink` and `communityLink` use `getByRole('link', { name })`. This inconsistency means the three locators behave differently under DOM changes, making failures non-uniform and harder to diagnose.  
- **Impact:** Maintenance confusion + differential fragility across locators.

---

### 🟠 MEDIUM — Coverage Gaps (AI-Missed Findings)

#### 4. No navigation target (`href`) verification
- **Category:** Coverage  
- **Problem:** Each assertion only checks `toBeVisible()`. There is no check that the links point to the correct destinations:
  - `Docs` → `/docs/intro`
  - `API` → `/docs/api/class-playwright`
  - `Community` → `/community/welcome`
  
  A link could be visible but point to the wrong URL (e.g., after a site restructure), and the test would still pass.  
- **Recommended assertion example:**
  ```ts
  await expect(mainPage.docsLink).toHaveAttribute('href', '/docs/intro');
  ```
- **Impact:** False confidence — navigation regression is invisible to the test suite.

---

#### 5. No `toBeEnabled()` / interactive-state assertion
- **Category:** Accessibility / Coverage  
- **Problem:** `toBeVisible()` does not guarantee an element is interactable. A link can be visible but `pointer-events: none`, have `aria-disabled`, or be hidden behind an overlay. There is no assertion that the links are actually clickable/enabled.  
- **Recommended assertion:**
  ```ts
  await expect(mainPage.docsLink).toBeEnabled();
  ```
- **Impact:** A disabled-but-visible link would pass the test unchallenged.

---

#### 6. No viewport-size guard — navigation collapses on small viewports
- **Category:** Coverage / Flakiness  
- **Problem:** On viewports narrower than ~996 px the Docusaurus navbar collapses the `Docs`, `API`, and `Community` links behind a hamburger `Toggle navigation bar` button (observed during page inspection). The config uses `devices['Desktop Chrome']` (1280×720) which is fine today, but if someone runs the test with `--project` overrides or a different device, all three `toBeVisible()` assertions will fail silently because the links are in the DOM but hidden.  
- **Impact:** Responsive-mode test runs will always fail — not reported as a coverage gap, treated as a selector bug.

---

#### 7. Missing accessibility role assertion (`getByRole` confirms ARIA role)
- **Category:** Accessibility  
- **Problem:** `docsLink` is asserted via a CSS ID locator — this provides zero guarantee the element has the correct ARIA role of `link`. If the element is a `<span>` or `<button>` styled to look like a link, the test still passes. Using `getByRole('link', { name: 'Docs' })` implicitly validates ARIA semantics.  
- **Impact:** Accessibility regression (non-link interactive elements) goes undetected.

---

### 🟡 LOW — Readability, Reuse, and Duplication Risks

#### 8. Test title calls links "buttons" — mismatched semantic terminology
- **Location:** `tests/main.navigation.spec.ts:4`  
  ```ts
  test('The main page should display navigation buttons: Docs, API, Community', ...)
  ```
- **Category:** Readability  
- **Problem:** The navbar elements are `<a>` tags with `role="link"`, not `role="button"`. Calling them "buttons" in the test title creates confusion in reports and mismatches the ARIA vocabulary. This also means the test description does not match what `getByRole` queries.  
- **Impact:** Misleading test reports; cognitive overhead during maintenance.

---

#### 9. Three separate visibility checks inside a single test — no isolation
- **Category:** Readability / Coverage  
- **Problem:** All three link checks are in one `test()` block. If `docsLink` fails (e.g., selector breaks), the remaining two assertions are also skipped, obscuring whether `apiLink` and `communityLink` are healthy. Separate test cases (or using `expect.soft`) would isolate failures.  
- **Impact:** One broken selector masks the status of sibling assertions.

---

#### 10. `MainPage.nav` is a public property but never used in tests
- **Location:** `pages/main-page.ts:5`, `tests/main.navigation.spec.ts`  
- **Category:** Readability / Reuse  
- **Problem:** `this.nav` is defined and exported on `MainPage` but the test file never references it directly. Meanwhile, the fact that `docsLink` is *not* scoped to `this.nav` means the encapsulation benefit of defining `nav` is already broken. Future tests that chain `mainPage.nav.locator(...)` will have a false sense of contained scope.  
- **Impact:** Dead public interface; false encapsulation trust.

---

#### 11. No `page.goto` success guard — silent navigation failure
- **Location:** `pages/main-page.ts:19–21`  
  ```ts
  async goto() {
    await this.page.goto('/');
  }
  ```
- **Category:** Synchronization / Coverage  
- **Problem:** `goto('/')` resolves when the `load` event fires but does not assert the page title or URL. If the site returns a redirect, error page, or the `baseURL` in config is wrong, the test will proceed and produce confusing assertion failures on the nav locators instead of a clear "wrong page" error.  
- **Recommended guard:**
  ```ts
  await expect(this.page).toHaveURL('/');
  // or
  await expect(this.page).toHaveTitle(/Playwright/);
  ```
- **Impact:** Misdirected failure messages when the environment or config is misconfigured.

---

## Summary Table

| # | Issue | Category | Severity | Impact Note |
|---|-------|----------|----------|-------------|
| 1 | `waitForTimeout(2000)` hard-coded pause | Synchronization | 🔴 High | Fixed waits → flakiness |
| 2 | `docsLink` uses CSS ID, unscoped to nav | Selector quality | 🔴 High | ID selector → brittle to markup changes |
| 3 | Inconsistent selector strategies | Selector quality | 🔴 High | Non-uniform fragility → confusing failures |
| 4 | No `href` / navigation target checks | Coverage | 🟠 Medium | Nav regression invisible to the suite |
| 5 | No `toBeEnabled()` assertion | Accessibility | 🟠 Medium | Disabled-but-visible links pass silently |
| 6 | No viewport guard, mobile-collapse risk | Coverage / Flakiness | 🟠 Medium | Responsive runs always fail |
| 7 | `docsLink` does not validate ARIA `link` role | Accessibility | 🟠 Medium | ARIA regression goes undetected |
| 8 | Test title says "buttons", not "links" | Readability | 🟡 Low | Misleading reports, ARIA mismatch |
| 9 | Three assertions unseparated — no isolation | Coverage / Readability | 🟡 Low | One failure masks siblings |
| 10 | `nav` defined but unused in test; broken encapsulation | Reuse / Readability | 🟡 Low | False trust in POM scoping |
| 11 | `goto()` has no page-load success guard | Synchronization / Coverage | 🟡 Low | Config errors produce misleading failures |

---

## Recommended Fix Categories (for next refactor)

1. **Synchronization** — Remove `waitForTimeout`; add page-load guard in `goto()`.  
2. **Selector quality** — Unify all three locators to `getByRole('link', { name })` scoped inside `this.nav`.  
3. **Coverage: navigation targets** — Add `toHaveAttribute('href', ...)` assertions for each link.  
4. **Coverage: interactivity** — Add `toBeEnabled()` alongside `toBeVisible()`.  
5. **Coverage: responsive** — Add a separate test (or `test.use({ viewport })`) that checks the hamburger menu at mobile viewport.  
6. **Readability** — Rename test title from "buttons" to "links"; consider `expect.soft` or separate `test()` blocks per link.  
7. **POM integrity** — Ensure all link locators honour the `this.nav` scope boundary; remove or privatise unused `nav` if not consumed externally.
