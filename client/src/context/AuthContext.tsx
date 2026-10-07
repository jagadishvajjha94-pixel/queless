import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'business_owner' | 'admin';
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, role: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch current user if token exists on load
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.success) {
          setUser(json.data);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Fetch user session failed', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (json.success) {
        localStorage.setItem('token', json.token);
        setToken(json.token);
        setUser(json.user);
        return { success: true };
      } else {
        return { success: false, message: json.message || 'Login failed' };
      }
    } catch (err) {
      return { success: false, message: 'Network error, please try again.' };
    }
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });
      const json = await res.json();

      if (json.success) {
        localStorage.setItem('token', json.token);
        setToken(json.token);
        setUser(json.user);
        return { success: true };
      } else {
        return { success: false, message: json.message || 'Registration failed' };
      }
    } catch (err) {
      return { success: false, message: 'Network error, please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
