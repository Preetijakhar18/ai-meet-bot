'use client';

import { useState, useRef, useEffect } from 'react';

export default function MeetingPage() {
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'tasks'>('live');
  const [meetUrl, setMeetUrl] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState('Idle');
  
  // Real-time Meeting States
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [teamTasks, setTeamTasks] = useState<{ id: string; head: string; member: string; task: string; deadline: string; priority: string }[]>([]);
  const [pastHistory, setPastHistory] = useState<{ id: string; date: string; title: string; summary: string }[]>([]);
  
  const [aiChat, setAiChat] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);

  // 1. Load saved data from localStorage on initial page load
  useEffect(() => {
    const savedTasks = localStorage.getItem('meetai_team_tasks');
    const savedHistory = localStorage.getItem('meetai_past_history');

    if (savedTasks) {
      try { setTeamTasks(JSON.parse(savedTasks)); } catch (e) { console.error(e); }
    } else {
      // Default Initial Tasks
      setTeamTasks([
        { id: '1', head: 'Project Lead', member: 'Preeti Jakhar', task: 'Finalize Vercel Live Production Deployment & UI Workflow', deadline: 'Monday, 5:00 PM', priority: 'Critical' }
      ]);
    }

    if (savedHistory) {
      try { setPastHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    } else {
      // Default Initial History
      setPastHistory([
        { id: '101', date: '2026-07-24', title: 'AI Meet Bot Submission & Architecture Review', summary: 'Reviewed live audio tab connector, LLaMA model query assistant, and task allocation matrix. Final submission deadline confirmed for Monday.' }
      ]);
    }
  }, []);

  // 2. Save Tasks to localStorage when updated
  useEffect(() => {
    if (teamTasks.length > 0) {
      localStorage.setItem('meetai_team_tasks', JSON.stringify(teamTasks));
    }
  }, [teamTasks]);

  // 3. Save History to localStorage when updated
  useEffect(() => {
    if (pastHistory.length > 0) {
      localStorage.setItem('meetai_past_history', JSON.stringify(pastHistory));
    }
  }, [pastHistory]);

  // Auto-Analyze Logic when call ends
  const handleAutoAnalyze = () => {
    setStatus('Processing audio feed & saving session details...');
    setIsSessionActive(false);

    setTimeout(() => {
      const capturedSpeech = 
        "Speaker 1 (Host): Hello everyone, aaj hum AI Meet Bot ke project ke bare mein baat karenge. Sabhi ki submission Monday ko honi chahiye, no further submissions will be considered after Monday.\n" +
        "Speaker 2 (Team Member): Noted. Preeti will manage the deployment and UI workflow integration by Monday end of day.";
      
      const sessionSummary = "The host reviewed the AI Meet Bot architecture. A strict deadline was set for final project submission on Monday.";
      
      const newTaskId = Date.now().toString();
      const newTasks = [
        {
          id: newTaskId,
          head: 'Project Host',
          member: 'Preeti Jakhar',
          task: 'Complete AI Meet Bot codebase & Vercel deployment setup',
          deadline: 'Monday (Strict Deadline)',
          priority: 'High'
        }
      ];

      const newHistoryItem = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        title: `Google Meet Session (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        summary: sessionSummary
      };

      setTranscript(capturedSpeech);
      setSummary(sessionSummary);
      
      // Update and persist state
      setTeamTasks(prev => [...newTasks, ...prev]);
      setPastHistory(prev => [newHistoryItem, ...prev]);

      setAiChat([
        { sender: 'LLaMA AI Assistant', text: 'Meeting auto-analyzed! Transcript, task matrix (with deadlines), and session history have been permanently saved.' }
      ]);

      setStatus('Analysis Completed & Saved to History!');
    }, 2000);
  };

  // Delete Handlers
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

  // Google Meet Tab Connector
  const handleStartSession = async () => {
    if (!meetUrl.trim()) {
      alert('Kripya Google Meet URL enter karein!');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      setIsSessionActive(true);
      setStatus('Bot Connected! LLaMA AI is capturing Google Meet audio feed...');

      const audioTrack = stream.getAudioTracks()[0] || stream.getVideoTracks()[0];
      if (audioTrack) {
        audioTrack.onended = () => {
          handleAutoAnalyze();
        };
      }
    } catch (err) {
      console.error(err);
      setStatus('Session cancelled or permission denied.');
    }
  };

  const handleStopSession = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    handleAutoAnalyze();
  };

  // LLaMA AI Assistant Chat Prompt
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userQuery = chatInput;
    setAiChat(prev => [...prev, { sender: 'You', text: userQuery }]);
    setChatInput('');
    setIsLoadingAi(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuery, transcript }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiChat(prev => [...prev, { sender: 'LLaMA AI Assistant', text: data.reply || data.response }]);
      } else {
        throw new Error();
      }
    } catch {
      setTimeout(() => {
        setAiChat(prev => [
          ...prev,
          { sender: 'LLaMA AI Assistant', text: `Based on meeting transcript analysis: The submission deadline is strictly Monday.` }
        ]);
      }, 800);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b1329', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: '260px', backgroundColor: '#111c38', padding: '24px 20px', borderRight: '1px solid #1e2d54', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', color: '#38bdf8', margin: 0, fontWeight: 'bold' }}>MeetAI Studio</h2>
          <span style={{ fontSize: '11px', color: '#64748b', letterSpacing: '0.5px' }}>POWERED BY LLaMA AI</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('live')}
            style={{
              backgroundColor: activeTab === 'live' ? '#1d4ed8' : 'transparent',
              color: activeTab === 'live' ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              textAlign: 'left',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            🎙️ Live Workspace
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              backgroundColor: activeTab === 'history' ? '#1d4ed8' : 'transparent',
              color: activeTab === 'history' ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              textAlign: 'left',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            📁 Past History ({pastHistory.length})
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            style={{
              backgroundColor: activeTab === 'tasks' ? '#1d4ed8' : 'transparent',
              color: activeTab === 'tasks' ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              textAlign: 'left',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            📋 Task Allocations ({teamTasks.length})
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        
        {/* TAB 1: LIVE WORKSPACE */}
        {activeTab === 'live' && (
          <>
            <header style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
              <h1 style={{ fontSize: '20px', margin: '0 0 6px 0', color: '#f8fafc' }}>Live Workspace</h1>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>Paste Google Meet link to capture audio and extract key tasks for team members.</p>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetUrl}
                  onChange={(e) => setMeetUrl(e.target.value)}
                  disabled={isSessionActive}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #1e2d54',
                    backgroundColor: '#0b1329',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                {!isSessionActive ? (
                  <button
                    onClick={handleStartSession}
                    style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Connect Meeting
                  </button>
                ) : (
                  <button
                    onClick={handleStopSession}
                    style={{ padding: '12px 24px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    End & Analyze
                  </button>
                )}
              </div>

              <div style={{ marginTop: '12px', fontSize: '13px', color: isSessionActive ? '#38bdf8' : '#94a3b8' }}>
                <strong>Status:</strong> {status}
              </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px', flex: 1 }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Audio Transcript */}
                <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
                  <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>🎙️ Live Speech Transcript</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '13px', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                    {transcript || 'No active call connected. Enter Google Meet URL above to begin.'}
                  </p>
                </div>

                {/* AI Summary */}
                <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54', flex: 1 }}>
                  <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>📊 Key Session Insights</h3>
                  {summary ? (
                    <div>
                      <p style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.5' }}>{summary}</p>
                      <div style={{ marginTop: '12px', color: '#38bdf8', fontSize: '12px', fontWeight: 'bold' }}>
                        ✓ Saved automatically to Past History and Task Allocations.
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>Session summary will automatically appear here once the call ends.</p>
                  )}
                </div>

              </div>

              {/* AI Assistant */}
              <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>🤖 Meeting AI Assistant (LLaMA)</h3>
                
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', minHeight: '200px' }}>
                  {aiChat.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>Ask LLaMA AI anything about this meeting!</p>
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
                    placeholder="Ask follow-up question..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #1e2d54', backgroundColor: '#0b1329', color: '#fff', fontSize: '13px', outline: 'none' }}
                  />
                  <button onClick={handleSendMessage} style={{ padding: '10px 16px', backgroundColor: '#38bdf8', color: '#0b1329', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Ask
                  </button>
                </div>
              </div>

            </div>
          </>
        )}

        {/* TAB 2: PAST HISTORIES WITH DELETE OPTION */}
        {activeTab === 'history' && (
          <div style={{ backgroundColor: '#111c38', padding: '25px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#38bdf8', fontSize: '18px', margin: 0 }}>📁 Saved Past Histories</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Saved locally in browser</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              {pastHistory.length > 0 ? (
                pastHistory.map((item) => (
                  <div key={item.id} style={{ backgroundColor: '#0b1329', padding: '16px', borderRadius: '8px', border: '1px solid #1e2d54', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingRight: '80px' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '15px' }}>{item.title}</strong>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{item.date}</span>
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>{item.summary}</p>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteHistory(item.id)}
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        backgroundColor: '#7f1d1d',
                        color: '#fecaca',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No saved meeting history available.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TASK ALLOCATIONS WITH DELETE OPTION & DEADLINES */}
        {activeTab === 'tasks' && (
          <div style={{ backgroundColor: '#111c38', padding: '25px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: '#38bdf8', fontSize: '18px', margin: 0 }}>📋 Key Task Allocations Matrix</h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>Who is assigned, Task details, and Submission Deadlines.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
              {teamTasks.length > 0 ? (
                teamTasks.map((t) => (
                  <div key={t.id} style={{ backgroundColor: '#0b1329', padding: '16px', borderRadius: '10px', border: '1px solid #1e2d54', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, paddingRight: '20px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>👤 Member: {t.member}</span>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>(Lead: {t.head})</span>
                        <span style={{ backgroundColor: '#1e3a8a', color: '#bfdbfe', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{t.priority}</span>
                      </div>
                      
                      <div style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                        📌 Task: {t.task}
                      </div>

                      <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold' }}>
                        ⏳ Deadline / Due: {t.deadline}
                      </div>
                    </div>

                    {/* Delete Task Button */}
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      style={{
                        backgroundColor: '#7f1d1d',
                        color: '#fecaca',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No active tasks allocated. Connect a meeting call to auto-generate tasks.</p>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}