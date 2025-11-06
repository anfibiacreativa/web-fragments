# Service Worker Fragment Gateway - Sequence Diagrams

## Expected Flow: Successful Fragment Piercing

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant SW as Service Worker
    participant CDN as CDN Server<br/>(port 4182)
    participant Remix as Remix Fragment<br/>(port 5174)

    Note over Browser,Remix: INITIAL NAVIGATION TO /remix-page

    Browser->>+SW: GET /remix-page
    Note right of Browser: Headers:<br/>sec-fetch-dest: document<br/>mode: navigate<br/>credentials: include

    SW->>SW: Match route → Remix fragment
    Note right of SW: Preserve sec-fetch-dest<br/>in x-wf-fetch-dest

    SW->>SW: Create SW-safe request
    Note right of SW: mode: cors (from navigate)<br/>credentials: same-origin<br/>redirect: follow<br/>x-wf-fetch-dest: document

    SW->>+CDN: GET /remix-page.html
    Note right of SW: Headers:<br/>X-Service-Worker-Bypass: true
    CDN-->>-SW: HTML Shell
    Note left of CDN: Contains web-fragment-host placeholders

    SW->>SW: Web Middleware Processing
    Note right of SW: effectiveFetchDest = 'document'<br/>piercing = true<br/>→ Enter piercing flow

    SW->>+Remix: GET /remix-page
    Note right of SW: Headers:<br/>x-fragment-mode: embedded<br/>sec-fetch-dest: empty<br/>x-forwarded-host: localhost:4182
    Remix-->>-SW: Fragment HTML
    Note left of Remix: Embedded fragment<br/>(not full page)

    SW->>SW: HTMLRewriter.transform()
    Note right of SW: Embed fragment into web-fragment-host<br/>Create shadow DOM

    SW-->>-Browser: Combined HTML
    Note left of SW: Shell + Fragment<br/>in shadow roots

    Browser->>Browser: Render page
    Note right of Browser: Fragment content<br/>in shadow DOM<br/>Isolated execution

    Note over Browser,Remix: REFRAMED IFRAME REQUEST

    Browser->>+SW: GET /remix-page (from iframe)
    Note right of Browser: Headers:<br/>sec-fetch-dest: iframe

    SW->>SW: effectiveFetchDest = 'iframe'
    Note right of SW: Preserved via<br/>x-wf-fetch-dest

    SW-->>-Browser: Stub document
    Note left of SW: Minimal HTML stub for iframe

    Browser->>Browser: iframe execution context
    Note right of Browser: Minimal document<br/>for isolation
```

## Current Broken Flow: Fragment Not Embedded

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant SW as Service Worker
    participant CDN as CDN Server<br/>(port 4182)
    participant Remix as Remix Fragment<br/>(port 5174)

    Note over Browser,Remix: WHAT'S ACTUALLY HAPPENING

    Browser->>+SW: GET /remix-page
    Note right of Browser: Headers:<br/>sec-fetch-dest: document<br/>mode: navigate

    SW->>SW: Match route ✓
    SW->>SW: Create SW-safe request ✓
    Note right of SW: x-wf-fetch-dest: document ✓<br/>mode: cors ✓<br/>credentials: same-origin ✓

    rect rgb(255, 200, 200)
        Note over SW,Remix: BROKEN: Shell fetch or embedding fails

        alt Shell fetch succeeds?
            SW->>+CDN: GET /remix-page.html
            CDN-->>-SW: HTML Shell
        else Shell fetch fails?
            SW->>CDN: GET /remix-page.html
            CDN-->>SW: 404 or error
        end

        SW->>+Remix: GET /remix-page
        Note right of SW: Headers look correct ✓
        Remix-->>-SW: Fragment HTML
        Note left of Remix: Returns embedded HTML ✓

        critical HTMLRewriter should run
            SW->>SW: embedFragmentIntoShellApp()
        option Error in embedding
            SW->>SW: Error thrown?
        option Wrong code path
            SW->>SW: Skipped embedding flow?
        option Response type mismatch
            SW->>SW: HTMLRewriter not triggered?
        end
    end

    SW-->>-Browser: Raw Fragment HTML ❌
    Note left of SW: NOT COMBINED!<br/>Missing shell structure<br/>No shadow DOM

    Browser->>Browser: Render fragment only
    Note right of Browser: Shows only fragment<br/>No shell<br/>No embedding

    rect rgb(255, 200, 200)
        Note over Browser: USER SEES:<br/>Fragment content only<br/>Missing shell structure<br/>No web-fragment-host elements
    end
```

