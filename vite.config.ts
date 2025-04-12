import { defineConfig } from 'vite';

import path from 'node:path';

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	build: {
		emptyOutDir: true,
		target: 'es2020',
		rollupOptions: {
			input: {
				background: path.resolve(__dirname, 'src/background.ts'),
			},
			output: {
				entryFileNames: '[name].js',
				chunkFileNames: undefined,
				manualChunks: undefined,
				// inlineDynamicImports: true,
			},
		}
	}
});
