'use client';

import React, { useState, useEffect } from 'react';
import { db, basePath } from '@/db/dbClient';
import { DisplayPlaylist, DisplayPlaylistSlide } from '@/db/types';
import { 
  Tv, Plus, Trash2, Edit3, Save, X, Play, Clock, Sparkles, 
  ChevronUp, ChevronDown, CheckCircle, Layers, Monitor, Award, Calendar, Volume2 
} from 'lucide-react';

interface DisplayPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlaylist?: (playlist: DisplayPlaylist) => void;
}

const DEFAULT_SLIDE_TYPES = [
  { type: 'live_scoreboard', name: 'Live Kumite Scoreboard', icon: Tv, defaultDuration: 25 },
  { type: 'kata_scoreboard', name: 'WKF 7-Judge Kata Scoreboard', icon: Award, defaultDuration: 25 },
  { type: 'bracket', name: 'Category Brackets & Draws', icon: Layers, defaultDuration: 20 },
  { type: 'medals', name: 'Club Medal Standings Leaderboard', icon: Award, defaultDuration: 15 },
  { type: 'schedule', name: 'Upcoming Tatami Match Schedule', icon: Calendar, defaultDuration: 15 },
  { type: 'announcement', name: 'Custom Announcement / Sponsor Banner', icon: Volume2, defaultDuration: 12 },
] as const;

