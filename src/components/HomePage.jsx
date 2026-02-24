import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DESCRIPTIONS = {
  'getting-started': 'Learn about the EONS platform capabilities',
  'whats-new': 'Latest updates and release notes',
  'user-login': 'How to access the EONS portal',
  'homepage-navigation': 'Navigate the EONS home screen',
  campaigns: 'Create, manage, and monitor campaigns',
  lists: 'Import and manage recipient lists',
  'master-list': 'View and search all recipient contacts',
  templates: 'Build SMS, Email, Voice, and TTY templates',
  suppression: 'Manage customer opt-outs',
  map: 'Create location-based recipient lists',
  calendar: 'Schedule and plan campaigns',
  'seed-lists': 'Create test recipient lists',
  management: 'Configure approvals and DND settings',
  'user-management-portal': 'Manage user access and roles',
};

const ICONS = {
  'release-notes': { icon: '\u{2728}', className: 'icon-release-notes' },
  overview: { icon: '\u{1F680}', className: 'icon-overview' },
  campaigns: { icon: '\u{1F4E2}', className: 'icon-campaigns' },
  lists: { icon: '\u{1F4CB}', className: 'icon-lists' },
  templates: { icon: '\u{1F4DD}', className: 'icon-templates' },
  tools: { icon: '\u{1F527}', className: 'icon-tools' },
  admin: { icon: '\u{1F512}', className: 'icon-admin' },
};

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

export default function HomePage({ articles, onNavigate }) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/search/${encodeURIComponent(search.trim())}`);
    }
  };

  // Group articles by category
  const grouped = {};
  for (const article of articles) {
    const cat = article.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(article);
  }

  return (
    <div className="home-page">
      <div className="home-hero">
        <h2>EONS Knowledge Base</h2>
        <p>
          Your guide to the Emergency Outage Notifications System.
          Find help with campaigns, templates, lists, and more.
        </p>
        <div className="home-search">
          <svg
            className="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search for answers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        if (!grouped[cat]) return null;
        const catInfo = ICONS[cat] || { icon: '\u{1F4C4}', className: '' };
        return (
          <div className="home-section" key={cat}>
            <div className="home-section-label">{CATEGORY_LABELS[cat]}</div>
            <div className="home-categories">
              {grouped[cat].map((article) => (
                <div
                  key={article.id}
                  className="category-card"
                  onClick={() => onNavigate(article.id)}
                >
                  <span className="card-arrow">&rarr;</span>
                  <div className={`category-card-icon ${catInfo.className}`}>
                    {catInfo.icon}
                  </div>
                  <h3>{article.title}</h3>
                  <p>{DESCRIPTIONS[article.id] || ''}</p>
                  {article.children && article.children.length > 0 && (
                    <div className="card-children">
                      {article.children.map((child) => (
                        <div
                          key={child.id}
                          className="card-child"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(child.id);
                          }}
                        >
                          {child.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
