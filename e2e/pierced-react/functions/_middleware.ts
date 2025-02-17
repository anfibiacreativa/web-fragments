import { FragmentGateway } from 'web-fragments/gateway';
import { getMiddleware } from 'web-fragments/gateway/middleware';
import { PagesFunction} from '@cloudflare/workers-types';

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

// CF Pages specific handler
export const onRequest: PagesFunction = async (context) => {
	const { request, next } = context;
	console.log('Incoming request', request.url);

	// run the standard middleware function
	const response = (await middleware(
		request as unknown as Request,
		next as unknown as () => Promise<Response>,
	)) as Response;
	return response as unknown as import('@cloudflare/workers-types').Response;
};



// const handleRequest = async (
// 	input: Request | EventContext<unknown, string, Record<string, unknown>>
// ) => {
// 	const request = input instanceof Request ? input : input.request;
// 	const next = input instanceof Request ? () => fetch(request as Request) : input.next;

// 	console.log('[Debug Info: Wrapper ]Incoming request', request.url);

// 	// Run middleware
// 	const response = (await middleware(request as Request, next as () => Promise<Response>)) as Response;
// 	return response as unknown as import('@cloudflare/workers-types').Response;
// };

// // Correctly typed exports for both Cloudflare Pages and Workers
// export const onRequest: PagesFunction = async (context) => handleRequest(context);
// export const onFetch: ExportedHandlerFetchHandler = async (request) => handleRequest(request as unknown as Request);
