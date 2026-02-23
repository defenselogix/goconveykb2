import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiGet, apiPost, apiDelete } from '../api/client';

export default function BookmarkButton({ articleId }) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiGet('/bookmarks/ids').then(ids => setBookmarked(ids.includes(articleId))).catch(() => {});
  }, [user, articleId]);

  if (!user) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      if (bookmarked) { await apiDelete(`/bookmarks/${articleId}`); setBookmarked(false); }
      else { await apiPost('/bookmarks', { articleId }); setBookmarked(true); }
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  return (
    <button className={`bookmark-btn ${bookmarked ? 'active' : ''}`} onClick={toggle} disabled={loading} title={bookmarked ? 'Remove bookmark' : 'Bookmark this article'}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
    </button>
  );
}
