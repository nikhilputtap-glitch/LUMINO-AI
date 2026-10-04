import React, { useState } from 'react';
import { Menu, X, Zap, Target, CheckSquare, Calendar, Brain, Bot, Bell, Settings, User, Plus, BookOpen, Link, LogOut, Film } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate?: (id: string) => void;
  currentPage?: string;
  onNewChat?: () => void;
}

const NavItems = [
    { icon: Zap, label: 'What Matters Now', id: 'matters' },
    { icon: Bot, label: 'Chat & Copilot', id: 'chat' },
    { icon: Target, label: 'Goals', id: 'goals' },
    { icon: CheckSquare, label: 'Tasks', id: 'tasks' },
    { icon: Calendar, label: 'Calendar', id: 'calendar' },
    { icon: Brain, label: 'Memory & Context', id: 'memory' },
    { icon: Film, label: 'Studio (4K/8K/16K)', id: 'animate-video' },
    { icon: BookOpen, label: 'Knowledge', id: 'knowledge' },
    { icon: Link, label: 'Integrations', id: 'integrations' },
    { icon: Bell, label: 'Proactive Intelligence', id: 'proactive' },
];

export default function MainLayout({ children, onNavigate, currentPage, onNewChat }: LayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const SidebarContent = () => (
    <>
        <div 
          onClick={() => onNavigate?.('matters')}
          className="text-xl font-bold mb-8 flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
        >
            <Zap className="text-indigo-400" /> LUMINO OS
        </div>
        <button 
          onClick={() => {
            if (onNewChat) {
              onNewChat();
            } else {
              onNavigate?.('chat');
            }
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-2.5 rounded-xl mb-6 transition w-full font-medium text-sm shadow-md shadow-indigo-600/20"
        >
            <Plus size={18} /> {isSidebarOpen && "New Chat"}
        </button>
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
            {NavItems.map(item => {
                const isActive = currentPage === item.id;
                return (
                    <button 
                      key={item.id} 
                      onClick={() => onNavigate?.(item.id)} 
                      className={`flex items-center gap-3 p-2 rounded-lg transition w-full text-sm font-medium ${
                        isActive 
                          ? 'bg-neutral-800 text-white font-semibold' 
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                      }`}
                    >
                        <item.icon size={20} className={isActive ? 'text-white' : 'text-neutral-400'} /> 
                        {isSidebarOpen && item.label}
                    </button>
                );
            })}
        </nav>
        <div className="mt-auto border-t border-neutral-800 pt-4 space-y-1.5">
            <button 
              onClick={() => onNavigate?.('profile')} 
              className={`flex items-center gap-3 p-2.5 w-full rounded-lg transition text-sm font-medium ${
                currentPage === 'profile'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <User size={20} /> 
              {isSidebarOpen && <span>Profile</span>}
            </button>
            <button 
              onClick={() => onNavigate?.('logout')} 
              className={`flex items-center gap-3 p-2.5 w-full rounded-lg transition text-sm font-medium ${
                currentPage === 'logout'
                  ? 'bg-red-500/20 text-red-400 font-semibold'
                  : 'text-neutral-400 hover:bg-red-500/10 hover:text-red-400'
              }`}
            >
              <LogOut size={20} /> 
              {isSidebarOpen && <span>Logout</span>}
            </button>
        </div>
    </>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col border-r border-neutral-800 p-4 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <SidebarContent />
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="mt-4 text-xs text-neutral-500 hover:text-neutral-400">Toggle</button>
      </aside>

      {/* Drawer - Mobile */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setMobileDrawerOpen(false)}>
          <div className="w-64 h-full bg-neutral-950 border-r border-neutral-800 p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="text-xl font-bold">LUMINO</div>
              <button onClick={() => setMobileDrawerOpen(false)}><X /></button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-neutral-800 flex items-center px-4 md:hidden justify-between">
          <button onClick={() => setMobileDrawerOpen(true)}><Menu /></button>
          <div className="font-bold cursor-pointer" onClick={() => onNavigate?.('chat')}>LUMINO</div>
          <button onClick={() => onNavigate?.('profile')} aria-label="Profile"><User /></button>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
