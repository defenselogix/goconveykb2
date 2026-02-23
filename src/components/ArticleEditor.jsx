import { useState, useRef, useCallback } from 'react';
import './ArticleEditor.css';

export default function ArticleEditor({ article, onSave, onCancel }) {
  const [title, setTitle] = useState(article.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editorRef = useRef(null);

  const exec = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const handleImage = () => {
    const url = prompt('Enter image URL:');
    if (url) exec('insertImage', url);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const content = editorRef.current.innerHTML;
      await onSave({ title, content });
    } catch (err) {
      setError(err.error || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="article-editor">
      <div className="editor-header">
        <h2>Edit Article</h2>
        <div className="editor-actions">
          <button className="editor-btn cancel" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="editor-btn save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && <div className="editor-error">{error}</div>}

      <div className="editor-field">
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="editor-title-input"
        />
      </div>

      <div className="editor-field">
        <label>Content</label>
        <div className="toolbar">
          <button onClick={() => exec('bold')} title="Bold"><b>B</b></button>
          <button onClick={() => exec('italic')} title="Italic"><i>I</i></button>
          <button onClick={() => exec('underline')} title="Underline"><u>U</u></button>
          <span className="toolbar-divider" />
          <button onClick={() => exec('formatBlock', '<h2>')} title="Heading 2">H2</button>
          <button onClick={() => exec('formatBlock', '<h3>')} title="Heading 3">H3</button>
          <button onClick={() => exec('formatBlock', '<p>')} title="Paragraph">P</button>
          <span className="toolbar-divider" />
          <button onClick={() => exec('insertUnorderedList')} title="Bullet List">• List</button>
          <button onClick={() => exec('insertOrderedList')} title="Numbered List">1. List</button>
          <span className="toolbar-divider" />
          <button onClick={handleLink} title="Insert Link">🔗 Link</button>
          <button onClick={handleImage} title="Insert Image">🖼 Image</button>
          <span className="toolbar-divider" />
          <button onClick={() => exec('removeFormat')} title="Clear Formatting">✕ Clear</button>
        </div>
        <div
          ref={editorRef}
          className="editor-content"
          contentEditable
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
            document.execCommand('insertHTML', false, text);
          }}
        />
      </div>
    </div>
  );
}
