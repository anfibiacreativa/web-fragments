import { initializeWebFragments } from 'web-fragments/elements';

if ('serviceWorker' in navigator) {
	navigator.serviceWorker
		.register('/sw.js', { type: 'module' })
		.catch((error) => {
			console.error('Service Worker registration failed:', error);
		});
}

initializeWebFragments();
