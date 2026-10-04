import { auth } from './firebase';

/**
 * Production authenticated fetch utility.
 * Awaits Firebase Auth readiness and automatically attaches 
 * cryptographic Firebase ID Token in `Authorization: Bearer <token>`
 * Ensuring strict server-side authentication and per-user scoping.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  
  try {
    if (typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }
  } catch (e) {
    // Continue if authStateReady is not supported or errors
  }

  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (e) {
      console.warn('[authFetch] Could not retrieve Firebase ID token:', e);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
