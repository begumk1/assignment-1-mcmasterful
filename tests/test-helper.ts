import { beforeEach, afterEach } from 'vitest';
import { createServer } from '../src/server-launcher';

export interface TestContext {
    address: string;
    close: () => Promise<void>;
    state: any; // Will be properly typed later
}

export function setupApiTest() {
    let testContext: TestContext | null = null;

    beforeEach(async () => {
        const { server, address, close, state } = await createServer(0, true);
        testContext = { address, close, state };
    });

    afterEach(async () => {
        if (testContext) {
            await testContext.close();
        }
    });

    return () => testContext!;
}
