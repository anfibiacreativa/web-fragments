# Service Worker Fragment Gateway Issue - Need Help

## Context

I'm working on adding Service Worker support to the web-fragments library. The goal is to enable the fragment gateway middleware to run in a Service Worker context, avoiding backend deployment. The middleware should work the same as it does in Express/Connect/Web platforms, but executed entirely in the browser's Service Worker.

**Repository**: https://github.com/anfibiacreativa/web-fragments  
**Branch**: `feat/add-sw-support`

## Current Problem

The Service Worker is intercepting fragment requests correctly, but there's an issue with how different request types are being handled:

1. **Document navigation** (`/remix-page` in browser) → Goes through piercing flow → Fails because HTMLRewriter not available in browser SW
2. **Iframe navigation** (created by reframed element) → Should get stub document with title "Web Fragments: reframed" but getting wrong content
3. **Fetch request** (for fragment content) → Should get full fragment HTML

### Latest Console Logs

```
[Main] SW registered with scope: http://localhost:4182/
[Main] SW already controlling
[Main] Initializing web fragments
[DEBUG SW] fetch: http://localhost:4182/remix-page mode: navigate dest: document sec-fetch-dest: null
[SW] Intercepting fragment route: /remix-page matched fragment: remix sec-fetch-dest: null
[SW Middleware] Inferred destination from mode=navigate: document
[Web Middleware] Fragment: remix sec-fetch-dest: null x-wf-fetch-dest: document effective: document
[Web] PIERCING FLOW ENTERED - effectiveFetchDest=document, piercing: true
[Web] Fetching shell HTML via next()
[SW] Fetching HTML shell from: http://localhost:4182/remix-page.html
[Web] HTMLRewriter is not available in this runtime. Aborting embedding.
```

The iframe request shows `dest: iframe` in one log but the middleware is not returning the stub correctly. The web-fragment element ends up embedding the shell page instead of the fragment content.

## Critical Files to Read

### 1. AGENTS.md (Critical Rules)
**Location**: `/AGENTS.md`

Key rules you MUST follow:
- **DO NOT modify production code** under `packages/` except:
  - `packages/web-fragments/src/gateway/middleware/web-for-sw.ts` (IN DEVELOPMENT)
  - `packages/web-fragments/src/gateway/middleware/service-worker.ts` (IN DEVELOPMENT)
- You MAY add `console.log` for debugging (must remove before commit)
- You MUST NOT change logic in `packages/web-fragments/src/elements/**` - these are PRODUCTION

### 2. Flow Diagrams (MANDATORY Reading)
**Location**: `/e2e/sw-vite-test/`
- `expected-flow.mmd` - The expected request/response flow
- `header-flow.mmd` - Header transformation chain
- `SERVICE_WORKER_FLOW.md` - Detailed flow documentation

### 3. Architecture Documentation
**Location**: `/docs/src/pages/documentation/`
- `gateway.md` - Gateway architecture and requirements
- `elements.md` - Fragment elements behavior  
- `glossary.md` - Terminology

### 4. Test Environment
**Location**: `/e2e/sw-vite-test/`
- `sw.js` - Service Worker implementation
- `main.js` - App initialization
- `remix-page.html` - Shell HTML for remix fragment
- `qwik-page.html` - Shell HTML for qwik fragment

### 5. Key Middleware Files
**Location**: `/packages/web-fragments/src/gateway/middleware/`
- `service-worker.ts` - SW wrapper that preserves headers in `x-wf-fetch-dest`
- `web-for-sw.ts` - SW-optimized middleware that should return stub for iframe
- `web.ts` - PRODUCTION middleware (DO NOT TOUCH except to understand how it works)

## The Architecture (from docs)

### Request Flow (from expected-flow.mmd)
1. Browser navigates to `/remix-page`
2. Service Worker intercepts
3. Middleware returns combined HTML (shell + fragment)
4. Page loads with `<web-fragment fragment-id="remix">`
5. web-fragment creates iframe with `src="/remix-page"` (for script execution context)
6. web-fragment calls `fetch('/remix-page')` (for content to stream into shadow DOM)
7. SW intercepts BOTH iframe and fetch requests
8. For iframe: return stub `<!doctype html><title>Web Fragments: reframed`
9. For fetch: return full fragment HTML

