# Nexus's Mods Per Page

> Userscript: load 20 / 40 / 60 / 80 / 100 mods per page on Nexus Mods, or use infinite scroll for the whole listing.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Greasy Fork](https://img.shields.io/badge/install-Greasy%20Fork-670000.svg)](https://greasyfork.org/scripts/<id>)
[![Userscript](https://img.shields.io/badge/userscript-tampermonkey-blue.svg)](https://www.tampermonkey.net/)

Nexus Mods displays only 20 mods per page by default, which makes browsing large categories tedious. This userscript adds a clean dropdown to the native Nexus toolbar so you can pick **20 / 40 / 60 / 80 / 100** mods per page — or switch to **infinite scroll** for the whole listing.

It uses Nexus's own public GraphQL API (the same one their website uses) with your existing session, appends mod tiles to the same grid Nexus rendered, and doesn't touch anything else on the page.

## Screenshots

<!-- TODO: drop screenshots here -->
<!-- ![Dropdown in toolbar](docs/dropdown.png) -->
<!-- ![80 mods grid](docs/grid.png) -->

## Features

- **5 page-size presets** (20 / 40 / 60 / 80 / 100) + **All (infinite scroll)** mode
- Native-looking dropdown button injected into the Nexus toolbar
- Custom pagination bar that respects the chosen page size
- Preserves all current filters: sort, direction, tags, categories, languages, adult content, vortex support, time range, keyword search
- **Smart deduplication** — mod tiles matched by canonical URL, never duplicated
- **11 UI languages**: English, Russian, German, French, Spanish, Italian, Polish, Portuguese (BR), Chinese (CN), Japanese, Hindi
- **Polite rate limiting** — exponential backoff with `Retry-After` support, 5-error circuit breaker, randomised batch pauses
- **Stable random/surprise sort** — single seed across batches, no duplicates from re-shuffles
- **Accessibility** — `role="menu"`, `aria-expanded`, Escape-to-close, focus return
- **XSS-safe** rendering — all dynamic values escaped, image URLs validated

## Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) — Chrome / Firefox / Edge / Opera / Safari (recommended)
   - [Violentmonkey](https://violentmonkey.github.io/) — Chrome / Firefox / Edge
2. Install the script:
   - **From Greasy Fork** *(recommended, includes auto-updates)*: <https://greasyfork.org/scripts/PLACEHOLDER-ID>
   - **From this repo**: open [`NexusMods_ModsPerPage.user.js`](./NexusMods_ModsPerPage.user.js) and your userscript manager will offer to install
3. Visit any Nexus Mods listing, e.g. <https://www.nexusmods.com/games/skyrim/mods>
4. Use the **«Per page: 20 ▾»** button next to the native sort/filter toolbar
5. Your preferred size is remembered between sessions

## How it works

The script reads the same `ModsListing` GraphQL operation that the Nexus website uses, authenticated with your existing browser session (`credentials: 'include'`). It paginates the API with `count: 20, offset: N`, deduplicates by canonical mod URL, and appends tiles to the existing `div.mods-grid` container. Nexus's own server-rendered tiles are left untouched.

```

[Nexus SSR: 20 tiles] + [script-fetched: 20–80 tiles] = [grid with N tiles]

```

When the user picks a new size:
1. New target persisted to `localStorage`
2. Previously-appended tiles removed; Nexus's SSR tiles preserved
3. URL pagination param recomputed to roughly preserve scroll position
4. Background load runs with polite pauses and exponential backoff

## Privacy

- **No telemetry. No analytics. No external servers.**
- The script only talks to `api-router.nexusmods.com/graphql` (Nexus's own API) using your own session cookies, the same way Nexus's website does.
- Data is stored only in:
  - `localStorage` — your chosen page size
  - `sessionStorage` — cached total mod count per listing

## Compatibility

| Manager | Status |
|---|---|
| Tampermonkey | ✅ Primary target |
| Violentmonkey | ✅ Tested |
| Greasemonkey | ⚠️ Untested but should work — pure userscript, `@grant none` |

Browsers: any modern Chromium, Firefox, Safari with userscript manager installed.

## Limitations

- Works on game-specific listings (`/games/<game>/mods`) and the global mods page (`/mods`). Not on individual mod detail pages.
- "All (infinite scroll)" mode is naturally rate-limited by Nexus's GraphQL endpoint. For very large listings (10k+) loading takes a while; the script throttles itself politely.
- If Nexus changes their GraphQL schema or `data-e2eid` selectors, the script may break — please [open an issue](../../issues).

## Development

The script is a single self-contained `.user.js` file with no build step:

```

# Syntax check

node --check NexusMods_ModsPerPage.user.js

# Lint (optional)

npx eslint NexusMods_ModsPerPage.user.js

```

Pull requests welcome — for non-trivial changes please open an issue first.

### Project structure

```

NexusMods_ModsPerPage.user.js   ← the script (drop into Tampermonkey)

[README.md](http://README.md)                        ← this file

LICENSE                          ← MIT

docs/                            ← screenshots (optional)

```

## FAQ

**Q: Does this give me Nexus Premium features?**
A: No. This is a UX improvement — the per-page count is not a Premium-gated feature. Premium gives ad-free browsing, no captchas, multi-GB downloads, instant download links, etc. This script does none of those.

**Q: Will Nexus ban me for using this?**
A: Extremely unlikely. The script uses the same GraphQL API as the website, with the same session, at a rate slower than normal browsing. There's no scraping, no automation, no API abuse.

**Q: Why does it sometimes take a few seconds to load 80 mods?**
A: To avoid hammering Nexus's API, the script pauses 500–900 ms between 20-mod batches. Loading 80 mods = 3 batches = ~1.5–3 s on top of network latency.

**Q: Does it work with adblockers?**
A: Yes. Nexus's ads (Playwire Ramp) are unrelated to the mods API. You may see harmless `window.ramp.destroyUnits is not a function` warnings in the console — those are from Nexus's own code, not this script.

## License

[MIT](LICENSE) © Steven (LIME)

## Disclaimer

This project is **not affiliated with, endorsed by, or sponsored by Nexus Mods** or its operators. "Nexus Mods" is the property of its respective owners. This is an independent, open-source userscript that uses Nexus's publicly accessible GraphQL endpoint.
