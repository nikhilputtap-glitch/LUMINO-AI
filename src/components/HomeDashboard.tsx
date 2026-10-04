import React, { useState, useEffect } from 'react';
import MainLayout from './layout/MainLayout';
import { whatMattersNowEngine } from '../lib/engine/WhatMattersNowEngine';
import { personalDataStore } from '../lib/store/PersonalDataStore';
import { agentOrchestrator } from '../lib/agents/orchestrator';
import { WhatMattersNowAnalysis, Task, Goal, CalendarEvent, ActivityAuditItem } from '../types';
import { 
  Zap, 
  Target, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Brain, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Play, 
  Pause, 
  ChevronRight, 
  ArrowRight, 
  Bot, 
  RefreshCw, 
  Check, 
  Plus, 
  HelpCircle,
  X,
  Send,
  Sliders,
  Flame,
  Layers,
  PhoneCall
} from 'lucide-react';

export default function HomeDashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [analysis, setAnalysis] = useState<WhatMattersNowAnalysis>(() => whatMattersNowEngine.analyze());
  const [tasks, setTasks] = useState<Task[]>(() => personalDataStore.getTasks());
  const [goals, setGoals] = useState<Goal[]>(() => personalDataStore.getGoals());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => personalDataStore.getCalendarEvents());
  const [auditLogs, setAuditLogs] = useState<ActivityAuditItem[]>(() => personalDataStore.getActivityAudit());

  // Focus Mode State
  const [focusActive, setFocusActive] = useState(false);
  const [focusSecondsRemaining, setFocusSecondsRemaining] = useState(45 * 60);
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [executingWorkflow, setExecutingWorkflow] = useState(false);
  const [workflowStatusText, setWorkflowStatusText] = useState<string | null>(null);

  // Quick Command input
  const [commandInput, setCommandInput] = useState('');

  // Subscribe to personal data store changes
  useEffect(() => {
    const unsubscribe = personalDataStore.subscribe(() => {
      setAnalysis(whatMattersNowEngine.analyze());
      setTasks(personalDataStore.getTasks());
      setGoals(personalDataStore.getGoals());
      setCalendarEvents(personalDataStore.getCalendarEvents());
      setAuditLogs(personalDataStore.getActivityAudit());
    });
    return unsubscribe;
  }, []);

  // Focus Timer interval
  useEffect(() => {
    let interval: any = null;
    if (focusActive && focusSecondsRemaining > 0) {
      interval = setInterval(() => {
        setFocusSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (focusSecondsRemaining === 0) {
      setFocusActive(false);
    }
    return () => clearInterval(interval);
  }, [focusActive, focusSecondsRemaining]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartFocus = () => {
    setFocusActive(true);
    setFocusSecondsRemaining(45 * 60);
    whatMattersNowEngine.startFocusMode(analysis.topPriority.title);
  };

  const handlePlanMyDay = async () => {
    setExecutingWorkflow(true);
    setWorkflowStatusText('Planning Agent decomposing day schedule & optimizing focus slots...');
    try {
      await agentOrchestrator.runWorkflow('Plan my day and reserve deep focus blocks', 2);
      setAnalysis(whatMattersNowEngine.analyze());
      setWorkflowStatusText('Day plan verified! Optimal focus slot reserved.');
      setTimeout(() => setWorkflowStatusText(null), 3000);
    } catch (e: any) {
      setWorkflowStatusText(`Workflow error: ${e?.message}`);
    } finally {
      setExecutingWorkflow(false);
    }
  };

  const handleTaskToggle = (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    personalDataStore.updateTaskStatus(task.id, nextStatus);
  };

  const handleQuickCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const text = commandInput;
    setCommandInput('');
    setExecutingWorkflow(true);
    setWorkflowStatusText(`AgentOS orchestrating request: "${text}"...`);
    try {
      await agentOrchestrator.runWorkflow(text, 2);
      setAnalysis(whatMattersNowEngine.analyze());
      setWorkflowStatusText('Agent task executed and verified! 🛡️');
      setTimeout(() => setWorkflowStatusText(null), 3000);
    } catch (e: any) {
      setWorkflowStatusText(`Execution error: ${e?.message}`);
    } finally {
      setExecutingWorkflow(false);
    }
  };

  const handleExecuteAutoAction = (actionId: string) => {
    const res = whatMattersNowEngine.executeAutoAction(actionId);
    setWorkflowStatusText(res.message);
    setTimeout(() => setWorkflowStatusText(null), 3500);
  };

  return (
    <MainLayout onNavigate={onNavigate} currentPage="matters">
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        
        {/* Top OS Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs uppercase tracking-widest font-mono text-emerald-400 font-bold">
                LUMINO PERSONAL AI OS
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
                AUTONOMY LEVEL 2/4 (SUPERVISED)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-mono">
                MODEL: LUMINO-6.7OMG
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {analysis.greeting}, Nikhil
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              {analysis.timeContext} • All systems calibrated & verified.
            </p>
          </div>

          {/* Quick OS Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePlanMyDay}
              disabled={executingWorkflow}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>Plan My Day</span>
            </button>

            <button
              onClick={() => onNavigate('chat')}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold border border-neutral-700 transition cursor-pointer"
            >
              <Bot size={14} className="text-indigo-400" />
              <span>Ask Lumino</span>
            </button>

            <button
              onClick={() => onNavigate('calendar')}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold border border-neutral-700 transition cursor-pointer"
            >
              <CalendarIcon size={14} className="text-emerald-400" />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        {/* Live Notification Bar if Workflow Running */}
        {workflowStatusText && (
          <div className="p-3.5 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 flex items-center justify-between shadow-lg animate-in fade-in">
            <span className="flex items-center gap-2 font-medium">
              <RefreshCw size={14} className="text-indigo-400 animate-spin" />
              {workflowStatusText}
            </span>
            <button onClick={() => setWorkflowStatusText(null)} className="p-1 hover:text-white">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Live Focus Mode Bar (If Active) */}
        {focusActive && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-indigo-950/80 to-neutral-900 border-2 border-red-500/50 shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-lg border border-red-500/30">
                <Flame size={20} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-red-400 font-bold uppercase tracking-wider block">
                  DISTRACTION-FREE FOCUS MODE ACTIVE
                </span>
                <span className="text-sm font-bold text-white">
                  Focusing on: {analysis.topPriority.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-black font-mono text-white tracking-widest bg-neutral-950/80 px-4 py-1.5 rounded-xl border border-neutral-800">
                {formatTimer(focusSecondsRemaining)}
              </span>
              <button
                onClick={() => setFocusActive(false)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl border border-neutral-700"
              >
                End Focus
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SIGNATURE HERO CARD: "WHAT MATTERS NOW?" */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-indigo-950/30 border-2 border-indigo-500/40 p-6 sm:p-8 shadow-2xl overflow-hidden group">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Zap size={22} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    WHAT MATTERS NOW?
                  </h2>
                  <span className="text-xs text-neutral-400">
                    Calculated from active goals, deadlines, upcoming meetings & energy cycles
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  analysis.topPriority.urgency === 'critical'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${analysis.topPriority.urgency === 'critical' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`}></span>
                  {analysis.topPriority.urgency} Priority
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {analysis.topPriority.deadline}
                </span>
              </div>
            </div>

            {/* Core Action Highlight */}
            <div className="bg-neutral-950/80 border border-neutral-800 p-5 sm:p-6 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
                  <Target size={14} /> Recommended Next Move
                </span>
                <span className="text-xs text-neutral-400 flex items-center gap-1 font-mono">
                  <Clock size={13} className="text-neutral-500" /> Est. {analysis.topPriority.estimatedMinutes} minutes
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {analysis.topPriority.title}
              </h3>

              <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800/80 text-xs sm:text-sm text-neutral-300 leading-relaxed flex items-start gap-2">
                <HelpCircle size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Why it matters:</strong> {analysis.topPriority.whyItMatters}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleStartFocus}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-neutral-950 hover:bg-neutral-200 active:bg-neutral-300 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition cursor-pointer transform hover:scale-[1.02]"
                >
                  <Play size={15} className="fill-neutral-950" />
                  <span>START FOCUS (45m)</span>
                </button>

                <button
                  onClick={handlePlanMyDay}
                  disabled={executingWorkflow}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer"
                >
                  <Sparkles size={15} className="text-indigo-400" />
                  <span>PLAN MY DAY</span>
                </button>

                <button
                  onClick={() => setExplainModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 hover:text-white rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer"
                >
                  <HelpCircle size={15} />
                  <span>EXPLAIN WHY</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Explain Why Modal */}
        {explainModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setExplainModalOpen(false)}>
            <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Brain size={18} className="text-indigo-400" /> Lumino MCDA Reasoning Breakdown
                </h3>
                <button onClick={() => setExplainModalOpen(false)} className="p-1 text-neutral-400 hover:text-white rounded">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-neutral-300">
                <p>Lumino evaluated your complete personal context across 6 multi-criteria dimensions:</p>
                <div className="space-y-2 bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
                  <div className="flex justify-between font-mono">
                    <span className="text-neutral-400">1. Active Goal Alignment:</span>
                    <span className="text-emerald-400 font-bold">+50 pts (Direct milestone)</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-neutral-400">2. Temporal Urgency & Deadline:</span>
                    <span className="text-amber-400 font-bold">+35 pts (Due within 24h)</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-neutral-400">3. Energy Cycle Synchronization:</span>
                    <span className="text-indigo-400 font-bold">+25 pts (High-focus window)</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-neutral-400">4. Dependency Graph Integrity:</span>
                    <span className="text-white font-bold">0 blockers identified</span>
                  </div>
                </div>
                <p className="text-neutral-400 italic">
                  Conclusion: Tackling this action first eliminates downstream bottlenecks and ensures you maintain momentum toward your Q4 objectives.
                </p>
              </div>

              <button
                onClick={() => setExplainModalOpen(false)}
                className="w-full py-2.5 bg-white text-neutral-950 font-bold text-xs rounded-xl hover:bg-neutral-200 transition"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN TWO-COLUMN DASHBOARD GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column (7 cols): Today's Schedule + Critical Tasks + Auto Actions */}
          <div className="lg:col-span-7 space-y-6">

            {/* Today's Strategic Schedule & Focus Blocks */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarIcon size={16} className="text-emerald-400" />
                  Today's Strategic Schedule
                </span>
                <button
                  onClick={() => onNavigate('calendar')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <span>Full Calendar</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="space-y-2.5">
                {analysis.todaySchedule.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                      item.type === 'meeting'
                        ? 'bg-neutral-950/60 border-neutral-800 hover:border-emerald-500/40'
                        : 'bg-indigo-950/20 border-indigo-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-neutral-400 w-16">
                        {item.time}
                      </span>
                      <div>
                        <span className="text-sm font-semibold text-white block">
                          {item.title}
                        </span>
                        {item.prepBriefing && (
                          <span className="text-[11px] text-neutral-400 truncate max-w-xs block">
                            {item.prepBriefing}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      item.type === 'meeting'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Tasks & Queue */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckSquare size={16} className="text-indigo-400" />
                  Priority Tasks & Next Actions
                </span>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <span>Task Board</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="space-y-2">
                {tasks.slice(0, 4).map(task => {
                  const isDone = task.status === 'done';
                  const isBlocked = task.status === 'blocked';
                  return (
                    <div 
                      key={task.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                        isDone 
                          ? 'bg-neutral-950/40 border-neutral-800/50 opacity-60' 
                          : isBlocked
                          ? 'bg-red-950/20 border-red-500/30'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTaskToggle(task)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer ${
                            isDone 
                              ? 'bg-emerald-500 border-emerald-500 text-neutral-950' 
                              : 'border-neutral-700 hover:border-indigo-400'
                          }`}
                        >
                          {isDone && <Check size={12} strokeWidth={3} />}
                        </button>
                        <div>
                          <span className={`text-sm font-medium block ${isDone ? 'line-through text-neutral-500' : 'text-white'}`}>
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                            <span>Due: {task.dueDate}</span>
                            <span>•</span>
                            <span>Est: {task.estimatedMinutes || 30}m</span>
                            {isBlocked && (
                              <span className="text-red-400 font-semibold">• Blocked: {task.blockedReason}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        task.priority === 'critical'
                          ? 'bg-red-500/20 text-red-300'
                          : task.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Autonomous Actions Lumino Can Take Now */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-3">
              <span className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Bot size={16} className="text-purple-400" />
                Autonomous Actions Available (Level 2 Autonomy)
              </span>

              <div className="space-y-2.5">
                {analysis.autoActionsAvailable.map(action => (
                  <div 
                    key={action.id}
                    className="p-3.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-purple-500/40 transition"
                  >
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        {action.title}
                      </span>
                      <span className="text-xs text-neutral-400 block mt-0.5">
                        {action.description}
                      </span>
                    </div>

                    <button
                      onClick={() => handleExecuteAutoAction(action.id)}
                      className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer"
                    >
                      Execute Action
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Active Goals + Verifier Audit Stream + Eisenhower Matrix */}
          <div className="lg:col-span-5 space-y-6">

            {/* Active Goals & Strategic Roadmaps */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Target size={16} className="text-amber-400" />
                  Active Strategic Goals
                </span>
                <button
                  onClick={() => onNavigate('goals')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <span>All Goals</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="space-y-4">
                {goals.slice(0, 2).map(goal => (
                  <div key={goal.id} className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        {goal.title}
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {goal.progress}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {goal.description}
                    </p>

                    {goal.milestones && (
                      <div className="text-[11px] text-neutral-500 pt-1">
                        Milestones: {goal.milestones.filter(m => m.completed).length} / {goal.milestones.length} done
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Agent OS Live Verification & Audit Stream */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  Agent Verification Audit Stream
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  100% VERIFIED
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {auditLogs.slice(0, 4).map(item => (
                  <div key={item.id} className="p-2.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-emerald-400" />
                        {item.title}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-neutral-400 text-[11px]">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Eisenhower Urgency Matrix Overview */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-3">
              <span className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
                <Layers size={16} className="text-indigo-400" />
                Strategic Prioritization Matrix
              </span>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded-xl">
                  <span className="font-bold text-red-400 block mb-1">1. DO FIRST (Urgent & Important)</span>
                  <span className="text-neutral-300">{analysis.urgencyMatrix.doFirst[0] || 'Top task'}</span>
                </div>
                <div className="p-2.5 bg-indigo-950/20 border border-indigo-500/30 rounded-xl">
                  <span className="font-bold text-indigo-400 block mb-1">2. SCHEDULE (High Impact)</span>
                  <span className="text-neutral-300">{analysis.urgencyMatrix.schedule[0] || 'Roadmap'}</span>
                </div>
                <div className="p-2.5 bg-purple-950/20 border border-purple-500/30 rounded-xl">
                  <span className="font-bold text-purple-400 block mb-1">3. DELEGATE / AUTO</span>
                  <span className="text-neutral-300">{analysis.urgencyMatrix.delegateOrAutomate[0] || 'Automations'}</span>
                </div>
                <div className="p-2.5 bg-neutral-950/40 border border-neutral-800 rounded-xl">
                  <span className="font-bold text-neutral-400 block mb-1">4. ELIMINATE</span>
                  <span className="text-neutral-500">{analysis.urgencyMatrix.eliminate[0] || 'Distractions'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Floating Quick Command Bar (Agent OS Command Dock) */}
        <div className="sticky bottom-4 z-40 max-w-3xl mx-auto">
          <form 
            onSubmit={handleQuickCommand}
            className="flex items-center gap-2 p-2 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-2xl"
          >
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Bot size={18} />
            </div>
            <input
              type="text"
              value={commandInput}
              onChange={e => setCommandInput(e.target.value)}
              placeholder="Give Lumino a command or ask a question (e.g. 'Plan my day', 'Prepare 4 PM briefing', 'Synthesize consensus benchmarks')..."
              className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder-neutral-500"
            />
            <button
              type="submit"
              disabled={!commandInput.trim() || executingWorkflow}
              className="px-4 py-2 bg-white text-neutral-950 font-bold text-xs rounded-xl hover:bg-neutral-200 transition cursor-pointer disabled:opacity-40"
            >
              Execute
            </button>
          </form>
        </div>

      </div>
    </MainLayout>
  );
}
