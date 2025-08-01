import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select']
        }
      }
    }
  },
  server: {
    host: "::",
    port: 8080,
    proxy: mode === 'development' ? {
      '/api/smartsheet': {
        target: 'https://api.smartsheet.com/2.0',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/smartsheet/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Add the Authorization header to the request when it's sent to the target
            proxyReq.setHeader('Authorization', `Bearer mcQHLLu8W9A0uUtAmgYaFsQE8yH1QWKUYNcoq`);
          });
        }
      },
    } : {},
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
