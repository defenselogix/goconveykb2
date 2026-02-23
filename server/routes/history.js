import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (rh.article_id) rh.article_id, rh.read_at, a.title, a.category, a.parent_id
       FROM reading_history rh JOIN articles a ON a.id = rh.article_id
       WHERE rh.user_id = $1 ORDER BY rh.article_id, rh.read_at DESC`, [req.user.id]
    );
    rows.sort((a, b) => new Date(b.read_at) - new Date(a.read_at));
    res.json(rows.slice(0, 50));
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { articleId } = req.body;
    if (!articleId) return res.status(400).json({ error: 'articleId is required' });
    await pool.query('INSERT INTO reading_history (user_id, article_id) VALUES ($1, $2)', [req.user.id, articleId]);
    res.status(201).json({ articleId });
  } catch (err) {
    console.error('Error recording history:', err);
    res.status(500).json({ error: 'Failed to record history' });
  }
});

export default router;
