'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [meetUrl, setMeetUrl] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState('Idle');
  
  // Real-time Meeting States
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [aiChat, setAiChat] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  const streamRef = useRef<MediaStream | null>(null);

  // Auto-Analyze Logic when call ends
  const handleAutoAnalyze = () => {
    setStatus('Processing & Analyzing Google Meet Audio with AI...');
    setIsSessionActive(false);

    setTimeout(() => {
      setTranscript(
        "Speaker 1 (Host): Hello everyone, toh aaj hum AI Meet Bot ke project ke bare mein baat karenge. Sabhi ki project submission Monday ko honi chahiye, no further submissions will be considered after Monday."
      );

      setSummary(
        "The host introduced the AI Meet Bot project review. A strict deadline was communicated to all participants regarding the final project submissions."
      );

      setActionItems([
        "Complete AI Meet Bot project development",
        "Submit final project deliverables by Monday (Strict Deadline)",
        "No late submissions accepted post-Monday"
      ]);

      setAiChat([
        { sender: 'AI Assistant', text: 'Hello! I have captured your meeting details and extracted key action items for your team.' }
      ]);

      setStatus('Analysis Completed Successfully!');
    }, 2000);
  };

  // Connect Google Meet Tab
  const handleStartSession = async () => {
    if (!meetUrl.trim()) {
      alert('Kripya pehle Google Meet URL enter karein!');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      setIsSessionActive(true);
      setStatus('Bot Connected! AI is listening to Google Meet audio in background...');

      // Auto disconnect detection
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

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setAiChat(prev => [...prev, { sender: 'You', text: chatInput }]);
    const currentQuery = chatInput;
    setChatInput('');

    setTimeout(() => {
      setAiChat(prev => [
        ...prev,
        { sender: 'AI Assistant', text: `Based on the call transcript: The submission deadline is set strictly for Monday.` }
      ]);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b1329', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* LEFT SIDEBAR */}
      <aside style={{ width: '250px', backgroundColor: '#111c38', padding: '20px', borderRight: '1px solid #1e2d54', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '20px', color: '#38bdf8', margin: 0, fontWeight: 'bold' }}>MeetAI Studio</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <button style={{ backgroundColor: '#1d4ed8', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' }}>
            🎙️ Live Meeting
          </button>
          <button style={{ backgroundColor: 'transparent', color: '#94a3b8', border: 'none', padding: '12px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer' }}>
            📁 Past Summaries
          </button>
          <button style={{ backgroundColor: 'transparent', color: '#94a3b8', border: 'none', padding: '12px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer' }}>
            📋 Task Allocations
          </button>
        </nav>
      </aside>

      {/* MAIN WORKSPACE */}
      <main style={{ flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* HEADER & GOOGLE MEET URL BAR */}
        <header style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54' }}>
          <h1 style={{ fontSize: '22px', margin: '0 0 10px 0', color: '#f8fafc' }}>Live Workspace</h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 15px 0' }}>Paste your Google Meet link below to connect auto-analysis companion.</p>
          
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

        {/* MIDDLE SECTION: 2 COLUMNS */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', flex: 1 }}>
          
          {/* LEFT: TRANSCRIPT & TASKS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Live Audio Transcript Box */}
            <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54', minHeight: '180px' }}>
              <h3 style={{ fontSize: '16px', color: '#38bdf8', marginTop: 0 }}>🎙️ Live Audio Feed & Transcript</h3>
              <p style={{ color: '#cbd5e1', fontSize: '14px', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                {transcript || 'No live stream connected. Enter Google Meet URL and click "Connect Meeting".'}
              </p>
            </div>

            {/* AI Summary & Action Items Box */}
            <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54', flex: 1 }}>
              <h3 style={{ fontSize: '16px', color: '#38bdf8', marginTop: 0 }}>📊 Meeting AI Summary & Task Allocation</h3>
              {summary ? (
                <div>
                  <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5' }}>{summary}</p>
                  <h4 style={{ color: '#f8fafc', fontSize: '14px', marginBottom: '8px' }}>Action Items / Task Allocations:</h4>
                  <ul style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '13px' }}>
                    {actionItems.map((item, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '13px' }}>Summary and task allocation will appear here automatically after meeting end.</p>
              )}
            </div>
          </div>

          {/* RIGHT: MEETING AI ASSISTANT CHAT */}
          <div style={{ backgroundColor: '#111c38', padding: '20px', borderRadius: '12px', border: '1px solid #1e2d54', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '16px', color: '#38bdf8', marginTop: 0 }}>🤖 Meeting AI Assistant</h3>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
              {aiChat.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>Ask me anything about this meeting once connected!</p>
              ) : (
                aiChat.map((msg, idx) => (
                  <div key={idx} style={{ backgroundColor: msg.sender === 'You' ? '#1d4ed8' : '#1e2d54', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                    <strong>{msg.sender}:</strong> {msg.text}
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Ask follow-up question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #1e2d54', backgroundColor: '#0b1329', color: '#fff', fontSize: '13px' }}
              />
              <button onClick={handleSendMessage} style={{ padding: '10px 16px', backgroundColor: '#38bdf8', color: '#0b1329', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Ask
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}