import { defineConfig } from 'vitest/config';

export default defineConfig({
	define: {
		'import.meta.env.RATE_LIMIT_TABLE_NAME': JSON.stringify(
			process.env.RATE_LIMIT_TABLE_NAME
		)
	},
	test: {
		coverage: {
			provider: 'c8',
			reporter: ['text', 'html'],
			exclude: ['node_modules', 'cdk.out', 'lib', 'bin']
		},
		environment: 'node',
		globals: true,
		include: ['test/**/*.test.ts']
	}
});
