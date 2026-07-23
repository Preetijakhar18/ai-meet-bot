'use client';

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useSpeechToText } from '../../hooks/useSpeechToText';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface ActionItem {
  task: string;
  assignee: string;
}

interface SummaryData {
  title: string;
  duration: string;
  overview: string;
  keyPoints: string[];
  actionItems: ActionItem[];
}

export default function MeetingPage() {
  const { isListening, transcriptText, startListening, stopListening } = useSpeechToText();

  // Speaker Roles State
  const [activeSpeakerRole, setActiveSpeakerRole] = useState<'Head' | 'Member'>('Head');

  // Live Transcript list
  const [transcript, setTranscript] = useState<string[]>([]);

  // Append speech with exact Role Tagging
  useEffect(() => {
    if (transcriptText.trim()) {
      const roleTag = activeSpeakerRole === 'Head' ? '[Head/Lead]' : '[Team Member]';
      const newLine = `${roleTag}: ${transcriptText}`;
      setTranscript((prev) => [...prev, newLine]);
    }
  }, [transcriptText]);

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const [slides, setSlides] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I am actively tracking speaker inputs. Ask me anything about tasks assigned by Head or discussion points!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleCaptureSlide = () => {
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSlides((prev) => [...prev, `Captured Slide at ${timeLabel}`]);
  };

  // Accurate Querying using Groq API
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery.trim();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: currentTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAiThinking(true);

    const fullContext = transcript.length > 0 
      ? transcript.join('\n')
      : "No live speech recorded yet.";

    try {
      // Updated Endpoint to /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are an AI Meeting Assistant. Based ONLY on the following tagged meeting transcript, answer the user query accurately and specifically.

TRANSCRIPT:
${fullContext}

USER QUESTION: ${userText}

Answer clearly based on who said what (Head/Lead vs Team Member):`,
        }),
      });

      let aiReplyText = "I couldn't process that response.";

      if (response.ok) {
        const data = await response.json();
        if (data && data.text) aiReplyText = data.text;
      } else {
        const errData = await response.json();
        if (errData && errData.error) aiReplyText = `API Error: ${errData.error}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: aiReplyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "Error connecting to AI. Please check server logs.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Dynamic End & Analyze via Groq Llama-3
  const handleEndAndAnalyze = async () => {
    stopListening();
    setIsSummaryModalOpen(true);
    setIsGeneratingSummary(true);

    const fullContext = transcript.length > 0 
      ? transcript.join('\n')
      : "[Head/Lead]: Please verify the API and submit report by tomorrow.";

    try {
      // Updated Endpoint to /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze this meeting transcript and extract structured JSON response:

TRANSCRIPT:
${fullContext}

Respond ONLY in valid JSON format like this without markdown backticks:
{
  "title": "Meeting Summary & Task Report",
  "overview": "Summary of main discussion points",
  "actionItems": [
    { "task": "Specific task mentioned", "assignee": "Person/Role assigned to" }
  ]
}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const cleanJsonText = data.text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanJsonText);
          setSummaryData({
            title: parsed.title || 'Meeting Summary',
            duration: 'Live Session',
            overview: parsed.overview || 'Discussion concluded.',
            keyPoints: ['Role tagged meeting recorded successfully.'],
            actionItems: parsed.actionItems || [],
          });
        } catch {
          setSummaryData({
            title: 'Meeting Executive Report',
            duration: 'Live Session',
            overview: data.text,
            keyPoints: ['Recorded real-time audio transcript.'],
            actionItems: [
              { task: 'Complete assigned deliverables', assignee: 'Team Member' }
            ],
          });
        }
      }
    } catch {
      setSummaryData({
        title: 'Meeting Strategy Report',
        duration: 'Live Session',
        overview: 'Meeting completed.',
        keyPoints: [],
        actionItems: [],
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        <header className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Live Workspace
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Role-aware meeting monitoring & smart task extraction
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Speaker Selection Badge */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-full p-1 text-xs">
              <button
                onClick={() => setActiveSpeakerRole('Head')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                  activeSpeakerRole === 'Head'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                👑 Head / Lead
              </button>
              <button
                onClick={() => setActiveSpeakerRole('Member')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                  activeSpeakerRole === 'Member'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                👤 Member
              </button>
            </div>

            <button
              onClick={toggleMic}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                isListening
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              {isListening ? '🎙️ Mic Active' : '🎙️ Start Mic'}
            </button>

            <button
              onClick={handleEndAndAnalyze}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              End & Analyze 🚀
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  🎙️ Live Audio Feed (Role Tagged)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Speaking as: <span className="text-indigo-400 font-bold">{activeSpeakerRole}</span>
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[180px] text-sm text-slate-300 font-mono">
                {transcript.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-2">Click "Start Mic" and speak to capture real-time audio...</p>
                ) : (
                  transcript.map((line, index) => {
                    const isHead = line.startsWith('[Head/Lead]');
                    return (
                      <p
                        key={index}
                        className={`leading-relaxed p-2.5 rounded-xl border text-xs ${
                          isHead
                            ? 'bg-indigo-950/40 border-indigo-800/50 text-indigo-200'
                            : 'bg-slate-800/30 border-slate-800/50 text-slate-300'
                        }`}
                      >
                        {line}
                      </p>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col flex-1 min-h-[220px]">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    📁 Presentation Reference
                  </h3>
                  <p className="text-[11px] text-slate-500">Capture key slides/charts during discussion</p>
                </div>
                <button
                  onClick={handleCaptureSlide}
                  className="bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-medium px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+</span> Capture Slide
                </button>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto max-h-[180px]">
                {slides.length === 0 ? (
                  <div className="col-span-2 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-6 text-slate-500 text-xs text-center">
                    <span>🖼️ No slides captured yet</span>
                  </div>
                ) : (
                  slides.map((slide, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 flex flex-col items-center justify-center text-xs text-indigo-200">
                      <span>🖼️ {slide}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  🤖 Meeting AI Assistant
                </h3>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-mono border border-indigo-500/20">
                Groq AI Active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-slate-400 text-xs italic bg-slate-800/40 p-2 rounded-xl w-max">
                  <span className="animate-spin text-indigo-400">⚡</span> AI analyzing live context...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-800">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask e.g. What did the Head ask?"
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 placeholder-slate-500 rounded-xl px-3.5 py-2.5 outline-none transition"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isAiThinking}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium p-2.5 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
              >
                ➔
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Summary Modal with Real AI Task Allocation */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                  AI Dynamic Summary & Task Report
                </span>
                <h2 className="text-xl font-bold text-white mt-2">
                  {summaryData?.title || 'Analyzing Real Audio Feed...'}
                </h2>
              </div>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-800/60 p-2 rounded-xl border border-slate-700/50 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isGeneratingSummary ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="text-3xl animate-spin">⚡</span>
                <p className="text-sm text-slate-300 font-medium">Extracting Exact Action Items via Groq AI...</p>
              </div>
            ) : (
              <div className="space-y-5 text-xs text-slate-300">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
                    📌 Meeting Overview
                  </h4>
                  <p className="leading-relaxed text-slate-300">{summaryData?.overview}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    ✅ Extracted Action Items & Assigned Tasks
                  </h4>
                  <div className="space-y-2">
                    {summaryData?.actionItems.length === 0 ? (
                      <p className="text-slate-500 italic">No specific tasks detected in conversation.</p>
                    ) : (
                      summaryData?.actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-xl text-emerald-200">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" className="accent-emerald-500 rounded cursor-pointer" />
                            <span>{item.task}</span>
                          </div>
                          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md">
                            {item.assignee}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setIsSummaryModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl font-medium text-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}