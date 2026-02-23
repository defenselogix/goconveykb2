import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.article_id, b.created_at, a.title, a.category, a.parent_id
       FROM bookmarks b JOIN articles a ON a.id = b.article_id
       WHERE b.user_id = $1 ORDER BY b.created_at DESC`, [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

router.get('/ids', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT article_id FROM bookmarks WHERE user_id = $1', [req.user.id]);
    res.json(rows.map(r => r.article_id));
  } catch (err) {
    console.error('Error fetching bookmark ids:', err);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { articleId } = req.body;
    if (!articleId) return res.status(400).json({ error: 'articleId is required' });
    await pool.query('INSERT INTO bookmarks (user_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, articleId]);
    res.status(201).json({ articleId });
  } catch (err) {
    console.error('Error adding bookmark:', err);
    res.status(500).json({ error: 'Failed to add bookmark' });
  }
});

router.delete('/:articleId', async (req, res) => {
  try {
    await pool.query('DELETE FROM bookmarks WHERE user_id = $1 AND article_id = $2', [req.user.id, req.params.articleId]);
    res.json({ removed: req.params.articleId });
  } catch (err) {
    console.error('Error removing bookmark:', err);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

export default router;
