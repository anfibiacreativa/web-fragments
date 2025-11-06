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

## Test: Browser Header Stripping Behavior

The `test-sec-fetch-dest.html` file demonstrates a critical browser security behavior that necessitates a workaround in the Service Worker middleware.

### Running the Test

```bash
# Option 1: Open directly in browser (no server needed)
open test-sec-fetch-dest.html

# Option 2: From macOS Finder
# Double-click the file to open in your default browser
```

### What the Test Proves

This standalone HTML file demonstrates three key behaviors:

1. **`mode: 'navigate'` throws TypeError** - The Request constructor in Service Workers cannot use `mode: 'navigate'`, requiring conversion to `mode: 'cors'`

2. **Browser strips `sec-fetch-dest`** - When creating a new Request with `mode: 'cors'`, the browser automatically strips all `sec-fetch-*` headers, even if explicitly set

3. **Custom header workaround** - Preserving the original `sec-fetch-dest` value in a custom header `x-wf-fetch-dest` successfully bypasses the stripping behavior

### Why This Matters

The Service Worker middleware in `packages/web-fragments/src/gateway/middleware/service-worker.ts` relies on the `sec-fetch-dest` header to detect iframe requests and return the appropriate stub document for the reframed pattern. Since browsers strip this header when creating CORS requests, the middleware must:

```typescript
// Preserve sec-fetch-dest before creating the new Request
const secFetchDest = request.headers.get('sec-fetch-dest');
const headers = new Headers(request.headers);
if (secFetchDest) {
	headers.set('x-wf-fetch-dest', secFetchDest);
}

// Create new Request with mode:'cors' (strips sec-fetch-dest but keeps x-wf-fetch-dest)
const safeRequest = new Request(request.url, {
	headers,
	mode: 'cors',
});
```

The web middleware (`web.ts`) then checks both headers to determine the effective fetch destination:

```typescript
const effectiveFetchDest = request.headers.get('x-wf-fetch-dest') || request.headers.get('sec-fetch-dest');
```

This test file serves as living documentation proving that this workaround is necessary due to browser security policies.
