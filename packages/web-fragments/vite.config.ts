
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
	plugins: [
		react(),
		nodePolyfills({
			protocolImports: true,
		})
	],
	build: {
		emptyOutDir: false,
		lib: {
			entry: {
				gateway: new URL('src/gateway/index.ts', import.meta.url).pathname,
				'gateway/node': new URL('src/gateway/middleware/node.ts', import.meta.url).pathname,
				'gateway/web': new URL('src/gateway/middleware/web.ts', import.meta.url).pathname,
				elements: new URL('src/elements/index.ts', import.meta.url).pathname,
			},
			formats: ['es'],
		},
		rollupOptions: {
			external: ['react', 'react-dom', 'reframed'],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
				},
			},
		},
	},
	resolve: {
		alias: {
			// cross-repo development only!
			// requires writable-dom checked out as a sibling to `reframed`
			// TODO: this is incorrect here and should be addressed as fragment-elements should be able to be standalone
			'writable-dom': new URL('../../../writable-dom/src/index.ts', import.meta.url).pathname,
			// './runtimeConfig': './runtimeConfig.browser',
		},
	},
});
