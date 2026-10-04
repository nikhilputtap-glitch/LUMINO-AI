import React, { useState, useRef, useEffect } from 'react';
import MainLayout from './layout/MainLayout';
import { authFetch } from '../lib/apiClient';
import { 
  Film, 
  Upload, 
  Sparkles, 
  Play, 
  Pause, 
  Download, 
  RefreshCw, 
  Sliders, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Clock, 
  Video, 
  Layers, 
  Maximize2, 
  X, 
  ChevronRight, 
  Wand2,
  Tv,
  Smartphone
} from 'lucide-react';

interface GeneratedVideoItem {
  id: string;
  sourceImage: string;
  videoUrl: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  createdAt: string;
}

const MOTION_PRESETS = [
  { label: 'Cinematic Push-in', prompt: 'Cinematic camera slowly pushes forward with rich atmospheric depth and subtle parallax motion.' },
  { label: 'Gentle Breeze', prompt: 'Gentle natural breeze rustling leaves and fabric with warm golden hour sunlight illumination.' },
  { label: 'Dynamic Action', prompt: 'Dynamic, high-energy camera pan with realistic motion blur and cinematic lighting.' },
  { label: 'Dreamy Floating', prompt: 'Subtle, dreamy slow-motion drift with soft ambient particle glows and smooth depth of field.' }
];

const SAMPLE_PHOTOS = [
  {
    title: 'Alpine Vista',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    prompt: 'Cinematic camera gliding over mountain peaks with morning mist rising slowly.'
  },
  {
    title: 'Cyber City',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    prompt: 'Hyper-lapse neon city traffic with reflections on wet pavement and moving billboards.'
  },
  {
    title: 'Studio Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    prompt: 'Subtle character breathing, soft wind catching hair, and expressive cinematic eye movement.'
  }
];

