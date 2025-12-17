import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'auth_state_v1';
const BASE_URL = 'https://freedom-tech.onrender.com';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // On app start, do not auto-restore previous auth state.
        // Always begin unauthenticated and require manual login.
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // ignore storage errors, start unauthenticated
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistAuth = async (next) => {
    setIsAuthenticated(!!next.accessToken);
    setUser(next.user || null);
    setAccessToken(next.accessToken || null);
    setRefreshToken(next.refreshToken || null);
    try {
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          user: next.user || null,
          accessToken: next.accessToken || null,
          refreshToken: next.refreshToken || null,
        })
      );
    } catch {
      // ignore persistence errors
    }
  };

  const clearAuth = async () => {
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const login = async (inmateId, password) => {
    const res = await fetch(`${BASE_URL}/auth/inmate-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inmateId, password }),
    });

    if (!res.ok) {
      let message = 'Login failed';
      try {
        const err = await res.json();
        if (err?.error) message = err.error;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }

    const data = await res.json();
    await persistAuth({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await fetch(`${BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch {
      // ignore network/logout errors
    } finally {
      await clearAuth();
    }
  };

  const value = useMemo(
    () => ({ isAuthenticated, user, accessToken, refreshToken, loading, login, logout }),
    [isAuthenticated, user, accessToken, refreshToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
