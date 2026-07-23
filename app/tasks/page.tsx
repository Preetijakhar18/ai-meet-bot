'use client';

import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

interface Task {
  id: string;
  title: string;
  assignee: string;
  assignedBy: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  meetingTitle: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Verify production API endpoints & CORS policies',
      assignee: 'Team Member', // <--- Yahan generic role kar diya
      assignedBy: 'Workspace Admin (Head)',
      dueDate: 'July 24, 2026',
      status: 'In Progress',
      meetingTitle: 'Q3 Product Strategy & Action Assignment',
    },
    {
      id: '2',
      title: 'Finalize live QA sanity test cases',
      assignee: 'QA Lead',
      assignedBy: 'Workspace Admin (Head)',
      dueDate: 'July 24, 2026',
      status: 'Pending',
      meetingTitle: 'Q3 Product Strategy & Action Assignment',
    },
    {
      id: '3',
      title: 'Approve final UI deployment pipeline',
      assignee: 'Workspace Admin',
      assignedBy: 'Head/Lead',
      dueDate: 'July 25, 2026',
      status: 'Completed',
      meetingTitle: 'UI Design System Review',
    },
  ]);

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' }
          : t
      )
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        <header className="border-b border-slate-800/80 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              📋 Task Allocations
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Action items automatically extracted from meetings and delegated by Head/Lead
            </p>
          </div>
          <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
            {tasks.filter((t) => t.status !== 'Completed').length} Pending Tasks
          </span>
        </header>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:border-slate-700"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.status === 'Completed'}
                  onChange={() => toggleTaskStatus(task.id)}
                  className="mt-1 w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <div>
                  <h3
                    className={`text-sm font-semibold text-slate-100 ${
                      task.status === 'Completed' ? 'line-through text-slate-500' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-mono">
                    <span className="text-indigo-400">👤 {task.assignee}</span>
                    <span>👑 {task.assignedBy}</span>
                    <span>📅 Due: {task.dueDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <span className="text-[10px] text-slate-500 bg-slate-800 px-2.5 py-1 rounded-lg">
                  {task.meetingTitle}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    task.status === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : task.status === 'In Progress'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}