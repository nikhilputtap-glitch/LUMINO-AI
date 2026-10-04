import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Shield, Sparkles, User, ArrowRight } from 'lucide-react';

export default function Auth() {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setError(err?.message || 'Google sign-in was interrupted. Try Instant Access below.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginAsGuest();
    } catch (err: any) {
      console.error('Guest sign-in error:', err);
      setError('Failed to initialize session. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950 p-4">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl w-full max-w-md shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mx-auto shadow-lg shadow-indigo-600/30">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">LUMINO AI</h1>
          <p className="text-xs text-neutral-400">Personal AI Operating System</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs leading-relaxed">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-neutral-200 text-neutral-950 font-bold p-3.5 rounded-xl transition flex items-center justify-center gap-3 cursor-pointer text-sm shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{loading ? 'Authenticating...' : 'Sign In with Google'}</span>
          </button>

          <button 
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-semibold p-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <User size={15} />
            <span>Instant Isolated Guest Session</span>
          </button>
        </div>

        <div className="border-t border-neutral-800 pt-4 text-center">
          <p className="text-[11px] text-neutral-500 leading-relaxed flex items-center justify-center gap-1.5">
            <Shield size={12} className="text-emerald-400" />
            <span>Encrypted zero-trust data vault hosted on Firebase Firestore</span>
          </p>
        </div>
      </div>
    </div>
  );
}
