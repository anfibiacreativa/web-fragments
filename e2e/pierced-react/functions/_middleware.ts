import { FragmentConfig, FragmentGateway } from 'web-fragments/gateway';
import { getMiddleware } from 'web-fragments/gateway/middlewares/cloudflare-pages';

const getGatewayMiddleware: ((devMode: boolean) => PagesFunction) & {
	_gatewayMiddleware?: PagesFunction;
} = () => {
	if (getGatewayMiddleware._gatewayMiddleware) {
		return getGatewayMiddleware._gatewayMiddleware;
	}

	const gateway = new FragmentGateway({
		prePiercingStyles: `<style id="fragment-piercing-styles" type="text/css">
      fragment-host[data-piercing="true"] {
        position: absolute;
        z-index: 9999999999999999999999999999999;

        &.remix {
            bottom: 16%;
            left: 15%;
        }
      }
    </style>`,
	});

	// this could be fetched from an endpoint, etc
	const fragments: FragmentConfig[] = [
		{
			fragmentId: 'blueCounter',
			prePiercingClassNames: ['remix'],
			assetsURLPrefix: ['/_fragment/remix/:_*'],
			appRoutes: ['/remix-page/:_*'],
			// Note: the pierced-react-remix-fragment has to be available on port 3000
			endpoint: 'http://localhost:3000',
			onSsrFetchError: () => {
				return {
					response: new Response(
						"<p id='remix-fragment-not-found'><style>#remix-fragment-not-found { color: red; font-size: 2rem; }</style>Remix fragment not found</p>",
						{ headers: [['content-type', 'text/html']] },
					),
				};
			},
		},
		{
			// this needs to be a UUID of some sort
			fragmentId: 'greenCounter',
			prePiercingClassNames: ['qwik'],
			assetsURLPrefix: ['/_fragment/qwik/:_*'],
			appRoutes: ['/qwik-page/:_*'],
			// Note: the pierced-react-qwik-fragment has to be available on port 8123
			endpoint: 'http://localhost:8123',
			forwardFragmentHeaders: ['x-fragment-name'],
			onSsrFetchError: () => {
				return {
					response: new Response(
						"<p id='qwik-fragment-not-found'><style>#qwik-fragment-not-found { color: red; font-size: 2rem; }</style>Qwik fragment not found</p>",
						{ headers: [['content-type', 'text/html']] },
					),
				};
			},
		}
	];

	gateway.registerWebFragments(fragments);


	getGatewayMiddleware._gatewayMiddleware = getMiddleware(gateway, { mode: 'development' });
	return getGatewayMiddleware._gatewayMiddleware;
};

export const onRequest: PagesFunction<{ DEV_MODE?: boolean }> = async (context) => {
	const gatewayMiddleware = getGatewayMiddleware(!!context.env.DEV_MODE);
	return gatewayMiddleware(context);
};
