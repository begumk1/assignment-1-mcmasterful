import { defineConfig } from 'vitest/config';
import openApiPlugin from './vitest-openapi-plugin';

export default defineConfig({
    plugins: [openApiPlugin],
    test: {
        globals: true,
        environment: 'node',
        include: ['src/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'build', 'client', 'tests'],
        setupFiles: ['./src/__tests__/setup.ts'],
    },
});
