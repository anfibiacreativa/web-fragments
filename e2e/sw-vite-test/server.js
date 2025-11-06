import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const HOST_PORT = Number(process.env.PORT ?? 4182);

// This server acts as a simple CDN - serving static shell HTML files and built assets.
// The Service Worker handles all fragment fetching directly from fragment dev servers.
// In production, this would be replaced by an actual CDN (Cloudflare, Fastly, etc.).
const app = express();
app.disable('x-powered-by');
app.use(compression());

// Serve static files (shell HTML, built JS/CSS)
app.use(
	express.static(DIST_DIR, {
		maxAge: '5m',
		setHeaders(res, filePath) {
			if (filePath.endsWith('.html')) {
				res.setHeader('Cache-Control', 'no-store');
			}
		},
	}),
);

function sendHtml(fileName) {
	return (req, res, next) => {
		res.sendFile(path.join(DIST_DIR, fileName), (err) => {
			if (err) next(err);
		});
	};
}

app.get('/', sendHtml('index.html'));
app.get('/remix-page', sendHtml('remix-page.html'));
app.get('/remix-page/*', sendHtml('remix-page.html'));
app.get('/qwik-page', sendHtml('qwik-page.html'));
app.get('/qwik-page/*', sendHtml('qwik-page.html'));
app.get('/solid-sierpinski-triangle', sendHtml('solid-sierpinski-triangle.html'));

app.use((req, res) => {
	res.status(404).send('Not found');
});

app.use((err, req, res, _next) => {
	console.error('[server] Unhandled error', err);
	res.status(500).send('Internal Server Error');
});

app.listen(HOST_PORT, () => {
	console.log(`CDN server ready on http://localhost:${HOST_PORT}`);
	console.log('Service Worker will fetch fragments directly from their dev servers');
});
