import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiPost, apiPut } from '../api/client';
import BookmarkButton from './BookmarkButton';
import ArticleEditor from './ArticleEditor';

export default function ArticleView({ article, parent, siblings, onNavigate, onArticleUpdated }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setEditing(false);
  }, [article.id]);

  useEffect(() => {
    if (user) {
      apiPost('/history', { articleId: article.id }).catch(() => {});
    }
  }, [article.id, user]);

  const handleSave = async ({ title, content }) => {
    await apiPut(`/articles/${article.id}`, {
      title,
      content,
      category: article.category,
      parentId: article.parentId || null,
    });
    setEditing(false);
    if (onArticleUpdated) onArticleUpdated();
  };

  const isAdmin = user?.role === 'admin';

  if (editing) {
    return <ArticleEditor article={article} onSave={handleSave} onCancel={() => setEditing(false)} />;
  }

  return (
    <div className="article-view">
      {parent && (
        <div className="article-breadcrumb">
          <button onClick={() => onNavigate(parent.id)}>{parent.title}</button>
          <span className="separator">/</span>
          <span>{article.title}</span>
        </div>
      )}

      <div className="article-title-row">
        <h1 className="article-title">{article.title}</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAdmin && (
            <button className="edit-article-btn" onClick={() => setEditing(true)}>
              ✏️ Edit
            </button>
          )}
          <BookmarkButton articleId={article.id} />
        </div>
      </div>
      <div className="article-meta">
        {parent && <span>Section: {parent.title}</span>}
        {!parent && article.category && (
          <span style={{ textTransform: 'capitalize' }}>{article.category}</span>
        )}
      </div>

      {article.content && (
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      )}

      {!article.parentId && article.children && article.children.length > 0 && (
        <div className="child-articles">
          <h3>In this section</h3>
          {article.children.map((child) => (
            <button
              key={child.id}
              className="child-article-link"
              onClick={() => onNavigate(child.id)}
            >
              {child.title}
            </button>
          ))}
        </div>
      )}

      {siblings.length > 0 && article.parentId && (
        <div className="sibling-nav">
          <div className="sibling-nav-label">Related articles</div>
          <div className="sibling-nav-items">
            {siblings.map((sib) => (
              <button
                key={sib.id}
                className={sib.id === article.id ? 'current' : ''}
                onClick={() => onNavigate(sib.id)}
              >
                {sib.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
