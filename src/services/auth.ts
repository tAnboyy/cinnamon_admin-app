type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

// Singleton storage instance shared across all auth functions
let storageInstance: StorageLike | null = null;

function getStorage(): StorageLike {
  if (storageInstance) return storageInstance;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      storageInstance = window.localStorage as StorageLike;
      return storageInstance;
    }
  } catch (e) {
    // ignore
  }

  // fallback in-memory storage (non-persistent)
  const store: Record<string, string> = {};
  storageInstance = {
    getItem(key: string) {
      return store.hasOwnProperty(key) ? store[key] : null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
  };
  return storageInstance;
}

const STORAGE_KEY = 'cinnamon_admin_session_v1';

export async function signIn(username: string, password: string) {
  // Only allow admin/admin
  const ok = username === 'admin' && password === 'admin';
  if (ok) {
    const storage = getStorage();
    storage.setItem(STORAGE_KEY, '1');
  }
  return ok;
}

export async function signOut() {
  const storage = getStorage();
  storage.removeItem(STORAGE_KEY);
}

export function isSignedIn(): boolean {
  const storage = getStorage();
  return storage.getItem(STORAGE_KEY) === '1';
}

export default { signIn, signOut, isSignedIn };
