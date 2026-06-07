import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Power, Activity, ShieldAlert, Volume2, VolumeX, CheckCircle } from 'lucide-react';
import api from '../services/api';

const NeuralOverride = () => {
  const navigate = useNavigate();
  
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [activeLogId, setActiveLogId] = useState(null);
  
  const audioCtxRef = useRef(null);
  const leftOscRef = useRef(null);
  const rightOscRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const masterGainRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Stop everything on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Format time (HH:MM:SS)
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const createBrownNoise = (audioCtx) => {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate gain
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    return noise;
  };

  const initAudio = () => {
    if (audioCtxRef.current) return;
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    masterGainRef.current = ctx.createGain();
    masterGainRef.current.gain.value = 0.5; // Main volume
    masterGainRef.current.connect(ctx.destination);

    // Left Ear (432 Hz - Healing/Calm baseline)
    const leftOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.setValueAtTime(432, ctx.currentTime);
    const leftPanner = ctx.createStereoPanner();
    leftPanner.pan.value = -1; // Hard left
    leftOsc.connect(leftPanner);
    leftPanner.connect(masterGainRef.current);
    leftOscRef.current = leftOsc;

    // Right Ear (440 Hz - 8Hz difference creates Alpha/Theta state)
    const rightOsc = ctx.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.setValueAtTime(440, ctx.currentTime);
    const rightPanner = ctx.createStereoPanner();
    rightPanner.pan.value = 1; // Hard right
    rightOsc.connect(rightPanner);
    rightPanner.connect(masterGainRef.current);
    rightOscRef.current = rightOsc;

    // Brown Noise for isolation
    const noise = createBrownNoise(ctx);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 400; // Deep rumble
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.15; // Subtle
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGainRef.current);
    noiseNodeRef.current = noise;

    leftOsc.start();
    rightOsc.start();
    noise.start();
  };

  const stopAudio = () => {
    if (leftOscRef.current) {
      leftOscRef.current.stop();
      leftOscRef.current.disconnect();
      leftOscRef.current = null;
    }
    if (rightOscRef.current) {
      rightOscRef.current.stop();
      rightOscRef.current.disconnect();
      rightOscRef.current = null;
    }
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current.disconnect();
      noiseNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const toggleAudio = () => {
    if (audioEnabled) {
      stopAudio();
      setAudioEnabled(false);
    } else {
      initAudio();
      setAudioEnabled(true);
    }
  };

  const startOverride = async () => {
    try {
      // Start backend timer
      const res = await api.tracker.startTimer({ 
        activityType: 'personal_study', 
        description: '[NEURAL OVERRIDE PROTOCOL]' 
      });
      setActiveLogId(res.data?._id || res.data?.id);
      
      setIsActive(true);
      setElapsedSeconds(0);
      
      // Auto-start audio
      initAudio();
      setAudioEnabled(true);

      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to initiate neural override", err);
      alert("Failed to initiate sequence. Check matrix connection.");
    }
  };

  const abortOverride = async () => {
    try {
      if (activeLogId) {
        await api.tracker.stopTimer(activeLogId);
      }
    } catch (err) {
      console.error("Failed to stop backend timer", err);
    }
    
    setIsActive(false);
    stopAudio();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    navigate('/'); // Return to dashboard
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center overflow-hidden font-display">
      {/* Absolute Black Background + Subtle Cyan Radar Pulse if Active */}
      {isActive && (
        <>
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <div className="w-[800px] h-[800px] rounded-full border border-cyan-500/20 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute w-[600px] h-[600px] rounded-full border border-cyan-500/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute w-[400px] h-[400px] rounded-full border border-cyan-500/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
          </div>
          <div className="absolute top-0 w-full h-1 bg-cyan-500/50 shadow-[0_0_20px_#06b6d4] animate-pulse" />
        </>
      )}

      {/* Top Status Bar */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <Activity className={`h-6 w-6 ${isActive ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
        <span className={`text-sm font-black tracking-widest uppercase ${isActive ? 'text-cyan-400' : 'text-slate-600'}`}>
          DEEP FLOW : {isActive ? 'ENGAGED' : 'STANDBY'}
        </span>
      </div>

      <div className="absolute top-8 right-8">
        {isActive && (
          <button 
            onClick={toggleAudio}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              audioEnabled 
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'bg-transparent border-white/10 text-slate-500 hover:text-white'
            }`}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {audioEnabled ? 'Abyssal Frequencies : ON' : 'Abyssal Frequencies : OFF'}
            </span>
          </button>
        )}
      </div>

      {/* Main HUD */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {!isActive ? (
          <div className="max-w-xl p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md text-center">
            <Power className="h-16 w-16 text-cyan-500 mx-auto mb-6 opacity-80" />
            <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-4 shadow-cyan-500/50 drop-shadow-lg">
              Neural Override Protocol
            </h1>
            <p className="text-sm text-slate-400 font-semibold mb-8 leading-relaxed max-w-md mx-auto">
              Initiating this sequence will isolate you from the standard matrix. 
              All distractions will be purged. An 8Hz Alpha/Theta binaural frequency 
              will be synthesized to forcibly induce a deep cognitive flow state.
            </p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-black tracking-widest uppercase transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={startOverride}
                className="px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black border border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.6)] text-xs font-black tracking-widest uppercase transition-all hover:scale-105"
              >
                ENGAGE OVERRIDE
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in flex flex-col items-center">
            <h2 className="text-[200px] leading-none font-black text-white tracking-wider tabular-nums drop-shadow-[0_0_40px_rgba(6,182,212,0.4)]">
              {formatTime(elapsedSeconds)}
            </h2>
            
            <div className="mt-8 flex items-center gap-3 px-6 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-400 text-sm font-bold tracking-widest uppercase">
                Target: Absolute Focus
              </span>
            </div>

            <button 
              onClick={abortOverride}
              className="mt-24 flex items-center gap-2 px-8 py-4 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-xs font-black tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <ShieldAlert className="h-4 w-4" />
              DISENGAGE & SAVE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeuralOverride;
