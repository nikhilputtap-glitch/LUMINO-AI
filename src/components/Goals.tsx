import React, { useState, useEffect } from 'react';
import MainLayout from './layout/MainLayout';
import { personalDataStore } from '../lib/store/PersonalDataStore';
import { Goal } from '../types';
import { Target, Plus, Trash2, Calendar, CheckCircle2, ChevronRight, TrendingUp } from 'lucide-react';

export default function Goals({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [goals, setGoals] = useState<Goal[]>(personalDataStore.getGoals());
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<'career' | 'health' | 'learning' | 'startup' | 'financial'>('startup');
  const [newPriority, setNewPriority] = useState<Goal['priority']>('critical');
  const [newDeadline, setNewDeadline] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);

  useEffect(() => {
    return personalDataStore.subscribe(() => {
      setGoals(personalDataStore.getGoals());
    });
  }, []);

  const handleUpdateProgress = (goalId: string, currentProgress: number, delta: number) => {
    const nextVal = Math.min(100, Math.max(0, currentProgress + delta));
    personalDataStore.updateGoalProgress(goalId, nextVal);
  };

  const handleDelete = (goalId: string) => {
    personalDataStore.deleteGoal(goalId);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    personalDataStore.addGoal({
      userId: personalDataStore.getActiveUserId(),
      title: newTitle.trim(),
      description: newDescription.trim() || 'Strategic outcome and milestones defined by user.',
      category: newCategory,
      priority: newPriority,
      status: 'active',
      progress: 10,
      deadline: newDeadline,
      targetOutcome: 'Successful execution of defined milestones.',
      milestones: [
        { id: `m-${Date.now()}-1`, title: 'Define scope and core architecture', completed: true },
        { id: `m-${Date.now()}-2`, title: 'Execute primary milestone deliverables', completed: false }
      ]
    });
    setNewTitle('');
    setNewDescription('');
    setIsAdding(false);
  };

  return (
    <MainLayout onNavigate={onNavigate} currentPage="goals">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Target className="text-indigo-400" /> STRATEGIC GOALS & OKRs
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              High-level vision broken down into actionable projects, milestones, and daily focus.
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-white text-neutral-950 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-neutral-200 transition shadow-md w-fit cursor-pointer"
          >
            <Plus size={16} /> {isAdding ? 'Cancel' : 'New Goal'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreate} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-xl animate-in fade-in">
            <h3 className="text-sm font-bold text-white">Create Strategic Goal</h3>
            <input 
              type="text" 
              placeholder="Goal title (e.g. Deploy Lumino AI Chief of Staff)..." 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              autoFocus
              required
            />
            <textarea 
              placeholder="Target outcome and description..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Category</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="startup">Startup</option>
                  <option value="career">Career</option>
                  <option value="learning">Learning</option>
                  <option value="health">Health</option>
                  <option value="financial">Financial</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Priority</label>
                <select 
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Target Deadline</label>
                <input 
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white"
                />
              </div>
            </div>
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
                Save Goal
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-6">
          {goals.map(goal => (
            <div key={goal.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-lg space-y-4 hover:border-neutral-700 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {goal.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      goal.priority === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      'bg-neutral-800 text-neutral-400'
                    }`}>
                      {goal.priority}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    🎯 {goal.title}
                  </h2>
                  <p className="text-neutral-400 text-sm">{goal.description}</p>
                </div>
                <button 
                  onClick={() => handleDelete(goal.id)}
                  className="p-2 text-neutral-500 hover:text-red-400 transition rounded-lg hover:bg-neutral-800 shrink-0"
                  title="Delete goal"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Progress Bar & Adjustment */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-indigo-400" /> Progress: {goal.progress}%
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <Calendar size={13} /> Target: {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                  <span>Adjust Progress:</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleUpdateProgress(goal.id, goal.progress, -10)}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    >
                      -10%
                    </button>
                    <button 
                      onClick={() => handleUpdateProgress(goal.id, goal.progress, 10)}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    >
                      +10%
                    </button>
                    <button 
                      onClick={() => handleUpdateProgress(goal.id, goal.progress, 100 - goal.progress)}
                      className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              {goal.milestones && goal.milestones.length > 0 && (
                <div className="border-t border-neutral-800/80 pt-3 space-y-1.5">
                  <span className="text-xs font-semibold text-neutral-400 block">Milestones:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {goal.milestones.map(m => (
                      <div key={m.id} className="flex items-center gap-2 text-xs p-2 rounded-xl bg-neutral-950/50 border border-neutral-800/60">
                        <CheckCircle2 size={14} className={m.completed ? 'text-emerald-400' : 'text-neutral-600'} />
                        <span className={m.completed ? 'text-neutral-400 line-through' : 'text-neutral-200'}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
