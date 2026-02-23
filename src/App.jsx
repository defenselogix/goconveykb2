import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { apiGet } from './api/client';
import Sidebar from './components/Sidebar';
import ArticleView from './components/ArticleView';
import HomePage from './components/HomePage';
import SearchResults from './components/SearchResults';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import UserMenu from './components/UserMenu';
import AdminDashboard from './components/AdminDashboard';
import ArticleEditor from './components/ArticleEditor';
import BookmarksPage from './components/BookmarksPage';
import HistoryPage from './components/HistoryPage';
import AdminBar from './components/AdminBar';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user) return null;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user || user.role !== 'admin') return null;
  return children;
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 900);
  const [headerSearch, setHeaderSearch] = useState('');
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch articles from API
  useEffect(() => {
    apiGet('/articles')
      .then(data => {
        setArticles(data);
        setArticlesLoading(false);
      })
      .catch(() => setArticlesLoading(false));
  }, []);

  const allArticles = useMemo(() => {
    const flat = [];
    for (const article of articles) {
      flat.push(article);
      if (article.children) {
        for (const child of article.children) {
          flat.push(child);
        }
      }
    }
    return flat;
  }, [articles]);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth <= 900) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const findArticle = (id) => allArticles.find((a) => a.id === id);

  const handleHeaderSearch = (e) => {
    if (e.key === 'Enter' && headerSearch.trim()) {
      navigate(`/search/${encodeURIComponent(headerSearch.trim())}`);
      setHeaderSearch('');
    }
  };

  // Reload articles after admin edits
  const refreshArticles = () => {
    apiGet('/articles').then(data => setArticles(data)).catch(() => {});
  };

  const isHome = location.pathname === '/' || location.pathname === '';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isListPage = location.pathname === '/bookmarks' || location.pathname === '/history';
  const showSidebar = !isHome && !isAuthPage && !isAdminPage && !isListPage;

  return (
    <div className="app">
      <header className="app-header">
        {showSidebar && (
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <div className="header-brand" onClick={() => navigate('/')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>EONS Knowledge Base</span>
        </div>
        <div className="header-search">
          <svg className="header-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search articles..."
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            onKeyDown={handleHeaderSearch}
          />
        </div>
        <div className="header-spacer" />
        <AdminBar />
        <UserMenu />
      </header>

      <div className="app-body">
        {showSidebar && (
          <>
            {sidebarOpen && (
              <div
                className="sidebar-overlay"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <Sidebar
              articles={articles}
              isOpen={sidebarOpen}
              onNavigate={(id) => navigate(`/article/${id}`)}
            />
          </>
        )}
        <main className={`main-content ${!showSidebar || !sidebarOpen ? 'full-width' : ''}`}>
          {articlesLoading ? (
            <div className="loading-state">Loading...</div>
          ) : (
            <Routes>
              <Route path="/" element={<HomePage articles={articles} onNavigate={(id) => navigate(`/article/${id}`)} />} />
              <Route path="/article/:id" element={<ArticleViewWrapper findArticle={findArticle} articles={articles} onNavigate={(id) => navigate(`/article/${id}`)} onArticleUpdated={refreshArticles} />} />
              <Route path="/search/:query" element={<SearchResults allArticles={allArticles} onNavigate={(id) => navigate(`/article/${id}`)} />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard onRefresh={refreshArticles} /></AdminRoute>} />
              <Route path="/admin/new" element={<AdminRoute><ArticleEditor onSaved={refreshArticles} /></AdminRoute>} />
              <Route path="/admin/edit/:id" element={<AdminRoute><ArticleEditor onSaved={refreshArticles} /></AdminRoute>} />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
}

function ArticleViewWrapper({ findArticle, articles, onNavigate, onArticleUpdated }) {
  const { id } = useParams();
  const article = findArticle(id);
  if (!article) {
    return (
      <div className="not-found">
        <h2>Article not found</h2>
        <p>The requested article could not be found.</p>
      </div>
    );
  }

  let parent = null;
  let siblings = [];
  if (article.parentId) {
    parent = articles.find((a) => a.id === article.parentId);
    if (parent) {
      siblings = parent.children || [];
    }
  } else {
    const topLevel = articles.find((a) => a.id === article.id);
    if (topLevel && topLevel.children && topLevel.children.length > 0) {
      siblings = topLevel.children;
    }
  }

  return (
    <ArticleView
      article={article}
      parent={parent}
      siblings={siblings}
      onNavigate={onNavigate}
      onArticleUpdated={onArticleUpdated}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
