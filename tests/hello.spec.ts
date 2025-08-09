import { describe, it, expect } from 'vitest';
import { setupApiTest } from './test-helper';
import { DefaultApi, Configuration } from '../client';

describe('Hello API', () => {
    const getTestContext = setupApiTest();

    it('should return hello message', async () => {
        const context = getTestContext();
        const client = new DefaultApi(new Configuration({ basePath: context.address }));

        const result = await client.getHello('test');

        expect(result).toBe('Hello test');
    });
});