### Header Transformation Chain (from header-flow.mmd)
```
Browser Request (iframe navigation)
  ↓ destination: 'iframe', sec-fetch-dest: 'iframe'
Service Worker (service-worker.ts)
  ↓ Wraps to mode: 'cors', preserves in x-wf-fetch-dest: 'iframe'
Web Middleware (web-for-sw.ts)
  ↓ Reads x-wf-fetch-dest → effectiveFetchDest: 'iframe'
  ↓ if effectiveFetchDest === 'iframe' → return stub
Fragment Server
  ✗ Never reached for iframe requests
```

## Fragment Servers
- Qwik fragment: `http://localhost:5173`
- Remix fragment: `http://localhost:5174`
- Gateway/CDN: `http://localhost:4182` (where SW is registered)

## What Should Happen (Expected Behavior)

1. Navigate to `http://localhost:4182/remix-page`
2. SW returns combined HTML (shell + fragment) - BUT piercing won't work (HTMLRewriter unavailable)
3. Shell loads with `<web-fragment fragment-id="remix"></web-fragment>` 
4. Element creates hidden iframe: `<iframe src="/remix-page" hidden>`
5. Element calls: `fetch('/remix-page', {headers: {'x-web-fragment-id': 'remix'}})`
6. SW intercepts iframe navigation → returns stub (title: "Web Fragments: reframed")
7. SW intercepts fetch → proxies to `http://localhost:5174/remix-page` → returns fragment HTML
8. Fragment HTML streams into shadow DOM
9. Scripts execute in iframe context

## What's Actually Happening (Current Broken State)

The iframe is getting the wrong content (shell page instead of stub), causing the web-fragment to embed the shell instead of the fragment content.

## Your Task

1. **Clone the repo and checkout the branch**: `git clone https://github.com/anfibiacreativa/web-fragments.git && cd web-fragments && git checkout feat/add-sw-support`

2. **Read the critical files** in this order:
   - `/AGENTS.md` - Understand what you can/cannot modify
   - `/e2e/sw-vite-test/expected-flow.mmd` - Understand expected flow
   - `/e2e/sw-vite-test/header-flow.mmd` - Understand header chain
   - `/docs/src/pages/documentation/gateway.md` - Understand architecture
   - `/packages/web-fragments/src/gateway/middleware/service-worker.ts` - How headers are preserved
   - `/packages/web-fragments/src/gateway/middleware/web-for-sw.ts` - Where stub should be returned

3. **Analyze the issue**:
   - Why isn't the stub being returned for iframe requests?
   - The logs show `effective: document` for the first request - correct
   - Later logs show `effective: iframe` - also correct!
   - But the iframe is still getting wrong content
   - Is there a caching issue?
   - Is the response being cloned incorrectly?
   - Is there a timing issue?

4. **Fix the issue** following AGENTS.md rules:
   - Only modify files in `/e2e/sw-vite-test/` or the two allowed middleware files
   - Add debug logging to understand what's happening
   - Ensure iframe gets stub: `<!doctype html><title>Web Fragments: reframed`
   - Ensure fetch gets full fragment HTML
   - Test with BOTH Qwik and Remix fragments

5. **Server Management**:
   - Use `./scripts/restart-sw-stack.sh` to rebuild and restart all servers
   - Ports: Qwik (5173), Remix (5174), Gateway (4182)
   - Never manually kill processes or manage ports

## Success Criteria

1. Navigate to `http://localhost:4182/remix-page`
2. Page loads without errors
3. Check Elements tab: `<web-fragment>` has shadow DOM with fragment content (NOT shell content)
4. Check iframe (hidden): title is "Web Fragments: reframed" (NOT "Remix Fragment Page")
5. Fragment content displays correctly in the page
6. Console shows no "Reframed IFrame init error"

## Additional Context

- **HTMLRewriter Issue**: Browser Service Workers don't support HTMLRewriter (Cloudflare Workers only), so the piercing flow will fail. This is expected. Focus on making the reframed (non-pierced) flow work.

- **Working Reference**: The node servers in `/e2e/node-servers/` show a working implementation of the same gateway pattern. Compare configurations if needed.

- **Three Request Types**:
  1. Document navigation: `destination: 'document'`, `mode: 'navigate'`
  2. Iframe navigation: `destination: 'iframe'`, `mode: 'navigate'`
  3. Fetch call: `destination: ''`, `mode: 'cors'`

Please help fix this! Read the diagrams and docs carefully, understand the expected flow, then identify and fix why the iframe isn't getting the stub document.
