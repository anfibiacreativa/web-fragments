# Middleware support

To support a diversity of request/response models, we are offering different middleware implementation types.

## Consolidated middleware

Our middleware provides support to standard request, response, next object model, like the one used by 'Cloudflare Pages' or 'Service Workers', as well as Node.js native http and Connext framework request and response, via the adaptor.

### Usage

Initialize the gateway and register the fragments in your server or server-side function

```javascript
import { FragmentGateway, getStandardMiddleware } from 'web-fragments/gateway';
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
```
### Wrap it for invocation

Use the corresponding provided handlers, for example for [Cloudflare Pages](https://pages.cloudflare.com/) using [Cloudflare Workers](https://workers.cloudflare.com/)

```javascript
const middleware = getStandardMiddleware(gateway, { mode: 'production' });

// CF Pages specific handler

// Service worker handler

```

#### Service worker registration example
```javascript
if ('serviceWorker' in navigator) {
	navigator.serviceWorker
		// providing your service worker is in a file called service-worker.js
		.register('/service-worker.js')
		.then((registration) => {
			console.log('Service Worker registered successfully:', registration);
		})
		.catch((error) => {
			console.error('Service Worker registration failed:', error);
		});
}
```

