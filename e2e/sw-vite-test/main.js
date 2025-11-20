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

// Dynamically create web-fragment elements after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	console.log('[Main] DOMContentLoaded fired');
	// Get fragment ID from URL path (e.g., /qwik-page -> qwik)
	const fragmentId = window.location.pathname.match(/\/([^-]+)-page/)?.[1];
	
	console.log('[Main] Detected fragment ID from path:', fragmentId);
	
	if (fragmentId) {
		const main = document.querySelector('main');
		if (main) {
			console.log('[Main] Creating <web-fragment> element for:', fragmentId);
			const webFragment = document.createElement('web-fragment');
			webFragment.setAttribute('fragment-id', fragmentId);
			main.appendChild(webFragment);
			console.log('[Main] <web-fragment> element appended to main');
		} else {
			console.error('[Main] Could not find <main> element!');
		}
	} else {
		console.log('[Main] No fragment ID detected in path');
	}
});
