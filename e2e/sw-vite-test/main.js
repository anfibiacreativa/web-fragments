import { initializeWebFragments } from 'web-fragments/elements';

// Register service worker - only runs once per origin
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

// Initialize web fragments
console.log('[Main] Initializing web fragments');
initializeWebFragments();