# Frontend refinement review — 2026-09-13

<!-- Purpose: record the scope and evidence for visual/interaction refinement, not MVP integration certification. -->

## Changes

- Saved the three requested WOFF2 files from official upstream repositories with licenses and provenance; FontTools verified variable weight/optical-size axes.
- Added self-hosted font loading, shared sans/mono tokens and authentic italic text.
- Refined the shared dark palette, type hierarchy, whitespace, borders, panels, forms, navigation, modal transitions and focus states.
- Made catalog metric cards functional shortcuts, added a visible reset action, selected-row treatment and mobile select-page control.
- Reflowed the catalog into labeled mobile rows, retained product/audit details on smaller editor layouts, and improved form/control sizing.
- Added a skip link, navigation drawer scroll locking/focus trapping/restoration, active-page semantics and full editor tab keyboard navigation.
- Fixed onboarding profile hydration defaults. Manual editing cancels a pending sample-generation result so it cannot overwrite a new edit.

## Browser evidence

- **1320px desktop:** inspected the catalog visually; computed styles resolved to the locally loaded Inter and Paper Mono families. The page did not overflow horizontally.
- **390px phone:** visually inspected catalog, editor and CSV dialog; exercised ready-for-review shortcut (4 results in the current sample), reset, search/no-results, and clear filters. Opened/closed the upload dialog without importing a file.
- **390px keyboard:** verified drawer focus starts on Close navigation, Shift+Tab/Tab wrap between first and last controls, Escape dismisses, and focus returns to the menu button. Background uses `inert`. Editor ArrowRight activates the next tab and its labeled panel.
- **1024px tablet:** inspected the editor and variant form; the audit remained displayed and document width stayed within the viewport.
- **320px phone:** checked catalog, new-product, workspace settings, brand settings, help, login and all four onboarding routes. Every heading rendered and document width was 320px with no document-level horizontal overflow. This is an overflow smoke check, not exhaustive visual inspection of each field.
- **1440px desktop:** visually inspected the sign-in design. Browser console inspection returned no captured warnings/errors at that point.
- **768px / 820px / 1280px:** overview, catalog and editor passed additional document-width checks at the intermediate breakpoints.

## Build evidence

- Final `NEXT_DIST_DIR=.next-build npm run build` passed, including TypeScript checking and all 16 route entries.
- `npm run test:prototype` passed all 9 existing parser/export/review regression checks during refinement.
- `git diff --check` passed for the edited application and documentation paths.
- The development server remains at `http://localhost:3000/dashboard/skus`. Temporary browser viewport overrides were reset after testing.

## Boundaries

These checks exercise the existing local prototype. They do not verify real authentication, marketplace connections, AI, database-backed workflows, mobile Safari behavior, a full assistive-technology audit or all MVP acceptance criteria. No real account was connected, no product was published, and no saved merchant data was changed during browser checks.

Keep `TASK.md` MVP-32 open until the integrated MVP receives its complete browser/accessibility review. Recheck affected layouts when API integration changes the data and loading states.
