# mikecirrotti.com

Personal portfolio built with Astro and published as a static site on Cloudflare Pages.

Use Node 24 (see `.node-version`), then:

```sh
npm ci
npm test
npm run build
```

`npm run dev` starts local development. `npm run preview` serves the generated site locally; it does not apply Cloudflare's `_headers` rules.

The production build checks `public/` before copying files, validates the generated résumé, generates a browser content policy from the emitted HTML, and checks `dist/` before publication. Publish **dist**, using **npm run build** as the Cloudflare build command. A failed check must stop deployment.

The content policy permits Google Fonts, the existing podcast media host, and Cloudflare analytics if enabled by the account. It hashes the exact inline scripts/styles in the build. Update and verify the policy when adding external resources. Keep the inline theme initialization working when changing the head.

GitHub Actions runs a fresh install, tests, dependency audit, and build. Branch builds also verify the immutable Cloudflare preview when that integration is enabled. Weekly Dependabot proposals require review; they do not merge themselves.

After a branch deployment:

```sh
node scripts/check-hosted-site.mjs https://DEPLOYMENT.mikecirrotti-com.pages.dev
```

This verifies missing paths, security headers, valid pages, the portrait, `/resume.json`, and `/llms.txt`. Browser review should also cover theme changes, navigation, responsive layouts, and podcast playback.

See [the maintenance record](docs/traffic-hardening.md) for validation and remaining account-level checks.