export default function DisplayPlaylistModal({ isOpen, onClose, onSelectPlaylist }: DisplayPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<DisplayPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / New state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tatami, setTatami] = useState('ALL');
  const [slides, setSlides] = useState<DisplayPlaylistSlide[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
    }
  }, [isOpen]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const list = await db.displayPlaylists.list();
      setPlaylists(list);
    } catch (e) {
      console.error('Failed to load display playlists:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setName('New Display Presentation');
    setDescription('Custom presentation sequence for spectator screen.');
    setTatami('ALL');
    setSlides([
      { id: 'slide-1', type: 'live_scoreboard', title: 'Live Kumite Scoreboard', duration_seconds: 25, tatami_filter: 'ALL' },
      { id: 'slide-2', type: 'kata_scoreboard', title: 'WKF Kata Scoreboard', duration_seconds: 25, tatami_filter: 'ALL' },
      { id: 'slide-3', type: 'medals', title: 'Club Medal Standings', duration_seconds: 15 }
    ]);
    setIsEditing(true);
  };

  const handleEdit = (pl: DisplayPlaylist) => {
    setEditingId(pl.id);
    setName(pl.name);
    setDescription(pl.description || '');
    setTatami(pl.tatami || 'ALL');
    setSlides([...pl.slides]);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      setLoading(true);
      await db.displayPlaylists.delete(id);
      await loadPlaylists();
      if (editingId === id) setIsEditing(false);
    } catch (e) {
      console.error('Error deleting playlist:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlide = (type: DisplayPlaylistSlide['type']) => {
    const meta = DEFAULT_SLIDE_TYPES.find(t => t.type === type);
    const newSlide: DisplayPlaylistSlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title: meta?.name || 'Custom Presentation Slide',
      duration_seconds: meta?.defaultDuration || 20,
      tatami_filter: tatami,
      announcement_text: type === 'announcement' ? 'Welcome to KarateTech Championship 2026!' : undefined
    };
    setSlides([...slides, newSlide]);
  };

  const handleRemoveSlide = (idx: number) => {
    setSlides(slides.filter((_, i) => i !== idx));
  };

  const handleMoveSlide = (idx: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? idx - 1 : idx + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const copy = [...slides];
    const temp = copy[idx];
    copy[idx] = copy[newIndex];
    copy[newIndex] = temp;
    setSlides(copy);
  };

  const handleSavePlaylist = async () => {
    if (!name.trim()) {
      alert('Please enter a playlist name.');
      return;
    }
    if (slides.length === 0) {
      alert('Playlist must contain at least one slide.');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await db.displayPlaylists.update(editingId, {
          name,
          description,
          tatami,
          slides
        });
      } else {
        await db.displayPlaylists.add({
          name,
          description,
          tatami,
          is_active: true,
          slides
        });
      }
      await loadPlaylists();
      setIsEditing(false);
    } catch (e) {
      console.error('Error saving display playlist:', e);
      alert('Failed to save playlist to database.');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchDisplay = (pl: DisplayPlaylist) => {
    const targetUrl = `${basePath}/display?playlistId=${pl.id}`;
    if (onSelectPlaylist) {
      onSelectPlaylist(pl);
    }
    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-foreground animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl">
              <Tv className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Display Playlists & Presentation Manager</h2>
              <p className="text-xs text-muted-foreground">Configure live display playlists saved in the database for any device/platform.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isEditing ? (
            /* LIST VIEW */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Saved Database Playlists</h3>
                  <p className="text-xs text-muted-foreground">Select a playlist to edit, modify, or launch on the live display screen.</p>
                </div>
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Playlist</span>
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-xs font-semibold text-muted-foreground animate-pulse">
                  Loading saved database playlists...
                </div>
              ) : playlists.length === 0 ? (
                <div className="p-12 border border-dashed border-border rounded-xl text-center space-y-3">
                  <Monitor className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <div className="text-xs text-muted-foreground font-semibold">No custom playlists created yet.</div>
                  <button
                    onClick={handleCreateNew}
                    className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Default Presentation</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      className="bg-secondary/10 border border-border hover:border-primary/40 rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all duration-200 shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span>{pl.name}</span>
                            {pl.is_active && (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                Active
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] bg-secondary px-2.5 py-1 rounded-md font-bold text-muted-foreground border border-border shrink-0">
                            {pl.tatami || 'ALL TATAMIS'}
                          </span>
                        </div>

                        {pl.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {pl.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md">
                            {pl.slides.length} Slides ({pl.slides.reduce((acc, s) => acc + (s.duration_seconds || 15), 0)}s loop)
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(pl)}
                            className="px-2.5 py-1.5 hover:bg-secondary border border-border rounded-lg text-xs font-semibold text-foreground transition flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Modify</span>
                          </button>
                          <button
                            onClick={() => handleDelete(pl.id)}
                            className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-lg text-xs font-semibold text-red-400 transition cursor-pointer"
                            title="Delete Playlist"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* PLAYLIST LAUNCH DISPLAY SCREEN BUTTON */}
                        <button
                          onClick={() => handleLaunchDisplay(pl)}
                          className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-lg text-xs transition cursor-pointer shadow-md flex items-center gap-1.5 uppercase tracking-wide border border-yellow-400/50"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Playlist Launch Display Screen</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* EDIT / CREATE FORM */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {editingId ? 'Modify Display Playlist' : 'Create New Display Playlist'}
                  </h3>
                  <p className="text-xs text-muted-foreground">Configure playlist details, sequence slides, and set rotation timers.</p>
                </div>

                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs font-semibold hover:bg-secondary/80 text-foreground transition cursor-pointer"
                >
                  Back to List
                </button>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Playlist Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Main Stage Spectator Loop"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Target Tatami Filter</label>
                  <select
                    value={tatami}
                    onChange={e => setTatami(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">All Tatamis (ALL)</option>
                    <option value="Tatami 1">Tatami 1</option>
                    <option value="Tatami 2">Tatami 2</option>
                    <option value="Tatami 3">Tatami 3</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Optional playlist summary or venue details..."
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Add Slides Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Presentation Slides ({slides.length})
                  </label>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-semibold mr-1">+ Add Slide:</span>
                    {DEFAULT_SLIDE_TYPES.map(st => (
                      <button
                        key={st.type}
                        onClick={() => handleAddSlide(st.type as any)}
                        className="px-2.5 py-1 bg-secondary hover:bg-primary/20 hover:border-primary/40 border border-border rounded-lg text-[10px] font-bold text-foreground transition flex items-center gap-1 cursor-pointer"
                      >
                        <st.icon className="h-3 w-3 text-primary" />
                        <span>{st.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slides List */}
                <div className="space-y-2.5">
                  {slides.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="bg-card border border-border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMoveSlide(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-secondary rounded text-muted-foreground disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveSlide(idx, 'down')}
                            disabled={idx === slides.length - 1}
                            className="p-1 hover:bg-secondary rounded text-muted-foreground disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <span className="font-mono text-xs font-bold text-muted-foreground w-6 text-center">
                          #{idx + 1}
                        </span>

                        <div className="min-w-0 flex-1 space-y-1">
                          <input
                            type="text"
                            value={s.title}
                            onChange={e => {
                              const copy = [...slides];
                              copy[idx].title = e.target.value;
                              setSlides(copy);
                            }}
                            className="w-full px-2 py-1 bg-secondary border border-border rounded text-xs font-bold text-foreground focus:outline-none"
                          />
                          {s.type === 'announcement' && (
                            <input
                              type="text"
                              value={s.announcement_text || ''}
                              onChange={e => {
                                const copy = [...slides];
                                copy[idx].announcement_text = e.target.value;
                                setSlides(copy);
                              }}
                              placeholder="Enter custom announcement banner message..."
                              className="w-full px-2 py-1 bg-secondary/80 border border-border rounded text-[11px] font-medium text-foreground focus:outline-none"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Slide Type Tag */}
                        <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md uppercase">
                          {s.type.replace('_', ' ')}
                        </span>

                        {/* Duration Selector */}
                        <div className="flex items-center gap-1 bg-secondary px-2 py-1 border border-border rounded-lg">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <select
                            value={s.duration_seconds}
                            onChange={e => {
                              const copy = [...slides];
                              copy[idx].duration_seconds = Number(e.target.value);
                              setSlides(copy);
                            }}
                            className="bg-transparent text-xs font-bold text-foreground focus:outline-none"
                          >
                            <option value={10}>10s</option>
                            <option value={15}>15s</option>
                            <option value={20}>20s</option>
                            <option value={25}>25s</option>
                            <option value={30}>30s</option>
                            <option value={45}>45s</option>
                            <option value={60}>60s</option>
                          </select>
                        </div>

                        <button
                          onClick={() => handleRemoveSlide(idx)}
                          className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-secondary border border-border hover:bg-secondary/80 text-foreground rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlaylist}
                  disabled={loading}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Playlist to Database</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
