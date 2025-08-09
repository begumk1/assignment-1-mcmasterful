import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { RegisterRoutes } from '../build/routes';
import koaSwagger from 'koa2-swagger-ui';
import swaggerJson from '../build/swagger.json';
import { AppState } from './server-launcher';

export function createApp(state?: AppState): Koa<AppState> {
    const app = new Koa<AppState>();

    app.use(bodyParser());

    // Inject state if provided
    if (state) {
        app.use(async (ctx, next) => {
            ctx.state = state;
            await next();
        });
    }

    // Register tsoa routes
    RegisterRoutes(app);

    // Add swagger documentation
    app.use(koaSwagger({
        routePrefix: '/docs',
        specPrefix: '/docs/spec',
        exposeSpec: true,
        swaggerOptions: {
            spec: swaggerJson
        }
    }));

    return app;
}

// Default app for backward compatibility
export const app = createApp();
