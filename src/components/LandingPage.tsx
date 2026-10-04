import React from 'react';
import { motion } from 'motion/react';

export default function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-black text-white px-8 py-16 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="max-w-5xl w-full"
      >
        {/* Cinematic Header */}
        <header className="flex justify-between items-center mb-32">
            <h1 className="text-4xl font-bold tracking-tighter">LUMINO</h1>
            <div className="flex gap-8 text-xs font-semibold uppercase tracking-widest text-white/50">
                <a href="#" className="hover:text-white transition-colors">Core</a>
                <a href="#" className="hover:text-white transition-colors">OS</a>
                <a href="#" className="hover:text-white transition-colors">Actions</a>
            </div>
        </header>

        {/* Hero Section */}
        <section className="mb-32">
            <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-8xl font-bold tracking-tighter leading-none mb-12"
            >
                KNOW WHAT<br/>
                MATTERS.
            </motion.h2>
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-white/60 max-w-lg mb-12"
            >
                Your AI Chief of Staff for turning complex goals into structured action.
            </motion.p>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex gap-6"
            >
                <button onClick={onStart} className="bg-white text-black px-10 py-4 font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-all">
                    Start Engine
                </button>
                <button className="border border-white/20 px-10 py-4 font-bold uppercase tracking-widest text-sm hover:bg-white/10 transition-all">
                    View Systems
                </button>
            </motion.div>
        </section>

        {/* Featured Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="border border-white/10 p-12 bg-white/5 shadow-2xl"
        >
          <h3 className="text-xs font-bold text-white/50 mb-12 uppercase tracking-widest">Active Context</h3>
          <h4 className="text-3xl font-semibold mb-8">🎯 Prepare for tomorrow's interview</h4>
          <div className="text-white/60 space-y-4 mb-10 text-lg">
            <p>• High impact on your main goal</p>
            <p>• Strategic preparation required</p>
          </div>
          <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 text-sm font-bold uppercase tracking-widest transition">
            Initialize Focus
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
