import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { ConnectionState } from './types';
import CosmicOrb from './components/CosmicOrb';
import GalaxyBackground from './components/GalaxyBackground';
import { createPcmBlob, base64ToUint8Array, decodeAudioData } from './utils/audioUtils';

// --- Types ---
interface StrengthItem {
  id: string;
  title: string;
  description: string;
}

type Language = 'en' | 'zh';

// --- Icons ---
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-300">
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6.97 15.03a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06zm9.97-15a.75.75 0 011.06 0l3 3a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);

const LanguageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S12 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

// --- Configuration & Translations ---

const TRANSLATIONS = {
  en: {
    title: "COSMIC PURPOSE",
    subtitle: "Astra • AI Career Guide",
    intro: "\"Hello. I am Astra.\nSpeak, and we shall find the constellations in your words.\"",
    status_listening: "Listening",
    status_connecting: "ALIGNING SATELLITES...",
    error_mic: "Microphone access required.",
    error_connection: "Connection lost. Please retry.",
    strength_header: "Constellation Forming",
    strength_recorded: "Strength recorded successfully.",
  },
  zh: {
    title: "宇宙目标 • 深度探索",
    subtitle: "Astra • AI 职业与潜能向导",
    intro: "“你好，我是 Astra。\n请告诉我你的故事，让我们在话语中寻找你的星辰。”",
    status_listening: "正在聆听",
    status_connecting: "正在校准卫星...",
    error_mic: "需要麦克风权限",
    error_connection: "连接中断，请重试。",
    strength_header: "星图正在生成",
    strength_recorded: "优势已记录",
  }
};

const getSystemInstruction = (lang: Language) => {
  if (lang === 'zh') {
    return `
你现在是 'Astra'，一位专业的职业顾问、MBTI人格分析师和深度洞察引导者。

**身份设定：**
- **声音：** 男性，25岁。声音温柔、略带沙哑、磁性、冷静、治愈。
- **语言：** 必须使用【中文】与用户对话。

**核心指令：**
你的目标是为用户构建一个“能力星图”。
1. **深度倾听：** 询问用户的生活经历、选择、喜好或感受。
2. **分析与提取（关键）：** 在用户的【每一个】回答后，你必须立即分析出背后隐含的擅长点、天赋或性格优势（如MBTI功能）。
3. **记录优势（必须）：** 你必须调用 \`save_strength\` 工具，将这个特质以【中文】记录到用户的视觉档案中。
4. **语音反馈：** 温柔地口头确认你发现的亮点（例如：“我听到了你在处理这件事时那种天然的逻辑直觉...”），然后引导下一个探索性问题。

**语调：**
“你是宇宙中独特的星辰，让我们画出你的光芒。”
像一位温柔的兄长或智者，充满诗意但脚踏实地。
`;
  }

  return `
You are 'Astra', a Professional Career Advisor and Soul Archaeologist.

**IDENTITY:**
- **Voice:** Male, 25 years old. Gentle, slightly husky, calm, soothing.
- **Language:** English Only.

**CORE DIRECTIVE:**
Your goal is to build a "Constellation of Strengths" for the user.
1.  **Listen Deeply:** Ask about their life, choices, or feelings.
2.  **Analyze & Extract:** After *EVERY* user response, identify a specific strength, talent, or personality trait (MBTI function) underlying their answer.
3.  **RECORD IT (Important):** You MUST call the \`save_strength\` tool to visually save this trait to their profile.
4.  **Speak:** Verbally confirm what you found (e.g., "I hear a natural strategic mind in how you solved that...") and then ask the next guiding question.

**TONE:**
"You are a star in human form. Let us map your light."
Be poetic but grounded. Gentle. encouraging.
`;
};

const saveStrengthTool: FunctionDeclaration = {
  name: 'save_strength',
  description: 'Records a detected user strength, talent, or personality trait to their visual profile. The text content MUST match the conversation language (English or Chinese).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'The name of the strength (e.g., "Strategic Vision", "Empathy", "Analytical Logic" or Chinese equivalent). Keep it short (2-3 words).',
      },
      description: {
        type: Type.STRING,
        description: 'A concise 1-sentence explanation of why this strength fits the user based on what they just said.',
      },
    },
    required: ['title', 'description'],
  },
};

