import React from 'react';
import ReactDOM from 'react-dom/client';
import "./global.d";
// import App from "./App.tsx";
import Root from './routes/root';
import QwikPage from './routes/qwik';
import RemixPage from './routes/remix';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Create a router
const router = createBrowserRouter([
	{
		path: '/',
		element: <Root />,
	},
	{
		path: '/qwik-page/*',
		element: <QwikPage />,
	},
	{
		path: '/remix-page/*',
		element: <RemixPage />,
	},
]);

// Render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>,
);


if (import.meta.env.MODE === 'production' || import.meta.env.MODE === 'development') {
	if ('serviceWorker' in navigator) {
		console.log('Attempting to register service worker...');
		navigator.serviceWorker
			.register('/sw.js', { type: 'module' })
			.then((registration) => {
				console.log('Service Worker registered with scope:', registration.scope);
			})
			.catch((error) => {
				console.log('Service Worker registration failed:', error);
			});
	} else {
		console.log('Service workers are not supported in this browser.');
	}
}
