'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/db/dbClient';
import { Bout, Participant, Category, Club, isKataCategory } from '@/db/types';
import { Zap, Play, Check, ShieldAlert, Award, ArrowRight, RefreshCw, Calendar, MapPin, Tv, Trophy, Sparkles, CheckCircle2, ChevronRight, FileText, Flag } from 'lucide-react';
import { useTournament } from '@/context/TournamentContext';
import KataResultBookModal from '@/components/KataResultBookModal';

const OFFICIAL_WKF_KATAS = [
  'Anan', 'Anan Dai', 'Annanko', 'Aoyanagi', 'Bassai Dai', 'Bassai Sho',
  'Chatanyara Kushanku', 'Chinte', 'Chinto', 'Enpi', 'Fukygata', 'Gankaku',
  'Garoryu', 'Gojushiho', 'Gojushiho Dai', 'Gojushiho Sho', 'Hakucho', 'Hangetsu',
  'Haufa', 'Heiku', 'Ishimine Bassai', 'Itosu Rohai', 'Jiin', 'Jion', 'Jitte',
  'Jyuroku', 'Kanchin', 'Kanku Dai', 'Kanku Sho', 'Kanshu', 'Kururunfa', 'Kusanku',
  'Matsumura Bassai', 'Matsumura Rohai', 'Meikyo', 'Nipaipo', 'Niseishi', 'Ohan',
  'Ohan Dai', 'Paiku', 'Papuren', 'Passai', 'Rohai', 'Saifa', 'Sanchin', 'Sanseiru',
  'Seienchin', 'Seipai', 'Seiryu', 'Seishan', 'Shinpa', 'Shinsei', 'Shisochin',
  'Sochin', 'Suparinpei', 'Unshu', 'Unsu', 'Useishi', 'Wankan', 'Wanshu'
].sort();

