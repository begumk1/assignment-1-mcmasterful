import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import qs from 'koa-qs';
import routes from './routes';
import { dbService } from './database';

const app = new Koa();
qs(app);

app.use(bodyParser());
app.use(routes.allowedMethods());
app.use(routes.routes());

const PORT = 3000;

async function startServer() {
    try {
        await dbService.connect();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

process.on('SIGINT', async () => {
    await dbService.disconnect();
    process.exit(0);
});