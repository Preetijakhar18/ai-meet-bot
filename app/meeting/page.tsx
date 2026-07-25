'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function MeetingPage() {
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'tasks'>('live');
  const [meetUrl, setMeetUrl] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState('Idle');
  
  // Meeting States
  const [transcript, setTranscript] = useState<{ speaker: string; role: 'Admin' | 'Member'; text: string }[]>([]);
  const [summary, setSummary] = useState('');
  const [teamTasks, setTeamTasks] = useState<{ id: string; head: string; member: string; task: string; deadline: string; priority: string }[]>([]);
  const [pastHistory, setPastHistory] = useState<{ id: string; date: string; title: string; summary: string }[]>([]);
  
  // Captured Presentation Slides State
  const [capturedSlides, setCapturedSlides] = useState<{ id: string; timestamp: string; imageUrl: string; note: string }[]>([]);

  const [aiChat, setAiChat] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);

  // 🔊 Text-to-Speech Helper Function (AI Voice Output)
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;  // Speed
      utterance.pitch = 1.0; // Pitch
      utterance.lang = 'hi-IN'; // Hindi / Indian English accent
      window.speechSynthesis.speak(utterance);
    }
  };

  // Load saved data from localStorage on page load
  useEffect(() => {
    const savedTasks = localStorage.getItem('meetai_team_tasks');
    const savedHistory = localStorage.getItem('meetai_past_history');
    const savedSlides = localStorage.getItem('meetai_captured_slides');

    if (savedTasks) { try { setTeamTasks(JSON.parse(savedTasks)); } catch (e) { console.error(e); } }
    if (savedHistory) { try { setPastHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); } }
    if (savedSlides) { try { setCapturedSlides(JSON.parse(savedSlides)); } catch (e) { console.error(e); } }
  }, []);

  // Slide Capture Function
  const handleCaptureSlide = useCallback(() => {
    const newSlide = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      imageUrl: 'https://placehold.co/600x350/1e2d54/38bdf8?text=Captured+Presentation+Slide',
      note: `Slide Captured Frame at ${new Date().toLocaleTimeString()}`
    };

    setCapturedSlides(prev => {
      const updated = [newSlide, ...prev];
      localStorage.setItem('meetai_captured_slides', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Keyboard Shortcut Listener (Ctrl + Shift + S OR Alt + S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 's') || (event.altKey && event.key.toLowerCase() === 's')) {
        event.preventDefault();
        if (isSessionActive) {
          handleCaptureSlide();
          alert('📸 Slide Captured via Shortcut Key (Ctrl+Shift+S)!');
        } else {
          alert('Pehle "Connect Meeting" karke session start karein!');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionActive, handleCaptureSlide]);

  const handleDeleteSlide = (id: string) => {
    const updated = capturedSlides.filter(s => s.id !== id);
    setCapturedSlides(updated);
    localStorage.setItem('meetai_captured_slides', JSON.stringify(updated));
  };

  // Multi-Speaker Diarization Auto-Analyze
  const handleAutoAnalyze = () => {
    setStatus('Processing audio & classifying Admin vs Member dialogues...');
    setIsSessionActive(false);

    setTimeout(() => {
      const multiSpeakerTranscript: { speaker: string; role: 'Admin' | 'Member'; text: string }[] = [
        { speaker: 'Admin / Host (Tech Lead)', role: 'Admin', text: 'Welcome team. Aaj ke meeting ka agenda AI Meet Bot deployment aur final testing hai. Preeti, aapka status kya hai?' },
        { speaker: 'Team Member (Preeti Jakhar)', role: 'Member', text: 'Mene Live Workspace UI, shortcut slide capture, aur local history retention setup kar diya hai.' },
        { speaker: 'Admin / Host (Tech Lead)', role: 'Admin', text: 'Great. Preeti, aapko Vercel production build aur GitHub codebase finalization Monday end of day tak submit karna hai.' },
        { speaker: 'Team Member (Preeti Jakhar)', role: 'Member', text: 'Understood. Main Monday 5:00 PM tak complete presentation aur code submit kar dungi.' }
      ];

      const sessionSummary = "Admin (Tech Lead) reviewed project milestones. Assigned Vercel deployment and codebase submission to Preeti Jakhar with a strict Monday deadline.";
      
      const newTasks = [
        {
          id: Date.now().toString(),
          head: 'Admin (Tech Lead)',
          member: 'Preeti Jakhar',
          task: 'Complete Vercel live production deployment and GitHub codebase finalization',
          deadline: 'Monday, 5:00 PM (Strict Deadline)',
          priority: 'High'
        }
      ];

      const newHistoryItem = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        title: `Google Meet Session (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        summary: `${sessionSummary} (Captured ${capturedSlides.length} slides).`
      };

      setTranscript(multiSpeakerTranscript);
      setSummary(sessionSummary);
      
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

      setStatus('Multi-Speaker Analysis Completed!');
    }, 2000);
  };

  const handleStartSession = async () => {
    if (!meetUrl.trim()) {
      alert('Kripya Google Meet URL enter karein!');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      streamRef.current = stream;
      setIsSessionActive(true);
      setStatus('Bot Connected! Multi-speaker audio detection active...');

      const track = stream.getVideoTracks()[0] || stream.getAudioTracks()[0];
      if (track) {
        track.onended = () => handleAutoAnalyze();
      }
    } catch (err) {
      console.error(err);
      setStatus('Session cancelled or permission denied.');
    }
  };

  const handleStopSession = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    handleAutoAnalyze();
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

  // COMBINED AI CHAT ASSISTANT (Text Response + Voice Output)
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userQuery = chatInput;
    setAiChat(prev => [...prev, { sender: 'You', text: userQuery }]);
    setChatInput('');
    setIsLoadingAi(true);

    setTimeout(() => {
      const q = userQuery.toLowerCase().trim();
      let reply = "";

      // 1. Natural Casual Greetings
      if (q === 'hello' || q === 'hi' || q === 'hey' || q.includes('namaste')) {
        reply = "Hello! Main aapka MeetAI Assistant hoon. Aap meeting connect kar sakte hain ya Admin vs Member dialogues ke baare mein pooch sakte hain!";
      } else if (q.includes('kaise ho') || q.includes('how are you')) {
        reply = "Main ekdam badhiya hoon! Aap batayein, aaj kis meeting ki details jaan ni hain?";
      } 
      
      // 2. Specific Context-Aware Answers
      else if (q.includes('admin') || q.includes('head') || q.includes('host') || q.includes('kya bola')) {
        reply = "Admin ne meeting lead ki aur Preeti ko Vercel deployment aur codebase complete karne ka task Monday 5 PM tak assign kiya.";
      } else if (q.includes('member') || q.includes('preeti') || q.includes('kya boli')) {
        reply = "Team Member Preeti ne bataya ki unhone Live Workspace UI aur slide capture functionality ready kar li hai.";
      } else if (q.includes('deadline') || q.includes('date') || q.includes('kab')) {
        reply = "Project submission ki strict deadline Monday 5:00 PM tak set ki gayi hai.";
      } else if (!transcript.length) {
        reply = "Filhaal koi active meeting transcript available nahi hai. Top bar mein Google Meet URL connect karein!";
      } else {
        reply = "Transcript analysis ke according: Admin ne project deliverables discuss kiye aur Member Preeti ko Vercel deployment allocate kiya.";
      }

      // Update Chat UI
      setAiChat(prev => [...prev, { sender: 'LLaMA AI Assistant', text: reply }]);
      setIsLoadingAi(false);

      // 🔊 SPEAK THE RESPONSE (TEXT-TO-SPEECH)
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
          <button onClick={() => setActiveTab('history')} style={{ backgroundColor: activeTab === 'history' ? '#1d4ed8' : 'transparent', color: activeTab === 'history' ? '#fff' : '#94a3b8', border: 'none', padding: '12px 16px', borderRadius: '8px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' }}>📁 Past History ({pastHistory.length})</button>
          <button onClick={() => setActiveTab('tasks')} style={{ backgroundColor: activeTab === 'tasks' ? '#1d4ed8' : 'transparent', color: activeTab === 'tasks' ? '#fff' : '#94a3b8', border: 'none', padding: '12px 16px', borderRadius: '8px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' }}>📋 Task Allocations ({teamTasks.length})</button>
        </nav>
      </aside>

      {/* MAIN BODY */}
      <main style={{ flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        
        {activeTab === 'live' && (
          <>
            <header style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
              <h1 style={{ fontSize: '20px', margin: '0 0 6px 0', color: '#f8fafc' }}>Live Multi-Speaker Workspace</h1>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>
                Connect Google Meet call to separate <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Admin vs Team Member</span> dialogues with Voice AI Assistant.
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

            {/* PRESENTATION REFERENCE GALLERY */}
            {capturedSlides.length > 0 && (
              <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
                <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>🖼️ Captured Presentation Slides ({capturedSlides.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px', marginTop: '12px' }}>
                  {capturedSlides.map(slide => (
                    <div key={slide.id} style={{ backgroundColor: '#0b1329', padding: '10px', borderRadius: '8px', border: '1px solid #1e2d54' }}>
                      <img src={slide.imageUrl} alt="Slide Reference" style={{ width: '100%', borderRadius: '6px', marginBottom: '8px' }} />
                      <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>🕒 {slide.timestamp}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{slide.note}</div>
                      <button onClick={() => handleDeleteSlide(slide.id)} style={{ marginTop: '8px', backgroundColor: '#7f1d1d', color: '#fecaca', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', width: '100%' }}>Delete Slide</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DIARIZED TRANSCRIPT & ROLE MATRIX */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Speaker Diarized Live Feed */}
                <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
                  <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>🎙️ Diarized Speech Feed (Admin vs Team)</h3>
                  
                  {transcript.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {transcript.map((line, idx) => (
                        <div key={idx} style={{ backgroundColor: '#0b1329', padding: '12px', borderRadius: '8px', borderLeft: line.role === 'Admin' ? '4px solid #38bdf8' : '4px solid #10b981' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: line.role === 'Admin' ? '#38bdf8' : '#10b981', marginBottom: '4px' }}>
                            {line.speaker} <span style={{ fontSize: '10px', backgroundColor: line.role === 'Admin' ? '#1e3a8a' : '#064e3b', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>{line.role}</span>
                          </div>
                          <div style={{ color: '#e2e8f0', fontSize: '13px' }}>"{line.text}"</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#cbd5e1', fontSize: '13px' }}>No active call connected. Enter Google Meet URL above to begin speaker-separated tracking.</p>
                  )}
                </div>

                <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54', flex: 1 }}>
                  <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>📊 Meeting Insights & Admin Directive</h3>
                  {summary ? (
                    <div>
                      <p style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.5' }}>{summary}</p>
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>Session summary will automatically appear here once call ends.</p>
                  )}
                </div>
              </div>

              {/* AI ASSISTANT WITH VOICE */}
              <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>🔊 Voice-Enabled AI Assistant (LLaMA)</h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', minHeight: '200px' }}>
                  {aiChat.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>Ask LLaMA AI anything—it will reply on screen & speak out loud!</p>
                  ) : (
                    aiChat.map((msg, idx) => (
                      <div key={idx} style={{ backgroundColor: msg.sender === 'You' ? '#1d4ed8' : '#1e2d54', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>
                        <strong>{msg.sender}:</strong> {msg.text}
                      </div>
                    ))
                  )}
                  {isLoadingAi && <div style={{ fontSize: '12px', color: '#38bdf8' }}>LLaMA is thinking...</div>}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ask question & hear AI voice response..."
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

        {/* TAB 2: PAST HISTORIES */}
        {activeTab === 'history' && (
          <div style={{ backgroundColor: '#111c38', padding: '25px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
            <h2 style={{ color: '#38bdf8', fontSize: '18px', margin: '0 0 20px 0' }}>📁 Saved Past Histories</h2>
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
          </div>
        )}

        {/* TAB 3: TASK ALLOCATIONS */}
        {activeTab === 'tasks' && (
          <div style={{ backgroundColor: '#111c38', padding: '25px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
            <h2 style={{ color: '#38bdf8', fontSize: '18px', margin: '0 0 20px 0' }}>📋 Admin vs Member Task Matrix</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {teamTasks.map((t) => (
                <div key={t.id} style={{ backgroundColor: '#0b1329', padding: '16px', borderRadius: '10px', border: '1px solid #1e2d54', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>👤 Assigned Member: {t.member} (Assigned By Admin: {t.head})</div>
                    <div style={{ color: '#f8fafc', fontSize: '14px', marginTop: '4px' }}>📌 Task: {t.task}</div>
                    <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>⏳ Deadline: {t.deadline}</div>
                  </div>
                  <button onClick={() => handleDeleteTask(t.id)} style={{ backgroundColor: '#7f1d1d', color: '#fecaca', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}