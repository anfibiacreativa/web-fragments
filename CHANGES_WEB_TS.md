# Service Worker Support Implementation

## Summary
Created `web-for-sw.ts` - a Service Worker optimized version of the web middleware with SW-specific fixes. The original `web.ts` remains **completely untouched** to avoid breaking changes in production.

## Architecture Decision
- **web.ts** - Unchanged, used by non-SW environments (production code)
- **web-for-sw.ts** - New file with SW-specific fixes
- **service-worker.ts** - Updated to import `getWebMiddlewareForSW()` from `web-for-sw.ts`

## Changes in web-for-sw.ts

## Changes in web-for-sw.ts

### 1. Response Cloning Fix
Changed from creating new Response with body to using `.clone()` in multiple locations:

**App shell response (line ~106):**
```typescript
// SW FIX: Use .clone() for proper response duplication
const appShellResponse = originalNextResponse.clone();
```

**Why:** Using `new Response(body)` can cause body consumption issues in Service Workers. The `.clone()` method properly duplicates the response including body stream.

### 2. Immutable Headers Fixes (4 locations)
Service Worker cloned responses have immutable headers. Fixed by creating new Headers objects before modification:

**Location 1 - Non-fragment routes:**
```typescript
const headers = new Headers(appShellResponse.headers);
headers.append('x-web-fragment-id', '<app-shell>');
return new Response(appShellResponse.body, { 
    status: appShellResponse.status, 
    statusText: appShellResponse.statusText, 
    headers 
});
```

**Location 2 - Early return path:**
```typescript
const headers = new Headers(appShellResponse.headers);
headers.append('vary', 'sec-fetch-dest');
headers.append('x-web-fragment-id', '<app-shell>');
return new Response(appShellResponse.body, { status: appShellResponse.status, statusText: appShellResponse.statusText, headers });
```

**Location 3 - Combined response:**
```typescript
const headers = new Headers(combinedResponse.headers);
headers.append('vary', 'sec-fetch-dest');
headers.append('x-web-fragment-id', matchedFragment.fragmentId);
const responseWithHeaders = new Response(combinedResponse.body, { status: combinedResponse.status, statusText: combinedResponse.statusText, headers });
```

**Location 4 - Soft navigation:**
```typescript
const headers = new Headers(fragmentResponse.headers);
headers.append('vary', 'sec-fetch-dest');
headers.append('x-web-fragment-id', matchedFragment.fragmentId);
const fragmentSoftNavResponse = new Response(fragmentResponse.body, { status: fragmentResponse.status, statusText: fragmentResponse.statusText, headers });
```

**Location 5 - Asset response:**
```typescript
const assetHeaders = new Headers(fragmentResponse.headers);
assetHeaders.append('x-web-fragment-id', matchedFragment.fragmentId);
const fragmentAssetResponse = new Response(fragmentResponse.body, { status: fragmentResponse.status, statusText: fragmentResponse.statusText, headers: assetHeaders });
```

### 3. Redirect Mode Fix
```typescript
// SW FIX: Use 'follow' redirect mode (manual not allowed with cors mode in SW)
return fragmentFetch(fragmentReq, { redirect: 'follow' });
```

**Why:** Service Workers with `mode: 'cors'` cannot use `redirect: 'manual'`. The original web.ts uses 'manual' to ensure redirects are sent to the client, but in SW context we must use 'follow'.

### 4. Removed isServiceWorker Option Check
The original web.ts had:
```typescript
const redirectMode = options.isServiceWorker ? 'follow' : 'manual';
```

In web-for-sw.ts, it's always 'follow' since this file is SW-only.

### 4. Removed isServiceWorker Option Check
The original web.ts had:
```typescript
const redirectMode = options.isServiceWorker ? 'follow' : 'manual';
```

In web-for-sw.ts, it's always 'follow' since this file is SW-only.

### 5. Comprehensive Debug Logging
Added detailed logging throughout the piercing flow:

**Shell fetch logging:**
```typescript
console.log('[Web] Fetching shell HTML via next()');
const originalNextResponse = await next();
console.log('[Web] Shell response received:', originalNextResponse.status, originalNextResponse.ok);
```

**embedFragmentIntoShellApp logging:**
```typescript
console.log('[Web] embedFragmentIntoShellApp entered - fragmentId:', fragmentId);
console.log('[Web] appShellResponse ok/status/content-type:', appShellResponse.ok, appShellResponse.status, appShellResponse.headers.get('content-type'));
console.log('[Web] fragmentResponse ok/status/content-type:', fragmentResponse.ok, fragmentResponse.status, fragmentResponse.headers.get('content-type'));
console.log('[Web] shell length:', shellText.length);
console.log('[Web] fragment length:', fragText.length);
console.log('[Web] shell first 200 chars:', shellText.slice(0, 200).replace(/\n/g, ' '));
console.log('[Web] fragment first 200 chars:', fragText.slice(0, 200).replace(/\n/g, ' '));
```

**HTMLRewriter element matching:**
```typescript
console.log('[Web] HTMLRewriter matched <web-fragment> element with fragment-id:', element.getAttribute('fragment-id'));
console.log('[Web] Embedding fragment content (length:', fragmentContent.length, ')');
```

## Changes in service-worker.ts

Updated import and usage:
```typescript
// Before:
import { getWebMiddleware } from './web';
const webMiddleware = getWebMiddleware(gateway, { ...options, isServiceWorker: true });

// After:
import { getWebMiddlewareForSW } from './web-for-sw';
const webMiddleware = getWebWebMiddlewareForSW(gateway, options);
```

## Why This Approach?

1. **Zero breaking changes** - Production code in `web.ts` remains untouched
2. **Clean separation** - SW-specific logic isolated in dedicated file
3. **Maintainability** - Easy to see SW-specific fixes with "SW FIX" comments
4. **Safety** - No risk of SW workarounds affecting production environments

## Testing Recommendations

### Response Handling
1. ✅ Verify shell HTML fetched correctly via next()
2. ✅ Check response.clone() doesn't cause body consumption issues
3. ✅ Ensure headers can be modified without errors

### Fragment Embedding
1. ✅ Verify fragments appear in <web-fragment> elements
2. ✅ Check shadow DOM structure is correct
3. ✅ Ensure HTMLRewriter finds and processes elements

### Headers
1. ✅ Verify vary header appended correctly
2. ✅ Check x-web-fragment-id header present
3. ✅ Ensure no "immutable headers" errors in console
