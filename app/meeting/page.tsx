'use client';

import { useState, useEffect } from 'react';

export default function MeetingPage() {
  const [meetUrl, setMeetUrl] = useState('');
  const [isBotEnabled, setIsBotEnabled] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');

  // LocalStorage / Chrome Sync se check karenge ki bot active hai ya nahi
  const handleToggleBot = () => {
    if (!meetUrl.trim()) {
      alert('Kripya pehle Google Meet Link enter karein!');
      return;
    }

    if (!isBotEnabled) {
      setIsBotEnabled(true);
      setStatus('Bot Enabled! Waiting for you to join Google Meet...');
      // Target URL save kar rahe hain background extension ke liye
      localStorage.setItem('active_meet_url', meetUrl);
      localStorage.setItem('bot_status', 'ENABLED');
    } else {
      setIsBotEnabled(false);
      setStatus('Bot Disabled');
      localStorage.removeItem('active_meet_url');
      localStorage.setItem('bot_status', 'DISABLED');
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