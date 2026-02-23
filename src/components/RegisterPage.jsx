import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join the EONS Knowledge Base</p>
        {error && <div className="auth-error">{error}</div>}
        <label className="auth-label">Username</label>
        <input className="auth-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" required autoFocus />
        <label className="auth-label">Email</label>
        <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <label className="auth-label">Password</label>
        <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required />
        <label className="auth-label">Confirm Password</label>
        <input className="auth-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required />
        <button className="auth-btn" type="submit" disabled={submitting}>{submitting ? 'Creating account...' : 'Create Account'}</button>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
