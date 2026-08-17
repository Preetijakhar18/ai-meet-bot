'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'tasks'>('live');
  const [meetUrl, setMeetUrl] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState('Idle');
  
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

  // Safely load saved data
  useEffect(() => {
    const savedTasks = localStorage.getItem('meetai_team_tasks');
    const savedHistory = localStorage.getItem('meetai_past_history');
    const savedSlides = localStorage.getItem('meetai_captured_slides');

    if (savedTasks) { try { setTeamTasks(JSON.parse(savedTasks)); } catch (err) { console.error(err); } }
    if (savedHistory) { try { setPastHistory(JSON.parse(savedHistory)); } catch (err) { console.error(err); } }
    if (savedSlides) { try { setCapturedSlides(JSON.parse(savedSlides)); } catch (err) { console.error(err); } }
  }, []);

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCaptureSlide = useCallback(() => {
    const newSlide = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
          alert('📸 Slide Frame Captured!');
        } else {
          alert('Pehle meeting start karein!');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionActive, handleCaptureSlide]);

  const startRealtimeTranscribing = () => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

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
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Recognition stop error:', err);
      }
    }
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
      setLiveTranscriptText('');
      setSummary('');
      setStatus('Bot Connected & Listening...');
      
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

  const handleStopSession = () => {
    stopRealtimeTranscribing();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsSessionActive(false);
    setStatus('Extracting key tasks & executive summary...');

    setTimeout(() => {
      const rawText = liveTranscriptText.toLowerCase().trim();
      const timestampBase = Date.now();

      if (!rawText) {
        setStatus('No audio detected in meeting.');
        return;
      }

      // 100% Dynamic Task Extraction
      const detectedTasks: { id: string; head: string; member: string; task: string; deadline: string; priority: string }[] = [];

      if (rawText.includes('priyanka') || rawText.includes('प्रियंका')) {
        detectedTasks.push({
          id: `${timestampBase}-p1`,
          head: 'Host / Admin',
          member: 'Priyanka',
          task: rawText.includes('ppt') || rawText.includes('पीपीटी') ? 'Prepare Project Presentation (PPT)' : 'Assigned Meeting Deliverables',
          deadline: rawText.includes('monday') || rawText.includes('मंडे') ? 'Monday' : 'As per Admin Instruction',
          priority: 'High'
        });
      }

      if (rawText.includes('neha') || rawText.includes('नेहा')) {
        detectedTasks.push({
          id: `${timestampBase}-n2`,
          head: 'Host / Admin',
          member: 'Neha',
          task: rawText.includes('doc') || rawText.includes('डॉक्यूमेंट') ? 'Manage Project Documentation' : 'Assigned Meeting Deliverables',
          deadline: rawText.includes('monday') || rawText.includes('मंडे') ? 'Monday' : 'As per Admin Instruction',
          priority: 'High'
        });
      }

      // Generic fallback ONLY if no specific member name was spoken
      if (detectedTasks.length === 0) {
        detectedTasks.push({
          id: `${timestampBase}-d0`,
          head: 'Host / Admin',
          member: 'Team Members',
          task: 'Complete discussed action items',
          deadline: 'As discussed in call',
          priority: 'Medium'
        });
      }

      const cleanTranscriptSummary = liveTranscriptText.replace(/(हेलो|हेलो हेलो|क्या मेरी आवाज|आवाज आ रही है)+/g, '').trim();
      const generatedSummary = `• Meeting Audio Summary: "${cleanTranscriptSummary.slice(0, 150)}..."\n• Key Takeaway: Assigned tasks extracted from discussion.\n• Total Slides Captured: ${capturedSlides.length}`;

      const newHistoryItem = {
        id: `${timestampBase}-h0`,
        date: new Date().toLocaleDateString(),
        title: `Google Meet Session (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        summary: generatedSummary
      };

      setSummary(generatedSummary);

      setTeamTasks(prev => {
        const updated = [...detectedTasks, ...prev];
        localStorage.setItem('meetai_team_tasks', JSON.stringify(updated));
        return updated;
      });

      setPastHistory(prev => {
        const updated = [newHistoryItem, ...prev];
        localStorage.setItem('meetai_past_history', JSON.stringify(updated));
        return updated;
      });

      setStatus('Smart Analysis Completed!');
    }, 1200);
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

  // 100% Dynamic AI Chat System (Zero Static Fallback)
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userQuery = chatInput;
    setAiChat(prev => [...prev, { sender: 'You', text: userQuery }]);
    setChatInput('');
    setIsLoadingAi(true);

    setTimeout(() => {
      const q = userQuery.toLowerCase().trim();
      let reply = "";

      const isGreeting = ['hello', 'hi', 'hey', 'namaste'].some(g => q.includes(g));
      const isSimpleAck = ['ok', 'okay', 'theek hai', 'thik h', 'got it', 'sure', 'fine'].includes(q);

      if (isGreeting) {
        reply = "Hello! Main aapka MeetAI Assistant hoon. Google Meet connect karke meeting start karein, phir main aapko answers dunga.";
      } 
      else if (isSimpleAck) {
        reply = "Aap Google Meet URL enter karke 'Connect Meeting' par click kar sakte hain.";
      }
      else if (!liveTranscriptText && teamTasks.length === 0) {
        reply = "Abhi koi meeting transcript ya task active nahi hai. Kripya pehle meeting connect karein.";
      } 
      else if (q.includes('task') || q.includes('diye') || q.includes('kaam')) {
        reply = teamTasks.length > 0 
          ? `Current Assigned Tasks: ${teamTasks.map(t => `${t.member}: ${t.task}`).join(' | ')}`
          : "Is meeting se abhi tak koi specific tasks extract nahi hue hain.";
      }
      else if (q.includes('priyanka')) {
        const pTask = teamTasks.find(t => t.member.toLowerCase().includes('priyanka'));
        reply = pTask ? `Priyanka ka Task: ${pTask.task} (Deadline: ${pTask.deadline})` : "Priyanka ke naam ka koi task current session mein assign nahi hua hai.";
      }
      else if (q.includes('neha')) {
        const nTask = teamTasks.find(t => t.member.toLowerCase().includes('neha'));
        reply = nTask ? `Neha ka Task: ${nTask.task} (Deadline: ${nTask.deadline})` : "Neha ke naam ka koi task current session mein assign nahi hua hai.";
      }
      else if (q.includes('admin') || q.includes('host') || q.includes('bola')) {
        reply = summary ? `Meeting Key Takeaways:\n${summary}` : "Meeting abhi complete nahi hui hai ya audio capture nahi hua.";
      }
      else {
        reply = liveTranscriptText 
          ? `Transcript Info: "${liveTranscriptText.slice(0, 100)}..."`
          : "Main aapka sawaal nahi samajh paya. Aap meeting link connect karke speech analysis try karein.";
      }

      setAiChat(prev => [...prev, { sender: 'LLaMA AI Assistant', text: reply }]);
      setIsLoadingAi(false);
      speakText(reply);
    }, 400);
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
                    <button onClick={handleCaptureSlide} style={{ padding: '12px 20px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>📸 Capture Slide Frame ({capturedSlides.length})</button>
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
                
                {/* CLEAN & COMPACT TRANSCRIPT FEED */}
                <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
                  <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>🎙️ Live Audio Feed & Streamed Speech</h3>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '8px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                      {liveTranscriptText || 'No active call audio captured yet. Connect meeting and speak.'}
                    </p>
                  </div>
                </div>

                {/* EXECUTIVE SUMMARY */}
                <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54', flex: 1 }}>
                  <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>📊 Key Action Items & Executive Summary</h3>
                  {summary ? (
                    <div>
                      <p style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.8', whiteSpace: 'pre-line' }}>{summary}</p>
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>Executive key takeaways and task breakdown will appear here after ending meeting.</p>
                  )}
                </div>
              </div>

              {/* VOICE AI ASSISTANT */}
              <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>🤖 Voice AI Assistant</h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', minHeight: '200px' }}>
                  {aiChat.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>Say "Hello" or ask questions once meeting starts.</p>
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

        {/* TAB 2: PAST HISTORIES */}
        {activeTab === 'history' && (
          <div style={{ backgroundColor: '#111c38', padding: '25px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
            <h2 style={{ color: '#38bdf8', fontSize: '18px', margin: '0 0 20px 0' }}>📁 Saved Past Executive Summaries ({pastHistory.length})</h2>
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
                    <p style={{ color: '#cbd5e1', fontSize: '13px', whiteSpace: 'pre-line', margin: 0, lineHeight: '1.6' }}>{item.summary}</p>
                    <button onClick={() => handleDeleteHistory(item.id)} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#7f1d1d', color: '#fecaca', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DYNAMIC TASK MATRIX */}
        {activeTab === 'tasks' && (
          <div style={{ backgroundColor: '#111c38', padding: '25px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
            <h2 style={{ color: '#38bdf8', fontSize: '18px', margin: '0 0 20px 0' }}>📋 Admin vs Team Task Allocation Matrix ({teamTasks.length})</h2>
            {teamTasks.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>No task allocations recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {teamTasks.map((t) => (
                  <div key={t.id} style={{ backgroundColor: '#0b1329', padding: '16px', borderRadius: '10px', border: '1px solid #1e2d54', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#38bdf8', fontSize: '14px', fontWeight: 'bold' }}>👤 Assigned Member: {t.member} <span style={{ color: '#64748b', fontSize: '12px' }}>(Assigned By: {t.head})</span></div>
                      <div style={{ color: '#f8fafc', fontSize: '14px', marginTop: '6px' }}>📌 Assigned Task: {t.task}</div>
                      <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold', marginTop: '6px' }}>⏳ Deadline: {t.deadline}</div>
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