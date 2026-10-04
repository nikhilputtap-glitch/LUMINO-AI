import React, { useState, useEffect } from 'react';
import MainLayout from './layout/MainLayout';
import { personalDataStore } from '../lib/store/PersonalDataStore';
import { Upload, Network, FileText, ArrowRight, Share2, Plus } from 'lucide-react';
import { PersonalKnowledgeGraph } from '../types';

export default function Knowledge({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<'graph' | 'docs'>('graph');
  const [knowledgeGraph, setKnowledgeGraph] = useState<PersonalKnowledgeGraph>(personalDataStore.getKnowledgeGraph());
  const [docs, setDocs] = useState([
    { id: 'doc-1', name: 'lumino_agent_architecture_v2.pdf', type: 'PDF', size: 245000, status: 'Indexed in Semantic Store' },
    { id: 'doc-2', name: 'q4_strategic_system_objectives.md', type: 'Markdown', size: 48000, status: 'Indexed in Semantic Store' }
  ]);

  useEffect(() => {
    return personalDataStore.subscribe(() => {
      setKnowledgeGraph(personalDataStore.getKnowledgeGraph());
    });
  }, []);

  return (
    <MainLayout onNavigate={onNavigate} currentPage="knowledge">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Network className="text-indigo-400" /> PERSONAL KNOWLEDGE GRAPH & DOCS
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Multi-entity relationship network connecting goals, projects, skills, tasks, and indexed documents.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('graph')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'graph' 
                  ? 'bg-neutral-800 text-white border border-neutral-700' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Entity Graph
            </button>
            <button 
              onClick={() => setActiveTab('docs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'docs' 
                  ? 'bg-neutral-800 text-white border border-neutral-700' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Document Store
            </button>
          </div>
        </div>

        {activeTab === 'graph' ? (
          <div className="space-y-6">
            {/* Knowledge Graph Card */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Share2 size={16} className="text-indigo-400" />
                  Active Entity Relationship Graph
                </span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono">
                  {knowledgeGraph.nodes.length} Nodes • {knowledgeGraph.edges.length} Edges
                </span>
              </div>

              {/* Entity Node Visual Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {knowledgeGraph.nodes.map(node => (
                  <div key={node.id} className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-indigo-500/50 transition space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                        {node.type}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">#{node.id}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{node.label}</h4>
                    {node.properties && (
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {Object.entries(node.properties).map(([k, v]) => (
                          <span key={k} className="mr-2">{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Relationships Link List */}
              <div className="border-t border-neutral-800 pt-4 space-y-2">
                <span className="text-xs font-semibold text-neutral-400 block">Verified Graph Dependencies:</span>
                <div className="space-y-2">
                  {knowledgeGraph.edges.map(edge => {
                    const sourceNode = knowledgeGraph.nodes.find(n => n.id === edge.source);
                    const targetNode = knowledgeGraph.nodes.find(n => n.id === edge.target);
                    return (
                      <div key={edge.id} className="flex items-center gap-3 text-xs p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-neutral-300">
                        <span className="font-semibold text-white">{sourceNode ? sourceNode.label : edge.source}</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono font-bold">
                          {edge.relation}
                        </span>
                        <ArrowRight size={13} className="text-neutral-500" />
                        <span className="font-semibold text-white">{targetNode ? targetNode.label : edge.target}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-xs text-neutral-300 font-medium">
                Upload text, PDF, and code files to index into vector chunks for the Research Agent.
              </span>
              <button 
                onClick={() => {
                  setDocs(prev => [...prev, {
                    id: `doc-${Date.now()}`,
                    name: `system_research_${Date.now().toString(36)}.txt`,
                    type: 'TXT',
                    size: 18000,
                    status: 'Indexed in Semantic Store'
                  }]);
                }}
                className="bg-white text-neutral-950 px-3.5 py-1.5 rounded-xl font-semibold text-xs hover:bg-neutral-200 transition shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus size={14} /> Add Document
              </button>
            </div>

            <div className="space-y-3">
              {docs.map(file => (
                <div key={file.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{file.name}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {file.type} • {(file.size / 1024).toFixed(1)} KB • <span className="text-emerald-400">{file.status}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
