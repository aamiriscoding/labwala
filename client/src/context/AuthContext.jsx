import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify token on mount
    const token = localStorage.getItem('labwala-token');
    if (token) {
      api.post('/auth/verify')
        .then(res => {
          if (res.data.valid) {
            setUser({ role: res.data.role, username: res.data.username });
          } else {
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password, role) => {
    const res = await api.post('/auth/login', { username, password, role });
    localStorage.setItem('labwala-token', res.data.token);
    localStorage.setItem('labwala-role', res.data.role);
    setUser({ role: res.data.role, username: res.data.username });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('labwala-token');
    localStorage.removeItem('labwala-role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
