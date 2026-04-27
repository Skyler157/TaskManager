const ACCESS_TOKEN_KEY = "tm_access_token";
const USER_KEY = "tm_user";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (!token) localStorage.removeItem(ACCESS_TOKEN_KEY);
  else localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown | null) {
  if (!user) localStorage.removeItem(USER_KEY);
  else localStorage.setItem(USER_KEY, JSON.stringify(user));
}

