/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for Cloudflare Pages when building for production.
 *
 * Learn more about the Cloudflare Pages integration here:
 * - https://qwik.dev/docs/deployments/cloudflare-pages/
 *
 */
import { createQwikCity, type PlatformCloudflarePages } from '@builder.io/qwik-city/middleware/cloudflare-pages';
import qwikCityPlan from '@qwik-city-plan';
import { manifest } from '@qwik-client-manifest';
import render from './entry.ssr';

declare global {
	interface QwikCityPlatform extends PlatformCloudflarePages {}
}

const qwikCity = createQwikCity({ render, qwikCityPlan, manifest });

// Wrap with CORS middleware
const fetch = async (request: Request, env: any, ctx: any) => {
	// Handle preflight requests
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': '*',
				'Access-Control-Max-Age': '86400',
			},
		});
	}

	// Handle actual requests
	const response = await qwikCity(request, env, ctx);
	
	// Add CORS headers to response
	const headers = new Headers(response.headers);
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	headers.set('Access-Control-Allow-Headers', '*');
	
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
};

export { fetch };
