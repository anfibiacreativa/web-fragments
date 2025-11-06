# Service Worker Fragment Gateway Flow Analysis

## Current Architecture Overview

The Service Worker (SW) architecture implements a CDN pattern where:

- **CDN Server** (port 4182): Static file server serving HTML shell pages
- **Service Worker**: Intercepts navigation requests, composes fragments into shell
- **Fragment Servers**: Vite dev servers (Remix on 5174, Qwik on 5173) serving fragment content

## Expected Flow: What SHOULD Happen

### 1. Initial Navigation to `/remix-page`

**Browser → CDN (port 4182)**

- Request: `GET /remix-page`
- Headers:
  - `sec-fetch-dest: document` (hard navigation)
  - `mode: navigate`

**Service Worker Intercepts**

- Matches route to Remix fragment
- Creates `next()` function that fetches shell HTML from `/remix-page.html`

**SW → CDN for Shell HTML**

- Request: `GET /remix-page.html`
- Headers: `X-Service-Worker-Bypass: true`
- Response: HTML shell with `<web-fragment-host>` placeholders

**SW Middleware Processing (service-worker.ts)**

1. Preserves `sec-fetch-dest: document` → `x-wf-fetch-dest: document`
2. Creates SW-safe request:
   - `mode: 'cors'` (convert from 'navigate')
   - `credentials: 'same-origin'` (to avoid CORS wildcard conflict)
   - `redirect: 'follow'` (convert from 'manual')
3. Passes to web middleware with `isServiceWorker: true`

**Web Middleware Processing (web.ts)**

1. Matches fragment: `{ fragmentId: 'remix', endpoint: 'http://localhost:5174', piercing: true }`
2. Calculates `effectiveFetchDest = 'document'` (from sec-fetch-dest OR x-wf-fetch-dest)
3. Since `effectiveFetchDest === 'document'` AND `piercing: true`:
   - Fetches shell HTML via `next()` → gets `/remix-page.html`
   - Fetches fragment HTML from `http://localhost:5174/remix-page` with headers:
     - `x-fragment-mode: embedded`
     - `sec-fetch-dest: empty` (overridden from 'document')
   - Uses HTMLRewriter to embed fragment into shell at `<web-fragment-host>` elements
   - Returns combined HTML with fragment in shadow DOM

**Expected Result**: Browser receives combined HTML with:

- Shell structure from `/remix-page.html`
- Remix fragment content embedded in `<web-fragment-host>` shadow roots
- Scripts and styles loaded from both shell and fragment

### 2. Subsequent iframe Request (reframed pattern)

**When reframed creates iframe for isolated execution context**

**Browser → SW**

- Request: `GET /remix-page` (from iframe src)
- Headers: `sec-fetch-dest: iframe`

**SW Middleware**

- Preserves `sec-fetch-dest: iframe` → `x-wf-fetch-dest: iframe`

**Web Middleware**

- `effectiveFetchDest === 'iframe'`
- Returns stub document: `<!doctype html><title>Web Fragments: reframed`
- NO fragment fetching occurs
- iframe gets minimal document for execution context

### 3. Fragment Asset Requests

**Browser → Fragment Server (direct)**

- Requests: `GET /assets/*.js`, `GET /app/*.css`, etc.
- SW does NOT intercept (bypassed by path filters in sw.js)
- Assets load directly from Vite dev servers

## Actual Flow: What IS Happening

### Current Behavior (BROKEN)

**Step 1: Navigation starts correctly**

- Browser requests `/remix-page` with `sec-fetch-dest: document`
- SW intercepts and matches Remix fragment ✓

**Step 2: SW Middleware creates safe request**

- Preserves `sec-fetch-dest: document` → `x-wf-fetch-dest: document` ✓
- Creates request with `mode: 'cors'`, `credentials: 'same-origin'` ✓

**Step 3: Web Middleware matches fragment**

- Matches Remix fragment ✓
- `effectiveFetchDest = 'document'` ✓
- `piercing: true` ✓

**Step 4: Fragment fetching happens**

- Fetches shell HTML from `next()` ✓
- Fetches fragment from `http://localhost:5174/remix-page` ✓
- Fragment server returns embedded HTML (not full page) ✓

**Step 5: HTML Rewriting FAILS** ❌

- HTMLRewriter does NOT run
- Shell HTML is NOT modified
- Fragment HTML is returned directly to browser
- Browser receives raw fragment HTML instead of composed shell+fragment

**Symptom**: Browser shows only fragment content, no shell structure, no embedding in shadow DOM

## Root Cause Analysis

### Hypothesis 1: effectiveFetchDest Detection Failure

**Status**: UNLIKELY - Logs show correct detection

The `effectiveFetchDest` calculation appears correct based on logs. Both `sec-fetch-dest` and `x-wf-fetch-dest` should be 'document' for navigation.

### Hypothesis 2: Piercing Flow Not Triggering

**Status**: LIKELY - Need to verify

