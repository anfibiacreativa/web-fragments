import { FragmentGateway, getServiceWorkerMiddleware } from 'web-fragments/gateway';

const gateway = new FragmentGateway();
const appOrigin = self.location.origin;

// Register fragments with the gateway
gateway.registerFragment({
	fragmentId: 'remix',
	endpoint: 'http://localhost:5174',
	piercing: true,
	routePatterns: ['/remix-page', '/remix-page/:path*'],
});

gateway.registerFragment({
	fragmentId: 'qwik',
	endpoint: 'http://localhost:5173',
	piercing: true,
	routePatterns: ['/qwik-page', '/qwik-page/:path*'],
});

gateway.registerFragment({
	fragmentId: 'solid-sierpinski-triangle',
	endpoint: 'https://solid-sierpinski-triangle.fragments.demos.web-fragments.dev',
	routePatterns: [
		'/solid-sierpinski-triangle',
		'/__wf/dev.web-fragments.demos.fragments.solid-sierpinski-triangle/:_*',
	],
});

const middleware = getServiceWorkerMiddleware(gateway);

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	const secFetchDest = event.request.headers.get('sec-fetch-dest');

	// Only log for our fragment routes to reduce noise
	if (url.pathname.startsWith('/remix-page') || url.pathname.startsWith('/qwik-page')) {
		console.log('[SW] Fetch event:', url.pathname, 'sec-fetch-dest:', secFetchDest);
		console.log('[SW] Request headers:', Object.fromEntries(event.request.headers.entries()));
	}

	if (event.request.method !== 'GET') {
		return;
	}

	if (event.request.headers.get('X-Service-Worker-Bypass') === 'true') {
		return;
	}

	if (event.request.headers.get('x-fragment-mode') === 'embedded') {
		// Fragment requests from the gateway should bypass the SW to avoid loops
		return;
	}

	// Let fragment assets (scripts, styles, HMR, etc.) pass through to their origin servers
	// These requests should NOT be intercepted by the service worker
	if (
		url.pathname.startsWith('/app/') ||
		url.pathname.startsWith('/assets/') ||
		url.pathname.startsWith('/@') ||
		url.pathname.startsWith('/src/') ||
		url.pathname.startsWith('/node_modules/') ||
		url.pathname.includes('.js') ||
		url.pathname.includes('.css') ||
		url.pathname.includes('.map')
	) {
		return;
	}

	// Check if this is a fragment route
	const requestFragmentId = event.request.headers.get('x-web-fragment-id') ?? undefined;
	const matchedFragment = gateway.matchRequestToFragment(url.pathname + url.search, requestFragmentId);

	// Only intercept fragment routes
	if (matchedFragment) {
		console.log(
			'[SW] Intercepting fragment route:',
			url.pathname,
			'matched fragment:',
			matchedFragment.fragmentId,
			'sec-fetch-dest:',
			secFetchDest,
		);

		event.respondWith(
			(async () => {
				// Create a next() function that fetches the HTML shell from the origin server
				// We need to bypass the service worker to avoid infinite loops
				const next = async () => {
					// Use the first path segment as the shell name (e.g., /qwik-page/details -> /qwik-page.html)
					const [, shellSegment = 'index'] = url.pathname.split('/');
					const htmlPath = `/${shellSegment || 'index'}.html`;
					const htmlUrl = new URL(htmlPath, self.location.origin);
					console.log('[SW] Fetching HTML shell from:', htmlUrl.href);

					// Fetch with a header to bypass this service worker if needed
					return fetch(htmlUrl, {
						headers: {
							'X-Service-Worker-Bypass': 'true',
						},
					});
				};

				const response = await middleware(event.request, next);
				console.log('[SW] Middleware returned response:', response);
				return response;
			})(),
		);
	}
});

self.addEventListener('install', (event) => {
	console.log('[SW] Service Worker installed');
	// Skip waiting to activate immediately
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	console.log('[SW] Service Worker activated');
	// Take control of all clients immediately
	event.waitUntil(self.clients.claim());
});
