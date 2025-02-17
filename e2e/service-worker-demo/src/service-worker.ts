/// <reference lib="webworker" />
import { FragmentGateway } from "web-fragments/gateway";
import { getMiddleware} from "web-fragments/gateway/middleware";

// Initialize the FragmentGateway
const gateway = new FragmentGateway({
	prePiercingStyles: `<style id="fragment-piercing-styles" type="text/css">
	fragment-host[data-piercing="true"] {
	  position: absolute;
	  z-index: 9999999999999999999999999999999;
	}
  </style>`,
});

// Register fragments
gateway.registerFragment({
	fragmentId: 'remix',
	prePiercingClassNames: ['remix'],
	routePatterns: ['/remix-page/:_*', '/_fragment/remix/:_*'],
	endpoint: 'http://localhost:3000',
	upstream: 'http://localhost:3000',
	onSsrFetchError: () => ({
		response: new Response('<p>Remix fragment not found</p>', {
			headers: { 'content-type': 'text/html' },
		}),
	}),
});

gateway.registerFragment({
	fragmentId: 'qwik',
	prePiercingClassNames: ['qwik'],
	routePatterns: ['/qwik-page/:_*', '/_fragment/qwik/:_*'],
	endpoint: 'http://localhost:8123',
	upstream: 'http://localhost:8123',
	forwardFragmentHeaders: ['x-fragment-name'],
	onSsrFetchError: () => ({
		response: new Response('<p>Qwik fragment not found</p>', {
			headers: { 'content-type': 'text/html' },
		}),
	}),
});


const middleware = getMiddleware(gateway, { mode: 'development' });

(self as unknown as ServiceWorkerGlobalScope).addEventListener('fetch', (event: FetchEvent) => {
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
	console.log('Intercepted request:', request.url);

	// run middleware with fetch as the next function
	const response = await middleware(request, () => fetch(request));

	return response;
}

(self as unknown as ServiceWorkerGlobalScope).addEventListener('install', (event) => {
	event.waitUntil((self as unknown as ServiceWorkerGlobalScope).skipWaiting());
});

(self as unknown as ServiceWorkerGlobalScope).addEventListener('activate', (event) => {
	event.waitUntil((self as unknown as ServiceWorkerGlobalScope).clients.claim());
});