Code path for piercing (lines 86-130 in web.ts):

```typescript
if (effectiveFetchDest === 'document') {
  // Should enter this block for hard navigation
  // Fetches shell via next()
  // Fetches fragment
  // Uses HTMLRewriter to combine
  return embedFragmentIntoShellApp(...)
}
```

**Possible issue**: Flow may be falling through to line 132+ which handles soft navigation or asset requests, skipping HTMLRewriter entirely.

### Hypothesis 3: Fragment Response Type Mismatch

**Status**: POSSIBLE

The fragment server might be returning:

- Wrong content-type header
- Full HTML page instead of embedded fragment
- Response that causes HTMLRewriter to skip processing

### Hypothesis 4: next() Function Not Working

**Status**: POSSIBLE

The `next()` function in sw.js (lines 89-99) fetches shell HTML:

```javascript
const next = async () => {
	const htmlPath = `/${shellSegment || 'index'}.html`;
	return fetch(htmlUrl, { headers: { 'X-Service-Worker-Bypass': 'true' } });
};
```

**Possible issues**:

- Shell HTML not found (404)
- Shell HTML missing `<web-fragment-host>` elements
- Fetch failing silently

### Hypothesis 5: isServiceWorker Flag Not Passed Through

**Status**: UNLIKELY - Set explicitly in service-worker.ts line 31

The flag is set: `{ ...options, isServiceWorker: true }` and used in fetchFragment for redirect mode.

## Debugging Strategy

### Immediate Checks Needed

1. **Add logging to web.ts line 86**:

   ```typescript
   if (effectiveFetchDest === 'document') {
     console.log('[Web] PIERCING FLOW - fetching shell and fragment');
     console.log('[Web] Fragment config:', matchedFragment);
   ```

2. **Add logging before embedFragmentIntoShellApp call (line 108)**:

   ```typescript
   console.log('[Web] About to embed fragment into shell');
   console.log('[Web] Fragment response ok:', fragmentResponse.ok);
   console.log('[Web] Fragment content-type:', fragmentResponse.headers.get('content-type'));
   ```

3. **Add logging in next() function in sw.js**:

   ```typescript
   const next = async () => {
   	console.log('[SW] next() called - fetching shell:', htmlUrl.href);
   	const response = await fetch(htmlUrl, { headers: { 'X-Service-Worker-Bypass': 'true' } });
   	console.log('[SW] Shell response:', response.status, response.ok);
   	return response;
   };
   ```

4. **Check shell HTML structure**:

   - Verify `/remix-page.html` exists in dist/
   - Verify it contains `<web-fragment-host>` elements
   - Verify it's valid HTML with proper structure

5. **Check fragment response headers**:
   ```typescript
   console.log('[Web] Fragment headers:', Object.fromEntries(fragmentResponse.headers.entries()));
   ```

## Key Questions to Answer

1. **Is `effectiveFetchDest === 'document'` true?** → Should be YES based on logs
2. **Does `matchedFragment.piercing === true`?** → Should be YES from sw.js registration
3. **Is the shell HTML fetch succeeding?** → UNKNOWN - need logs
4. **Is the fragment fetch succeeding?** → Appears YES but need content-type verification
5. **Is HTMLRewriter being invoked?** → UNKNOWN - likely NO
6. **Are there errors in embedFragmentIntoShellApp?** → UNKNOWN - may be throwing silently

## Next Steps

1. Add comprehensive logging throughout web.ts piercing flow
2. Verify shell HTML structure and `<web-fragment-host>` presence
3. Check fragment server response content-type and format
4. Trace exact code path execution through web.ts
5. Check for any promise rejection or error handling that might skip HTMLRewriter

## Critical Code Sections

### service-worker.ts (lines 44-65)

- Preserves sec-fetch-dest in x-wf-fetch-dest
- Creates SW-safe request with cors/same-origin/follow

### web.ts (lines 53-58)

- Calculates effectiveFetchDest
- Logs fragment matching

### web.ts (lines 86-130)

- **THE PIERCING FLOW** - where HTMLRewriter should run
- This is likely where the failure occurs

### web.ts (lines 223-285)

- fetchFragment function
- Sets x-fragment-mode: embedded
- Overrides sec-fetch-dest to 'empty'

### sw.js (lines 89-99)

- next() function that fetches shell HTML
- May be failing silently

## Expected vs Actual Headers

### Expected: Browser → SW (Initial Request)

```
sec-fetch-dest: document
mode: navigate
credentials: include
```

### Expected: SW → Web Middleware

```
sec-fetch-dest: (stripped by browser)
x-wf-fetch-dest: document  ← Preserved by SW
mode: cors
credentials: same-origin
```

### Expected: Web → Fragment Server

```
x-fragment-mode: embedded
sec-fetch-dest: empty  ← Overridden
x-forwarded-proto: http
x-forwarded-host: localhost:4182
```

### Expected: Fragment Server Response

```
content-type: text/html
(embedded HTML fragment, not full page)
```
