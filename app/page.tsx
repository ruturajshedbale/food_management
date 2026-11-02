'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/Navbar';
import { OverviewLanding } from '@/components/OverviewLanding';
import { AdminDashboard } from '@/components/AdminDashboard';
import { DonorDashboard } from '@/components/DonorDashboard';
import { RecipientDashboard } from '@/components/RecipientDashboard';
import { VolunteerDashboard } from '@/components/VolunteerDashboard';
import { MatchingView } from '@/components/MatchingView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { SqlConsoleModal } from '@/components/SqlConsoleModal';
import { HeartHandshake, Database, Layers, ShieldCheck } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        openSqlModal={() => setSqlModalOpen(true)} 
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewLanding 
            setActiveTab={setActiveTab} 
            openSqlModal={() => setSqlModalOpen(true)} 
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard 
            openSqlModal={() => setSqlModalOpen(true)} 
          />
        )}

        {activeTab === 'donor' && <DonorDashboard />}

        {activeTab === 'recipient' && (
          <RecipientDashboard 
            setActiveTab={setActiveTab} 
          />
        )}

        {activeTab === 'volunteer' && <VolunteerDashboard />}

        {activeTab === 'matching' && <MatchingView />}

        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      {/* Interactive SQL Workbench Modal */}
      <SqlConsoleModal 
        isOpen={sqlModalOpen} 
        onClose={() => setSqlModalOpen(false)} 
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              <HeartHandshake className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-200">
              Smart Food Rescue & Redistribution Intelligence System
            </span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-mono">
            <span>MySQL 8.0+ (InnoDB)</span>
            <span>MongoDB WiredTiger</span>
            <span>Outbox Pattern</span>
            <span>Semantic Embeddings (384-d)</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Production Academic DBMS Project &bull; Fully Localized
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
