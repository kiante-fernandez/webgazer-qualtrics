import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            'webeyetrack': path.resolve(__dirname, './src/vendor/webeyetrack/index.ts')
        }
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/lib/gaze-adapter.ts'),
            name: 'GazeAdapter',
            fileName: 'gaze-adapter.bundle',
            formats: ['umd']
        },
        outDir: 'dist'
    },
    worker: {
        format: 'iife'
    }
});
