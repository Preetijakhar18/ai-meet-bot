'use client';

import { useState, useEffect } from 'react';

export default function MeetingPage() {
  const [meetUrl, setMeetUrl] = useState('');
  const [isBotEnabled, setIsBotEnabled] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');

  // 1. Extension se aane wale "MEETING_ENDED" signal ko listen karne ke liye
  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      // Check if message is coming from Chrome/Edge Extension
      if (event.data && event.data.action === "TRIGGER_AUTO_ANALYZE") {
        triggerAutoAnalyze();
      }
    };

    // Chrome Extension runtime listener (Direct Communication)
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
      (window as any).chrome.runtime.onMessage?.addListener((message: any) => {
        if (message.action === "TRIGGER_AUTO_ANALYZE") {
          triggerAutoAnalyze();
        }
      });
    }

    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, []);

  // 2. Auto-Analyze Function
  const triggerAutoAnalyze = () => {
    setStatus('Meeting ended! Analyzing audio & generating tasks...');
    setIsBotEnabled(false);

    setTimeout(() => {
      setTranscript(
        "Speaker 1: Hi team, let's discuss the project update.\nSpeaker 2: Yes, we need to finalize the dashboard UI and extension integration today."
      );
      setSummary(
        "Key Tasks Allocated:\n- Finalize Extension & Dashboard Communication\n- Review Vercel deployment status"
      );
      setStatus('Analysis Completed Successfully!');
    }, 2000);
  };

  const handleToggleBot = () => {
    if (!meetUrl.trim()) {
      alert('Kripya pehle Google Meet Link enter karein!');
      return;
    }

    if (!isBotEnabled) {
      setIsBotEnabled(true);
      setStatus('Bot Enabled! Waiting for you to join Google Meet...');
    } else {
      setIsBotEnabled(false);
      setStatus('Bot Disabled');
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2>MeetAI Studio - Auto Meeting Companion</h2>
      <p style={{ color: '#666' }}>
        Paste your Google Meet URL below. When enabled, the AI will automatically track the call background tab when you join, and auto-analyze when you leave.
      </p>

      {/* URL Input Box */}
      <div style={{ marginBottom: '20px', marginTop: '20px' }}>
        <input
          type="text"
          placeholder="https://meet.google.com/abc-defg-hij"
          value={meetUrl}
          onChange={(e) => setMeetUrl(e.target.value)}
          disabled={isBotEnabled}
          style={{
            width: '65%',
            padding: '12px',
            fontSize: '15px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            marginRight: '10px'
          }}
        />

        <button
          onClick={handleToggleBot}
          style={{
            padding: '12px 24px',
            backgroundColor: isBotEnabled ? '#dc2626' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isBotEnabled ? 'Disable Bot' : 'Enable Bot'}
        </button>
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '12px',
        backgroundColor: isBotEnabled ? '#e0f2fe' : '#f3f4f6',
        borderRadius: '6px',
        marginBottom: '25px',
        borderLeft: isBotEnabled ? '4px solid #0284c7' : '4px solid #9ca3af'
      }}>
        <strong>Status:</strong> {status}
      </div>

      {/* AI Output Section */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, border: '1px solid #e5e7eb', padding: '15px', borderRadius: '8px', minHeight: '150px' }}>
          <h3>Captured Transcript</h3>
          <p style={{ whiteSpace: 'pre-line', color: '#4b5563', fontSize: '14px' }}>
            {transcript || 'No transcript captured yet. Enable bot and join meeting.'}
          </p>
        </div>

        <div style={{ flex: 1, border: '1px solid #e5e7eb', padding: '15px', borderRadius: '8px', minHeight: '150px' }}>
          <h3>AI Summary & Action Items</h3>
          <p style={{ whiteSpace: 'pre-line', color: '#4b5563', fontSize: '14px' }}>
            {summary || 'No tasks generated yet.'}
          </p>
        </div>
      </div>
    </div>
  );
}