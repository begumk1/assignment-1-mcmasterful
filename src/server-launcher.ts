import { Server } from 'http';
import { createApp } from './app';
import { dbService } from './database';
import { getBookDatabase } from './__tests__/database-utils';

export interface AppBookDatabaseState {
    books: any; // Replace with actual type
}

export interface AppWarehouseDatabaseState {
    warehouse: any; // Replace with actual type
}

export interface AppState extends AppBookDatabaseState, AppWarehouseDatabaseState {}

export async function createServer(port: number = 0, randomizeDatabases: boolean = false): Promise<{
    server: Server;
    address: string;
    close: () => Promise<void>;
    state: AppState;
}> {
    try {
        await dbService.connect();
        
        // Create database access with optional randomization
        const dbName = randomizeDatabases ? Math.floor(Math.random() * 100000).toString() : undefined;
        const dbAccess = getBookDatabase(dbName);
        
        // Create state object with database access
        const state: AppState = {
            books: dbAccess.books,
            warehouse: dbAccess.warehouseDatabase,
        };

        // Create app with state injection
        const app = createApp(state);

        const server = app.listen(port, () => {
            const address = server.address();
            if (address && typeof address === 'object') {
                console.log(`Server running on http://localhost:${address.port}`);
                console.log(`Swagger docs available at http://localhost:${address.port}/docs`);
            }
        });

        const close = async () => {
            await new Promise<void>((resolve) => server.close(() => resolve()));
            await dbService.disconnect();
        };

        return {
            server,
            address: `http://localhost:${(server.address() as any)?.port || port}`,
            close,
            state,
        };
    } catch (error) {
        console.error('Failed to start server:', error);
        throw error;
    }
}
