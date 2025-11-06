# Service Worker Vite Sample

This sample demonstrates using the `web-fragments` service worker middleware to load the Remix and Qwik fragments without cross-origin CORS problems. The Express server listens on a single origin (default `http://localhost:4182`) and proxies fragment requests to the existing Remix (`http://localhost:5173`) and Qwik (`http://localhost:5174`) fragment dev servers. The Express host is purely a development convenience—production setups can serve the static shell directly and point the service worker middleware at your fragment endpoints with no Node.js layer involved.

## Getting started

From the repo root run:

```bash
pnpm install
pnpm --filter pierced-react___remix-fragment dev
pnpm --filter pierced-react___qwik-fragment dev
```

Then in a new shell:

```bash
cd e2e/sw-vite-test
pnpm install
pnpm build
pnpm serve
```

Visit <http://localhost:4182> and navigate between the home, Remix, and Qwik pages. The service worker will intercept the fragment routes and serve the combined shell + fragment content via the gateway middleware.

> **Note:** If your fragment dev servers run on different ports, set `REMIX_TARGET` and `QWIK_TARGET` before starting `pnpm serve` so the express proxy can reach them.
