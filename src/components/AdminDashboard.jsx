import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiDelete } from '../api/client';

const CATEGORY_LABELS = {
  'release-notes': 'Release Notes', overview: 'Getting Started', campaigns: 'Campaigns',
  lists: 'Lists & Data', templates: 'Templates', tools: 'Tools', admin: 'Administration',
};

export default function AdminDashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  const loadArticles = () => {
    apiGet('/articles').then(data => {
      const flat = [];
      for (const article of data) {
        flat.push({ ...article, isParent: true });
        if (article.children) {
          for (const child of article.children) flat.push({ ...child, isParent: false });
        }
      }
      setArticles(flat);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadArticles(); }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try { await apiDelete(`/articles/${id}`); loadArticles(); }
    catch (err) { alert(err.error || 'Failed to delete'); }
    finally { setDeleting(null); }
  };

  if (loading) return <div className="admin-dashboard"><p>Loading articles...</p></div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <button className="btn-primary" onClick={() => navigate('/admin/new')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Article
        </button>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Category</th><th>Type</th><th>Actions</th></tr></thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} className={article.parentId ? 'child-row' : ''}>
                <td>
                  <span className="admin-article-link" onClick={() => navigate(`/article/${article.id}`)}>
                    {article.parentId && <span className="child-indent">&mdash; </span>}{article.title}
                  </span>
                </td>
                <td><span className="admin-category-badge">{CATEGORY_LABELS[article.category] || article.category}</span></td>
                <td>{article.parentId ? 'Sub-article' : 'Parent'}</td>
                <td>
                  <div className="admin-actions">
                    <button className="btn-icon" title="Edit" onClick={() => navigate(`/admin/edit/${article.id}`)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    </button>
                    <button className="btn-icon danger" title="Delete" disabled={deleting === article.id} onClick={() => handleDelete(article.id, article.title)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
