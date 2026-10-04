import React from 'react';
import { motion } from 'framer-motion';

const CinematicDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Top Bar Contract: 3 zones */}
      <header className="flex justify-between items-center mb-16 border-b border-white/10 pb-6">
        {/* Zone 1: Brand title */}
        <h1 className="text-3xl font-bold tracking-tighter text-white">LUMINO</h1>

        {/* Zone 2: Navigation */}
        <nav className="flex gap-12 text-xs font-semibold text-white/60 uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">OS</a>
          <a href="#" className="hover:text-white transition-colors">Agents</a>
          <a href="#" className="hover:text-white transition-colors">Data</a>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex gap-3">
          <button className="px-5 py-2 text-xs font-bold text-black bg-white uppercase tracking-widest hover:bg-gray-200 transition-colors">
            Init Engine
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main 3D Perspective Container */}
        <motion.section
          className="md:col-span-3 border border-white/10 p-10 bg-white/5 shadow-2xl"
          style={{ transformStyle: 'preserve-3d' }}
          whileHover={{ rotateY: 5, rotateX: 2 }}
          transition={{ type: 'spring', stiffness: 40 }}
        >
          <h2 className="text-xs font-bold text-white/50 mb-12 uppercase tracking-widest">Intelligence Hub</h2>
          <div className="h-96 flex flex-col items-start justify-end border border-white/10 bg-black p-8">
            <motion.div
               className="text-7xl font-bold tracking-tighter leading-none"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            >
              LUMINO<br/>
              AI
            </motion.div>
          </div>
        </motion.section>

        {/* Sidebar */}
        <motion.section
          className="border border-white/10 p-10 bg-white/5"
          whileHover={{ rotateY: -5, rotateX: 2 }}
          transition={{ type: 'spring', stiffness: 40 }}
        >
          <h2 className="text-xs font-bold text-white/50 mb-12 uppercase tracking-widest">Workflows</h2>
          <div className="space-y-8">
            <div className="text-sm font-medium border-b border-white/10 pb-4">Project Sync</div>
            <div className="text-sm font-medium border-b border-white/10 pb-4">Research Agent</div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default CinematicDashboard;
