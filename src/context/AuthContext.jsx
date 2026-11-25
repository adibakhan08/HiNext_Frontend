import { createContext, useContext, useState } from 'react';
import { axiosClient } from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nexhire_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async ({ username, password, role }) => {
    const endpoint =
      role === 'ADMIN'
        ? API_ENDPOINTS.AUTH.ADMIN_LOGIN
        : API_ENDPOINTS.AUTH.STUDENT_LOGIN;

    const { data } = await axiosClient.post(
      endpoint,
      { username, password },
      { skipAuth: true }
    );

    if (data.tokens) {
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
    }

    if (data.user) {
      localStorage.setItem('nexhire_user', JSON.stringify(data.user));
      setUser(data.user);
    }

    return data;
  };

  const logout = async () => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');

    try {
      if (refresh) {
        await axiosClient.post(
          API_ENDPOINTS.AUTH.LOGOUT,
          { refresh },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(access ? { Authorization: `Bearer ${access}` } : {}),
            },
          }
        );
      }
    } catch {
      // Proceed with local cleanup even if token is already expired or blacklisted
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('nexhire_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);