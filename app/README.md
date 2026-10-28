# aline — phone app

React + Vite + TypeScript build of `project/aline Phone.dc.html` (the Claude Design prototype).
Frontend only: the other DJs are demo data and invite/personal links are placeholders.

```sh
npm install
npm run dev      # local dev server
npm test         # parsing / title cleaning / repeat matching tests
npm run build    # static output in dist/ — deploy to Cloudflare Pages
```

On screens wider than 500px the app shows inside a phone frame next to the logo, as in the
prototype. On a phone it fills the screen.

Prototype settings are URL parameters:

| Param | Example | Effect |
| --- | --- | --- |
| `screen` | `?screen=join` | Open on `start`, `create`, `created`, `join`, `saved` or `app` |
| `loaded` | `?loaded=1` | Load the sample `Latin Club.txt` on open |
| `logo` | `?logo=0` | Hide the logo panel on desktop |
| `drop` | `?drop=8` | BPM drop between DJs that triggers the order warning (default 5) |

## Layout

- `src/lib/tracks.ts` — rekordbox `.txt` parsing (UTF-16), title cleaning, same-song matching
- `src/lib/analysis.ts` — lineup, set, BPM flow and repeat views derived from state
- `src/lib/demo.ts` — demo sets for SOL MONTES and PERRO SALVAJE
- `src/state.tsx` — app state, file import, toasts, share/copy
- `src/screens/` — onboarding screens (start, create, created, join, saved) and the Event / Set / Lineup tabs

## Deploy (Cloudflare Workers via GitHub)

Deployed as a Worker with static assets, configured in `wrangler.jsonc` at the repo root:
`wrangler deploy` installs and builds `app/` and uploads `app/dist`. In the Worker's Settings → Build:

- Root directory: `/`
- Build command: none
- Deploy command: `npx wrangler deploy`

Every push to `main` redeploys.