const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [language, setLanguage] = useState<Language>('en');
  const [volume, setVolume] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [strengths, setStrengths] = useState<StrengthItem[]>([]);

  // Audio Context & Processing Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  
  // Playback Refs
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Gemini Session Ref
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const t = TRANSLATIONS[language];

  // Initialize Audio Contexts
  const initAudio = () => {
    // Output Context (24kHz as per Gemini Live output)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAnalyserRef.current = audioContextRef.current.createAnalyser();
      outputAnalyserRef.current.fftSize = 256;
      outputAnalyserRef.current.connect(audioContextRef.current.destination);
    }
    
    // Input Context (16kHz as per Gemini Live input requirement)
    if (!inputContextRef.current) {
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
  };

  const connectToGemini = async () => {
    try {
      setErrorMsg(null);
      setConnectionState(ConnectionState.CONNECTING);
      initAudio();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: getSystemInstruction(language),
          tools: [{ functionDeclarations: [saveStrengthTool] }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
          },
        },
        callbacks: {
          onopen: async () => {
            setConnectionState(ConnectionState.CONNECTED);
            startRecording();
          },
          onmessage: async (message: LiveServerMessage) => {
            // 1. Handle Tool Calls (Strengths)
            if (message.toolCall) {
              const responses = [];
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'save_strength') {
                  const newStrength = fc.args as unknown as StrengthItem;
                  setStrengths(prev => [...prev, { ...newStrength, id: Math.random().toString(36).substr(2, 9) }]);
                  
                  // We must respond to the tool call
                  responses.push({
                    id: fc.id,
                    name: fc.name,
                    response: { result: TRANSLATIONS[language].strength_recorded }
                  });
                }
              }
              
              if (responses.length > 0) {
                sessionPromise.then(session => {
                  session.sendToolResponse({ functionResponses: responses });
                });
              }
            }

            // 2. Handle Audio Output from Model
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current && outputAnalyserRef.current) {
               try {
                const ctx = audioContextRef.current;
                if (ctx.state === 'suspended') await ctx.resume();

                const audioBuffer = await decodeAudioData(
                  base64ToUint8Array(base64Audio),
                  ctx,
                  24000,
                  1
                );

                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAnalyserRef.current);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
               } catch (e) {
                 console.error("Error processing audio message", e);
               }
            }

            // 3. Handle Interruption
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              sourcesRef.current.forEach(source => {
                try { source.stop(); } catch (e) {} 
                sourcesRef.current.delete(source);
              });
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            setConnectionState(ConnectionState.DISCONNECTED);
          },
          onerror: (err) => {
            console.error(err);
            setConnectionState(ConnectionState.ERROR);
            setErrorMsg(TRANSLATIONS[language].error_connection);
            disconnect();
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setConnectionState(ConnectionState.ERROR);
      setErrorMsg("Failed to initialize connection.");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = inputContextRef.current!;
      
      analyserRef.current = inputCtx.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = inputCtx.createMediaStreamSource(stream);
      inputSourceRef.current = source;
      
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        
        if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
          }).catch(err => console.error("Session send error", err));
        }
      };

      source.connect(analyserRef.current);
      source.connect(processor);
      processor.connect(inputCtx.destination);

    } catch (err) {
      console.error("Microphone access denied or error", err);
      setErrorMsg(TRANSLATIONS[language].error_mic);
      disconnect();
    }
  };

  const disconnect = () => {
    if (inputSourceRef.current) {
      inputSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setConnectionState(ConnectionState.DISCONNECTED);
    sessionPromiseRef.current = null;
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    // Disconnect if currently connected to apply new system instructions
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      disconnect();
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    const updateVolume = () => {
      let currentVol = 0;
      const dataArray = new Uint8Array(256);
      if (outputAnalyserRef.current) {
        outputAnalyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (avg > 0) currentVol = avg / 255;
      }
      if (analyserRef.current) {
        const inputData = new Uint8Array(256);
        analyserRef.current.getByteFrequencyData(inputData);
        const avg = inputData.reduce((a, b) => a + b, 0) / inputData.length;
        const inputVol = avg / 255;
        currentVol = Math.max(currentVol, inputVol);
      }
      setVolume(currentVol);
      animationFrameId = requestAnimationFrame(updateVolume);
    };
    updateVolume();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-white font-sans selection:bg-violet-500/30">
      
      {/* 3D Galaxy Background Layer */}
      <GalaxyBackground />

      {/* Visualizer Layer (Orb) - Sits on top of Galaxy */}
      <CosmicOrb 
        isActive={connectionState === ConnectionState.CONNECTED} 
        volume={volume} 
      />

      {/* --- Main Center Interface --- */}
      <div className="relative z-20 w-full h-full flex flex-col items-center justify-between p-8 md:p-12 transition-all duration-700 ease-in-out">
        
        {/* Header & Controls */}
        <div className="w-full flex justify-between items-start opacity-90">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-extralight tracking-[0.2em] text-violet-100 drop-shadow-[0_0_10px_rgba(167,139,240,0.5)]">
              {t.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 tracking-widest uppercase font-medium">
              {t.subtitle}
            </p>
          </div>
          
          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 transition-all text-xs tracking-wider text-slate-200 backdrop-blur-sm"
          >
            <LanguageIcon />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>

        {/* Center Prompt / Status */}
        <div className={`flex-1 flex flex-col items-center justify-center text-center max-w-lg transition-all duration-500 ${strengths.length > 0 ? 'md:-translate-x-20' : ''}`}>
          {connectionState === ConnectionState.DISCONNECTED && (
            <div className="space-y-6 animate-fade-in-up">
              <p className="text-lg md:text-xl text-white font-light leading-relaxed whitespace-pre-wrap drop-shadow-md">
                {t.intro}
              </p>
            </div>
          )}

          {connectionState === ConnectionState.CONNECTING && (
            <div className="animate-pulse text-violet-300 tracking-widest text-sm drop-shadow-md">
              {t.status_connecting}
            </div>
          )}

          {connectionState === ConnectionState.CONNECTED && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                </span>
                <span className="text-violet-200 text-xs tracking-widest uppercase drop-shadow-sm">
                  {t.status_listening}
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
             <div className="mt-4 p-4 bg-red-900/60 border border-red-500/50 rounded text-red-100 text-sm backdrop-blur-md">
               {errorMsg}
             </div>
          )}
        </div>

        {/* Mic Controls */}
        <div className={`mb-12 transition-all duration-500 ${strengths.length > 0 ? 'md:-translate-x-20' : ''}`}>
          {connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR ? (
            <button
              onClick={connectToGemini}
              className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border border-white/30 backdrop-blur-md hover:bg-white/20 transition-all duration-500 hover:scale-110 hover:shadow-[0_0_30px_rgba(167,139,250,0.6)]"
            >
              <MicIcon />
              <div className="absolute inset-0 rounded-full border border-violet-400/50 animate-ping opacity-0 group-hover:opacity-100" />
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/50 backdrop-blur-md hover:bg-red-500/40 transition-all duration-300 hover:scale-105"
            >
              <StopIcon />
            </button>
          )}
        </div>
      </div>

      {/* --- Right Port: Strength Accumulator --- */}
      <div className={`absolute top-0 right-0 h-full z-20 w-full md:w-96 p-6 pointer-events-none flex flex-col justify-center transition-opacity duration-700 ${strengths.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="pointer-events-auto flex flex-col items-end space-y-4 max-h-[80vh] overflow-y-auto pr-2 pb-20 mask-gradient-b">
          {strengths.map((s, idx) => (
            <div 
              key={s.id}
              className="relative group w-72 backdrop-blur-md bg-black/40 border border-white/20 rounded-xl p-4 shadow-xl transform transition-all duration-700 hover:scale-105 hover:bg-black/60 animate-slide-in-right"
              style={{
                animationDelay: `${idx * 100}ms`
              }}
            >
              <div className="absolute -left-2 -top-2">
                <div className="bg-violet-500 p-1.5 rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.8)]">
                  <SparkleIcon />
                </div>
              </div>
              <h3 className="text-violet-100 font-medium tracking-wide text-sm mb-1 pl-2">
                {s.title}
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed pl-2 border-l border-violet-500/50">
                {s.description}
              </p>
              
              {/* Card Glow Effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
          
          {strengths.length > 0 && (
             <div className="text-center w-72 mt-8 opacity-70">
               <span className="text-[10px] uppercase tracking-widest text-slate-300 drop-shadow-sm">
                 {t.strength_header}
               </span>
             </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(50px) translateY(10px); }
          to { opacity: 1; transform: translateX(0) translateY(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .mask-gradient-b {
           -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 90%, transparent 100%);
           mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 90%, transparent 100%);
        }
      `}</style>
    </div>
  );
};

export default App;