export default function AnimateVideo({ onNavigate }: { onNavigate: (id: string) => void }) {
  // Input states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('Cinematic camera push-in with realistic depth and smooth movement');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [quality, setQuality] = useState<'4K' | '8K' | '16K'>('4K');

  // Daily quota states (5 videos daily limit)
  const [quota, setQuota] = useState<{
    date: string;
    picsUsed: number;
    picsLimit: number;
    videosUsed: number;
    videosLimit: number;
    picsRemaining: number;
    videosRemaining: number;
    resetAt: string;
  } | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Generation status states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusStep, setStatusStep] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result states
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('lumino_veo_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch daily quota
  const fetchQuota = async () => {
    try {
      const res = await authFetch('/api/quota');
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
        if (data.videosRemaining <= 0 || data.videosUsed >= data.videosLimit) {
          setIsLimitReached(true);
        } else {
          setIsLimitReached(false);
        }
      }
    } catch (e) {
      console.error("Failed to load quota:", e);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lumino_veo_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setImageFileName(file.name);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Load sample image
  const loadSample = async (sample: typeof SAMPLE_PHOTOS[0]) => {
    try {
      setErrorMessage(null);
      setImageFileName(sample.title);
      setPrompt(sample.prompt);

      // Fetch sample and convert to base64
      const res = await fetch(sample.url);
      const blob = await res.blob();
      setMimeType(blob.type || 'image/jpeg');

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch {
      setErrorMessage('Failed to load sample photo. You can upload any photo from your computer.');
    }
  };

  // Rotating reassuring messages for user reassurance as recommended in skill
  const REASSURING_MESSAGES = [
    'Analyzing image composition and depth geometry...',
    'Synthesizing cinematic 3D motion with Veo 3.1...',
    'Rendering realistic lighting, textures, and fluid physics...',
    'Encoding high-definition frames into smooth video...',
    'Finalizing video stream and preparing MP4 download...'
  ];

  // Start Video Generation
  const handleGenerate = async () => {
    if (!selectedImage) {
      setErrorMessage('Please upload or select a photo first.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setCurrentVideoUrl(null);
    setElapsedSeconds(0);
    setStatusStep(0);
    setStatusMessage(REASSURING_MESSAGES[0]);

    // Timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(secs);
      // Change reassuring message every 12 seconds
      const msgIndex = Math.min(Math.floor(secs / 12), REASSURING_MESSAGES.length - 1);
      setStatusStep(msgIndex);
      setStatusMessage(REASSURING_MESSAGES[msgIndex]);
    }, 1000);

    try {
      // Step 1: Start video generation with Veo
      const genRes = await authFetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          prompt,
          aspectRatio,
          quality,
          model: 'lumino-6.7omg'
        }),
      });

      if (!genRes.ok) {
        const errData = await genRes.json().catch(() => ({}));
        if (errData.code === 'LIMIT_REACHED' || genRes.status === 429) {
          setIsLimitReached(true);
          if (errData.quota) setQuota(errData.quota);
        }
        throw new Error(errData.error || 'Failed to start Veo video generation');
      }

      const resData = await genRes.json();
      if (resData.quota) {
        setQuota(resData.quota);
        if (resData.quota.videosRemaining <= 0) {
          setIsLimitReached(true);
        }
      }
      const { operationName } = resData;
      if (!operationName) throw new Error('No operation name received from Veo service');

      // Step 2: Poll operation status every 5 seconds
      const pollStatus = async () => {
        try {
          const statusRes = await authFetch('/api/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName }),
          });

          if (!statusRes.ok) {
            throw new Error('Failed to query generation status');
          }

          const statusData = await statusRes.json();

          if (statusData.error) {
            throw new Error(statusData.error.message || 'Veo video generation encountered an error');
          }

          if (statusData.done) {
            // Step 3: Generation complete! Fetch the video MP4
            setStatusMessage('Generation complete! Downloading your animated video...');
            clearInterval(pollingRef.current!);
            clearInterval(timerRef.current!);

            const downloadRes = await authFetch('/api/video-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName }),
            });

            if (!downloadRes.ok) {
              throw new Error('Failed to download completed video stream');
            }

            const videoBlob = await downloadRes.blob();
            const videoObjectUrl = URL.createObjectURL(videoBlob);

            setCurrentVideoUrl(videoObjectUrl);
            setIsGenerating(false);

            // Add to history
            const newItem: GeneratedVideoItem = {
              id: `veo-${Date.now()}`,
              sourceImage: selectedImage,
              videoUrl: videoObjectUrl,
              prompt,
              aspectRatio,
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setHistory(prev => [newItem, ...prev.slice(0, 9)]);
          }
        } catch (pollErr: any) {
          console.error(pollErr);
          clearInterval(pollingRef.current!);
          clearInterval(timerRef.current!);
          setIsGenerating(false);
          setErrorMessage(pollErr?.message || 'Video generation failed');
        }
      };

      // Initial check after 4s, then poll every 5s
      pollingRef.current = setInterval(pollStatus, 5000);
    } catch (err: any) {
      clearInterval(timerRef.current!);
      setIsGenerating(false);
      setErrorMessage(err?.message || 'Failed to generate video');
    }
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <MainLayout onNavigate={onNavigate} currentPage="animate-video">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-indigo-950/40 to-neutral-900 border border-indigo-500/20 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Film size={20} />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Animate Images into Video
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm">
                lumino-6.7omg Flagship
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                4K • 8K • 16K Ultra HD
              </span>
            </div>
            <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Upload any static photo and transform it into a fluid, cinematic video in 4K, 8K, or 16K master quality using Google's Veo video engine.
            </p>
          </div>

          {/* Quota Tracker Pills */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs shrink-0">
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition ${
              isLimitReached || (quota && quota.videosRemaining <= 0)
                ? 'bg-red-950/50 border-red-500/40 text-red-300'
                : 'bg-indigo-950/50 border-indigo-500/30 text-indigo-200'
            }`}>
              <Film size={14} className={isLimitReached || (quota && quota.videosRemaining <= 0) ? 'text-red-400' : 'text-indigo-400'} />
              <span>
                Daily Videos: <strong>{quota ? quota.videosRemaining : 5} / 5</strong>
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl border bg-neutral-900/80 border-neutral-800 text-neutral-300 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" />
              <span>
                Daily Pics: <strong>{quota ? quota.picsRemaining : 10} / 10</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* WARNING BANNER: DAILY GENERATION LIMIT REACHED */}
        {/* ========================================================================= */}
        {(isLimitReached || (quota && quota.videosRemaining <= 0)) && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/80 via-red-950/60 to-neutral-950 border-2 border-amber-500/60 text-amber-200 shadow-2xl shadow-amber-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/40 shadow-inner">
                <AlertTriangle size={26} className="animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-extrabold text-white text-base tracking-wide flex items-center gap-2">
                    Daily Generation Limit Reached (5/5 Videos Used)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/40">
                    0 Videos Remaining Today
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-medium border border-indigo-500/30">
                    lumino-6.7omg
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed max-w-2xl">
                  You have utilized all <strong>5 daily video generations</strong> in 4K/8K/16K quality on model <code className="text-white font-mono bg-amber-950/90 px-1 py-0.5 rounded border border-amber-500/30">lumino-6.7omg</code>. Your daily quota automatically resets at midnight UTC (00:00 UTC).
                </p>
                <div className="flex items-center gap-4 text-xs text-amber-300/90 pt-1 flex-wrap">
                  <span className="flex items-center gap-1.5 font-mono bg-neutral-900/90 px-2.5 py-1 rounded-lg border border-neutral-800">
                    <Clock size={13} className="text-amber-400" />
                    <span>Quota Resets: <strong className="text-white">Midnight UTC</strong></span>
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span>All your previously generated videos remain saved and downloadable below! 🎬</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={fetchQuota}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-900/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 hover:text-white rounded-xl text-xs font-semibold transition shadow-md w-full md:w-auto cursor-pointer"
                title="Refresh Quota Status"
              >
                <RefreshCw size={14} />
                <span>Refresh Status</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-start gap-3 shadow-md animate-in fade-in">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Generation Error</span>
              <p className="text-xs text-red-300 mt-0.5">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:text-white rounded">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Main Creation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload & Aspect Ratio & Prompt Config */}
          <div className="lg:col-span-6 space-y-5">
            {/* Photo Upload Card */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon size={16} className="text-indigo-400" />
                  1. Upload Your Photo
                </span>
                {selectedImage && (
                  <button 
                    onClick={() => {
                      setSelectedImage(null);
                      setImageFileName('');
                    }}
                    className="text-xs text-neutral-400 hover:text-red-400 transition"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Upload Dropzone */}
              {!selectedImage ? (
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-700 hover:border-indigo-500/60 rounded-xl p-8 text-center cursor-pointer transition bg-neutral-950/50 hover:bg-neutral-950/80 group space-y-3"
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/png,image/jpeg,image/webp,image/jpg" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-105 flex items-center justify-center mx-auto transition">
                    <Upload size={22} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white group-hover:text-indigo-300 block">
                      Click to upload photo or drag & drop
                    </span>
                    <span className="text-xs text-neutral-400 mt-1 block">
                      PNG, JPG, or WEBP (Max 50MB)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 group">
                  <img 
                    src={selectedImage} 
                    alt="Source Preview" 
                    className="w-full h-56 object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                    <span className="text-xs font-medium text-white truncate max-w-[200px]">
                      {imageFileName || 'Selected Photo'}
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-white rounded-lg text-xs font-semibold shadow-md transition"
                    >
                      Change Photo
                    </button>
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/png,image/jpeg,image/webp,image/jpg" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </div>
              )}

              {/* Sample Photos for 1-Click Testing */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-neutral-400 block">Or test with a sample photo:</span>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_PHOTOS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadSample(sample)}
                      className="group relative rounded-lg overflow-hidden border border-neutral-800 hover:border-indigo-500/80 transition text-left h-16"
                    >
                      <img src={sample.url} alt={sample.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition flex items-end p-1.5">
                        <span className="text-[10px] font-bold text-white truncate">{sample.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Aspect Ratio Selector (16:9 Landscape vs 9:16 Portrait) */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders size={16} className="text-indigo-400" />
                  2. Choose Aspect Ratio
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {aspectRatio === '16:9' ? 'Landscape' : 'Portrait'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 16:9 Landscape Option */}
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                    aspectRatio === '16:9'
                      ? 'bg-indigo-950/40 border-indigo-500 text-white ring-2 ring-indigo-500/20'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <div className="w-10 h-7 rounded-md border-2 border-current flex items-center justify-center shrink-0">
                    <Tv size={14} />
                  </div>
                  <div>
                    <span className="text-sm font-bold block text-white">16:9 Landscape</span>
                    <span className="text-[11px] text-neutral-400 block">Wide, YouTube, Desktop</span>
                  </div>
                </button>

                {/* 9:16 Portrait Option */}
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                    aspectRatio === '9:16'
                      ? 'bg-indigo-950/40 border-indigo-500 text-white ring-2 ring-indigo-500/20'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <div className="w-7 h-10 rounded-md border-2 border-current flex items-center justify-center shrink-0">
                    <Smartphone size={14} />
                  </div>
                  <div>
                    <span className="text-sm font-bold block text-white">9:16 Portrait</span>
                    <span className="text-[11px] text-neutral-400 block">Vertical, Reels, Shorts</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Quality & Resolution Selector (4K, 8K, 16K) */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" />
                  3. Select Master Quality
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {quality} Cinema
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {(['4K', '8K', '16K'] as const).map((q) => {
                  const isSelected = quality === q;
                  const label = q === '4K' ? '4K Ultra HD' : q === '8K' ? '8K Super UHD' : '16K Extreme';
                  const res = q === '4K' ? '3840×2160' : q === '8K' ? '7680×4320' : '15360×8640';
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/40'
                          : 'border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/60 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span className="font-extrabold text-xs tracking-wider">{q}</span>
                      <span className="text-[10px] opacity-75 font-mono">{res}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt & Motion Configuration */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Wand2 size={16} className="text-indigo-400" />
                  4. Cinematic Motion Prompt
                </span>
                <span className="text-xs text-neutral-400">Optional</span>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="Describe how the camera should move or how elements should animate..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition resize-none"
              />

              {/* Preset chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {MOTION_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(p.prompt)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-[11px] text-neutral-300 hover:text-white transition"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>

              {/* Generate Action Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedImage || isLimitReached || (quota ? quota.videosRemaining <= 0 : false)}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg mt-2 cursor-pointer ${
                  isLimitReached || (quota && quota.videosRemaining <= 0)
                    ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300 cursor-not-allowed shadow-none'
                    : isGenerating || !selectedImage
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-indigo-600/30'
                }`}
              >
                {isLimitReached || (quota && quota.videosRemaining <= 0) ? (
                  <>
                    <AlertTriangle size={16} className="text-amber-400" />
                    <span>Daily Limit Reached (0/5 Remaining) • Resets Midnight UTC</span>
                  </>
                ) : isGenerating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-white" />
                    <span>Rendering with Veo in {quality} ({elapsedSeconds}s)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate {quality} Video with Veo ({aspectRatio})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Video Preview, Reassuring Loading, & Export */}
          <div className="lg:col-span-6 space-y-5">
            {/* Generated Video Player Card */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Video size={16} className="text-indigo-400" />
                  Veo Video Output
                </span>
                {currentVideoUrl && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Ready
                  </span>
                )}
              </div>

              {/* Display Area: Video, Loading State, or Empty Placeholder */}
              <div className={`relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center min-h-[300px] ${
                aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[460px] mx-auto' : 'aspect-video'
              }`}>
                {isGenerating ? (
                  /* Reassuring Loading Screen */
                  <div className="p-6 text-center space-y-4 max-w-sm">
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                      <Film size={24} className="text-indigo-400 animate-pulse" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-sm font-bold text-white block">
                        Generating Video with Veo
                      </span>
                      <p className="text-xs text-indigo-300 font-medium">
                        {statusMessage}
                      </p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex justify-center gap-1.5 pt-2">
                      {REASSURING_MESSAGES.map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            i <= statusStep ? 'bg-indigo-500 scale-110' : 'bg-neutral-800'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-center gap-2">
                      <Clock size={12} className="text-neutral-400" />
                      <span>Elapsed time: {elapsedSeconds}s</span>
                    </div>

                    <span className="text-[10px] text-neutral-500 block">
                      Video generation creates fluid multi-frame sequences and usually takes about 1-2 minutes.
                    </span>
                  </div>
                ) : currentVideoUrl ? (
                  /* Completed Video Player */
                  <div className="w-full h-full flex flex-col justify-center items-center relative group">
                    <video
                      ref={videoRef}
                      src={currentVideoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                  </div>
                ) : (
                  /* Idle / Empty Placeholder */
                  <div className="p-8 text-center space-y-3 text-neutral-500">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                      <Film size={26} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-neutral-300 block">No video generated yet</span>
                      <span className="text-xs text-neutral-500 mt-1 block">
                        Upload a photo and click "Generate Video with Veo" to animate it.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons for Completed Video */}
              {currentVideoUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <a
                    href={currentVideoUrl}
                    download={`lumino-veo-${Date.now()}.mp4`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download MP4 Video</span>
                  </a>

                  <button
                    onClick={() => {
                      setCurrentVideoUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="flex items-center gap-1.5 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold border border-neutral-700 transition cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>Animate Another</span>
                  </button>
                </div>
              )}
            </div>

            {/* Recent Generations Gallery */}
            {history.length > 0 && (
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <Clock size={13} className="text-indigo-400" />
                    Recent Video Animations ({history.length})
                  </span>
                  <button
                    onClick={() => setHistory([])}
                    className="text-[11px] text-neutral-500 hover:text-red-400 transition"
                  >
                    Clear History
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => setCurrentVideoUrl(item.videoUrl)}
                      className="group relative rounded-xl overflow-hidden border border-neutral-800 hover:border-indigo-500/80 cursor-pointer bg-neutral-950 text-left transition"
                    >
                      <img 
                        src={item.sourceImage} 
                        alt="Source" 
                        className="w-full h-24 object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-black/70 border border-white/30 flex items-center justify-center text-white group-hover:scale-110 transition shadow-lg">
                          <Play size={13} className="fill-current ml-0.5" />
                        </div>
                      </div>
                      <div className="p-2 bg-neutral-950/90 text-[10px] space-y-0.5">
                        <div className="flex justify-between items-center text-neutral-400">
                          <span className="font-mono text-indigo-400 font-bold">{item.aspectRatio}</span>
                          <span>{item.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