export default function KataControlPanelPage() {
  const { tournamentName } = useTournament();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bouts, setBouts] = useState<Bout[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);

  // Selection state
  const [selectedCatId, setSelectedCatId] = useState<string>('ALL');
  const [selectedBoutId, setSelectedBoutId] = useState<string>('');
  const [panelSize, setPanelSize] = useState<7 | 5>(7); // 7-judge standard or 5-judge panel

  // Current active bout state
  const [currentBout, setCurrentBout] = useState<Bout | null>(null);
  const [kataA, setKataA] = useState<string>('Suparinpei');
  const [kataB, setKataB] = useState<string>('Anan Dai');
  const [judgeScoresA, setJudgeScoresA] = useState<number[]>([8.2, 8.4, 8.1, 8.3, 8.5, 8.2, 8.4]);
  const [judgeScoresB, setJudgeScoresB] = useState<number[]>([8.0, 8.2, 8.3, 8.1, 8.4, 8.2, 8.3]);
  const [activeScoringTab, setActiveScoringTab] = useState<'AKA' | 'AO'>('AKA');
  const [scoringMethod, setScoringMethod] = useState<'Points' | 'Flags'>('Points');
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  // Modal state
  const [isResultBookOpen, setIsResultBookOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bList, pList, catList, clList] = await Promise.all([
        db.bouts.list(),
        db.participants.list(),
        db.categories.list(),
        db.clubs.list(),
      ]);
      
      // Filter kata-relevant categories if name contains Kata or default all
      setBouts(bList);
      setParticipants(pList);
      setCategories(catList);
      setClubs(clList);

      // Auto-select first active bout if available
      if (bList.length > 0) {
        const activeBout = bList.find(b => b.status === 'Running') || bList[0];
        if (activeBout) {
          selectBout(activeBout);
        }
      }
    } catch (err) {
      console.error('Error loading Kata control data:', err);
    } fontFinally: {
      setLoading(false);
    }
  };

  const selectBout = (bout: Bout) => {
    setCurrentBout(bout);
    setSelectedBoutId(bout.id);
    setSelectedCatId(bout.category_id);

    setKataA(bout.kata_a || 'Suparinpei');
    setKataB(bout.kata_b || 'Anan Dai');

    const defaultScoresA = bout.judge_scores_a && bout.judge_scores_a.length > 0 
      ? bout.judge_scores_a 
      : (scoringMethod === 'Flags' ? [0,0,0,0,0,0,0] : [8.2, 8.4, 8.1, 8.3, 8.5, 8.2, 8.4]);
    const defaultScoresB = bout.judge_scores_b && bout.judge_scores_b.length > 0 
      ? bout.judge_scores_b 
      : (scoringMethod === 'Flags' ? [0,0,0,0,0,0,0] : [8.0, 8.2, 8.3, 8.1, 8.4, 8.2, 8.3]);

    setJudgeScoresA(defaultScoresA.slice(0, panelSize));
    setJudgeScoresB(defaultScoresB.slice(0, panelSize));
    
    // Auto-detect if loaded bout was a Flags match
    if (bout.judge_scores_a && bout.judge_scores_a.length > 0) {
      const isFlagsMatch = bout.judge_scores_a.every(s => s === 0 || s === 1) && bout.judge_scores_b?.every(s => s === 0 || s === 1);
      if (isFlagsMatch) {
        setScoringMethod('Flags');
      } else {
        setScoringMethod('Points');
      }
    }
    setSelectedWinnerId(bout.winner_id || null);
  };

  // Helper to trim High (MAX) and Low (MIN) scores and calculate Total Score
  const calculateTotalScore = (scores: number[], method: 'Points' | 'Flags' = scoringMethod) => {
    if (!scores || scores.length === 0) return 0;
    if (method === 'Flags') return scores.reduce((a, b) => a + b, 0);
    if (scores.length <= 2) return scores.reduce((a, b) => a + b, 0);

    const sorted = [...scores].sort((a, b) => a - b);
    const minVal = sorted[0];
    const maxVal = sorted[sorted.length - 1];

    let minRemoved = false;
    let maxRemoved = false;

    const trimmed = scores.filter(s => {
      if (s === minVal && !minRemoved) {
        minRemoved = true;
        return false;
      }
      if (s === maxVal && !maxRemoved) {
        maxRemoved = true;
        return false;
      }
      return true;
    });

    return trimmed.reduce((a, b) => a + b, 0);
  };

  const totalScoreA = calculateTotalScore(judgeScoresA, scoringMethod);
  const totalScoreB = calculateTotalScore(judgeScoresB, scoringMethod);

  // Auto recommend winner
  useEffect(() => {
    if (currentBout?.participant_a_id && currentBout?.participant_b_id) {
      if (totalScoreA > totalScoreB) {
        setSelectedWinnerId(currentBout.participant_a_id);
      } else if (totalScoreB > totalScoreA) {
        setSelectedWinnerId(currentBout.participant_b_id);
      }
    }
  }, [totalScoreA, totalScoreB, currentBout]);

  const updateJudgeScore = (athlete: 'AKA' | 'AO', idx: number, val: number) => {
    const clamped = Math.max(5.0, Math.min(10.0, Math.round(val * 10) / 10));
    if (athlete === 'AKA') {
      const copy = [...judgeScoresA];
      copy[idx] = clamped;
      setJudgeScoresA(copy);
    } else {
      const copy = [...judgeScoresB];
      copy[idx] = clamped;
      setJudgeScoresB(copy);
    }
  };

  const setAllJudgeScores = (athlete: 'AKA' | 'AO', presetVal: number) => {
    const arr = Array(panelSize).fill(presetVal);
    if (athlete === 'AKA') setJudgeScoresA(arr);
    else setJudgeScoresB(arr);
  };

  const handleSaveAndCompleteBout = async () => {
    if (!currentBout) return;
    try {
      setIsSaving(true);
      const winner = selectedWinnerId || (totalScoreA >= totalScoreB ? currentBout.participant_a_id : currentBout.participant_b_id);
      
      const updates: Partial<Bout> = {
        kata_a: kataA,
        kata_b: kataB,
        judge_scores_a: judgeScoresA,
        judge_scores_b: judgeScoresB,
        total_score_a: totalScoreA,
        total_score_b: totalScoreB,
        score_a: Math.round(totalScoreA),
        score_b: Math.round(totalScoreB),
        winner_id: winner,
        status: 'Completed',
      };

      const updatedBout = await db.bouts.updateBoutState(currentBout.id, updates);
      setCurrentBout(updatedBout);
      
      // Refresh list
      await loadData();
      
      // Open Result Book Modal
      setIsResultBookOpen(true);
    } catch (err) {
      console.error('Error completing Kata bout:', err);
      alert('Failed to save bout results.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRematch = async () => {
    if (!currentBout) return;
    if (!window.confirm("Are you sure you want to reset this match? All saved scores and the winner decision will be permanently deleted from the database.")) return;

    try {
      setIsSaving(true);
      const updates: Partial<Bout> = {
        kata_a: undefined,
        kata_b: undefined,
        judge_scores_a: [],
        judge_scores_b: [],
        total_score_a: 0,
        total_score_b: 0,
        score_a: 0,
        score_b: 0,
        winner_id: null as any,
        status: 'Running',
      };

      const updatedBout = await db.bouts.updateBoutState(currentBout.id, updates);
      
      // Update local state directly so we don't need a full reload
      setKataA('Suparinpei');
      setKataB('Anan Dai');
      setJudgeScoresA(scoringMethod === 'Flags' ? [0,0,0,0,0,0,0] : [8.2, 8.4, 8.1, 8.3, 8.5, 8.2, 8.4]);
      setJudgeScoresB(scoringMethod === 'Flags' ? [0,0,0,0,0,0,0] : [8.0, 8.2, 8.3, 8.1, 8.4, 8.2, 8.3]);
      setSelectedWinnerId(null);
      setCurrentBout(updatedBout);
      
      // Refresh list
      await loadData();
      
    } catch (err) {
      console.error('Error resetting bout:', err);
      alert('Failed to reset match.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  // Kata-only categories
  const kataCategories = categories.filter(isKataCategory);
  const kataCatIds = new Set(kataCategories.map(c => c.id));

  // Participant lookups
  const participantA = participants.find(p => p.id === currentBout?.participant_a_id);
  const participantB = participants.find(p => p.id === currentBout?.participant_b_id);
  const clubA = clubs.find(c => c.id === participantA?.club_id);
  const clubB = clubs.find(c => c.id === participantB?.club_id);
  const category = categories.find(c => c.id === currentBout?.category_id);

  // Helper for max/min score indices
  const getScoreStatusIndex = (scores: number[], index: number) => {
    if (!scores || scores.length < 3) return 'active';
    const sorted = [...scores].sort((a, b) => a - b);
    const minVal = sorted[0];
    const maxVal = sorted[sorted.length - 1];

    const val = scores[index];
    if (val === minVal && scores.indexOf(val) === index) return 'min';
    if (val === maxVal && scores.lastIndexOf(val) === index) return 'max';
    return 'active';
  };

  const filteredBouts = bouts.filter(b => {
    if (b.status === 'Walkover') return false;
    if (!kataCatIds.has(b.category_id)) return false;
    return selectedCatId === 'ALL' || b.category_id === selectedCatId;
  });

  return (
    <div className="min-h-screen bg-[#07070a] text-white p-6 pb-12">
      
      {/* Top Banner (Identical to Kumite Scoreboard Header) */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="h-5 w-5 text-yellow-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-yellow-400">
                WKF KATA SCOREBOARD & CONTROL MODULE
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              WKF Kata Control Panel
            </h1>
            <p className="text-gray-400 text-sm mt-1">{tournamentName || 'Kelab Karate Do Senshi Goju-Ryu Championship'}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync Matches
            </button>
            
            <button
              onClick={() => setIsResultBookOpen(true)}
              disabled={!currentBout}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 hover:border-yellow-400/50 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              Official Result Book
            </button>
          </div>
        </div>
      </div>

      {/* Control Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Panel: Category & Bout Selector */}
        <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-md h-fit">
          <h2 className="text-base font-black tracking-wider uppercase mb-6 text-gray-300">
            Tournament Selection
          </h2>

          <div className="space-y-5">
            {/* Category Select */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Kata Category</label>
              <select
                value={selectedCatId}
                onChange={e => {
                  setSelectedCatId(e.target.value);
                  const firstInCat = bouts.find(b => e.target.value === 'ALL' || b.category_id === e.target.value);
                  if (firstInCat) selectBout(firstInCat);
                }}
                className="w-full bg-[#101015] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400 transition"
              >
                <option value="ALL">All Kata Categories ({kataCategories.length})</option>
                {kataCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Bout Select */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Match / Bout</label>
              <select
                value={selectedBoutId}
                onChange={e => {
                  const b = bouts.find(item => item.id === e.target.value);
                  if (b) selectBout(b);
                }}
                className="w-full bg-[#101015] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400 transition font-mono"
              >
                {filteredBouts.map(b => {
                  const pA = participants.find(p => p.id === b.participant_a_id)?.full_name || 'AKA';
                  const pB = participants.find(p => p.id === b.participant_b_id)?.full_name || 'AO';
                  return (
                    <option key={b.id} value={b.id}>
                      Bout #{b.bout_no} (R{b.round_no}): {pA} vs {pB}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Panel Mode Select */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Judge Panel Standard</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#101015] rounded-xl border border-white/10">
                <button
                  onClick={() => {
                    setPanelSize(7);
                    setJudgeScoresA(prev => prev.length === 7 ? prev : [8.2, 8.4, 8.1, 8.3, 8.5, 8.2, 8.4]);
                    setJudgeScoresB(prev => prev.length === 7 ? prev : [8.0, 8.2, 8.3, 8.1, 8.4, 8.2, 8.3]);
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${panelSize === 7 ? 'bg-yellow-400 text-black shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  7 Judges (Standard)
                </button>
                <button
                  onClick={() => {
                    setPanelSize(5);
                    setJudgeScoresA(prev => prev.slice(0, 5));
                    setJudgeScoresB(prev => prev.slice(0, 5));
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${panelSize === 5 ? 'bg-yellow-400 text-black shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  5 Judges Panel
                </button>
              </div>
            </div>

            {/* Scoring Method Select */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Scoring Method</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#101015] rounded-xl border border-white/10">
                <button
                  onClick={() => {
                    setScoringMethod('Points');
                    setJudgeScoresA(prev => prev.map(s => s === 0 || s === 1 ? 8.0 : s));
                    setJudgeScoresB(prev => prev.map(s => s === 0 || s === 1 ? 8.0 : s));
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${scoringMethod === 'Points' ? 'bg-yellow-400 text-black shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  WKF Points
                </button>
                <button
                  onClick={() => {
                    setScoringMethod('Flags');
                    setJudgeScoresA(prev => prev.map(() => 0));
                    setJudgeScoresB(prev => prev.map(() => 0));
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${scoringMethod === 'Flags' ? 'bg-yellow-400 text-black shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  WKF Flags
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Panel: Athletes & Judge Matrix */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Match Banner Header */}
          <div className="p-5 bg-gradient-to-r from-[#10111a] via-[#141522] to-[#10111a] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                {category?.name || 'Kata Division'} • {currentBout?.tatami || 'Tatami 1'}
              </span>
              <h2 className="text-xl font-black text-white flex items-center gap-3 mt-0.5">
                Bout #{currentBout?.bout_no || 1}
                <span className="text-xs px-2.5 py-0.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-full font-bold">
                  Round {currentBout?.round_no || 1}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase">AKA Total</div>
                <div className="text-2xl font-black font-mono text-red-500">
                  {scoringMethod === 'Flags' ? (
                    <div className="flex items-center gap-1 justify-end">
                      {Array.from({ length: totalScoreA }).map((_, i) => (
                        <Flag key={`aka-${i}`} className="h-5 w-5 fill-current" />
                      ))}
                    </div>
                  ) : totalScoreA.toFixed(2)}
                </div>
              </div>
              <div className="text-gray-600 font-bold text-lg">VS</div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-gray-400 uppercase">AO Total</div>
                <div className="text-2xl font-black font-mono text-blue-500">
                  {scoringMethod === 'Flags' ? (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalScoreB }).map((_, i) => (
                        <Flag key={`ao-${i}`} className="h-5 w-5 fill-current" />
                      ))}
                    </div>
                  ) : totalScoreB.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Athletes Comparison & Declared Kata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AKA Athlete Card (Red) */}
            <div className="p-6 bg-gradient-to-b from-red-950/30 to-[#0d0d14] border border-red-500/30 rounded-2xl relative overflow-hidden shadow-lg shadow-red-950/20">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-red-600 text-white font-black text-xs rounded-lg uppercase tracking-wider shadow">
                  AKA 🔴
                </span>
                <span className="text-xs font-mono font-bold text-red-400 flex items-center">
                  Total: 
                  <strong className="text-xl text-white ml-2 flex items-center gap-1">
                    {scoringMethod === 'Flags' ? (
                      Array.from({ length: totalScoreA }).map((_, i) => (
                        <Flag key={`card-aka-${i}`} className="h-4 w-4 fill-red-500 text-red-500" />
                      ))
                    ) : (
                      totalScoreA.toFixed(2)
                    )}
                  </strong>
                </span>
              </div>

              <h3 className="text-xl font-black text-white">{participantA?.full_name || 'AKA Athlete'}</h3>
              <p className="text-xs text-gray-400 font-medium mb-4">{clubA?.name || 'Independent Dojo'}</p>

              {/* Declared Kata Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-red-300 mb-1">Declared Kata</label>
                <select
                  value={kataA}
                  onChange={e => setKataA(e.target.value)}
                  className="w-full bg-[#181015] border border-red-500/40 rounded-xl px-3 py-2 text-xs font-bold text-red-200 focus:outline-none focus:border-red-400 transition"
                >
                  {OFFICIAL_WKF_KATAS.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* AO Athlete Card (Blue) */}
            <div className="p-6 bg-gradient-to-b from-blue-950/30 to-[#0d0d14] border border-blue-500/30 rounded-2xl relative overflow-hidden shadow-lg shadow-blue-950/20">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-blue-600 text-white font-black text-xs rounded-lg uppercase tracking-wider shadow">
                  AO 🔵
                </span>
                <span className="text-xs font-mono font-bold text-blue-400 flex items-center">
                  Total: 
                  <strong className="text-xl text-white ml-2 flex items-center gap-1">
                    {scoringMethod === 'Flags' ? (
                      Array.from({ length: totalScoreB }).map((_, i) => (
                        <Flag key={`card-ao-${i}`} className="h-4 w-4 fill-blue-500 text-blue-500" />
                      ))
                    ) : (
                      totalScoreB.toFixed(2)
                    )}
                  </strong>
                </span>
              </div>

              <h3 className="text-xl font-black text-white">{participantB?.full_name || 'AO Athlete'}</h3>
              <p className="text-xs text-gray-400 font-medium mb-4">{clubB?.name || 'Independent Dojo'}</p>

              {/* Declared Kata Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-blue-300 mb-1">Declared Kata</label>
                <select
                  value={kataB}
                  onChange={e => setKataB(e.target.value)}
                  className="w-full bg-[#101420] border border-blue-500/40 rounded-xl px-3 py-2 text-xs font-bold text-blue-200 focus:outline-none focus:border-blue-400 transition"
                >
                  {OFFICIAL_WKF_KATAS.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Interactive Judge Scoring Matrix */}
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-6">
            
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Judge Score Matrix
                  <span className="text-xs font-normal text-gray-400">({panelSize} Judges Panel)</span>
                </h3>
                <p className="text-xs text-gray-400">Highest & Lowest scores are automatically discarded (red line-through)</p>
              </div>

              {/* AKA vs AO Tab Toggle */}
              {scoringMethod === 'Points' && (
                <div className="flex items-center gap-2 p-1 bg-[#101015] border border-white/10 rounded-xl">
                  <button
                    onClick={() => setActiveScoringTab('AKA')}
                    className={`px-4 py-1.5 text-xs font-black rounded-lg transition ${activeScoringTab === 'AKA' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-gray-400 hover:text-white'}`}
                  >
                    AKA Scoring 🔴
                  </button>
                  <button
                    onClick={() => setActiveScoringTab('AO')}
                    className={`px-4 py-1.5 text-xs font-black rounded-lg transition ${activeScoringTab === 'AO' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-400 hover:text-white'}`}
                  >
                    AO Scoring 🔵
                  </button>
                </div>
              )}
            </div>

            {/* Quick Presets Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/5 rounded-xl">
              <span className="text-xs font-bold text-gray-300">Set All Judges:</span>
              <div className="flex flex-wrap gap-2">
                {scoringMethod === 'Points' ? (
                  [8.0, 8.2, 8.4, 8.5, 8.8, 9.0].map(val => (
                    <button
                      key={val}
                      onClick={() => setAllJudgeScores(activeScoringTab, val)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-mono rounded-lg transition cursor-pointer"
                    >
                      {val.toFixed(1)}
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setJudgeScoresA(Array(panelSize).fill(1));
                        setJudgeScoresB(Array(panelSize).fill(0));
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      All Flags AKA <Flag className="h-3 w-3 fill-current" />
                    </button>
                    <button
                      onClick={() => {
                        setJudgeScoresA(Array(panelSize).fill(0));
                        setJudgeScoresB(Array(panelSize).fill(1));
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      All Flags AO <Flag className="h-3 w-3 fill-current" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Judge Score Cards Input Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {Array.from({ length: panelSize }).map((_, idx) => {
                if (scoringMethod === 'Flags') {
                  const isAka = judgeScoresA[idx] === 1;
                  const isAo = judgeScoresB[idx] === 1;
                  return (
                    <div key={idx} className="p-3 rounded-xl border bg-white/[0.02] border-white/10 flex flex-col items-center transition">
                      <span className="text-[10px] font-bold uppercase text-gray-400 mb-3">Judge {idx + 1}</span>
                      <div className="flex flex-col gap-2 w-full h-full">
                        <button
                          onClick={() => {
                            const newA = [...judgeScoresA];
                            const newB = [...judgeScoresB];
                            newA[idx] = 1;
                            newB[idx] = 0;
                            setJudgeScoresA(newA);
                            setJudgeScoresB(newB);
                          }}
                          className={`flex-1 py-3 text-red-500 rounded-lg border transition flex items-center justify-center ${isAka ? 'bg-red-600 border-red-400 shadow-lg shadow-red-600/40 grayscale-0 text-white' : 'bg-red-950/20 border-red-900/30 grayscale opacity-50 hover:opacity-100 hover:grayscale-0'}`}
                        >
                          <Flag className="h-6 w-6 fill-current" />
                        </button>
                        <button
                          onClick={() => {
                            const newA = [...judgeScoresA];
                            const newB = [...judgeScoresB];
                            newA[idx] = 0;
                            newB[idx] = 1;
                            setJudgeScoresA(newA);
                            setJudgeScoresB(newB);
                          }}
                          className={`flex-1 py-3 text-blue-500 rounded-lg border transition flex items-center justify-center ${isAo ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-600/40 grayscale-0 text-white' : 'bg-blue-950/20 border-blue-900/30 grayscale opacity-50 hover:opacity-100 hover:grayscale-0'}`}
                        >
                          <Flag className="h-6 w-6 fill-current" />
                        </button>
                      </div>
                    </div>
                  );
                }

                const activeScores = activeScoringTab === 'AKA' ? judgeScoresA : judgeScoresB;
                const status = getScoreStatusIndex(activeScores, idx);
                const score = activeScores[idx] !== undefined ? activeScores[idx] : 8.0;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex flex-col items-center transition relative ${
                      status !== 'active'
                        ? 'bg-red-950/20 border-red-500/40 opacity-70'
                        : activeScoringTab === 'AKA'
                        ? 'bg-red-950/10 border-red-500/30'
                        : 'bg-blue-950/10 border-blue-500/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-1">
                      Judge {idx + 1}
                    </span>

                    {/* Discard Tag */}
                    {status !== 'active' && (
                      <span className="text-[9px] font-black uppercase text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/30 mb-1">
                        {status === 'max' ? 'MAX' : 'MIN'}
                      </span>
                    )}

                    {/* Display Score */}
                    <div className={`text-2xl font-black font-mono my-1 ${status !== 'active' ? 'line-through text-red-400 opacity-60' : 'text-white'}`}>
                      {score.toFixed(1)}
                    </div>

                    {/* Stepper Buttons */}
                    <div className="flex gap-1 mt-2 w-full">
                      <button
                        onClick={() => updateJudgeScore(activeScoringTab, idx, score - 0.1)}
                        className="flex-1 py-1 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded transition"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateJudgeScore(activeScoringTab, idx, score + 0.1)}
                        className="flex-1 py-1 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Winner Declaration & Action Toolbar */}
          <div className="p-6 bg-gradient-to-r from-yellow-950/20 via-[#12131c] to-yellow-950/20 border border-yellow-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            
            {/* Winner Announcement */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-400/20 text-yellow-400 rounded-2xl border border-yellow-400/30">
                <Trophy className="h-8 w-8 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                  DECISION / WINNER DETERMINATION
                </span>
                <h3 className="text-xl font-black text-white">
                  Winner: {selectedWinnerId === participantA?.id ? (
                    <span className="text-red-400">{participantA?.full_name} (AKA 🔴)</span>
                  ) : selectedWinnerId === participantB?.id ? (
                    <span className="text-blue-400">{participantB?.full_name} (AO 🔵)</span>
                  ) : (
                    'Tied Score'
                  )}
                </h3>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRematch}
                disabled={isSaving || !currentBout}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-black text-sm rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="h-5 w-5" />
                Reset Match
              </button>
              <button
                onClick={handleSaveAndCompleteBout}
                disabled={isSaving || !currentBout}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm rounded-xl transition cursor-pointer shadow-lg shadow-yellow-400/20 disabled:opacity-50"
              >
                <CheckCircle2 className="h-5 w-5" />
                {isSaving ? 'Saving...' : 'Complete Match & Advance Bracket'}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Result Book Modal */}
      <KataResultBookModal
        isOpen={isResultBookOpen}
        onClose={() => setIsResultBookOpen(false)}
        bout={currentBout}
        category={category}
        participantA={participantA}
        participantB={participantB}
        clubA={clubA}
        clubB={clubB}
        judgeScoresA={judgeScoresA}
        judgeScoresB={judgeScoresB}
        totalScoreA={totalScoreA}
        totalScoreB={totalScoreB}
        kataA={kataA}
        kataB={kataB}
        winnerId={selectedWinnerId}
        clubsList={clubs}
      />

    </div>
  );
}
