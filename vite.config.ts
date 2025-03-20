import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
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
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
