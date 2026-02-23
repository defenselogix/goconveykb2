import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, requireAuth, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM articles ORDER BY sort_order ASC');
    const parentMap = {};
    const children = [];

    for (const row of rows) {
      const article = {
        id: row.id, title: row.title, content: row.content,
        searchText: row.search_text, category: row.category,
        icon: row.icon, parentId: row.parent_id,
      };
      if (!row.parent_id) {
        article.children = [];
        parentMap[row.id] = article;
      } else {
        children.push(article);
      }
    }

    for (const child of children) {
      if (parentMap[child.parentId]) {
        parentMap[child.parentId].children.push(child);
      }
    }

    const categoryOrder = ['release-notes', 'overview', 'campaigns', 'lists', 'templates', 'tools', 'admin'];
    const result = [];
    const seen = new Set();
    for (const cat of categoryOrder) {
      for (const id of Object.keys(parentMap)) {
        if (parentMap[id].category === cat && !seen.has(id)) {
          result.push(parentMap[id]);
          seen.add(id);
        }
      }
    }
    for (const id of Object.keys(parentMap)) {
      if (!seen.has(id)) result.push(parentMap[id]);
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM articles WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Article not found' });

    const row = rows[0];
    const article = {
      id: row.id, title: row.title, content: row.content,
      searchText: row.search_text, category: row.category,
      icon: row.icon, parentId: row.parent_id, sortOrder: row.sort_order,
    };

    if (!row.parent_id) {
      const childResult = await pool.query(
        'SELECT * FROM articles WHERE parent_id = $1 ORDER BY sort_order ASC', [row.id]
      );
      article.children = childResult.rows.map(c => ({
        id: c.id, title: c.title, content: c.content,
        searchText: c.search_text, category: c.category, parentId: c.parent_id,
      }));
    }

    res.json(article);
  } catch (err) {
    console.error('Error fetching article:', err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

router.post('/', authenticate, requireAuth, adminOnly, async (req, res) => {
  try {
    const { id, title, content, category, parentId } = req.body;
    if (!id || !title) return res.status(400).json({ error: 'id and title are required' });

    const searchText = (content || '').replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();

    let sortOrder = 0;
    if (parentId) {
      const { rows } = await pool.query(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM articles WHERE parent_id = $1', [parentId]
      );
      sortOrder = rows[0].next_order;
    } else {
      const { rows } = await pool.query(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM articles WHERE parent_id IS NULL AND category = $1', [category]
      );
      sortOrder = rows[0].next_order;
    }

    await pool.query(
      `INSERT INTO articles (id, title, content, search_text, category, parent_id, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, title, content || '', searchText, category, parentId || null, sortOrder]
    );

    res.status(201).json({ id, title, category, parentId: parentId || null });
  } catch (err) {
    console.error('Error creating article:', err);
    if (err.code === '23505') return res.status(409).json({ error: 'An article with this ID already exists' });
    res.status(500).json({ error: 'Failed to create article' });
  }
});

router.put('/:id', authenticate, requireAuth, adminOnly, async (req, res) => {
  try {
    const { title, content, category, parentId } = req.body;
    const searchText = (content || '').replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();

    const { rowCount } = await pool.query(
      `UPDATE articles SET title = $1, content = $2, search_text = $3, category = $4, parent_id = $5, updated_at = NOW() WHERE id = $6`,
      [title, content || '', searchText, category, parentId || null, req.params.id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Article not found' });
    res.json({ id: req.params.id, title, category, parentId: parentId || null });
  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

router.delete('/:id', authenticate, requireAuth, adminOnly, async (req, res) => {
  try {
    await pool.query('UPDATE articles SET parent_id = NULL WHERE parent_id = $1', [req.params.id]);
    await pool.query('DELETE FROM bookmarks WHERE article_id = $1', [req.params.id]);
    await pool.query('DELETE FROM reading_history WHERE article_id = $1', [req.params.id]);

    const { rowCount } = await pool.query('DELETE FROM articles WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Article not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

export default router;
