import { FragmentGateway, getServiceWorkerMiddleware } from 'web-fragments/gateway';

const gateway = new FragmentGateway();

// Register fragments with the gateway
gateway.registerFragment({
	fragmentId: 'remix',
	endpoint: 'http://localhost:3000',
	piercing: true,
	routePatterns: ['/remix-page', '/remix-page/:_*', '/_fragment/remix/:_*'],
	onSsrFetchError: () => ({
		response: new Response('<p>Remix fragment not found</p>', {
			headers: { 'content-type': 'text/html' },
		}),
	}),
});

gateway.registerFragment({
	fragmentId: 'qwik',
	endpoint: 'http://localhost:8123',
	piercing: true,
	forwardFragmentHeaders: ['x-fragment-name'],
	routePatterns: ['/qwik-page', '/qwik-page/:_*', '/_fragment/qwik/:_*'],
	onSsrFetchError: () => ({
		response: new Response('<p>Qwik fragment not found</p>', {
			headers: { 'content-type': 'text/html' },
		}),
	}),
});

gateway.registerFragment({
	fragmentId: 'solid-sierpinski-triangle',
	endpoint: 'https://solid-sierpinski-triangle.fragments.demos.web-fragments.dev',
	routePatterns: [
		'/solid-sierpinski-triangle',
		'/__wf/dev.web-fragments.demos.fragments.solid-sierpinski-triangle/:_*',
	],
});

const middleware = getServiceWorkerMiddleware(gateway, {
	initializeHtmlRewriter: async () => {
		if (self.HTMLRewriter) {
			return;
		}

		const module = await import('wf-htmlrewriter/dist/html_rewriter.js');
		const init = module.default;
		const { HTMLRewriter } = module;
		const wasmUrl = new URL('wf-htmlrewriter/dist/html_rewriter_bg.wasm', import.meta.url);
		const wasmResponse = await fetch(wasmUrl);
		await init(wasmResponse);
		self.HTMLRewriter = HTMLRewriter;
		console.log('[SW] HTMLRewriter polyfill initialized');
	},
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	event.respondWith(
		(async () => {
			// Create a next() function that fetches from the origin server
			const next = async () => {
				// For fragment routes, fetch the corresponding HTML shell
				const requestFragmentId = event.request.headers.get('x-web-fragment-id') ?? undefined;
				const matchedFragment = gateway.matchRequestToFragment(url.pathname + url.search, requestFragmentId);

				if (matchedFragment) {
					// Use the first path segment as the shell name (e.g., /qwik-page/details -> /qwik-page.html)
					const [, shellSegment = 'index'] = url.pathname.split('/');
					const htmlPath = `/${shellSegment || 'index'}.html`;
					const htmlUrl = new URL(htmlPath, self.location.origin);
					console.log('[SW] Fetching HTML shell from:', htmlUrl.href);

					return fetch(htmlUrl, {
						headers: {
							'X-Service-Worker-Bypass': 'true',
						},
					});
				}

				// For non-fragment routes, just fetch normally
				return fetch(event.request);
			};

			const response = await middleware(event.request, next);
			console.log('[SW] Middleware returned response for:', url.pathname);
			return response;
		})(),
	);
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

console.log('[XXXXXXXX] Service Worker script loaded');
