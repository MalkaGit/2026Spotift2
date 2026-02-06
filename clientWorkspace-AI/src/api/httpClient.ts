import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const httpClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'spotift_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete httpClient.defaults.headers.common['Authorization'];
  }
}

// Restore token on load (e.g. after refresh)
const stored = getStoredToken();
if (stored) setAuthToken(stored);
