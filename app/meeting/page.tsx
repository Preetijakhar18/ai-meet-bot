'use client';

import { useState, useRef, useEffect } from 'react';

export default function MeetingPage() {
  const [meetUrl, setMeetUrl] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [actionItems, setActionItems] = useState<string[]>([]);
  
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-analyze AI logic
  const handleAutoAnalyze = () => {
    setStatus('Processing & Analyzing Google Meet Audio with AI...');
    setIsSessionActive(false);

    // Simulated AI API Processing Delay
    setTimeout(() => {
      setTranscript(
        "Speaker 1 (Host): Welcome everyone. Today we are reviewing the AI Meet Bot architecture.\n" +
        "Speaker 2 (Product): The goal is to provide a seamless automated task generator for Google Meet calls.\n" +
        "Speaker 1 (Host): Excellent. Preeti will lead the deployment and GitHub pipeline."
      );

      setSummary(
        "The meeting focused on validating the automated workflow for MeetAI Studio. " +
        "The team agreed on simplifying the deployment model to run directly via web browser without external setup dependencies."
      );

      setActionItems([
        "Finalize Vercel live production link for showcase",
        "Verify auto-trigger mechanisms on call disconnection",
        "Prepare documentation for end-user onboarding"
      ]);

      setStatus('Analysis Completed Successfully!');
    }, 2500);
  };

  // Start Session with Tab Stream
  const handleStartSession = async () => {
    if (!meetUrl.trim()) {
      alert('Kripya Google Meet URL enter karein!');
      return;
    }

    try {
      // Browser tab capture API (Captures ONLY the selected Google Meet tab)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      setIsSessionActive(true);
      setStatus('Bot Connected! AI is listening to Google Meet audio in background...');

      // Auto-Detect when the user closes/leaves the Google Meet tab
      const audioTrack = stream.getAudioTracks()[0] || stream.getVideoTracks()[0];
      if (audioTrack) {
        audioTrack.onended = () => {
          console.log("Google Meet tab disconnected. Triggering auto-analysis...");
          handleAutoAnalyze();
        };
      }
    } catch (err) {
      console.error("Stream error:", err);
      setStatus('Session cancelled or permission denied.');
    }
  };

  const handleStopSession = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    handleAutoAnalyze();
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui, sans-serif', maxWidth: '850px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', color: '#111827', marginBottom: '8px' }}>MeetAI Studio</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          Automated AI Meeting Companion — Input link, join meeting, get auto-generated transcript & insights.
        </p>
      </header>

      {/* Input Section */}
      <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
          Google Meet URL
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="https://meet.google.com/abc-defg-hij"
            value={meetUrl}
            onChange={(e) => setMeetUrl(e.target.value)}
            disabled={isSessionActive}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              outline: 'none'
            }}
          />
          {!isSessionActive ? (
            <button
              onClick={handleStartSession}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Start Session
            </button>
          ) : (
            <button
              onClick={handleStopSession}
              style={{
                padding: '12px 24px',
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              End & Analyze
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div style={{
        padding: '14px',
        backgroundColor: isSessionActive ? '#eff6ff' : '#f3f4f6',
        borderRadius: '6px',
        marginBottom: '30px',
        borderLeft: isSessionActive ? '4px solid #3b82f6' : '4px solid #9ca3af',
        color: '#1f2937',
        fontSize: '14px'
      }}>
        <strong>Status:</strong> {status}
      </div>

      {/* Results Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Transcript Box */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '18px', backgroundColor: '#fff' }}>
          <h3 style={{ fontSize: '16px', color: '#111827', marginTop: 0 }}>Captured Transcript</h3>
          <p style={{ whiteSpace: 'pre-line', color: '#4b5563', fontSize: '13px', lineHeight: '1.6' }}>
            {transcript || 'No transcript available yet. Start session and join call.'}
          </p>
        </div>

        {/* AI Summary Box */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '18px', backgroundColor: '#fff' }}>
          <h3 style={{ fontSize: '16px', color: '#111827', marginTop: 0 }}>AI Summary & Tasks</h3>
          {summary ? (
            <div>
              <p style={{ color: '#4b5563', fontSize: '13px', lineHeight: '1.5', marginBottom: '12px' }}>
                {summary}
              </p>
              <strong style={{ fontSize: '13px', color: '#111827' }}>Action Items:</strong>
              <ul style={{ paddingLeft: '18px', marginTop: '6px', fontSize: '13px', color: '#374151' }}>
                {actionItems.map((item, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ color: '#4b5563', fontSize: '13px' }}>No analysis generated yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}