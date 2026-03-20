# Refactoring Summary — Main Navigation Specs

| | `main.navigation.spec.ts` | `main.navigation.refactored.spec.ts` | `main.navigation.manual.refactore.spec.ts` |
|---|---|---|---|
| **Purpose** | Original (legacy) test | Functional refactor | Accessibility-focused refactor |
| **Test count** | 1 | 3 | 4 |
| **Test isolation** | Single block for all 3 links | One test per link | One landmark test + one per link |
| **Fixed wait** | `waitForTimeout(2000)` ✗ | Removed ✓ | Removed ✓ |
| **Selector — Docs** | `css=#docs` (CSS ID, unscoped) ✗ | `getByRole('link', { name })` ✓ | `getByRole('link', { name })` ✓ |
| **Selector — API / Community** | `getByRole` scoped to nav ✓ | `getByRole` scoped to nav ✓ | `getByRole` scoped to nav ✓ |
| **Page-load guard** | None ✗ | `toHaveTitle(/Playwright/)` in POM ✓ | `toHaveTitle(/Playwright/)` in POM ✓ |
| **Visibility assertion** | `toBeVisible()` ✓ | `toBeVisible()` ✓ | `toBeVisible()` ✓ |
| **Enabled / interactive** | None ✗ | `toBeEnabled()` ✓ | `toBeEnabled()` + `not aria-disabled` ✓ |
| **href / nav target** | None ✗ | `toHaveAttribute('href', …)` ✓ | `toHaveAttribute('href', …)` ✓ |
| **ARIA role validation** | None — CSS ID bypasses ARIA ✗ | Implicit via `getByRole` ✓ | Explicit landmark + per-link role check ✓ |
| **Accessible name check** | None ✗ | Implicit via `getByRole` name ✓ | Explicit `not aria-label` override check ✓ |
| **Navigation landmark** | Not checked ✗ | Not checked ✗ | `role="navigation"` + name `"Main"` ✓ |
| **Test steps / reporting** | None ✗ | `test.step()` per assertion ✓ | `test.step()` per assertion ✓ |
| **Test title accuracy** | "buttons" (wrong ARIA term) ✗ | "links" ✓ | "ARIA role, accessible name, state" ✓ |
| **POM method used** | Named properties (`docsLink` etc.) | `navLink(label)` helper | `navLink(label)` helper |

## Key Improvements per Iteration

### Legacy → Refactored
- Removed synchronization anti-pattern (`waitForTimeout`)
- Replaced brittle CSS ID selector with role-based locator scoped to nav
- Unified selector strategy across all three links
- Split one monolithic test into three isolated ones
- Added `toBeEnabled()` and `href` target assertions
- Added page-load guard in `MainPage.goto()`

### Refactored → Manual Refactored
- Added explicit `role="navigation"` landmark assertion
- Added explicit accessible name verification (`name: 'Main'`, `exact: true`)
- Added `not.toHaveAttribute('aria-label')` to confirm names come from visible text content
- Added `not.toHaveAttribute('aria-disabled', 'true')` alongside `toBeEnabled()` to cover both the ARIA state tree and the DOM enabled state
