import { createContext, useContext, useState, useEffect } from 'react';
import { apiGet, apiPost } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/auth/me')
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await apiPost('/auth/login', { email, password });
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const data = await apiPost('/auth/register', { username, email, password });
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await apiPost('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
