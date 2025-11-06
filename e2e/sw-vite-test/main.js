import { initializeWebFragments } from 'web-fragments/elements';

// Unregister any existing service workers first (e.g., from Qwik prefetch)
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.getRegistrations().then((registrations) => {
		console.log('[Main] Found', registrations.length, 'existing service worker(s)');
		registrations.forEach((registration) => {
			console.log('[Main] Unregistering existing SW:', registration.scope);
			registration.unregister();
		});
	});
}

// Wait a bit then register our service worker
setTimeout(() => {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
			.register('/sw.js', { type: 'module' })
			.then((registration) => {
				console.log('[Main] Service Worker registered:', registration);
				// Force the SW to take control immediately
				navigator.serviceWorker.ready.then(() => {
					console.log('[Main] Service Worker is ready and controlling');
				});
			})
			.catch((error) => {
				console.error('[Main] Service Worker registration failed:', error);
			});
	}
}, 100);

// Initialize web fragments
console.log('[Main] Initializing web fragments');
initializeWebFragments();
