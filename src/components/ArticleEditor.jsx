import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { apiGet, apiPost, apiPut } from '../api/client';

const CATEGORIES = [
  { value: 'release-notes', label: 'Release Notes' },
  { value: 'overview', label: 'Getting Started' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'lists', label: 'Lists & Data' },
  { value: 'templates', label: 'Templates' },
  { value: 'tools', label: 'Tools' },
  { value: 'admin', label: 'Administration' },
];

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('overview');
  const [parentId, setParentId] = useState('');
  const [parentArticles, setParentArticles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/articles').then(data => {
      setParentArticles(data.map(a => ({ id: a.id, title: a.title, category: a.category })));
    });
  }, []);

  useEffect(() => {
    if (isEditing) {
      apiGet(`/articles/${id}`).then(article => {
        setTitle(article.title);
        setContent(article.content || '');
        setCategory(article.category || 'overview');
        setParentId(article.parentId || '');
        setLoading(false);
      }).catch(() => { setError('Article not found'); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [id, isEditing]);

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link', 'image'],
      ['blockquote'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['clean'],
    ],
  }), []);

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    const slug = isEditing ? id : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const payload = { id: slug, title: title.trim(), content, category, parentId: parentId || null };
    try {
      if (isEditing) await apiPut(`/articles/${id}`, payload);
      else await apiPost('/articles', payload);
      navigate('/admin');
    } catch (err) {
      setError(err.error || 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="article-editor"><p>Loading...</p></div>;

  return (
    <div className="article-editor">
      <div className="editor-header">
        <h2>{isEditing ? 'Edit Article' : 'New Article'}</h2>
        <div className="editor-actions">
          <button className="btn-secondary" onClick={() => navigate('/admin')}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Article'}</button>
        </div>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="editor-field">
        <label className="editor-label">Title</label>
        <input className="editor-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" />
      </div>
      <div className="editor-row">
        <div className="editor-field">
          <label className="editor-label">Category</label>
          <select className="editor-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="editor-field">
          <label className="editor-label">Parent Article (optional)</label>
          <select className="editor-input" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">None (top-level article)</option>
            {parentArticles.filter(a => a.id !== id).map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </div>
      </div>
      <div className="editor-field">
        <label className="editor-label">Content</label>
        <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} placeholder="Write your article content here..." />
      </div>
    </div>
  );
}
