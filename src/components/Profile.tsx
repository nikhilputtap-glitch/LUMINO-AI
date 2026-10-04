import React, { useState } from 'react';
import MainLayout from './layout/MainLayout';
import { useAuth } from '../lib/AuthContext';
import { personalDataStore } from '../lib/store/PersonalDataStore';
import { 
  User, 
  LogOut, 
  Shield, 
  Settings, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  Target, 
  CheckSquare, 
  Brain, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface ProfileProps {
  onNavigate: (id: string) => void;
  initialTab?: 'overview' | 'activity' | 'security' | 'logout';
}

export default function Profile({ onNavigate, initialTab = 'overview' }: ProfileProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'security' | 'logout'>(initialTab);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const displayName = user?.name || personalDataStore.getProfile().name || 'Lumino Member';
  const displayEmail = user?.email || (user?.isAnonymous ? 'Guest Member Session' : 'member@lumino.ai');
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'LU';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      onNavigate('login');
    } catch (err: any) {
      console.error('Logout error:', err);
      setLogoutError(err?.message || 'Failed to log out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  return (
    <MainLayout onNavigate={onNavigate} currentPage="profile">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Profile Banner */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-neutral-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-neutral-800">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{displayName}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={12} /> Active
                </span>
              </div>
              <p className="text-sm text-neutral-400 mt-1 flex items-center gap-1.5">
                <Mail size={14} className="text-neutral-500" /> {displayEmail}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Lumino AI Chief of Staff • Connected
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('logout')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'logout'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
              }`}
            >
              <LogOut size={16} />
              Logout Tab
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User size={16} />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Settings size={16} />
            Preferences & Stats
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield size={16} />
            Security & Session
          </button>

          <button
            onClick={() => setActiveTab('logout')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'logout'
                ? 'border-red-500 text-red-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-red-400'
            }`}
          >
            <LogOut size={16} className={activeTab === 'logout' ? 'text-red-500' : ''} />
            <span>Logout</span>
            <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 text-xs rounded-full">Sign out</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div 
                onClick={() => onNavigate('goals')}
                className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl cursor-pointer hover:border-neutral-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-sm">Active Goals</span>
                  <div className="p-2 bg-neutral-800 rounded-lg text-emerald-400">
                    <Target size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold mt-2">{personalDataStore.getGoals().length}</div>
                <p className="text-xs text-neutral-500 mt-1">Strategic objectives tracked</p>
              </div>

              <div 
                onClick={() => onNavigate('tasks')}
                className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl cursor-pointer hover:border-neutral-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-sm">Pending Tasks</span>
                  <div className="p-2 bg-neutral-800 rounded-lg text-blue-400">
                    <CheckSquare size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold mt-2">{personalDataStore.getTasks().length}</div>
                <p className="text-xs text-neutral-500 mt-1">Ready for execution</p>
              </div>

              <div 
                onClick={() => onNavigate('memory')}
                className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl cursor-pointer hover:border-neutral-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-sm">Stored Memories</span>
                  <div className="p-2 bg-neutral-800 rounded-lg text-purple-400">
                    <Brain size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold mt-2">{personalDataStore.getMemories().length}</div>
                <p className="text-xs text-neutral-500 mt-1">Personal context retained</p>
              </div>
            </div>

            {/* Profile Details Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User size={18} /> Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider block">Full Name</span>
                  <span className="text-base font-medium text-neutral-200 mt-0.5 block">{displayName}</span>
                </div>
                <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider block">Email Address</span>
                  <span className="text-base font-medium text-neutral-200 mt-0.5 block">{displayEmail}</span>
                </div>
                <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider block">Role</span>
                  <span className="text-base font-medium text-neutral-200 mt-0.5 block">Primary Executive</span>
                </div>
                <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider block">Assistant Tier</span>
                  <span className="text-base font-medium text-indigo-400 mt-0.5 block flex items-center gap-1.5">
                    <Sparkles size={14} /> Lumino Intelligence Suite
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action to Logout */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-neutral-200">Need to switch accounts?</h4>
                <p className="text-xs text-neutral-400 mt-0.5">You can sign out anytime from the Logout tab.</p>
              </div>
              <button
                onClick={() => setActiveTab('logout')}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition"
              >
                Go to Logout <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings size={18} /> Lumino Assistant Preferences
              </h3>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
                  <div>
                    <p className="font-medium text-sm text-neutral-200">Communication Style</p>
                    <p className="text-xs text-neutral-400">Direct, high-agency Chief of Staff</p>
                  </div>
                  <span className="text-xs bg-neutral-800 px-3 py-1 rounded-full text-neutral-300">Concise</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
                  <div>
                    <p className="font-medium text-sm text-neutral-200">Default Model</p>
                    <p className="text-xs text-neutral-400">Active engine for standard inquiries</p>
                  </div>
                  <span className="text-xs bg-neutral-800 px-3 py-1 rounded-full text-neutral-300">Lumino-6.4 (Gemini 3.1)</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
                  <div>
                    <p className="font-medium text-sm text-neutral-200">Proactive Monitoring</p>
                    <p className="text-xs text-neutral-400">Autonomously watch for goal deadlines and conflicts</p>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield size={18} className="text-emerald-400" /> Security & Session Management
              </h3>
              <div className="space-y-3 pt-2">
                <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-neutral-200">Authentication Method</span>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Google / Firebase</span>
                  </div>
                  <p className="text-xs text-neutral-400">Protected with Google OAuth and encrypted session tokens.</p>
                </div>

                <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-neutral-200">Active Session ID</span>
                    <span className="text-xs text-neutral-400 font-mono">{user?.uid || 'sess_user_active_01'}</span>
                  </div>
                  <p className="text-xs text-neutral-400">Currently active on this device.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOGOUT TAB */}
        {activeTab === 'logout' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <LogOut size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Log Out of Lumino</h2>
                  <p className="text-sm text-neutral-400">Sign out of your current session on this device.</p>
                </div>
              </div>

              {logoutError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{logoutError}</span>
                </div>
              )}

              {/* Current Session Summary */}
              <div className="p-5 bg-neutral-950 border border-neutral-800/80 rounded-2xl space-y-3">
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-medium block">Active Account Session</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-neutral-300">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{displayName}</p>
                      <p className="text-xs text-neutral-400">{displayEmail}</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    Currently Logged In
                  </span>
                </div>
              </div>

              {/* What happens next info */}
              <div className="p-5 bg-neutral-900/50 border border-neutral-800/60 rounded-2xl space-y-2">
                <h4 className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                  <Shield size={16} className="text-neutral-400" /> What happens when you log out?
                </h4>
                <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                  <li>Your active session will be terminated and credentials cleared from this browser.</li>
                  <li>Your goals, tasks, meeting notes, and memory database will remain safely saved.</li>
                  <li>You will be redirected to the sign-in page to log back in anytime.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={18} />
                      <span>Confirm & Log Out</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onNavigate('chat')}
                  disabled={isLoggingOut}
                  className="w-full sm:w-auto px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-semibold transition"
                >
                  Cancel & Return to Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
