import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminLogin from './AdminLogin';
import './AdminLogin.css';

export default function AdminBar() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (user) {
    return (
      <div className="admin-user-info">
        <span>{user.username}</span>
        {user.role === 'admin' && <span className="admin-badge">Admin</span>}
        <button className="admin-logout-btn" onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="admin-bar">
      <button className="admin-menu-btn" onClick={() => setShowLogin(true)}>
        🔑 Admin
      </button>
      {showLogin && <AdminLogin onClose={() => setShowLogin(false)} />}
    </div>
  );
}
