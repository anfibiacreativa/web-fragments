import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: path.resolve(__dirname, 'index.html'),
				remixPage: path.resolve(__dirname, 'remix-page.html'),
				qwikPage: path.resolve(__dirname, 'qwik-page.html'),
				sw: path.resolve(__dirname, 'sw.js'),
			},
			output: {
				entryFileNames: (chunkInfo) => {
					return chunkInfo.name === 'sw' ? '[name].js' : 'assets/[name]-[hash].js';
				},
			},
		},
	},
	resolve: {
		alias: {
			'web-fragments/gateway': path.resolve(__dirname, '../../packages/web-fragments/src/gateway/index.ts'),
			'web-fragments/elements': path.resolve(__dirname, '../../packages/web-fragments/src/elements/index.ts'),
		},
	},
	optimizeDeps: {
		exclude: ['htmlrewriter'],
	},
});
