import React, { useState, useEffect } from 'react';
import MainLayout from './layout/MainLayout';
import { personalDataStore } from '../lib/store/PersonalDataStore';
import { CalendarEvent } from '../types';
import { Calendar as CalendarIcon, Clock, PhoneCall, Plus, Bell, Trash2, Info, CheckCircle2 } from 'lucide-react';
import { VoiceService } from '../lib/voice';

export default function Calendar({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [events, setEvents] = useState<CalendarEvent[]>(personalDataStore.getCalendarEvents());
  const [showCallAlert, setShowCallAlert] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('16:00');
  const [newDuration, setNewDuration] = useState(60);
  const [newFocusType, setNewFocusType] = useState<CalendarEvent['focusType']>('meeting');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    return personalDataStore.subscribe(() => {
      setEvents(personalDataStore.getCalendarEvents());
    });
  }, []);

  const simulateCall = (title: string, time: string) => {
    setShowCallAlert(`Audio Briefing Call: "${title}" (${time})...`);
    VoiceService.playRingtone();
    setTimeout(() => {
      VoiceService.stopRingtone();
      VoiceService.speak(`Hello! This is Lumino with your 30-minute reminder briefing for your upcoming meeting: ${title} at ${time}. Your notes and agenda are organized. You are all set!`, () => {
        setShowCallAlert(null);
      });
    }, 2000);
  };

  const handleDelete = (eventId: string) => {
    personalDataStore.deleteCalendarEvent(eventId);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const startIso = `${newDate}T${newTime}:00.000Z`;
    const endTime = new Date(new Date(startIso).getTime() + newDuration * 60000).toISOString();

    personalDataStore.addCalendarEvent({
      userId: personalDataStore.getActiveUserId(),
      title: newTitle.trim(),
      description: newDescription.trim() || 'Scheduled strategic session',
      startTime: startIso,
      endTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      focusType: newFocusType,
      status: 'confirmed',
      reminderSettings: 30,
      prepTimeMinutes: 30
    });

    setNewTitle('');
    setNewDescription('');
    setIsAdding(false);
  };

  return (
    <MainLayout onNavigate={onNavigate} currentPage="calendar">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <CalendarIcon className="text-indigo-400" /> CALENDAR & MEETINGS
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Timezone-aware scheduling with 30-minute automated preparation briefings.
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-white text-neutral-950 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-neutral-200 transition shadow-md w-fit cursor-pointer"
          >
            <Plus size={16} /> {isAdding ? 'Cancel' : 'Schedule Event'}
          </button>
        </div>

        {/* Telephony Architecture Status Notice */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-start gap-3 text-xs text-neutral-300 shadow-sm">
          <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white block">Telephony & Voice Architecture</span>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Standard SIP / PSTN carrier trunking is currently unconfigured. In-browser Web Audio synthesis & high-fidelity voice briefings are active for all scheduled calendar events.
            </p>
          </div>
        </div>

        {showCallAlert && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-2 font-medium">
              <PhoneCall size={16} /> {showCallAlert}
            </span>
            <button 
              onClick={() => {
                VoiceService.stopRingtone();
                VoiceService.stopSpeaking();
                setShowCallAlert(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/30 text-emerald-300"
            >
              Stop
            </button>
          </div>
        )}

        {isAdding && (
          <form onSubmit={handleCreate} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-xl animate-in fade-in">
            <h3 className="text-sm font-bold text-white">Schedule Strategic Event</h3>
            <input 
              type="text" 
              placeholder="Event title (e.g. Sprint Architecture Sync)..." 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              autoFocus
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Date</label>
                <input 
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Time</label>
                <input 
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Duration (Mins)</label>
                <input 
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  min={15}
                  step={15}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Focus Type</label>
                <select 
                  value={newFocusType}
                  onChange={(e) => setNewFocusType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="meeting">Meeting</option>
                  <option value="deep_work">Deep Work</option>
                  <option value="prep">Preparation</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
            </div>
            <textarea 
              placeholder="Meeting agenda, prep notes, or location..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                Save Event
              </button>
            </div>
          </form>
        )}

        {events.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 p-12 rounded-3xl text-center space-y-3">
            <CalendarIcon size={40} className="text-neutral-600 mx-auto" />
            <p className="text-lg font-medium text-white">Your calendar is clear.</p>
            <p className="text-sm text-neutral-400 max-w-sm mx-auto">
              Schedule meetings or ask Lumino in Chat to automatically reserve focus time with prep reminders.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-2 text-neutral-300 font-medium">
                <Bell size={15} className="text-amber-400" /> 
                Automated Briefings: 30-minute voice synthesis armed for all scheduled meetings.
              </span>
              <span className="bg-neutral-800 px-2.5 py-1 rounded-full text-[11px] text-neutral-300 font-semibold">
                {events.length} Scheduled
              </span>
            </div>

            {events.map((event) => {
              const start = new Date(event.startTime);
              const timeFormatted = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div 
                  key={event.id} 
                  className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-sm"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-base">{event.title}</h3>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium uppercase">
                        {event.focusType || 'Meeting'}
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                        30m Briefing Active
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 flex items-center gap-2">
                      <Clock size={13} className="text-neutral-500" />
                      <span>{start.toLocaleDateString()} at {timeFormatted}</span>
                      {event.location && (
                        <>
                          <span>•</span>
                          <span>{event.location}</span>
                        </>
                      )}
                    </p>
                    {event.description && (
                      <p className="text-xs text-neutral-400 line-clamp-1">{event.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => simulateCall(event.title, timeFormatted)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                      title="Trigger audio briefing synthesis"
                    >
                      <PhoneCall size={14} />
                      <span>Test Audio Briefing</span>
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                      title="Delete event"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
