/**
 * Full-stack Express server for Linux AMD64 Wi-Fi Dashboard
 * Mounts REST API at /api and Vite development middleware on port 3000
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './backend/apiRouter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // REST API routes
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'wifi-dashboard', timestamp: new Date().toISOString() });
  });

  if (!isProduction) {
    // Vite middleware for dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static production build - search standard project, build, and /opt directories
    const candidateDistPaths = [
      path.resolve(process.cwd(), 'dist'),
      path.resolve(__dirname, 'dist'),
      path.resolve(__dirname, '..', 'dist'),
      '/opt/wifi-dashboard/dist',
    ];
    const distPath = candidateDistPaths.find((p) => fs.existsSync(path.join(p, 'index.html'))) || path.resolve(__dirname, 'dist');

    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Web interface build not found. Please ensure dist/index.html is compiled.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` Linux AMD64 Wi-Fi Repeater & AP Management Dashboard  `);
    console.log(` Active at: http://0.0.0.0:${PORT}                     `);
    console.log(` REST API: http://0.0.0.0:${PORT}/api                  `);
    console.log(` Mode: ${isProduction ? 'Production' : 'Development'}  `);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal: Failed to start Wi-Fi dashboard server:', err);
  process.exit(1);
});
