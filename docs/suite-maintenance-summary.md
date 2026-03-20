# Suite Maintenance Summary

> Review date: 2026-03-20  
> Reviewed: `tests/` (5 specs) · `pages/` (2 POMs) · `playwright.config.ts`

---

## 1. File Inventory

| File | Tests | Status |
|------|------:|-------|
| `tests/main.navigation.spec.ts` | 1 | ❌ Superseded — delete |
| `tests/main.navigation.refactored.spec.ts` | 3 | ❌ Superseded — delete |
| `tests/main.navigation.manual.refactore.spec.ts` | 4 | ⚠️ Partially overlapping — merge unique ARIA tests, delete |
| `tests/main.navigation.professional.spec.ts` | 5 | ✅ Canonical — keep, apply fixes |
| `tests/playwright-dev.spec.ts` | 2 | ⚠️ Needs attention — locator and structure issues |

---

## 2. Findings per File

### `tests/main.navigation.spec.ts` — Superseded

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 High | `waitForTimeout(2000)` — unconditional fixed wait; adds 2 s on every run, still flakes on slow CI |
| 2 | 🔴 High | Single monolithic test — one broken selector silently masks the other two links |
| 3 | 🟠 Medium | No `href` assertions — a nav regression (link pointing to the wrong URL) passes invisibly |
| 4 | 🟠 Medium | No `toBeEnabled()` — a disabled-but-visible link passes silently |
| 5 | 🟡 Low | Title calls links "buttons" — wrong ARIA term; elements are `<a role="link">` |

**Action:** Delete. Every scenario is covered more thoroughly by the professional spec.

---

### `tests/main.navigation.refactored.spec.ts` — Superseded

Covers the same three parameterized per-link tests (visibility + enabled + href) as the professional
spec, using identical `NAV_LINKS` data and `MainPage.navLink()`. No unique scenarios exist.

**Action:** Delete. Zero net test coverage is lost.

---

### `tests/main.navigation.manual.refactore.spec.ts` — Partially Overlapping

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟠 Medium | `href` attribute assertions duplicate those in `refactored` and `professional` specs |
| 2 | 🟡 Low | Filename typo: `refactore` should be `refactored` |
| 3 | — | **Unique tests worth keeping:** nav landmark role assertion; `aria-label` absence check |

**Action:** Merge the two unique ARIA tests (landmark + `aria-label` absence) into
`main.navigation.professional.spec.ts`; then delete this file.

---

### `tests/main.navigation.professional.spec.ts` — Canonical (Keep)

Most complete file. Issues to fix before other files are removed:

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟠 Medium | `href` data is duplicated: `NAV_LINKS[].href` and the `expectedDestinations` `urlPattern` list in the click test. A single route rename requires two edits — one will be missed. Derive `urlPattern` from `href` inside `NAV_LINKS`. |
| 2 | 🟡 Low | `toHaveAttribute('href', href)` is `expect.soft` — a wrong navigation target produces only a soft failure, which can be overlooked in noisy CI reports. Promote to a hard assertion. |
| 3 | 🟡 Low | Ghost-link test (`'Pricing'` has 0 matches) provides minimal regression value; a silently removed `Docs` link does not trigger it. Replace with a link-count assertion: `nav.getByRole('link').toHaveCount(N)`. |
| 4 | 🟡 Low | `mainPage.navLink(label as NavLabel)` — the cast is redundant; `NavLabel ⊆ string` and the POM signature already accepts `string`. Remove the cast or narrow the POM signature to `NavLabel`. |

---

### `tests/playwright-dev.spec.ts` — Needs Attention

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 High | `tocList` asserts 8 exact TOC item strings. Any documentation update (item added, renamed, reordered) will break the test. Relax to `toHaveCount(8)` or assert only the first/last item. |
| 2 | 🟠 Medium | `getStartedLink` uses `page.locator('a', { hasText: 'Get started' })` + `.first()`. The `.first()` signals ambiguity; prefer `getByRole('link', { name: 'Get started' })` scoped to the hero section or navbar. |
| 3 | 🟠 Medium | `PlaywrightDevPage.goto()` navigates to `/` with no load guard (no `toHaveTitle`). A misconfigured `baseURL` produces misleading failures instead of a clear navigation error. |
| 4 | 🟠 Medium | `pomLink` chains two text-based locators (`hasText`). If "Guides" sidebar label or "Page Object Model" link text changes, this selector silently fails to find the element. |
| 5 | 🟡 Low | Both tests repeat `new PlaywrightDevPage(page)` + `goto()` without a `beforeEach`. Add a shared `beforeEach` to remove the duplication. |
| 6 | 🟡 Low | `tocList` uses a CSS class selector `div.markdown` — tied to the Docusaurus implementation class, not a semantic HTML or ARIA attribute. |

---

## 3. Consolidation Plan

