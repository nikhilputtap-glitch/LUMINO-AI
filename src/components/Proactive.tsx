import React, { useState, useEffect } from 'react';
import MainLayout from './layout/MainLayout';
import { personalDataStore } from '../lib/store/PersonalDataStore';
import { Zap, AlertTriangle, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { ProactiveDetectionEngine } from '../lib/proactive';
import { ProactiveEvent } from '../types';

export default function Proactive({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [events, setEvents] = useState<ProactiveEvent[]>([]);

  useEffect(() => {
    const detected = ProactiveDetectionEngine.detectEvents();
    setEvents([...detected]);

    return personalDataStore.subscribe(() => {
      const updated = ProactiveDetectionEngine.detectEvents();
      setEvents([...updated]);
    });
  }, []);

  const criticalEvents = events.filter(e => e.urgency === 'critical');
  const otherEvents = events.filter(e => e.urgency !== 'critical');

  return (
    <MainLayout onNavigate={onNavigate} currentPage="proactive">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Zap className="text-amber-400" /> PROACTIVE INTELLIGENCE
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Event-driven anticipation engine monitoring deadlines, upcoming meetings, and blockers without alert fatigue.
          </p>
        </div>

        {criticalEvents.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
              <AlertTriangle size={15} /> Critical Proactive Alerts
            </h2>
            <div className="space-y-3">
              {criticalEvents.map(event => (
                <EventCard key={event.id} event={event} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
            Detected Context & Recommended Actions
          </h2>
          <div className="space-y-3">
            {otherEvents.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 p-10 rounded-2xl text-center space-y-2">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-white">All systems synchronized.</p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Lumino is actively monitoring tasks, goals, and schedule boundaries. New proactive signals will be presented here as conditions arise.
                </p>
              </div>
            ) : (
              otherEvents.map(event => (
                <EventCard key={event.id} event={event} onNavigate={onNavigate} />
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function EventCard({ event, onNavigate }: { event: ProactiveEvent; onNavigate: (page: string) => void; key?: string }) {
  const isCritical = event.urgency === 'critical';
  return (
    <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-sm ${
      isCritical 
        ? 'bg-red-950/20 border-red-500/40 text-red-200' 
        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
    }`}>
      <div className="flex gap-4 items-start">
        <div className={`p-3 rounded-xl shrink-0 ${
          isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          {isCritical ? <AlertTriangle size={20} /> : <Zap size={20} />}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-base">{event.title}</h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
              {event.type}
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">{event.description}</p>
          {event.recommendedAction && (
            <p className="text-xs text-indigo-300 flex items-center gap-1 font-medium pt-1">
              <Sparkles size={13} /> {event.recommendedAction}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={() => onNavigate('matters')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white transition border border-neutral-700 cursor-pointer"
        >
          View in What Matters Now
        </button>
      </div>
    </div>
  );
}
