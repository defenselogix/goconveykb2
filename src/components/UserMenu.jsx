import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) {
    return <button className="header-login-btn" onClick={() => navigate('/login')}>Log In</button>;
  }

  const handleLogout = async () => { setOpen(false); await logout(); navigate('/'); };

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button className="user-menu-trigger" onClick={() => setOpen(!open)}>
        <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
        <span className="user-menu-name">{user.username}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <span className="user-menu-username">{user.username}</span>
            <span className={`user-menu-role ${user.role}`}>{user.role}</span>
          </div>
          <div className="user-menu-divider" />
          <button className="user-menu-item" onClick={() => { setOpen(false); navigate('/bookmarks'); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
            My Bookmarks
          </button>
          <button className="user-menu-item" onClick={() => { setOpen(false); navigate('/history'); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Reading History
          </button>
          {user.role === 'admin' && (
            <button className="user-menu-item" onClick={() => { setOpen(false); navigate('/admin'); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              Admin Panel
            </button>
          )}
          <div className="user-menu-divider" />
          <button className="user-menu-item logout" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
