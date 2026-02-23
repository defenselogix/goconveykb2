import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../api/client';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet('/bookmarks').then(data => { setBookmarks(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="list-page"><p>Loading bookmarks...</p></div>;

  return (
    <div className="list-page">
      <h2>My Bookmarks</h2>
      {bookmarks.length === 0 ? (
        <p className="list-empty">You haven&apos;t bookmarked any articles yet. Click the bookmark icon on any article to save it here.</p>
      ) : (
        <div className="list-items">
          {bookmarks.map((b) => (
            <div key={b.article_id} className="list-item" onClick={() => navigate(`/article/${b.article_id}`)}>
              <h3>{b.title}</h3>
              <span className="list-item-meta">{b.category && <span className="admin-category-badge">{b.category}</span>}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
