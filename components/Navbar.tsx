'use client';

import React from 'react';
import { useAuth } from './AuthContext';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Store, 
  Users, 
  Truck, 
  Sparkles, 
  BarChart3, 
  Database,
  LogOut,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openSqlModal: () => void;
}

export function Navbar({ activeTab, setActiveTab, openSqlModal }: NavbarProps) {
  const { user, logout, switchDemoRole } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: HeartHandshake },
    { id: 'admin', label: 'Admin Command', icon: ShieldCheck, role: 'ADMIN' },
    { id: 'donor', label: 'Donor Hub', icon: Store, role: 'DONOR' },
    { id: 'recipient', label: 'Recipient NGO', icon: Users, role: 'RECIPIENT' },
    { id: 'volunteer', label: 'Volunteer Logistics', icon: Truck, role: 'VOLUNTEER' },
    { id: 'matching', label: 'Intelligent Matching', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      {/* Top Banner: Local DBMS Environment Indicator & Demo Switcher */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400 font-mono">
            Local MySQL 8.0+ (Port 3306) &bull; MongoDB (Port 27017) Active &bull; InnoDB ACID
          </span>
        </div>

        {/* Quick Demo Persona Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1">Switch Role:</span>
          <button
            onClick={() => { switchDemoRole('ADMIN'); setActiveTab('admin'); }}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${user?.role === 'ADMIN' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            Admin
          </button>
          <button
            onClick={() => { switchDemoRole('DONOR'); setActiveTab('donor'); }}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${user?.role === 'DONOR' ? 'bg-emerald-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            Donor
          </button>
          <button
            onClick={() => { switchDemoRole('RECIPIENT'); setActiveTab('recipient'); }}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${user?.role === 'RECIPIENT' ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            Recipient NGO
          </button>
          <button
            onClick={() => { switchDemoRole('VOLUNTEER'); setActiveTab('volunteer'); }}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${user?.role === 'VOLUNTEER' ? 'bg-cyan-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            Volunteer
          </button>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div 
            onClick={() => setActiveTab('overview')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-white block leading-tight">
                Smart Food Rescue
              </span>
              <span className="text-[11px] text-emerald-400 font-mono tracking-wider uppercase block">
                Redistribution Intelligence System
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}

            {/* SQL Studio Modal Trigger */}
            <button
              onClick={openSqlModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all ml-1"
              title="Open Interactive DBMS SQL & EXPLAIN Workbench"
            >
              <Database className="w-4 h-4" />
              SQL Studio
            </button>
          </nav>

          {/* User state */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {user.organization_name || user.role}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  user.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                  user.role === 'DONOR' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  user.role === 'RECIPIENT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}>
                  {user.role}
                </span>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => switchDemoRole('ADMIN')}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav pills */}
      <div className="md:hidden overflow-x-auto flex items-center gap-1 px-4 py-2 bg-slate-950 border-t border-slate-800 scrollbar-none">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === item.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          onClick={openSqlModal}
          className="whitespace-nowrap px-2.5 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40"
        >
          SQL Studio
        </button>
      </div>
    </header>
  );
}
