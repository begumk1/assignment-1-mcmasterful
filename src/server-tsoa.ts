import { createServer } from './server-launcher';

const PORT = 3000;

async function startServer() {
    try {
        const { server, address } = await createServer(PORT);
        console.log(`Server running on ${address}`);
        console.log(`Swagger docs available at ${address}/docs`);
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

process.on('SIGINT', async () => {
    process.exit(0);
});
