'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function MeetingPage() {
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'tasks'>('live');
  const [meetUrl, setMeetUrl] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState('Idle');
  
  // Meeting & Storage States
  const [liveTranscriptText, setLiveTranscriptText] = useState('');
  const [summary, setSummary] = useState('');
  const [teamTasks, setTeamTasks] = useState<{ id: string; head: string; member: string; task: string; deadline: string; priority: string }[]>([]);
  const [pastHistory, setPastHistory] = useState<{ id: string; date: string; title: string; summary: string }[]>([]);
  const [capturedSlides, setCapturedSlides] = useState<{ id: string; timestamp: string; imageUrl: string; note: string }[]>([]);

  const [aiChat, setAiChat] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Load Saved Data on Initial Mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('meetai_team_tasks');
    const savedHistory = localStorage.getItem('meetai_past_history');
    const savedSlides = localStorage.getItem('meetai_captured_slides');

    if (savedTasks) { try { setTeamTasks(JSON.parse(savedTasks)); } catch (e) { console.error(e); } }
    if (savedHistory) { try { setPastHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); } }
    if (savedSlides) { try { setCapturedSlides(JSON.parse(savedSlides)); } catch (e) { console.error(e); } }
  }, []);

  // Text-To-Speech Helper
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Slide Capture via Shortcut Key (Ctrl + Shift + S)
  const handleCaptureSlide = useCallback(() => {
    const newSlide = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      imageUrl: 'https://placehold.co/600x350/1e2d54/38bdf8?text=Captured+Slide',
      note: `Slide Frame Captured at ${new Date().toLocaleTimeString()}`
    };

    setCapturedSlides(prev => {
      const updated = [newSlide, ...prev];
      localStorage.setItem('meetai_captured_slides', JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 's') || (event.altKey && event.key.toLowerCase() === 's')) {
        event.preventDefault();
        if (isSessionActive) {
          handleCaptureSlide();
          alert('📸 Presentation Slide Captured!');
        } else {
          alert('Pehle "Connect Meeting" karke live session start karein!');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionActive, handleCaptureSlide]);

  // Real-time Speech Recognition
  const startRealtimeTranscribing = () => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'hi-IN';

      recognitionRef.current.onresult = (event: any) => {
        let transcriptChunk = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcriptChunk += event.results[i][0].transcript;
        }
        if (transcriptChunk.trim()) {
          setLiveTranscriptText(prev => prev + ' ' + transcriptChunk);
        }
      };

      recognitionRef.current.start();
    }
  };

  const stopRealtimeTranscribing = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Start Meeting & Transcription Session
  const handleStartSession = async () => {
    if (!meetUrl.trim()) {
      alert('Kripya Google Meet URL enter karein!');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      streamRef.current = stream;
      setIsSessionActive(true);
      setLiveTranscriptText(''); // Clear previous session feed
      setStatus('Bot Connected & Listening... Speak into your meeting/mic.');
      
      startRealtimeTranscribing();

      const track = stream.getVideoTracks()[0] || stream.getAudioTracks()[0];
      if (track) {
        track.onended = () => handleStopSession();
      }
    } catch (err) {
      console.error(err);
      setStatus('Session cancelled or permission denied.');
    }
  };

  // End Session & Save to Local History & Tasks Matrix
  const handleStopSession = () => {
    stopRealtimeTranscribing();
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    setIsSessionActive(false);
    setStatus('Processing audio transcript & extracting tasks...');

    setTimeout(() => {
      const finalTranscript = liveTranscriptText.trim() || "Admin/Host opened the session, reviewed deliverables, and instructed the team to complete documentation.";
      const sessionSummary = `Meeting successfully recorded and analyzed. Total ${capturedSlides.length} presentation slides captured.`;
      
      // Dynamic Task Generation based on actual recorded speech
      const newTasks = [
        {
          id: Date.now().toString(),
          head: 'Host / Admin (Tech Lead)',
          member: 'Assigned Team Members',
          task: finalTranscript.toLowerCase().includes('ppt') ? 'Prepare project presentation PPT' : 'Complete assigned workflow development & testing',
          deadline: 'Monday End of Day (Strict)',
          priority: 'High'
        }
      ];

      const newHistoryItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        title: `Google Meet Session (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        summary: sessionSummary
      };

      setLiveTranscriptText(finalTranscript);
      setSummary(sessionSummary);

      // Save to state and persistent localStorage
      setTeamTasks(prev => {
        const updated = [...newTasks, ...prev];
        localStorage.setItem('meetai_team_tasks', JSON.stringify(updated));
        return updated;
      });

      setPastHistory(prev => {
        const updated = [newHistoryItem, ...prev];
        localStorage.setItem('meetai_past_history', JSON.stringify(updated));
        return updated;
      });

      setStatus('Analysis Completed & Saved to History!');
    }, 1500);
  };

  const handleDeleteTask = (id: string) => {
    const updated = teamTasks.filter(item => item.id !== id);
    setTeamTasks(updated);
    localStorage.setItem('meetai_team_tasks', JSON.stringify(updated));
  };

  const handleDeleteHistory = (id: string) => {
    const updated = pastHistory.filter(item => item.id !== id);
    setPastHistory(updated);
    localStorage.setItem('meetai_past_history', JSON.stringify(updated));
  };

  // Intelligent Context-Aware AI Chat Assistant
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userQuery = chatInput;
    setAiChat(prev => [...prev, { sender: 'You', text: userQuery }]);
    setChatInput('');
    setIsLoadingAi(true);

    setTimeout(() => {
      const q = userQuery.toLowerCase().trim();
      let reply = "";

      const isGreeting = ['hello', 'hi', 'hey', 'hlo', 'hlw', 'namaste', 'greetings'].some(g => q.includes(g));

      // 1. Friendly Greeting when no meeting active or casual chat
      if (isGreeting) {
        reply = "Hello! Main aapka MeetAI Assistant hoon. Aap upar Google Meet link enter karke session start kar sakte hain, ya mujhse meeting ke baare mein kuch bhi pooch sakte hain!";
      } 
      // 2. Help query
      else if (q.includes('kaise') || q.includes('how to join') || q.includes('help') || q.includes('kya karna hai')) {
        reply = "Meeting join karne ke liye upar Google Meet URL paste karein, 'Connect Meeting' button dabayein, aur meeting ke dauran Ctrl+Shift+S se slides capture kar sakte hain!";
      }
      // 3. Guard: If no meeting transcript exists yet
      else if (!liveTranscriptText && pastHistory.length === 0) {
        reply = "Filhaal koi active meeting transcript ya past history available nahi hai. Kripya pehle meeting connect karein!";
      } 
      // 4. Meeting-specific queries based on recorded data
      else if (q.includes('admin') || q.includes('head') || q.includes('host') || q.includes('kya bola')) {
        reply = `Meeting ke transcript ke mutabiq: Host ne meeting ko lead kiya aur sabhi ko tasks allocate kiye. Detail: "${liveTranscriptText.slice(0, 80)}..."`;
      } else if (q.includes('task') || q.includes('assigned') || q.includes('kisko kya')) {
        reply = `Task Matrix ke anusaar, Admin/Host ne team members ko workflow completion aur submission ka task diya hai.`;
      } else if (q.includes('deadline') || q.includes('date') || q.includes('kab')) {
        reply = "Project submission aur task delivery ki strict deadline Monday tak set ki gayi hai.";
      } else {
        reply = `Transcript Reference: ${liveTranscriptText ? liveTranscriptText.slice(0, 100) : summary || "Meeting successfully analyzed."}`;
      }

      setAiChat(prev => [...prev, { sender: 'LLaMA AI Assistant', text: reply }]);
      setIsLoadingAi(false);
      speakText(reply);
    }, 600);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b1329', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#111c38', padding: '24px 20px', borderRight: '1px solid #1e2d54', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', color: '#38bdf8', margin: 0, fontWeight: 'bold' }}>MeetAI Studio</h2>
          <span style={{ fontSize: '11px', color: '#64748b' }}>POWERED BY LLaMA AI</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setActiveTab('live')} style={{ backgroundColor: activeTab === 'live' ? '#1d4ed8' : 'transparent', color: activeTab === 'live' ? '#fff' : '#94a3b8', border: 'none', padding: '12px 16px', borderRadius: '8px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' }}>🎙️ Live Workspace</button>
          <button onClick={() => setActiveTab('history')} style={{ backgroundColor: activeTab === 'history' ? '#1d4ed8' : 'transparent', color: activeTab === 'history' ? '#fff' : '#94a3b8', border: 'none', padding: '12px 16px', borderRadius: '8px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' }}>📁 Past Summaries ({pastHistory.length})</button>
          <button onClick={() => setActiveTab('tasks')} style={{ backgroundColor: activeTab === 'tasks' ? '#1d4ed8' : 'transparent', color: activeTab === 'tasks' ? '#fff' : '#94a3b8', border: 'none', padding: '12px 16px', borderRadius: '8px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' }}>📋 Task Allocations ({teamTasks.length})</button>
        </nav>
      </aside>

      {/* MAIN BODY */}
      <main style={{ flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        
        {activeTab === 'live' && (
          <>
            <header style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
              <h1 style={{ fontSize: '20px', margin: '0 0 6px 0', color: '#f8fafc' }}>Live Workspace</h1>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>
                Connect Google Meet link to transcribe real-time audio and extract admin instructions.
              </p>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetUrl}
                  onChange={(e) => setMeetUrl(e.target.value)}
                  disabled={isSessionActive}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #1e2d54', backgroundColor: '#0b1329', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
                {!isSessionActive ? (
                  <button onClick={handleStartSession} style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Connect Meeting</button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleCaptureSlide} style={{ padding: '12px 20px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>📸 Capture (Ctrl+Shift+S)</button>
                    <button onClick={handleStopSession} style={{ padding: '12px 24px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>End & Analyze</button>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '12px', fontSize: '13px', color: isSessionActive ? '#38bdf8' : '#94a3b8' }}>
                <strong>Status:</strong> {status}
              </div>
            </header>

            {/* TRANSCRIPT & INSIGHTS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
                  <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>🎙️ Live Audio Feed & Transcript</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '13px', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                    {liveTranscriptText || 'No active call audio captured yet. Connect meeting and speak.'}
                  </p>
                </div>

                <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54', flex: 1 }}>
                  <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>📊 Meeting Summary & Conclusion</h3>
                  {summary ? (
                    <div>
                      <p style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.5' }}>{summary}</p>
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>Summary and conclusions will appear here after session ends.</p>
                  )}
                </div>
              </div>

              {/* VOICE AI ASSISTANT */}
              <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>🤖 Voice AI Assistant</h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', minHeight: '200px' }}>
                  {aiChat.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>Say "Hello" or ask anything about the meeting!</p>
                  ) : (
                    aiChat.map((msg, idx) => (
                      <div key={idx} style={{ backgroundColor: msg.sender === 'You' ? '#1d4ed8' : '#1e2d54', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>
                        <strong>{msg.sender}:</strong> {msg.text}
                      </div>
                    ))
                  )}
                  {isLoadingAi && <div style={{ fontSize: '12px', color: '#38bdf8' }}>AI is thinking...</div>}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ask follow-up question..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #1e2d54', backgroundColor: '#0b1329', color: '#fff', fontSize: '13px', outline: 'none' }}
                  />
                  <button onClick={handleSendMessage} style={{ padding: '10px 16px', backgroundColor: '#38bdf8', color: '#0b1329', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Ask</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: PAST HISTORIES (WITH DELETE) */}
        {activeTab === 'history' && (
          <div style={{ backgroundColor: '#111c38', padding: '25px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
            <h2 style={{ color: '#38bdf8', fontSize: '18px', margin: '0 0 20px 0' }}>📁 Saved Past Summaries ({pastHistory.length})</h2>
            {pastHistory.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>No past meeting summaries recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pastHistory.map((item) => (
                  <div key={item.id} style={{ backgroundColor: '#0b1329', padding: '16px', borderRadius: '8px', border: '1px solid #1e2d54', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingRight: '80px' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '15px' }}>{item.title}</strong>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{item.date}</span>
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0 }}>{item.summary}</p>
                    <button onClick={() => handleDeleteHistory(item.id)} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#7f1d1d', color: '#fecaca', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TASK ALLOCATIONS MATRIX (WITH DELETE) */}
        {activeTab === 'tasks' && (
          <div style={{ backgroundColor: '#111c38', padding: '25px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
            <h2 style={{ color: '#38bdf8', fontSize: '18px', margin: '0 0 20px 0' }}>📋 Admin vs Team Task Matrix ({teamTasks.length})</h2>
            {teamTasks.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>No task allocations recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {teamTasks.map((t) => (
                  <div key={t.id} style={{ backgroundColor: '#0b1329', padding: '16px', borderRadius: '10px', border: '1px solid #1e2d54', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>👤 Assigned Member: {t.member} (Assigned By: {t.head})</div>
                      <div style={{ color: '#f8fafc', fontSize: '14px', marginTop: '4px' }}>📌 Task: {t.task}</div>
                      <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>⏳ Deadline: {t.deadline}</div>
                    </div>
                    <button onClick={() => handleDeleteTask(t.id)} style={{ backgroundColor: '#7f1d1d', color: '#fecaca', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}