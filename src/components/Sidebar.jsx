import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const CATEGORY_LABELS = {
  'release-notes': 'Release Notes',
  overview: 'Getting Started',
  campaigns: 'Campaigns',
  lists: 'Lists & Data',
  templates: 'Templates',
  tools: 'Tools',
  admin: 'Administration',
};

const CATEGORY_ORDER = ['release-notes', 'overview', 'campaigns', 'lists', 'templates', 'tools', 'admin'];

export default function Sidebar({ articles, isOpen, onNavigate }) {
  const { id: activeId } = useParams();
  const [expanded, setExpanded] = useState({});

  // Auto-expand the section containing the active article
  useEffect(() => {
    if (activeId) {
      for (const article of articles) {
        if (article.children && article.children.some((c) => c.id === activeId)) {
          setExpanded((prev) => ({ ...prev, [article.id]: true }));
        }
        if (article.id === activeId && article.children && article.children.length > 0) {
          setExpanded((prev) => ({ ...prev, [article.id]: true }));
        }
      }
    }
  }, [activeId, articles]);

  const toggleExpand = (articleId) => {
    setExpanded((prev) => ({ ...prev, [articleId]: !prev[articleId] }));
  };

  const grouped = {};
  for (const article of articles) {
    const cat = article.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(article);
  }

  return (
    <aside className={`sidebar ${isOpen ? '' : 'closed'}`}>
      <nav className="sidebar-nav">
        {CATEGORY_ORDER.map((cat) => {
          if (!grouped[cat]) return null;
          return (
            <div className="sidebar-section" key={cat}>
              <div className="sidebar-section-label">{CATEGORY_LABELS[cat]}</div>
              {grouped[cat].map((article) => {
                const hasChildren = article.children && article.children.length > 0;
                const isExpanded = expanded[article.id];
                const isActive = activeId === article.id;
                const childActive = hasChildren && article.children.some((c) => c.id === activeId);

                return (
                  <div key={article.id}>
                    <button
                      className={`sidebar-item ${isActive ? 'active' : ''} ${childActive ? 'child-active' : ''}`}
                      onClick={() => {
                        onNavigate(article.id);
                        if (hasChildren) {
                          setExpanded((prev) => ({ ...prev, [article.id]: true }));
                        }
                      }}
                    >
                      <span className="sidebar-item-text">{article.title}</span>
                      {hasChildren && (
                        <span
                          className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(article.id);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      )}
                    </button>
                    {hasChildren && isExpanded && (
                      <div className="sidebar-children">
                        {article.children.map((child) => (
                          <button
                            key={child.id}
                            className={`sidebar-child-item ${activeId === child.id ? 'active' : ''}`}
                            onClick={() => onNavigate(child.id)}
                          >
                            {child.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
