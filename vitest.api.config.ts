import { defineConfig } from 'vitest/config';
import openApiPlugin from './vitest-openapi-plugin';

export default defineConfig({
    plugins: [openApiPlugin],
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.spec.ts'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'build', 'client'],
        setupFiles: ['./src/__tests__/setup.ts'],
    },
});
