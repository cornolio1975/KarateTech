'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PrintBracketView } from '@/components/PrintBracketView';
import { db } from '@/db/dbClient';
import { Bout, Participant, Club, Category } from '@/db/types';

function PrintPreviewContent() {
  const searchParams = useSearchParams();
  const catIdParam = searchParams.get('catId');
  
  const [bouts, setBouts] = useState<Bout[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse multiple categories if comma-separated
  const selectedCatIds = catIdParam ? catIdParam.split(',') : [];

  useEffect(() => {
    async function loadData() {
      try {
        const [catList, pList, clList, bList] = await Promise.all([
          db.categories.list(),
          db.participants.list(),
          db.clubs.list(),
          db.bouts.list(),
        ]);
        setCategories(catList);
        setParticipants(pList);
        setClubs(clList);
        setBouts(bList);
      } catch (err) {
        console.error("Error loading print data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-800">
        <p className="text-xl font-bold animate-pulse">Loading Print Data...</p>
      </div>
    );
  }

  if (selectedCatIds.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-800">
        <p className="text-xl font-bold">No categories selected for printing.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 print:bg-white pb-10 print:pb-0">
      
      {/* Floating Toolbar (Hidden during actual printing) */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-slate-900 text-white px-6 py-3 shadow-lg">
        <div className="font-bold">
          📄 Tournament Print Preview
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.close()} 
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-semibold transition-colors"
          >
            Close
          </button>
          <button 
            onClick={() => window.print()} 
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold shadow transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Pages Container - Push down below toolbar */}
      <div className="pt-16 print:pt-0 flex flex-col gap-10 print:gap-0 print:block">
        {selectedCatIds.map((catId, index) => (
          <div 
            key={catId} 
            className="mx-auto shadow-2xl print:shadow-none print:border-none print:max-w-none print:!w-full max-w-[95vw] border border-slate-200 bg-white overflow-hidden"
            style={{ 
              pageBreakAfter: index < selectedCatIds.length - 1 ? 'always' : 'auto',
            }}
          >
            <PrintBracketView 
              bouts={bouts}
              participants={participants}
              clubs={clubs}
              categories={categories}
              selectedCatId={catId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PrintPreviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Preview...</div>}>
      <PrintPreviewContent />
    </Suspense>
  );
}
