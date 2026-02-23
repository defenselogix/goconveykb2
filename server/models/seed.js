import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function seedArticles() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM articles');
  if (parseInt(rows[0].count) > 0) {
    console.log('Articles already seeded, skipping');
    return;
  }

  const articlesPath = path.join(__dirname, '..', '..', 'src', 'data', 'articles.json');
  const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < articles.length; i++) {
      const a = articles[i];
      await client.query(
        `INSERT INTO articles (id, title, content, search_text, category, parent_id, sort_order, icon)
         VALUES ($1, $2, $3, $4, $5, NULL, $6, $7)`,
        [a.id, a.title, a.content || '', a.searchText || '', a.category, i, a.icon || null]
      );
    }

    for (let i = 0; i < articles.length; i++) {
      const a = articles[i];
      if (a.children && a.children.length > 0) {
        for (let j = 0; j < a.children.length; j++) {
          const c = a.children[j];
          await client.query(
            `INSERT INTO articles (id, title, content, search_text, category, parent_id, sort_order, icon)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)`,
            [c.id, c.title, c.content || '', c.searchText || '', a.category, a.id, j]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('Seeded articles from articles.json');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
