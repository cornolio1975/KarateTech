'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FolderPlus, FolderOpen, Download, Upload, Trash2, 
  Archive, MoreVertical, Calendar, MapPin, Search, Plus, Cloud
} from 'lucide-react';
import { dbManager, supabase } from '@/db/dbClient';
import { localStore } from '@/db/localStore';
import { Tournament, TournamentDatabase } from '@/db/types';

export default function TournamentManager() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // New Tournament Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newDate, setNewDate] = useState('');
  
  // Ref for file import
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const list = await localStore.listTournaments();
      setTournaments(list);
    } catch (e) {
      console.error('Failed to load tournaments', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTournament = async (id: string) => {
    try {
      setLoading(true);
      const success = await dbManager.setActiveTournament(id);
      if (success) {
        router.push('/dashboard/scoreboard');
      } else {
        alert('Failed to open tournament project. The file might be corrupted.');
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert('Error opening tournament.');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete "${name}"? This cannot be undone unless you have an exported backup.`)) {
      await localStore.deleteTournament(id);
      await loadTournaments();
    }
  };

  const handleExport = async (id: string, name: string) => {
    const db = await localStore.loadTournament(id);
    if (!db) return;
    
    const blob = new Blob([JSON.stringify(db)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.ktournament`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const db = JSON.parse(content) as TournamentDatabase;
        
        if (!db.tournament || !db.tournament.id) {
          throw new Error('Invalid .ktournament file format');
        }

        await localStore.saveTournament(db);
        await loadTournaments();
        alert('Tournament imported successfully!');
      } catch (err) {
        console.error(err);
        alert('Failed to import tournament. The file might be corrupted or incompatible.');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be imported again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    const newId = `tr_${Date.now()}`;
    const newDb: TournamentDatabase = {
      tournament: {
        id: newId,
        name: newName.trim(),
        organizer: newOrg.trim() || 'New Organizer',
        date: newDate ? new Date(newDate).toLocaleDateString() : new Date().toLocaleDateString(),
        date_iso: new Date(newDate || Date.now()).toISOString(),
        venue: 'Main Stadium',
        city: 'Local City',
        registration_close: '',
        registration_close_iso: '',
        status: 'Draft',
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      },
      participants: [],
      categories: [],
      clubs: [],
      coaches: [],
      bouts: [],
      payments: [],
      medical: [],
      documents: [],
      teams: [],
      team_members: [],
      participant_categories: [],
      activity_logs: [],
      audit_logs: [],
      officials: [],
      display_playlists: []
    };

    await localStore.saveTournament(newDb);
    setShowNewModal(false);
    setNewName('');
    setNewOrg('');
    setNewDate('');
    
    // Automatically open it
    await handleOpenTournament(newId);
  };

  const filteredTournaments = tournaments.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Official Header with Dual Branding */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 bg-slate-950/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Subtle metallic glow background */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-red-900/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-900/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-5 z-10">
            <div className="relative group shrink-0">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-red-600 via-slate-300 to-blue-600 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
                <img 
                  src="/karatetech-logo.png" 
                  alt="KarateTech Logo" 
                  className="w-full h-full object-cover rounded-full bg-slate-900 drop-shadow" 
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-white tracking-tight font-sans flex items-center gap-0.5">
                  <span className="text-red-600">Karate</span>
                  <span className="text-sky-400">Tech</span>
                  <sup className="text-xs font-bold text-slate-400 -mt-2 ml-0.5 select-none">©</sup>
                </h1>
                <span className="bg-red-500/10 text-red-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-red-500/20">
                  WKF Standard
                </span>
              </div>
              
              {/* Professional SP SPORTDATA SOLUTION Logo Block (Centered) */}
              <div className="mt-2.5 space-y-1.5 flex flex-col items-center text-center w-full max-w-fit">
                {/* Row 1: SP SPORTDATA (Centered) */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black italic tracking-tighter leading-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    <span className="text-white bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">S</span>
                    <span className="text-red-600 font-black -ml-0.5">P</span>
                  </span>
                  <span className="text-base md:text-lg font-black italic tracking-[0.12em] text-white uppercase leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    SPORTDATA
                  </span>
                </div>

                {/* Row 2: — SOLUTION — (Centered with symmetric red accent lines) */}
                <div className="flex items-center justify-center gap-2 w-full">
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-red-600 to-red-500 rounded-full"></div>
                  <span className="text-xs font-black text-red-500 tracking-[0.3em] uppercase leading-none drop-shadow">
                    SOLUTION
                  </span>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-red-500 via-red-600 to-transparent rounded-full"></div>
                </div>

                {/* Row 3: PRECISION. SPEED. RESULTS. (Centered) */}
                <div className="pt-0.5 text-[10px] md:text-[11px] font-extrabold tracking-[0.2em] text-slate-300 uppercase font-sans whitespace-nowrap drop-shadow text-center">
                  PRECISION. SPEED. RESULTS.
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto z-10">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search tournaments..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 placeholder:text-slate-500"
              />
            </div>
            <input 
              type="file" 
              accept=".ktournament,.json" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImport} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <Upload size={16} /> <span className="hidden md:inline">Import</span>
            </button>
            <button 
              onClick={() => setShowNewModal(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-red-950/60 cursor-pointer"
            >
              <Plus size={16} /> <span>New Tournament</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20 text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <FolderPlus size={48} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-bold mb-2">No Tournaments Found</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              You haven't created any local tournament databases yet, or your search didn't match anything.
            </p>
            <button 
              onClick={() => setShowNewModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto transition"
            >
              <Plus size={18} /> Create Your First Tournament
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map(t => (
              <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition group flex flex-col">
                <div className={`h-2 ${t.status === 'Completed' ? 'bg-green-500' : t.status === 'Draft' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <h3 className="font-bold text-lg leading-tight line-clamp-2">{t.name}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!!supabase && <span title="Cloud Synced"><Cloud size={14} className="text-indigo-400" /></span>}
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                        t.status === 'Completed' ? 'bg-green-900/30 text-green-400 border-green-800' : 
                        t.status === 'Draft' ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 
                        'bg-indigo-900/30 text-indigo-400 border-indigo-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-400 mb-6 flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} /> <span>{t.date || 'Date not set'}</span>
                    </div>
                    {t.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} /> <span className="truncate">{t.venue}, {t.city}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 mb-4">
                    Last modified: {new Date(t.last_modified || t.created_at || Date.now()).toLocaleString()}
                  </div>

                  <div className="flex items-center gap-2 mt-auto">
                    <button 
                      onClick={() => handleOpenTournament(t.id)}
                      className="flex-1 bg-white/10 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <FolderOpen size={16} /> Open
                    </button>
                    
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      title="Delete Tournament Profile"
                      className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      onClick={() => handleExport(t.id, t.name)}
                      title="Export Backup (.ktournament)"
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 transition cursor-pointer"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Tournament Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Create New Tournament</h2>
            <form onSubmit={handleCreateNew} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Tournament Name *</label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none" 
                  placeholder="e.g. National Open 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Organizer</label>
                <input 
                  type="text" 
                  value={newOrg}
                  onChange={e => setNewOrg(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Event Date</label>
                <input 
                  type="date" 
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none" 
                />
              </div>
              
              <div className="flex items-center gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-2 rounded-lg font-bold text-slate-400 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold transition shadow-lg shadow-indigo-900/50"
                >
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
