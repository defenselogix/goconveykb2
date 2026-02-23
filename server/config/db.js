import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS articles (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT DEFAULT '',
        search_text TEXT DEFAULT '',
        category VARCHAR(50),
        parent_id VARCHAR(100) REFERENCES articles(id) ON DELETE SET NULL,
        sort_order INTEGER DEFAULT 0,
        icon VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        article_id VARCHAR(100) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, article_id)
      );

      CREATE TABLE IF NOT EXISTS reading_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        article_id VARCHAR(100) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        read_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
      CREATE INDEX IF NOT EXISTS idx_articles_parent_id ON articles(parent_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
      CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON reading_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_reading_history_read_at ON reading_history(read_at);
    `);
    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

export default pool;