## Detailed Header Flow

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant SW as Service Worker<br/>(service-worker.ts)
    participant Web as Web Middleware<br/>(web.ts)
    participant Fragment as Fragment Server

    Note over Browser,Fragment: HEADER TRANSFORMATION CHAIN

    Browser->>SW: Request
    Note right of Browser: ORIGINAL HEADERS:<br/>sec-fetch-dest: document<br/>mode: navigate<br/>credentials: include<br/>redirect: manual

    rect rgb(200, 230, 255)
        Note over SW: service-worker.ts lines 44-65
        SW->>SW: const secFetchDest = request.headers.get('sec-fetch-dest')
        SW->>SW: headers.set('x-wf-fetch-dest', 'document')
        SW->>SW: Create new Request()
        Note right of SW: BROWSER SECURITY:<br/>Creating Request with mode:'cors'<br/>STRIPS sec-fetch-dest!<br/>That's why we preserve it in<br/>x-wf-fetch-dest
    end

    SW->>Web: Modified Request
    Note right of SW: MODIFIED HEADERS:<br/>sec-fetch-dest: (stripped!)<br/>x-wf-fetch-dest: document ← preserved!<br/>mode: cors ← changed<br/>credentials: same-origin ← changed<br/>redirect: follow ← changed

    rect rgb(200, 255, 200)
        Note over Web: web.ts lines 53-58
        Web->>Web: requestSecFetchDest = null
        Web->>Web: xwfFetchDest = 'document'
        Web->>Web: effectiveFetchDest = 'document' ✓

        Note over Web: web.ts line 58
        Web->>Web: if (effectiveFetchDest === 'iframe')<br/>→ NO, skip stub

        Note over Web: web.ts line 80
        Web->>Web: if (piercing || effectiveFetchDest !== 'document')<br/>→ YES, fetch fragment

        Note over Web: web.ts line 86
        Web->>Web: if (effectiveFetchDest === 'document')<br/>→ YES, should enter piercing flow!
    end

    rect rgb(255, 255, 200)
        Note over Web: web.ts fetchFragment (lines 223-285)
        Web->>Web: Create fragment request
        Web->>Web: headers.set('sec-fetch-dest', 'empty')
        Web->>Web: headers.set('x-fragment-mode', 'embedded')
        Web->>Web: headers.set('x-forwarded-host', 'localhost:4182')
    end

    Web->>Fragment: Fragment Request
    Note right of Web: FRAGMENT REQUEST HEADERS:<br/>sec-fetch-dest: empty ← overridden<br/>x-fragment-mode: embedded ← added<br/>x-forwarded-host: localhost:4182 ← added<br/>x-forwarded-proto: http ← added

    Fragment->>Fragment: Detect embedded mode
    Note right of Fragment: Checks x-fragment-mode<br/>Returns partial HTML<br/>Not full page

    Fragment-->>Web: Fragment Response
    Note left of Fragment: EXPECTED:<br/>content-type: text/html<br/>Body: embedded HTML

    rect rgb(255, 200, 200)
        Note over Web: FAILURE POINT?<br/>HTMLRewriter should run here<br/>but may not be executing
    end
```

## Possible Failure Scenarios

```mermaid
sequenceDiagram
    autonumber
    participant SW as Service Worker
    participant Web as Web Middleware
    participant CDN
    participant Fragment

    Note over SW,Fragment: SCENARIO 1: Shell fetch fails

    SW->>CDN: GET /remix-page.html
    CDN-->>SW: 404 Not Found
    SW->>SW: next() promise rejected?
    SW-->>SW: Error handling skips HTMLRewriter
    SW-->>Browser: Raw fragment (error path)

    Note over SW,Fragment: SCENARIO 2: Wrong code path

    SW->>Web: Request with effectiveFetchDest='document'
    Web->>Web: piercing=true, effectiveFetchDest='document'
    Web->>Web: BUG: Condition check fails?
    Web->>Web: Falls through to line 132+ (soft nav)
    Web-->>SW: Fragment only (no embedding)

    Note over SW,Fragment: SCENARIO 3: HTMLRewriter not invoked

    Web->>CDN: Fetch shell ✓
    Web->>Fragment: Fetch fragment ✓
    Web->>Web: embedFragmentIntoShellApp() called
    Web->>Web: isNativeHtmlRewriter check?
    Web->>Web: BUG: HTMLRewriter not running?
    Web-->>SW: Returns wrong response

    Note over SW,Fragment: SCENARIO 4: Content-type mismatch

    Fragment-->>Web: Response with wrong content-type
    Web->>Web: isHTMLResponse check fails
    Web->>Web: Line 102: !isHTMLResponse → early return
    Web-->>SW: Shell only (no fragment)
```
