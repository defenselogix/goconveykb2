import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

export default function SearchResults({ allArticles, onNavigate }) {
  const { query } = useParams();
  const decodedQuery = decodeURIComponent(query || '');

  const results = useMemo(() => {
    if (!decodedQuery.trim()) return [];
    const terms = decodedQuery.toLowerCase().split(/\s+/);
    return allArticles
      .map((article) => {
        const text = (article.searchText || '').toLowerCase();
        const title = (article.title || '').toLowerCase();
        let score = 0;
        for (const term of terms) {
          if (title.includes(term)) score += 10;
          if (text.includes(term)) score += 1;
        }
        return { article, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.article);
  }, [decodedQuery, allArticles]);

  const getSnippet = (article) => {
    const text = article.searchText || '';
    if (!text) return '';
    const lower = text.toLowerCase();
    const term = decodedQuery.toLowerCase().split(/\s+/)[0];
    const idx = lower.indexOf(term);
    if (idx === -1) return text.slice(0, 150) + '...';
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + 100);
    return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
  };

  return (
    <div className="search-results">
      <h2>
        Search results for &ldquo;{decodedQuery}&rdquo; ({results.length}{' '}
        {results.length === 1 ? 'result' : 'results'})
      </h2>
      {results.length === 0 && (
        <p style={{ color: 'var(--text-light)' }}>
          No articles match your search. Try different keywords.
        </p>
      )}
      {results.map((article) => (
        <div
          key={article.id}
          className="search-result-item"
          onClick={() => onNavigate(article.id)}
        >
          {article.parentId && (
            <div className="parent-label">{article.parentId}</div>
          )}
          <h3>{article.title}</h3>
          <p>{getSnippet(article)}</p>
        </div>
      ))}
    </div>
  );
}
