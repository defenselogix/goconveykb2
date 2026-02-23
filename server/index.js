import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { initDB } from './config/db.js';
import { seedArticles } from './models/seed.js';
import authRoutes from './routes/auth.js';
import articleRoutes from './routes/articles.js';
import bookmarkRoutes from './routes/bookmarks.js';
import historyRoutes from './routes/history.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/history', historyRoutes);

// Serve Vite build output in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback - all non-API routes serve index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

async function start() {
  try {
    await initDB();
    await seedArticles();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
