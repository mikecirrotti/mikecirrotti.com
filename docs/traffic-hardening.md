# Traffic and publication safeguards

Date: 2026-11-06
Status: prepared on a review branch; production unchanged
Baseline: 3c943f80080085d1a1de7f00cf105895d6fe5dfe

## Assessment

The personal site already included a missing-page component. A live HEAD request to `/config/app/.env` returned HTTP 404 during this review. Register Fluency's former missing-page defect therefore does not apply to the personal site in the same way. Traffic totals still do not establish relative human readership.

## Changes

The error page retains shared navigation and the visible employer-views disclaimer, gains recovery links and noindex metadata, and stays out of the sitemap. Build checks require a regular `dist/404.html` so its removal cannot silently restore Cloudflare's homepage fallback.

A publication guard checks `public/` before copying and `dist/` after generation. It rejects environment files, private-key filenames, backups, database files, source maps, unintended source/dependency files, and symbolic links. A limited signature scan reports possible credentials by category and path without printing values. It is an additional check, not proof that every secret can be detected. Legitimate JSON, JavaScript, and `.well-known` files remain allowed.

The browser policy uses hashes of the exact inline script/style blocks in the generated HTML. External resources are limited to the existing Google Fonts services, the podcast's specific CloudFront media host, and Cloudflare analytics if already enabled. No new tracker is installed. Style attributes remain allowed for existing presentation. The policy also restricts framing, embedded objects, base URLs, forms, and unused camera/microphone/location features. The existing icon-discovery and résumé Content-Type headers are preserved. The production pages.dev hostname receives noindex; that is not authentication.

Astro moves from 6.3.7 to 7.4.7, sitemap to 3.7.4, with an explicitly regenerated lockfile and Node 24. HTML-aware whitespace compression stays enabled across the compiler migration. No dependency overrides or forced audit fixes are used. The baseline npm audit reported 12 affected package entries; a fresh post-upgrade audit reports zero. Audit severity does not establish exploitability on this static deployment.

Read-only GitHub Actions checks run install, tests, audit, build, and branch-preview response verification. They have no private-wiki credentials. Weekly Dependabot proposals cover npm and GitHub Actions with no automatic merge. The crawler permissions and cache lifetimes remain as before.

## Validation

- Ten automated tests passed, including controlled dangerous-file fixtures, missing-404 failures, and content-policy checks.
- The production build passed: seven HTML pages plus generated text/JSON outputs. The pinned résumé schema, portrait, links, public-claim checks, and seven-direct-report scope passed.
- Generated output contains the error page with noindex, excludes it from sitemaps, and passes publication checks. The content policy covers five distinct inline script blocks and five style blocks within Cloudflare's header-line limit.
- Hosted response checks and browser inspection are recorded below after branch deployment.

## Release and account checks

Merge and production deployment await an explicit publication instruction. Before release, verify the immutable Cloudflare preview's status codes and headers, dark-mode initialization/toggle/persistence, fonts, podcast audio, recovery links, and phone-sized layouts.

Cloudflare account configuration was not inspected or changed. Later, confirm production tracks main, the output directory is dist, and the build command runs the full checks. Review preview access and retained deployments separately. Noindex does not prevent someone with a preview address from reading it. Check existing analytics before adding any measurement, and compare both sites using the same metric and time window. There is no evidence here requiring paid hosting or broad bot challenges.

References: [Cloudflare serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/), [header configuration](https://developers.cloudflare.com/pages/configuration/headers/), and [Astro 7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/).
