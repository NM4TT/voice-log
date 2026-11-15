import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

function useSelfHostedOrtWasmBackend(): Plugin {
  return {
    name: 'use-self-hosted-ort-wasm-backend',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (!id.includes('@huggingface/transformers')) {
        return null;
      }
      if (!code.includes('onnxruntime-web/webgpu')) {
        return null;
      }
      return {
        code: code.replace(
          /from\s+["']onnxruntime-web\/webgpu["']/g,
          'from "onnxruntime-web/wasm"'
        ),
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [useSelfHostedOrtWasmBackend(), react(), tailwindcss()],
  envPrefix: ['VITE_', 'PUBLIC_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['localhost', '127.0.0.1', '.trycloudflare.com'],
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
    watch: {
      usePolling: true,
    },
  },
  worker: {
    format: 'es',
    plugins: () => [useSelfHostedOrtWasmBackend()],
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
