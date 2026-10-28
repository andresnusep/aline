# aline

React + Vite + TypeScript build of the Claude Design prototypes in `project/`.
Frontend only: the other DJs are demo data and invite/personal links are placeholders.

```sh
npm install
npm run dev      # local dev server
npm test         # parsing / title cleaning / repeat matching tests
npm run build    # static output in dist/
```

Two layouts from the design: the web version (`aline Web.dc.html`) on screens 900px and wider, and
the phone version (`aline Phone.dc.html`) full-screen on anything narrower.

Prototype settings are URL parameters:

| Param | Example | Effect |
| --- | --- | --- |
| `screen` | `?screen=join` | Open on `start`, `create`, `created`, `join`, `saved` or `app` |
| `loaded` | `?loaded=1` | Load the sample `Latin Club.txt` on open |
| `drop` | `?drop=8` | BPM drop between DJs that triggers the order warning (default 5) |

## Layout

- `src/lib/tracks.ts` — rekordbox `.txt` parsing (UTF-16), title cleaning, same-song matching
- `src/lib/analysis.ts` — lineup, set, BPM flow and repeat views derived from state
- `src/lib/demo.ts` — demo sets for SOL MONTES and PERRO SALVAJE
- `src/state.tsx` — app state, file import, toasts, share/copy
- `src/screens/Onboarding.tsx` — start, create, created, join, saved (shared by both layouts)
- `src/screens/Tabs.tsx` — phone Event / Set / Lineup tabs
- `src/screens/Web.tsx` — web header, start page and one-page event dashboard

## Deploy (Cloudflare Workers via GitHub)

Deployed as a Worker with static assets, configured in `wrangler.jsonc` at the repo root:
`wrangler deploy` installs and builds `app/` and uploads `app/dist`. In the Worker's Settings → Build:

- Root directory: `/`
- Build command: none
- Deploy command: `npx wrangler deploy`

Every push to `main` redeploys.
