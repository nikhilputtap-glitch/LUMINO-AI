import { Request, Response, NextFunction } from 'express';
import firebaseConfig from '../../firebase-applet-config.json';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    isAnonymous?: boolean;
  };
}

/**
 * Production Firebase Authentication Middleware
 * 
 * Enforces strict cryptographic Firebase ID token verification.
 * Rejects unauthenticated requests with 401 Unauthorized.
 * Derives authenticated UID strictly from verified token claims.
 * NEVER creates silent guest identities or trusts client-supplied user IDs.
 */
export async function verifyFirebaseAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Allow health check endpoint without token
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization Bearer token',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Empty token provided',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });

    if (response.ok) {
      const data: any = await response.json();
      if (data.users && data.users.length > 0) {
        const u = data.users[0];
        req.user = {
          uid: u.localId,
          email: u.email,
          isAnonymous: !u.email
        };
        return next();
      }
    }

    console.warn('[verifyFirebaseAuth] Firebase token verification failed with status:', response.status);
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase ID token',
      code: 'TOKEN_INVALID'
    });
  } catch (err) {
    console.error('[verifyFirebaseAuth] Verification network error:', err);
    return res.status(503).json({
      error: 'Authentication verification service temporarily unavailable',
      code: 'AUTH_SERVICE_UNAVAILABLE'
    });
  }
}
