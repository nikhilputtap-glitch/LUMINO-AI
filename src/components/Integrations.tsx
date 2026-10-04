import React, { useState } from 'react';
import MainLayout from './layout/MainLayout';
import { Zap, CheckCircle2, Shield, Calendar, Mail, FileText, Database } from 'lucide-react';

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'connected' | 'not_connected';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  icon: string;
}

const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'google-workspace',
    name: 'Google Workspace & Meet',
    category: 'Productivity',
    description: 'Direct calendar synchronization, automated 30-minute meeting briefing schedules.',
    status: 'connected',
    riskLevel: 'MEDIUM',
    icon: 'calendar'
  },
  {
    id: 'firebase-firestore',
    name: 'Firebase Cloud Firestore',
    category: 'Persistent Storage',
    description: 'Zero-trust isolated user document vault for memories, goals, tasks, and audit logs.',
    status: 'connected',
    riskLevel: 'LOW',
    icon: 'database'
  },
  {
    id: 'gemini-api',
    name: 'Google Gemini & Veo 3.1',
    category: 'AI Model Foundation',
    description: 'Multi-model inference for reasoning, vision, code synthesis, and 4K media generation.',
    status: 'connected',
    riskLevel: 'LOW',
    icon: 'zap'
  },
  {
    id: 'telephony-voip',
    name: 'Telephony & Carrier VoIP Trunking',
    category: 'Communications',
    description: 'Outbound carrier calls for voice reminders (Web Audio synthesis active by default).',
    status: 'not_connected',
    riskLevel: 'HIGH',
    icon: 'mail'
  }
];

export default function Integrations({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);

  const toggleConnection = (id: string) => {
    setIntegrations(prev => prev.map(int => {
      if (int.id === id) {
        return { ...int, status: int.status === 'connected' ? 'not_connected' : 'connected' };
      }
      return int;
    }));
  };

  return (
    <MainLayout onNavigate={onNavigate} currentPage="integrations">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Zap className="text-amber-400" /> INTEGRATIONS & TOOL CONNECTORS
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Connect Lumino Agent OS to authenticated external providers, APIs, and cloud services.
          </p>
        </div>

        <div className="space-y-4">
          {integrations.map(integration => {
            const isConnected = integration.status === 'connected';
            return (
              <div 
                key={integration.id} 
                className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-neutral-700 transition"
              >
                <div className="flex gap-4 items-start">
                  <div className="bg-neutral-800/80 p-3 rounded-xl shrink-0 border border-neutral-700/50">
                    <Zap className={isConnected ? 'text-amber-400' : 'text-neutral-500'} size={24}/>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-base">{integration.name}</h3>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                        {integration.category}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        integration.riskLevel === 'HIGH' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        integration.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        Risk: {integration.riskLevel}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">{integration.description}</p>
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      {isConnected ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 size={13} /> Active & Authenticated
                        </span>
                      ) : (
                        <span className="text-neutral-500 font-medium">
                          Unconfigured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => toggleConnection(integration.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm shrink-0 cursor-pointer ${
                    isConnected 
                      ? 'bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700' 
                      : 'bg-white text-neutral-950 hover:bg-neutral-200'
                  }`}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
