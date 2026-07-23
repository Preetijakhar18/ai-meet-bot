'use client';

import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

interface MeetingRecord {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  overview: string;
  actionItemsCount: number;
}

const initialHistoryData: MeetingRecord[] = [
  {
    id: '1',
    title: 'Production API & Security Review',
    date: '2026-07-23',
    time: '04:30 PM',
    duration: '15 mins',
    overview: 'Reviewed production endpoints and CORS policy configurations with Team Lead.',
    actionItemsCount: 2,
  },
  {
    id: '2',
    title: 'Sprint Planning & Module Demo',
    date: '2026-07-22',
    time: '11:00 AM',
    duration: '45 mins',
    overview: 'Discussed dynamic task assignment engine and frontend UI state flow.',
    actionItemsCount: 4,
  },
  {
    id: '3',
    title: 'Test Audio Recording Session',
    date: '2026-07-21',
    time: '02:15 PM',
    duration: '5 mins',
    overview: 'Initial microphone test and role-tagging validation.',
    actionItemsCount: 1,
  },
];

export default function HistoryPage() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>(initialHistoryData);

  // Delete handler function
  const handleDeleteMeeting = (id: string) => {
    const updatedMeetings = meetings.filter((meeting) => meeting.id !== id);
    setMeetings(updatedMeetings);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <header className="border-b border-slate-800/80 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              📜 Meeting History
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Review past recorded discussions, AI summaries, and clean up unwanted logs
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-slate-400">
            Total Sessions: <span className="text-indigo-400 font-bold">{meetings.length}</span>
          </span>
        </header>

        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
            <span>🗑️ No meeting history found. All sessions cleared!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {meetings.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition rounded-2xl p-5 flex flex-col justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">
                      {item.title}
                    </h3>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteMeeting(item.id)}
                      title="Delete Session"
                      className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mb-3">
                    <span>📅 {item.date}</span>
                    <span>⏰ {item.time}</span>
                    <span>⏳ {item.duration}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {item.overview}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    {item.actionItemsCount} Action Items
                  </span>

                  <button className="text-indigo-400 hover:text-indigo-300 font-medium text-xs flex items-center gap-1 cursor-pointer">
                    View Details ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}