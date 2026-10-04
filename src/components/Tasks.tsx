import React, { useState, useEffect } from 'react';
import MainLayout from './layout/MainLayout';
import { personalDataStore } from '../lib/store/PersonalDataStore';
import { Task } from '../types';
import { CheckSquare, Plus, Trash2, Clock, AlertCircle, CheckCircle2, Filter } from 'lucide-react';

export default function Tasks({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [tasks, setTasks] = useState<Task[]>(personalDataStore.getTasks());
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('high');
  const [newDueDate, setNewDueDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [newMinutes, setNewMinutes] = useState(45);

  useEffect(() => {
    return personalDataStore.subscribe(() => {
      setTasks(personalDataStore.getTasks());
    });
  }, []);

  const handleToggle = (task: Task) => {
    const nextStatus: Task['status'] = task.status === 'done' ? 'todo' : 'done';
    personalDataStore.updateTaskStatus(task.id, nextStatus);
  };

  const handleDelete = (taskId: string) => {
    personalDataStore.deleteTask(taskId);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    personalDataStore.addTask({
      userId: personalDataStore.getActiveUserId(),
      title: newTitle.trim(),
      priority: newPriority,
      status: 'todo',
      dueDate: newDueDate,
      estimatedMinutes: newMinutes,
      energyLevel: 'high',
      contextCategory: 'deep-work',
      dependencyIds: []
    });
    setNewTitle('');
    setIsAdding(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  return (
    <MainLayout onNavigate={onNavigate} currentPage="tasks">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <CheckSquare className="text-indigo-400" /> TASKS & ACTION QUEUE
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Context-aware tasks prioritized by energy windows, urgency, and goal alignment.
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-white text-neutral-950 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-neutral-200 transition shadow-md w-fit cursor-pointer"
          >
            <Plus size={16} /> {isAdding ? 'Cancel' : 'New Task'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreate} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-xl animate-in fade-in">
            <h3 className="text-sm font-bold text-white">Create Strategic Task</h3>
            <input 
              type="text" 
              placeholder="Task title..." 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              autoFocus
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Due Date</label>
                <input 
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Est. Duration (Mins)</label>
                <input 
                  type="number"
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(Number(e.target.value))}
                  min={5}
                  step={5}
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
                Save Task
              </button>
            </div>
          </form>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 text-xs overflow-x-auto">
          <Filter size={14} className="text-neutral-500 mr-1" />
          {(['all', 'todo', 'in-progress', 'done'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer capitalize ${
                filter === tab 
                  ? 'bg-neutral-800 text-white border border-neutral-700' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
          <span className="text-neutral-500 ml-auto font-mono text-[11px]">
            {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Task Items */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-center text-neutral-400 text-sm">
              No tasks found in this view.
            </div>
          ) : (
            filteredTasks.map(task => {
              const isDone = task.status === 'done';
              return (
                <div 
                  key={task.id} 
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                    isDone 
                      ? 'bg-neutral-900/40 border-neutral-800/60 opacity-60' 
                      : 'bg-neutral-900 border-neutral-800 shadow-sm hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button 
                      onClick={() => handleToggle(task)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition cursor-pointer shrink-0 ${
                        isDone 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                          : 'border-neutral-700 hover:border-indigo-400'
                      }`}
                    >
                      {isDone && <CheckCircle2 size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold truncate ${isDone ? 'line-through text-neutral-500' : 'text-white'}`}>
                          {task.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                          task.priority === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          task.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          task.priority === 'medium' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          'bg-neutral-800 text-neutral-400'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {task.estimatedMinutes || 30}m
                        </span>
                        <span>•</span>
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        {task.contextCategory && (
                          <>
                            <span>•</span>
                            <span className="text-neutral-500 capitalize">{task.contextCategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => handleDelete(task.id)}
                      className="p-2 text-neutral-500 hover:text-red-400 transition rounded-lg hover:bg-neutral-800"
                      title="Delete task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}
