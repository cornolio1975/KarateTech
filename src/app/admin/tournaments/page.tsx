'use client';

import React, { useState, useEffect } from 'react';
import { dbManager } from '@/db/dbClient';
import { localStore } from '@/db/localStore';
import { useTournament } from '@/context/TournamentContext';
import { Tournament, TournamentDatabase } from '@/db/types';
import { 
  Trophy, Save, AlertCircle, Sparkles 
} from 'lucide-react';

export default function TournamentConfigPage() {
  const { canModify, setTournamentName } = useTournament();
  const [mounted, setMounted] = useState(false);
  const [activeDb, setActiveDb] = useState<TournamentDatabase | null>(null);
  
  // Fields
  const [name, setName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [date, setDate] = useState('');
  const [dateIso, setDateIso] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [regClose, setRegClose] = useState('');
  const [regCloseIso, setRegCloseIso] = useState('');
  const [status, setStatus] = useState<Tournament['status']>('Open');
  const [featured, setFeatured] = useState(false);
  const [discipline, setDiscipline] = useState('Kata, Kumite');
  const [gold, setGold] = useState(0);
  const [silver, setSilver] = useState(0);
  const [bronze, setBronze] = useState(0);
  const [participants, setParticipants] = useState(0);
  const [clubs, setClubs] = useState(0);
  const [emoji, setEmoji] = useState('🏆');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    const db = dbManager.getActiveTournament();
    if (db) {
      setActiveDb(db);
      const t = db.tournament;
      setName(t.name);
      setOrganizer(t.organizer);
      setDate(t.date || '');
      setDateIso(t.date_iso || '');
      setVenue(t.venue);
      setCity(t.city);
      setRegClose(t.registration_close || '');
      setRegCloseIso(t.registration_close_iso || '');
      setStatus(t.status || 'Open');
      setFeatured(!!t.featured);
      setDiscipline(t.discipline || 'Kata, Kumite');
      setGold(t.medals_gold ?? 0);
      setSilver(t.medals_silver ?? 0);
      setBronze(t.medals_bronze ?? 0);
      setParticipants(t.total_participants ?? 0);
      setClubs(t.total_clubs ?? 0);
      setEmoji(t.poster_emoji || '🏆');
    }
  }, []);

  if (!mounted) return null;

  if (!activeDb) {
    return (
      <div className="p-6">
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl p-6 flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-6 w-6" />
          <h2 className="font-bold">No Active Project</h2>
          <p className="text-sm">Please open a tournament project from the Home page first.</p>
        </div>
      </div>
    );
  }

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return alert('You do not have permissions to modify this tournament.');
    
    setSaving(true);
    setMessage(null);

    // Auto-calculate readable display dates if empty
    const parseDisplayDate = () => {
      if (date && date.trim()) return date.trim();
      if (!dateIso) return '';
      const parsed = new Date(dateIso);
      return !isNaN(parsed.getTime()) 
        ? parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) 
        : '';
    };

    const parseDisplayReg = () => {
      if (regClose && regClose.trim()) return regClose.trim();
      if (!regCloseIso) return '';
      const parsed = new Date(regCloseIso);
      return !isNaN(parsed.getTime()) 
        ? parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) 
        : '';
    };

    const updatedT = {
      ...activeDb.tournament,
      name,
      organizer,
      date: parseDisplayDate(),
      date_iso: dateIso,
      venue,
      city,
      registration_close: parseDisplayReg(),
      registration_close_iso: regCloseIso,
      status,
      featured,
      discipline,
      medals_gold: gold,
      medals_silver: silver,
      medals_bronze: bronze,
      total_participants: participants,
      total_clubs: clubs,
      poster_emoji: emoji,
      banner_gradient: status === 'Completed' 
        ? 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 50%, #3b82f6 100%)' 
        : 'linear-gradient(135deg, #0b0f19 0%, #1a1035 40%, #2d1a00 100%)'
    };

    activeDb.tournament = updatedT;

    try {
      await localStore.saveTournament(activeDb);
      // Update global context so header updates instantly
      setTournamentName(name);
      setMessage({ type: 'success', text: 'Tournament configuration saved successfully.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to save tournament configuration.' });
    } finally {
      setSaving(false);
      // clear message after 3s
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="p-6 space-y-6 text-foreground w-full max-w-4xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Configuration</h1>
          <p className="text-sm text-muted-foreground">Manage the active tournament details, dates, and metadata.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        {/* Form Header */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-secondary/20">
          <Trophy className="h-4.5 w-4.5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Tournament Details</h2>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveSubmit} className="p-6 space-y-6 text-sm">
          {message && (
            <div className={`p-3 rounded-lg text-xs font-semibold ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {message.text}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-bold text-muted-foreground uppercase text-[10px] block">Tournament Name</label>
            <input
              type="text"
              required
              disabled={!canModify}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organizer */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground uppercase text-[10px] block">Organizer</label>
              <input
                type="text"
                required
                disabled={!canModify}
                value={organizer}
                onChange={e => setOrganizer(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
              />
            </div>
            {/* Emoji Indicator */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground uppercase text-[10px] block">Emoji Poster</label>
              <select
                disabled={!canModify}
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none text-foreground disabled:opacity-50"
              >
                <option value="🏆">🏆 Trophy</option>
                <option value="🥇">🥇 Gold Medal</option>
                <option value="🥋">🥋 Karate Gi</option>
                <option value="🔥">🔥 Flame</option>
                <option value="🌟">🌟 Star</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date ISO */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground uppercase text-[10px] block">Start Date</label>
              <input
                type="date"
                required
                disabled={!canModify}
                value={dateIso}
                onChange={e => setDateIso(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
              />
            </div>
            {/* Custom display date override */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground uppercase text-[10px] block flex items-center gap-1">
                Date Display override <Sparkles className="h-3 w-3 text-primary" />
              </label>
              <input
                type="text"
                disabled={!canModify}
                value={date}
                onChange={e => setDate(e.target.value)}
                placeholder="e.g. 15–16 Aug 2026 (Optional)"
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Venue */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground uppercase text-[10px] block">Venue</label>
              <input
                type="text"
                required
                disabled={!canModify}
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="e.g. PJ Town Hall"
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
              />
            </div>
            {/* City */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground uppercase text-[10px] block">City & State</label>
              <input
                type="text"
                required
                disabled={!canModify}
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Petaling Jaya, Selangor"
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reg Close ISO */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground uppercase text-[10px] block">Reg Close Date</label>
              <input
                type="date"
                required
                disabled={!canModify}
                value={regCloseIso}
                onChange={e => setRegCloseIso(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
              />
            </div>
            {/* Reg Close text override */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground uppercase text-[10px] block flex items-center gap-1">
                Reg Close Display override <Sparkles className="h-3 w-3 text-primary" />
              </label>
              <input
                type="text"
                disabled={!canModify}
                value={regClose}
                onChange={e => setRegClose(e.target.value)}
                placeholder="e.g. 31 July 2026 (Optional)"
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground uppercase text-[10px] block">Status</label>
              <select
                disabled={!canModify}
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none text-foreground disabled:opacity-50"
              >
                <option value="Open">Open</option>
                <option value="Closing Soon">Closing Soon</option>
                <option value="Full">Full</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            {/* Disciplines */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-muted-foreground uppercase text-[10px] block">Disciplines</label>
              <input
                type="text"
                disabled={!canModify}
                value={discipline}
                onChange={e => setDiscipline(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
              />
            </div>
          </div>

          {/* Advanced stats for completed tournament archiving */}
          <div className="border-t border-border/60 pt-6 space-y-4">
            <span className="font-bold text-muted-foreground text-[10px] uppercase block">Historical Telemetry (For Past Archives)</span>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground">Total Participants</label>
                <input
                  type="number"
                  disabled={!canModify}
                  value={participants}
                  onChange={e => setParticipants(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-secondary/80 border border-border rounded-lg text-foreground disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground">Total Clubs</label>
                <input
                  type="number"
                  disabled={!canModify}
                  value={clubs}
                  onChange={e => setClubs(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-secondary/80 border border-border rounded-lg text-foreground disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5 flex items-center md:pt-6 col-span-2 md:col-span-1">
                <label className="flex items-center gap-2 font-bold cursor-pointer text-muted-foreground select-none">
                  <input
                    type="checkbox"
                    disabled={!canModify}
                    checked={featured}
                    onChange={e => setFeatured(e.target.checked)}
                    className="rounded text-primary border-border focus:ring-primary disabled:opacity-50"
                  />
                  <span className="text-xs">Featured Event</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] text-yellow-500 font-bold">🥇 Gold Medals</label>
                <input
                  type="number"
                  disabled={!canModify}
                  value={gold}
                  onChange={e => setGold(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-secondary/80 border border-border rounded-lg text-foreground disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold">🥈 Silver Medals</label>
                <input
                  type="number"
                  disabled={!canModify}
                  value={silver}
                  onChange={e => setSilver(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-secondary/80 border border-border rounded-lg text-foreground disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-amber-600 font-bold">🥉 Bronze Medals</label>
                <input
                  type="number"
                  disabled={!canModify}
                  value={bronze}
                  onChange={e => setBronze(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-secondary/80 border border-border rounded-lg text-foreground disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button
              type="submit"
              disabled={!canModify || saving}
              className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
