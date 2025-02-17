import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FragmentGateway } from '../../src/gateway/fragment-gateway';
import { getMiddleware, prepareFragmentForReframing } from '../../src/gateway/middleware/web';
import connect from 'connect';
import http from 'node:http';
import stream from 'node:stream';
import streamWeb from 'node:stream/web';

// comment out some environments if you want to focus on testing just one or a few
const environments = [];
environments.push('web');
// environments.push('connect');

for (const environment of environments) {
	describe(`${environment} middleware`, () => {
		/**
		 * @param request A request to test
		 * @param hostResponse A response that should be served as if it came from the legacy host
		 */
		let testRequest: (request: Request, hostResponse?: Response) => Promise<Response>;

		describe(`app shell requests`, () => {
			it(`should serve requests from the app shell when there is no fragments match`, async () => {
				mockShellAppResponse(new Response('<p>hello world</p>'));

				const response = await testRequest(new Request('http://localhost/'));

				expect(response.status).toBe(200);
				expect(await response.text()).toBe('<p>hello world</p>');

				// make one more request to a different non-fragment path
				mockShellAppResponse(new Response('<p>hello moon</p>'));

				const response2 = await testRequest(new Request('http://localhost/not-a-fragment-path'));

				expect(response2.status).toBe(200);
				expect(await response2.text()).toBe('<p>hello moon</p>');
			});
		});

		describe(`app shell requests - Error Handling`, () => {
			const mockErrorResponse = (status: number, body = '') => {
				return new Response(body, {
					status,
					headers: { 'content-type': 'text/html' },
				});
			};

			it(`should handle 3xx redirections properly`, async () => {
				mockShellAppResponse(mockErrorResponse(302, '<p>Redirecting...</p>'));

				const response = await testRequest(new Request('http://localhost/'));

				expect(response.status).toBe(302);
				expect(await response.text()).toBe('<p>Redirecting...</p>');
			});

			it(`should handle 4xx client errors gracefully`, async () => {
				mockShellAppResponse(mockErrorResponse(404, '<p>Not Found</p>'));

				const response = await testRequest(new Request('http://localhost/'));

				expect(response.status).toBe(404);
				expect(await response.text()).toBe('<p>Not Found</p>');
			});

			it(`should handle 5xx server errors appropriately`, async () => {
				mockShellAppResponse(mockErrorResponse(500, '<p>Internal Server Error</p>'));

				const response = await testRequest(new Request('http://localhost/'));

				expect(response.status).toBe(500);
				expect(await response.text()).toBe('<p>Internal Server Error</p>');
			});
		});

		describe(`pierced fragment requests`, () => {
			it(`should match a fragment and return html that combines the host and fragment payloads`, async () => {
				mockShellAppResponse(
					new Response('<html><body>legacy host content</body></html>', { headers: { 'content-type': 'text/html' } }),
				);
				mockFragmentFooResponse('/foo', new Response('<p>foo fragment</p>'));

				const response = await testRequest(
					new Request('http://localhost/foo', { headers: { 'sec-fetch-dest': 'document' } }),
				);

				expect(response.status).toBe(200);
				expect(await response.text()).toBe(
					`<html><body>legacy host content<fragment-host class="foo" fragment-id="fragmentFoo" data-piercing="true"><template shadowrootmode="open"><p>foo fragment</p></template></fragment-host></body></html>`,
				);
				expect(response.headers.get('content-type')).toBe('text/html');
				expect(response.headers.get('vary')).toBe('sec-fetch-dest');

				// make one more request to the second fragment path
				mockShellAppResponse(
					new Response(`<html><body>legacy host content</body></html>`, { headers: { 'content-type': 'text/html' } }),
				);
				mockFragmentBarResponse('/bar', new Response('<p>bar fragment</p>'));

				const response2 = await testRequest(
					new Request('http://localhost/bar', { headers: { 'sec-fetch-dest': 'document' } }),
				);

				expect(response2.status).toBe(200);
				expect(await response2.text()).toBe(
					`<html><body>legacy host content<fragment-host class="bar" fragment-id="fragmentBar" data-piercing="true"><template shadowrootmode="open"><p>bar fragment</p></template></fragment-host></body></html>`,
				);
			});

			describe(`fragment requests - Error Handling`, () => {
				const mockErrorResponse = (status: number, body = '', headers: Record<string, string> = {}) => {
					return new Response(body, {
						status,
						headers: { 'content-type': 'text/html', ...headers },
					});
				};

				// need to think about 3xx redirections since the proxy
				// will reroute and not serve a 302 response

				it(`should handle 4xx client errors gracefully`, async () => {
					mockFragmentFooResponse('/foo', mockErrorResponse(404, '<p>Not Found</p>'));

					const response = await testRequest(new Request('http://localhost/foo'));

					expect(response.status).toBe(404);
					expect(await response.text()).toBe('<p>Not Found</p>');
				});

				it(`should handle 5xx server errors appropriately`, async () => {
					mockFragmentFooResponse('/foo', mockErrorResponse(500, '<p>Internal Server Error</p>'));

					const response = await testRequest(new Request('http://localhost/foo'));

					expect(response.status).toBe(500);
					expect(await response.text()).toBe('<p>Internal Server Error</p>');
				});

				it(`should handle missing or incorrect content-type headers`, async () => {
					mockFragmentFooResponse('/foo', new Response('<p>foo fragment</p>', { headers: { 'content-type': 'application/json' } }));

					const response = await testRequest(new Request('http://localhost/foo'));

					expect(response.headers.get('content-type')).not.toBe('text/html');
					expect(response.headers.get('content-type')).toBe('application/json');
					expect(await response.text()).toBe('<p>foo fragment</p>');
				});

				it(`should handle encoding errors gracefully`, async () => {
					const invalidUtf8 = new Uint8Array([0xc3, 0x28]); // invalid UTF-8 byte sequence
					mockFragmentFooResponse('/foo', new Response(invalidUtf8, { headers: { 'content-type': 'text/html; charset=utf-8' } }));

					const response = await testRequest(new Request('http://localhost/foo'));

					expect(response.status).toBe(200);
					const text = await response.text();

					// expect corrupted text instead of rejection
					// handle encoding errors gracefully by replacing with �
					expect(text).toContain('�');
				});
			});


			it(`should append additional headers to the composed response`, async () => {
				fetchMock.doMockIf((request) => {
					if (request.url.toString() === 'http://foo.test:1234/foo') {
						expect(request.headers.get('x-additional-header')).toBe('j/k');
						return true;
					}
					return false;
				}, new Response('<p>foo fragment</p>'));

				const response = await testRequest(
					new Request('http://localhost/foo', { headers: { 'sec-fetch-dest': 'empty' } }),
				);

				expect(response.status).toBe(200);
				expect(await response.text()).toBe('<p>foo fragment</p>');
			});
		});


		describe(`fragment iframe requests`, () => {
			it(`should serve a blank html document if a request is made by the iframe[src] element`, async () => {
				mockShellAppResponse(
					new Response('<html><body>legacy host content</body></html>', { headers: { 'content-type': 'text/html' } }),
				);
				mockFragmentFooResponse('/foo', new Response('<p>foo fragment</p>'));

				const response = await testRequest(
					new Request('http://localhost/foo', { headers: { 'sec-fetch-dest': 'iframe' } }),
				);

				expect(response.status).toBe(200);
				expect(await response.text()).toBe(`<!doctype html><title>`);
				expect(response.headers.get('content-type')).toBe('text/html');
				expect(response.headers.get('vary')).toBe('sec-fetch-dest');

				// make one more request to the second fragment path
				mockShellAppResponse(
					new Response('<html><body>legacy host content</body></html>', { headers: { 'content-type': 'text/html' } }),
				);
				mockFragmentBarResponse('/bar', new Response('<p>bar fragment</p>'));

				const response2 = await testRequest(
					new Request('http://localhost/bar', { headers: { 'sec-fetch-dest': 'iframe' } }),
				);

				expect(response2.status).toBe(200);
				expect(await response2.text()).toBe(`<!doctype html><title>`);
				expect(response2.headers.get('content-type')).toBe('text/html');
				expect(response2.headers.get('vary')).toBe('sec-fetch-dest');
			});
		});


		describe('prepareFragmentForReframing', () => {
			it('should modify script elements to have type="inert" while preserving original type in data attribute', async () => {
				const html = `<html><body>
					<script>console.log('test');</script>
					<script type="module">import foo from 'bar';</script>
					<script type="application/json">{ "key": "value" }</script>
				</body></html>`;

				const fragmentResponse = new Response(html, {
					headers: { 'content-type': 'text/html' },
				});

				const transformedResponse = prepareFragmentForReframing(fragmentResponse);
				const transformedHtml = await transformedResponse.text();

				console.log('Transformed HTML:', transformedHtml);

				// normalize whitespace for better comparison
				const normalizedHtml = transformedHtml.replace(/\s+/g, ' ').trim();

				// match script tag regardless of attribute order
				expect(normalizedHtml).toMatch(/<script\s+type="inert">\s*console\.log\('test'\);\s*<\/script>/);
				expect(normalizedHtml).toMatch(/<script\s+(?:type="inert"\s+data-script-type="module"|data-script-type="module"\s+type="inert")>\s*import foo from 'bar';\s*<\/script>/);
				expect(normalizedHtml).toMatch(/<script\s+(?:type="inert"\s+data-script-type="application\/json"|data-script-type="application\/json"\s+type="inert")>\s*\{ "key": "value" \}\s*<\/script>/);
			});

			it('should not modify non-script elements', async () => {
				const html = `<html><body><p>Hello World</p></body></html>`;

				const fragmentResponse = new Response(html, {
					headers: { 'content-type': 'text/html' },
				});

				const transformedResponse = prepareFragmentForReframing(fragmentResponse);
				const transformedHtml = await transformedResponse.text();

				console.log('Transformed HTML (non-script test):', transformedHtml);

				expect(transformedHtml).toContain('<p>Hello World</p>');
			});
		});


		describe(`fragment html and asset requests`, () => {
			it(`should serve a fragment soft navigation request`, async () => {
				mockFragmentFooResponse(
					'/foo/some/path',
					new Response('<p>hello foo world!</p>', { headers: { 'content-type': 'text/html' } }),
				);

				const softNavResponse = await testRequest(new Request('http://localhost/foo/some/path'));

				expect(softNavResponse.status).toBe(200);
				expect(await softNavResponse.text()).toBe(`<p>hello foo world!</p>`);
				expect(softNavResponse.headers.get('content-type')).toBe('text/html');
				expect(softNavResponse.headers.get('vary')).toBe('sec-fetch-dest');

				// let's make one more request to the same path but this time with sec-fetch-dest=document to simulate hard navigation
				mockFragmentFooResponse(
					'/foo/some/path',
					new Response('<p>hello foo world!</p>', { headers: { 'content-type': 'text/html' } }),
				);
				mockShellAppResponse(
					new Response('<html><body>legacy host content</body></html>', { headers: { 'content-type': 'text/html' } }),
				);

				const hardNavResponse = await testRequest(
					new Request('http://localhost/foo/some/path', { headers: { 'sec-fetch-dest': 'document' } }),
				);

				expect(hardNavResponse.status).toBe(200);
				expect(await hardNavResponse.text()).toBe(
					`<html><body>legacy host content<fragment-host class="foo" fragment-id="fragmentFoo" data-piercing="true"><template shadowrootmode="open"><p>hello foo world!</p></template></fragment-host></body></html>`,
				);
				expect(hardNavResponse.headers.get('content-type')).toBe('text/html');
				expect(hardNavResponse.headers.get('vary')).toBe('sec-fetch-dest');
			});

			it(`should serve a fragment asset`, async () => {
				// fetch an image from the fooFragment
				mockFragmentFooResponse(
					'/_fragment/foo/image.jpg',
					new Response('lol cat img', { headers: { 'content-type': 'image/jpeg' } }),
				);

				const imgResponse = await testRequest(new Request('http://localhost/_fragment/foo/image.jpg'));

				expect(imgResponse.status).toBe(200);
				expect(await imgResponse.text()).toBe(`lol cat img`);
				expect(imgResponse.headers.get('content-type')).toBe('image/jpeg');

				// fetch a js file from the fooFragment
				mockFragmentFooResponse(
					'/_fragment/foo/jquery.js',
					new Response('globalThis.$ = () => {};', { headers: { 'content-type': 'text/javascript' } }),
				);

				const jsResponse = await testRequest(
					new Request('http://localhost/_fragment/foo/jquery.js', {
						// let's also set the sec-fetch-dest as the browser would
						headers: { 'sec-fetch-dest': 'script' },
					}),
				);
				expect(jsResponse.status).toBe(200);
				expect(await jsResponse.text()).toBe(`globalThis.$ = () => {};`);
				expect(jsResponse.headers.get('content-type')).toBe('text/javascript');

				// fetch a barFragment path
				mockFragmentBarResponse(
					'/_fragment/bar/image.jpg',
					new Response('bar cat img', { headers: { 'content-type': 'image/jpeg' } }),
				);

				const barImgResponse = await testRequest(
					new Request('http://localhost/_fragment/bar/image.jpg', {
						// let's also set the sec-fetch-dest as the browser would
						headers: { 'sec-fetch-dest': 'image' },
					}),
				);

				expect(barImgResponse.status).toBe(200);
				expect(await barImgResponse.text()).toBe(`bar cat img`);
				expect(barImgResponse.headers.get('content-type')).toBe('image/jpeg');
			});
		});

		let server: http.Server;

		beforeEach(async () => {
			const fragmentGateway = new FragmentGateway();
			fragmentGateway.registerFragment({
				fragmentId: 'fragmentFoo',
				prePiercingClassNames: ['foo'],
				routePatterns: ['/foo/:_*', '/_fragment/foo/:_*'],
				endpoint: 'http://foo.test:1234',
				upstream: 'http://foo.test:1234',
				onSsrFetchError: () => ({
					response: new Response('<p>Foo fragment not found</p>', {
						headers: { 'content-type': 'text/html' },
					}),
				}),
			});
			fragmentGateway.registerFragment({
				fragmentId: 'fragmentBar',
				prePiercingClassNames: ['bar'],
				routePatterns: ['/bar/:_*', '/_fragment/bar/:_*'],
				endpoint: 'http://bar.test:4321',
				upstream: 'http://bar.test:4321',
				onSsrFetchError: () => ({
					response: new Response('<p>Bar fragment not found</p>', {
						headers: { 'content-type': 'text/html' },
					}),
				}),
			});

			switch (environment) {
				case 'web': {
					const webMiddleware = getMiddleware(fragmentGateway, {
						additionalHeaders: {
							'x-additional-header': 'j/k',
						},
					});

					// The web case is simple and doesn't even require an HTTP server.
					// We simply pass around Requests and Responses.
					testRequest = function webTestRequest(request: Request): Promise<Response> {
						return webMiddleware(request, function nextFn() {
							const appShellResponse = mockShellAppResponse.getResponse();
							if (!appShellResponse) {
								throw new Error('No app shell response provided, use mockShellAppResponse to set it');
							}
							return Promise.resolve(appShellResponse);
						});
					};

					break;
				}
				case 'connect': {
					// We use an actual connect server here with an ephemeral port
					const app = connect();
					app.use(
						getMiddleware(fragmentGateway, {
							additionalHeaders: {
								'x-additional-header': 'j/k',
							},
						}),
					);

					app.use(async (req, resp, next) => {
						let appShellResponse = mockShellAppResponse.getResponse();

						if (!appShellResponse) {
							throw new Error('No app shell response provided, use mockShellAppResponse to set it');
						}

						resp.writeHead(
							appShellResponse.status,
							appShellResponse.statusText,
							Object.fromEntries(Array.from(appShellResponse.headers.entries())),
						);

						if (appShellResponse.body) {
							stream.Readable.fromWeb(appShellResponse.body as streamWeb.ReadableStream<any>).pipe(resp);
						} else {
							resp.end();
						}
					});

					// Start server
					server = http.createServer(app);

					let serverStarted = new Promise((resolve) => {
						server.listen(() => {
							console.debug(`Server running at http://localhost:${server.address()!.port}`);
							resolve(void 0);
						});
					});

					await serverStarted;

					testRequest = async function nodeTestRequest(request: Request): Promise<Response> {
						const newUrl = new URL(new URL(request.url).pathname, `http://localhost:${server.address()!.port}`);

						const newRequest = new Request(newUrl, {
							method: request.method,
							headers: request.headers,
							body: request.body,
							mode: request.mode,
							credentials: request.credentials,
							cache: request.cache,
							redirect: request.redirect,
							referrer: request.referrer,
							integrity: request.integrity,
						});

						// TODO: why not working?
						// fetchMock.dontMockOnce();
						// fetch(newRequest);
						return fetch.unpatchedFetch(newRequest);
					};

					break;
				}
			}
		});

		afterEach(() => {
			if (server) {
				server.close();
			}
			fetchMock.resetMocks();
			vi.resetModules();
			mockShellAppResponse.response = null;
		});
	});
}

function mockFragmentFooResponse(pathname: string, response: Response) {
	fetchMock.doMockIf('http://foo.test:1234' + pathname, response);
}

function mockFragmentBarResponse(pathname: string, response: Response) {
	fetchMock.doMockIf('http://bar.test:4321' + pathname, response);
}

async function mockShellAppResponse(response: Response) {
	mockShellAppResponse.response = response;
}

mockShellAppResponse.getResponse = function (): Response | null {
	const r = mockShellAppResponse.response;
	mockShellAppResponse.response = null;
	return r;
};
