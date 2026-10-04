/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from './lib/AuthContext';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import HomeDashboard from './components/HomeDashboard';
import Chat from './components/Chat';
import Goals from './components/Goals';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import Memory from './components/Memory';
import Knowledge from './components/Knowledge';
import Integrations from './components/Integrations';
import Proactive from './components/Proactive';
import Profile from './components/Profile';
import AnimateVideo from './components/AnimateVideo';

export default function App() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = React.useState('matters');

  if (!user) {
    if (currentPage === 'login') return <Auth />;
    return <LandingPage onStart={() => setCurrentPage('login')} />;
  }
  
  if (!user.onboarded) return <Onboarding />;
  
  switch(currentPage) {
      case 'matters':
      case 'home':
        return <HomeDashboard onNavigate={setCurrentPage} />;
      case 'animate-video': return <AnimateVideo onNavigate={setCurrentPage} />;
      case 'goals': return <Goals onNavigate={setCurrentPage} />;
      case 'tasks': return <Tasks onNavigate={setCurrentPage} />;
      case 'calendar': return <Calendar onNavigate={setCurrentPage} />;
      case 'memory': return <Memory onNavigate={setCurrentPage} />;
      case 'knowledge': return <Knowledge onNavigate={setCurrentPage} />;
      case 'integrations': return <Integrations onNavigate={setCurrentPage} />;
      case 'proactive': return <Proactive onNavigate={setCurrentPage} />;
      case 'profile': return <Profile onNavigate={setCurrentPage} initialTab="overview" />;
      case 'logout': return <Profile onNavigate={setCurrentPage} initialTab="logout" />;
      case 'chat': return <Chat onNavigate={setCurrentPage} />;
      default: return <HomeDashboard onNavigate={setCurrentPage} />;
  }
}
