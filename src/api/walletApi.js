import AsyncStorage from '@react-native-async-storage/async-storage';

// Match AuthContext BASE_URL; adjust here if you want to use localhost in dev.
const BASE_URL = 'https://freedom-tech.onrender.com';

async function authFetch(path, options = {}) {
  // AuthContext persists full auth state under AUTH_STORAGE_KEY; we also
  // store accessToken separately for convenience when calling APIs here.
  const token = await AsyncStorage.getItem('auth_access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || text || 'Request failed';
    throw new Error(message);
  }

  return data;
}

export async function getInmateWallet() {
  return authFetch('/inmates/wallet');
}
