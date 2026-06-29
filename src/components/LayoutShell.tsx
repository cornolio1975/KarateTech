'use client';

import React, { useState } from 'react';
import { TournamentProvider } from '@/context/TournamentContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ImportModal from './ImportModal';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <TournamentProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Shell */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <TopBar onImportClick={() => setIsImportOpen(true)} />

          {/* Page Body */}
          <main className="flex-1 overflow-y-auto bg-background focus:outline-none relative">
            {children}
          </main>
        </div>

        {/* Global Import Modal */}
        <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      </div>
    </TournamentProvider>
  );
}
