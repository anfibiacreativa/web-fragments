# Agent Instructions for Web Fragments Development

## Critical Rules - READ FIRST

### 0. Server Management

**DO NOT start, stop, restart, or manage servers directly.**

- The user will manually start/stop servers using `./scripts/restart-sw-stack.sh`
- **NEVER** run terminal commands to kill processes, restart servers, or manage ports
- If you need servers restarted or rebuilt, **ASK THE USER**
- If you need to verify server status, **ASK THE USER**

### 1. Production Code Protection

**DO NOT MODIFY** any code under `packages/` except for:

- `packages/web-fragments/src/gateway/middleware/web-for-sw.ts` (SW-specific middleware - IN DEVELOPMENT)
- `packages/web-fragments/src/gateway/middleware/service-worker.ts` (SW wrapper - IN DEVELOPMENT)

**PRODUCTION CODE (DO NOT TOUCH):**

- `packages/web-fragments/src/gateway/middleware/web.ts` - PRODUCTION, WORKING
- `packages/web-fragments/src/gateway/fragment-gateway.ts` - PRODUCTION, WORKING
- `packages/web-fragments/src/elements/**` - PRODUCTION, WORKING
- All other files under `packages/`

**Temporary debugging only:**

- You MAY add `console.log` statements for debugging
- You MUST remove them before final commit
- DO NOT change any logic, types, or structure

### 1.1. Service Worker Goal

**The goal of Service Worker support is to enable the fragment gateway middleware to run in a Service Worker context**, avoiding the need for backend-side deployment. The middleware should work the same way it does in Express, Connect, or Web platforms (like Cloudflare Workers), but executed entirely in the browser's Service Worker.

This means:

- Service Worker intercepts fragment requests
- Gateway middleware processes them client-side
- Fragment responses are fetched and composed in the browser
- No backend server needed for the gateway logic

### 2. Required Reading Before Making Decisions

**MANDATORY - Read these files BEFORE making ANY architectural decisions or assessments:**

1. **Flow Diagrams:**

   - `/e2e/sw-vite-test/expected-flow.mmd` - The expected request/response flow
   - `/e2e/sw-vite-test/header-flow.mmd` - Header transformation chain

2. **Documentation:**

   - `/docs/src/pages/documentation/gateway.md` - Gateway architecture and requirements
   - `/docs/src/pages/documentation/elements.md` - Fragment elements behavior
   - `/docs/src/pages/documentation/getting-started.md` - Setup and configuration
   - `/docs/src/pages/documentation/glossary.md` - Terminology

3. **Debug Documents:**
   - Any `DEBUG_*.md` files in the root directory

### 3. Development Guidelines

#### When Working on Service Worker Support:

1. **ALWAYS** check the flow diagrams first
2. **UNDERSTAND** the header transformation chain (service-worker.ts → web-for-sw.ts → fragment server)
3. **UNDERSTAND** how Node servers handle shell routes (see `/e2e/node-servers/app/server/src/express.ts`)
   - Middleware is installed BEFORE static file serving
   - Middleware intercepts fragment routes and returns combined HTML
   - Manual route handlers serve shell HTML files for non-fragment requests
4. **REMEMBER** the architecture:
   - Route patterns MUST include both page routes AND asset routes
   - Assets paths typically use `/_fragment/<fragment-id>/:_*` pattern
   - Gateway routes ALL requests (pages + assets) to the correct fragment endpoint
   - Service Worker intercepts and passes through to gateway middleware

#### Asset Routing is Critical:

From `gateway.md`:

> A typical fragment has two kinds of url patterns which you need to configure in `routePatterns`:
>
> - The routable url pattern — navigating to a url matching this pattern with the browser should invoke a fragment
> - The asset url pattern — a pattern which uniquely identifies static assets of a fragment belonging to a particular fragment. We recommend using `/_fragment/<fragment-id>/` prefix to ensure uniqueness.

**NEVER** bypass fragment assets in the Service Worker - they MUST be routed through the gateway to the fragment endpoint.

### 4. Testing Changes

Before proposing any solution:

1. Verify against the expected flow diagram
2. Check that headers are preserved correctly through the chain
3. Ensure asset requests are routed to fragment endpoints
4. Test with BOTH Qwik and Remix fragments

### 5. Communication

When discussing issues:

- Reference specific line numbers from flow diagrams
- Quote relevant documentation sections
- Explain which part of the header transformation chain is affected
- Show before/after request/response flows

### 6. Common Pitfalls to Avoid

❌ **DON'T:**

- Modify production code without explicit permission
- Make assumptions without reading the docs
- Bypass asset requests in the Service Worker
- Remove route patterns for `/_fragment/*` paths
- Change header handling without understanding the full chain
- Guess at architectural decisions

✅ **DO:**

- Read the flow diagrams first
- Understand the complete request/response cycle
- Preserve all headers through the transformation chain
- Route both pages AND assets through the gateway
- Ask for clarification when unsure
- Reference documentation in your reasoning

## Current Work Context

**Active Development:**

- Service Worker support for fragment gateway
- File: `packages/web-fragments/src/gateway/middleware/web-for-sw.ts`
- Test environment: `e2e/sw-vite-test/`

**Known Working (Production):**

- Non-SW middleware: `web.ts`
- Fragment elements and custom elements
- Gateway routing and fragment registration
- Fragment embedding and shadow DOM

## Questions?

If you're unsure about anything:

1. Read the relevant documentation section
2. Check the flow diagrams
3. Ask for clarification
4. **DO NOT** make assumptions or changes without understanding

---

**Remember: Production code is WORKING and in USE. Do not break it.**
