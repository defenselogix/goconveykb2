import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Log In</h2>
        <p className="auth-subtitle">Sign in to your EONS Knowledge Base account</p>
        {error && <div className="auth-error">{error}</div>}
        <label className="auth-label">Email</label>
        <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
        <label className="auth-label">Password</label>
        <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
        <button className="auth-btn" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign In'}</button>
        <p className="auth-footer">Don&apos;t have an account? <Link to="/register">Create one</Link></p>
      </form>
    </div>
  );
}
