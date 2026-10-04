import React from 'react';
import HomeDashboard from './HomeDashboard';

export default function MattersNow({ onNavigate }: { onNavigate?: (id: string) => void }) {
  return <HomeDashboard onNavigate={onNavigate || (() => {})} />;
}

