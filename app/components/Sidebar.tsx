'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Live Workspace', href: '/meeting', icon: '🎙️' },
    { name: 'Meeting History', href: '/history', icon: '📁' },
    { name: 'Task Allocations', href: '/tasks', icon: '📋' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700/80 p-1 flex items-center justify-center shadow-inner overflow-hidden">
            <Image
              src="/logo.png"
              alt="MeetAI Studio Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">MeetAI Studio</h2>
            <p className="text-[10px] text-indigo-400 font-mono">v1.0 • AI Engine</p>
          </div>
        </div>

        {/* Start New Session CTA */}
        <Link
          href="/meeting"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>+</span> Start New Session
        </Link>

        {/* Menu Navigation Links */}
        <nav className="space-y-1">
          <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500 px-3 mb-2">
            Menu
          </p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User / Workspace Admin Profile Footer */}
      <div className="border-t border-slate-800/80 pt-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold">
          WA
        </div>
        <div className="text-xs">
          <p className="font-semibold text-slate-200">Workspace Admin</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-slate-400 font-mono">Active Session</span>
          </div>
        </div>
      </div>
    </aside>
  );
}