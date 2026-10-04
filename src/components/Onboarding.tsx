import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

export default function Onboarding() {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950 p-4">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">
          {step === 1 && "What do you want to achieve?"}
          {step === 2 && "What are you working on?"}
          {step === 3 && "What matters most right now?"}
        </h2>
        <textarea className="w-full bg-neutral-800 border border-neutral-700 p-4 rounded-xl mb-6 min-h-[120px]" />
        
        <div className="flex justify-between">
          <button onClick={() => setStep(prev => Math.max(1, prev - 1))} className="text-neutral-500">Back</button>
          {step < 3 ? (
            <button onClick={() => setStep(prev => prev + 1)} className="bg-white text-neutral-950 px-6 py-2 rounded-full font-semibold">Next</button>
          ) : (
            <button onClick={completeOnboarding} className="bg-white text-neutral-950 px-6 py-2 rounded-full font-semibold">Finish</button>
          )}
        </div>
      </div>
    </div>
  );
}
