import React, { useState, useEffect } from 'react';
import MainLayout from './layout/MainLayout';
import { personalDataStore } from '../lib/store/PersonalDataStore';
import { MemoryService } from '../lib/memory';
import { Memory as MemoryType } from '../types';
import { Brain, Plus, Trash2, Search, Sparkles, Filter } from 'lucide-react';

export default function Memory({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [memories, setMemories] = useState<MemoryType[]>(personalDataStore.getMemories());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeScope, setActiveScope] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newScope, setNewScope] = useState<MemoryType['scope']>('long_term');
  const [newImportance, setNewImportance] = useState(8);

  useEffect(() => {
    return personalDataStore.subscribe(() => {
      setMemories(personalDataStore.getMemories());
    });
  }, []);

  const handleDelete = (id: string) => {
    MemoryService.deleteMemory(id);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    MemoryService.createMemory(
      personalDataStore.getActiveUserId(),
      newScope,
      newScope === 'preference' ? 'preference' : 'fact',
      newKey.trim(),
      newValue.trim(),
      'user_explicit',
      newImportance,
      0.95
    );
    setNewKey('');
    setNewValue('');
    setIsAdding(false);
  };

  const filteredMemories = memories.filter(m => {
    if (activeScope !== 'all' && m.scope !== activeScope) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.key.toLowerCase().includes(q) || m.value.toLowerCase().includes(q) || m.scope.toLowerCase().includes(q);
  });

  return (
    <MainLayout onNavigate={onNavigate} currentPage="memory">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Brain className="text-indigo-400" /> ADVANCED MEMORY SYSTEM
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Semantic, episodic, preference, and project memory retrieved dynamically by the Personal Context Engine.
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-white text-neutral-950 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-neutral-200 transition shadow-md w-fit cursor-pointer"
          >
            <Plus size={16} /> {isAdding ? 'Cancel' : 'Teach Lumino'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAdd} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-xl animate-in fade-in">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" /> Store Explicit Memory
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Concept / Key</label>
                <input 
                  type="text" 
                  placeholder="e.g. Preferred Coding Style, Meeting Buffer..." 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Memory Scope</label>
                  <select 
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="preference">Preference</option>
                    <option value="long_term">Long-Term</option>
                    <option value="semantic">Semantic</option>
                    <option value="episodic">Episodic</option>
                    <option value="project">Project</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Importance (1-10)</label>
                  <input 
                    type="number"
                    min={1}
                    max={10}
                    value={newImportance}
                    onChange={(e) => setNewImportance(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Detailed Context & Rules</label>
              <textarea 
                placeholder="What should Lumino remember about this?"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={2}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 resize-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
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
                Store Memory
              </button>
            </div>
          </form>
        )}

        {/* Search & Scope Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3 text-neutral-500" />
            <input 
              type="text"
              placeholder="Search memories semantically..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            {['all', 'preference', 'long_term', 'semantic', 'project'].map(s => (
              <button
                key={s}
                onClick={() => setActiveScope(s)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition cursor-pointer shrink-0 ${
                  activeScope === s 
                    ? 'bg-neutral-800 text-white border border-neutral-700' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Memory Items */}
        {filteredMemories.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 p-12 rounded-3xl text-center space-y-3">
            <Brain size={36} className="text-neutral-600 mx-auto" />
            <p className="text-lg font-medium text-white">No memories found.</p>
            <p className="text-sm text-neutral-400 max-w-sm mx-auto">
              Lumino automatically learns your preferences, working style, and strategic decisions during conversations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMemories.map(memory => (
              <div 
                key={memory.id} 
                className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex items-start justify-between gap-4 hover:border-neutral-700 transition shadow-sm"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{memory.key}</span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium uppercase">
                      {memory.scope}
                    </span>
                    <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-medium">
                      Importance: {memory.importance}/10
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">{memory.value}</p>
                </div>
                <button 
                  onClick={() => handleDelete(memory.id)}
                  className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition shrink-0"
                  title="Delete memory"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