```
Step 1 — Delete superseded files
  rm tests/main.navigation.spec.ts
  rm tests/main.navigation.refactored.spec.ts

Step 2 — Merge ARIA tests into the canonical file
  Copy nav-landmark + aria-label tests from
  main.navigation.manual.refactore.spec.ts → main.navigation.professional.spec.ts
  rm tests/main.navigation.manual.refactore.spec.ts

Step 3 — Fix the canonical file (see diff below)
  • Merge NAV_LINKS + expectedDestinations into one array (add urlPattern)
  • Promote href assertion to hard expect()
  • Replace ghost-link test with link-count assertion
  • Remove redundant `as NavLabel` cast

Step 4 — Fix playwright-dev.spec.ts
  • Add beforeEach; modernise locators in PlaywrightDevPage POM
  • Relax tocList assertion
```

**Before:** 5 spec files, ~13 tests, significant duplication across 4 nav spec variants.  
**After:** 2 spec files, ~9 focused tests, single source of truth for navigation scenarios.

---

## 4. Representative Diff — `tests/main.navigation.professional.spec.ts`

Shows the recommended fixes from Step 3 above.

```diff
--- a/tests/main.navigation.professional.spec.ts
+++ b/tests/main.navigation.professional.spec.ts
@@ -1,12 +1,16 @@
 import { test, expect } from '@playwright/test';
 import { MainPage } from '../pages/main-page';
 
-// Relative hrefs — resolved against baseURL ('https://playwright.dev') in playwright.config.ts.
+// Single source of truth for nav link data.
+// urlPattern is derived from href so a route rename requires only one edit.
 const NAV_LINKS = [
-  { label: 'Docs',      href: '/docs/intro' },
-  { label: 'API',       href: '/docs/api/class-playwright' },
-  { label: 'Community', href: '/community/welcome' },
+  { label: 'Docs',      href: '/docs/intro',                urlPattern: /\/docs\/intro$/ },
+  { label: 'API',       href: '/docs/api/class-playwright', urlPattern: /\/docs\/api\/class-playwright$/ },
+  { label: 'Community', href: '/community/welcome',         urlPattern: /\/community\/welcome$/ },
 ] as const;
 
 type NavLabel = typeof NAV_LINKS[number]['label'];
 
@@ -18,32 +22,27 @@ test.describe('Main page — navigation links', () => {
   });
 
-  for (const { label, href } of NAV_LINKS) {
+  for (const { label, href } of NAV_LINKS) {  // NavLabel is a subtype of string; cast removed
     test(`"${label}" nav link is visible, enabled and points to "${href}"`, async () => {
-      const link = mainPage.navLink(label as NavLabel);
+      const link = mainPage.navLink(label);
 
       await expect(link).toBeVisible();
       await expect.soft(link).toBeEnabled();
       await expect.soft(link).not.toHaveAttribute('aria-disabled', 'true');
-      await expect.soft(link).toHaveAttribute('href', href);
+      await expect(link).toHaveAttribute('href', href);       // promoted: wrong href = hard failure
     });
   }
 
-  test('a non-existent nav label has no matches', async ({ page }) => {
-    const ghostLink = page
-      .getByRole('navigation', { name: 'Main' })
-      .getByRole('link', { name: 'Pricing' });
-
-    await expect(ghostLink).toHaveCount(0);
-  });
+  // Guards against a real nav link being silently removed from the DOM.
+  test('navigation contains exactly the expected number of links', async ({ page }) => {
+    const nav = page.getByRole('navigation', { name: 'Main' });
+    // NAV_LINKS.length (3) + logo home link (1) = 4 total links in the nav
+    await expect(nav.getByRole('link')).toHaveCount(NAV_LINKS.length + 1);
+  });
 
   // Verifies actual browser navigation, not just the DOM href attribute.
   // Catches JS router overrides or event.preventDefault() bypasses.
   test('clicking each nav link navigates to the correct URL', async ({ page }) => {
-    const expectedDestinations = [
-      { label: 'Docs',      urlPattern: /\/docs\/intro/ },
-      { label: 'API',       urlPattern: /\/docs\/api\/class-playwright/ },
-      { label: 'Community', urlPattern: /\/community\// },
-    ];
-
-    for (const { label, urlPattern } of expectedDestinations) {
+    for (const { label, urlPattern } of NAV_LINKS) {         // reuses NAV_LINKS — no duplication
       await page.goto('/');
       const link = page
         .getByRole('navigation', { name: 'Main' })
```

---

## 5. Broken Selector Inventory

| File | Selector | Issue |
|------|----------|-------|
| `pages/playwright-dev-page.ts:9` | `page.locator('a', { hasText: 'Get started' }).first()` | Text-based + `.first()` signals ambiguity |
| `pages/playwright-dev-page.ts:10` | `page.locator('h1', { hasText: 'Installation' })` | Brittle to heading text changes |
| `pages/playwright-dev-page.ts:11–13` | `locator('li', { hasText: 'Guides' }).locator('a', { hasText: 'Page Object Model' })` | Double text-chaining; fragile to sidebar renames |
| `pages/playwright-dev-page.ts:14` | `page.locator('article div.markdown ul > li > a')` | CSS implementation class; brittle to Docusaurus upgrades |
| `tests/playwright-dev.spec.ts:22` | `page.locator('article')` | Unscoped generic element; matches any `<article>` on the page |

> Note: `pages/main-page.ts` selectors are already clean (role-based, nav-scoped). No broken selectors remain there.
