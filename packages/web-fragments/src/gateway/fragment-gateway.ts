import { MatchFunction, match } from 'path-to-regexp';

interface SSRFetchErrorResponse {
	response: Response;
	overrideResponse?: boolean;
}

/**
 * Configuration object for the registration of a fragment in the app's gateway worker.
 */
export interface FragmentConfig {
	/**
	 * Unique Id for the fragment.
	 */
	fragmentId: string;
	/**
	 * Styles to apply to the fragment before it gets pierced, their purpose
	 * is to style the fragment in such a way to make it look as close as possible
	 * to the final pierced view (so that the piercing operation can look seamless).
	 *
	 * For best results they should use the following selector:
	 * :not(piercing-fragment-outlet) > piercing-fragment-host[fragment-id="fragmentId"]
	 */
	prePiercingClassNames: string[];
	/**
	 * An array of route patterns this fragment should handle serving.
	 * Pattern format must adhere to https://github.com/pillarjs/path-to-regexp#parameters syntax
	 */
	routePatterns: string[];
	/**
	 * The endpoint URI of the fragment application.
	 * This will be fetched on any request paths matching the specified `routePatterns`
	 */
	endpoint: string;
	/**
	 * @deprecated use `endpoint` instead
	 */
	upstream?: string;
	/**
	 * An optional list of fragment response headers to forward to the gateway response.
	 */
	forwardFragmentHeaders?: string[];
	/**
	 * Handler/Fallback to apply when the fetch for a fragment ssr code fails.
	 * It allows the gateway to serve the provided fallback response instead of an error response straight
	 * from the server.
	 *
	 * @param req the request sent to the fragment
	 * @param failedRes the failed response (with a 4xx or 5xx status) or the thrown error
	 * @returns the response to use for the document's ssr
	 */
	onSsrFetchError?: (
		req: RequestInfo,
		failedResOrError: Response | unknown,
	) => SSRFetchErrorResponse | Promise<SSRFetchErrorResponse>;
}

type FragmentGatewayConfig = {
	prePiercingStyles?: string;
};

export class FragmentGateway {
	private fragmentConfigs: Map<string, FragmentConfig> = new Map();
	private routeMap: Map<MatchFunction, FragmentConfig> = new Map();
	#prePiercingStyles: string;

	constructor(config?: FragmentGatewayConfig) {
		this.#prePiercingStyles = config?.prePiercingStyles ?? '';
	}

	get prePiercingStyles() {
		return this.#prePiercingStyles;
	}

	/**
	 * Registers a fragment in the gateway worker so that it can be integrated
	 * with the gateway worker.
	 *
	 * @param fragmentConfig Configuration object for the fragment.
	 */
	registerFragment(fragmentConfig: FragmentConfig) {
		if (this.fragmentConfigs.has(fragmentConfig.fragmentId)) {
			console.warn(
				"\x1b[31m Warning: you're trying to register a fragment with id" +
					` "${fragmentConfig.fragmentId}", but a fragment with the same fragmentId` +
					` has already been registered, thus this` +
					' duplicate registration will be ignored. \x1b[0m',
			);
			return;
		}

		if (fragmentConfig.upstream && !fragmentConfig.endpoint) {
			throw new Error(
				"\x1b[31m You're using the deprecated `upstream` property" +
					` in the fragment config for fragment with id "${fragmentConfig.fragmentId}".` +
					' Please use `endpoint` config property instead. \x1b[0m',
			);
		}

		this.fragmentConfigs.set(fragmentConfig.fragmentId, fragmentConfig);

		// create a reverse mapping of route patterns to fragment configs
		// used for lookup when finding a route match.
		fragmentConfig.routePatterns.forEach((routePattern) => {
			const matcher = match(routePattern, {
				decode: globalThis.decodeURIComponent,
			});

			this.routeMap.set(matcher, fragmentConfig);
		});
	}

	matchRequestToFragment(urlOrRequest: string | URL | Request) {
		const path = new URL(urlOrRequest instanceof Request ? urlOrRequest.url : `${urlOrRequest}`).pathname;
		// TODO: path matching needs to take pattern specificity into account
		// such that more specific patterns are matched before less specific ones
		//   e.g. given route patterns `['/:accountId', '/:accountId/workers']` and a request path of `/abc123/workers/foo`,
		//   the matched pattern should be `/:accountId/workers` since it is the more specific pattern.
		const match = [...this.routeMap.keys()].find((matcher) => matcher(path));

		if (match) {
			return this.routeMap.get(match) ?? null;
		} else return null;
	}
}

/**
 * Registers a list of fragments in the gateway worker so that they can be integrated
 * with the gateway worker.
 * @param fragment List of fragment configurations to register.
 * @param gateway The gateway worker to register the fragments with.
 * @returns The gateway worker with the fragments registered.
 */
export function registerWebFragments(fragment: FragmentConfig[], gateway: FragmentGateway) {
	fragment.forEach((f) => {
		validateFragmentConfig(f);
		gateway.registerFragment(f);
	});
	return gateway;
}

/**
 *
 * @param f FragmentConfig to validate
 * @throws Error if the FragmentConfig is invalid
 * @returns void
 */
function validateFragmentConfig(f: FragmentConfig) {
	if (!f.fragmentId) {
		throw new Error('FragmentConfig must have a fragmentId.');
	}
	if (!Array.isArray(f.prePiercingClassNames)) {
		throw new Error('FragmentConfig must have an array of prePiercingClassNames.');
	}
	if (!Array.isArray(f.routePatterns) || f.routePatterns.length === 0) {
		throw new Error('FragmentConfig must have at least one routePattern.');
	}
	if (!f.endpoint) {
		throw new Error('FragmentConfig must have an endpoint.');
	}
}

