import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, registerUser as registerApi, loginUser as loginApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('disasternet_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await getMe();
          setUser(res.data.data);
        } catch {
          localStorage.removeItem('disasternet_token');
          localStorage.removeItem('disasternet_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const register = async (username, password) => {
    const res = await registerApi({ username, password });
    const { user: userData, token: authToken } = res.data.data;
    localStorage.setItem('disasternet_token', authToken);
    localStorage.setItem('disasternet_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  const login = async (username, password) => {
    const res = await loginApi({ username, password });
    const { user: userData, token: authToken } = res.data.data;
    localStorage.setItem('disasternet_token', authToken);
    localStorage.setItem('disasternet_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('disasternet_token');
    localStorage.removeItem('disasternet_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
