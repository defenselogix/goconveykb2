import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../api/client';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet('/history').then(data => { setHistory(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="list-page"><p>Loading history...</p></div>;

  return (
    <div className="list-page">
      <h2>Reading History</h2>
      {history.length === 0 ? (
        <p className="list-empty">No reading history yet. Start exploring articles!</p>
      ) : (
        <div className="list-items">
          {history.map((h, i) => (
            <div key={`${h.article_id}-${i}`} className="list-item" onClick={() => navigate(`/article/${h.article_id}`)}>
              <h3>{h.title}</h3>
              <span className="list-item-meta">
                {h.category && <span className="admin-category-badge">{h.category}</span>}
                <span className="list-item-date">{new Date(h.read_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
