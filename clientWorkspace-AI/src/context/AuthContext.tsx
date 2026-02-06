import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '@/api/authApi';
import * as userApi from '@/api/userApi';
import { getMyLikes } from '@/api/likesApi';
import { setAuthToken, setStoredToken, clearStoredToken, getStoredToken } from '@/api/httpClient';
import { MIN_ARTISTS } from '@/constants';
import { getArtistCount } from '@/utils/library';
import type { UserProfile } from '@/types';
import type { LoginCredentials, RegisterInput } from '@/types';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: getStoredToken(),
    isAuthenticated: false,
    isInitialized: false,
  });
  const navigate = useNavigate();

  const initFromStoredToken = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setState((s) => ({ ...s, isInitialized: true }));
      return;
    }
    setAuthToken(token);
    try {
      const user = await userApi.getMe();
      setState({ user, token, isAuthenticated: true, isInitialized: true });
    } catch {
      clearStoredToken();
      setAuthToken(null);
      setState({ user: null, token: null, isAuthenticated: false, isInitialized: true });
    }
  }, []);

  useEffect(() => {
    initFromStoredToken();
  }, [initFromStoredToken]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const { accessToken } = await authApi.login(credentials);
      setStoredToken(accessToken);
      setAuthToken(accessToken);
      const user = await userApi.getMe();
      setState({ user, token: accessToken, isAuthenticated: true, isInitialized: true });

      const { items } = await getMyLikes({ limit: 100 });
      const artistCount = getArtistCount(items);
      if (artistCount < MIN_ARTISTS) {
        navigate('/onboarding/favorites', { replace: true, state: { fromLogin: true, artistCount } });
      } else {
        navigate('/library', { replace: true });
      }
    },
    [navigate]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await authApi.register(input);
      await login({ email: input.email, password: input.password });
    },
    [login]
  );

  const logout = useCallback(() => {
    clearStoredToken();
    setAuthToken(null);
    setState({ user: null, token: null, isAuthenticated: false, isInitialized: true });
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
    }),
    [state, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
