import { useEffect } from 'react';

export default function ArticleView({ article, parent, siblings, onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [article.id]);

  return (
    <div className="article-view">
      {parent && (
        <div className="article-breadcrumb">
          <button onClick={() => onNavigate(parent.id)}>{parent.title}</button>
          <span className="separator">/</span>
          <span>{article.title}</span>
        </div>
      )}

      <h1 className="article-title">{article.title}</h1>
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
