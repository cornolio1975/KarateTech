'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db, supabase } from '@/db/dbClient';
import { Bout, Participant, Category, Club } from '@/db/types';
import { ShieldAlert, Zap, Award, Trophy, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { useTournament } from '@/context/TournamentContext';

function SpectatorDisplayContent() {
  const searchParams = useSearchParams();
  const urlBoutId = searchParams.get('boutId');
  const [activeBoutId, setActiveBoutId] = useState<string | null>(null);
  const { tournamentName } = useTournament();

  // Sync activeBoutId with URL query params initially or when they change
  useEffect(() => {
    if (urlBoutId) {
      setActiveBoutId(urlBoutId);
    }
  }, [urlBoutId]);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Competitor info
  const [akaName, setAkaName] = useState<string>('TBD Red');
  const [akaClub, setAkaClub] = useState<string>('Senshi Karate Academy');
  const [aoName, setAoName] = useState<string>('TBD Blue');
  const [aoClub, setAoClub] = useState<string>('Goju-Ryu Karate Club');

  // Match details
  const [categoryName, setCategoryName] = useState<string>('Kumite Championship');
  const [tatamiName, setTatamiName] = useState<string>('Tatami 1');
  const [boutNo, setBoutNo] = useState<number>(1);
  const [roundNo, setRoundNo] = useState<number>(1);

  // Live scoreboard states
  const [scoreAka, setScoreAka] = useState<number>(0);
  const [scoreAo, setScoreAo] = useState<number>(0);
  const [senshuAka, setSenshuAka] = useState<boolean>(false);
  const [senshuAo, setSenshuAo] = useState<boolean>(false);
  const [penaltiesAka, setPenaltiesAka] = useState<string[]>([]);
  const [penaltiesAo, setPenaltiesAo] = useState<string[]>([]);

  // Detailed WKF warnings states: C1, C2, C3, HC, H (1 to 5)
  const [c1Aka, setC1Aka] = useState<number>(0);
  const [c1Ao, setC1Ao] = useState<number>(0);
  const [eventsAka, setEventsAka] = useState<{ fighter: string; points: number; technique: string; timestamp: number; matchId: string }[]>([]);
  const [eventsAo, setEventsAo] = useState<{ fighter: string; points: number; technique: string; timestamp: number; matchId: string }[]>([]);
  const [showPointHistory, setShowPointHistory] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number>(1800);
  const [timerActive, setTimerActive] = useState<boolean>(false);


  // Winner banner
  const [winnerSide, setWinnerSide] = useState<'aka' | 'ao' | null>(null);
  const [winMethod, setWinMethod] = useState<string>('');

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const soundBuzzerRef = useRef<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const soundPlayedRef = useRef<string | null>(null);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Auto-hide controls after 3s idle
  const resetHideTimer = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current); };
  }, []);

  // Trigger Superior Points fanfare or Hansoku alarm when winner is declared
  useEffect(() => {
    if (winnerSide && winMethod === 'HANSOKU' && soundPlayedRef.current !== winnerSide + '-hansoku') {
      soundPlayedRef.current = winnerSide + '-hansoku';
      playHansokuAlarm();
    } else if (winnerSide && winMethod === 'Superior Points' && soundPlayedRef.current !== winnerSide + '-superior') {
      soundPlayedRef.current = winnerSide + '-superior';
      playSuperiorPointsSound();
    } else if (!winnerSide) {
      soundPlayedRef.current = null;
    }
  }, [winnerSide, winMethod]);

  // Web Audio buzzer sound
  const playBuzzer = () => {
    if (!soundBuzzerRef.current) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(320, audioCtx.currentTime); // Deep buzzer tone
      
      gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.2);
    } catch (err) {
      console.warn('Audio Context error:', err);
    }
  };

  const playBeep = () => {
    if (!soundBuzzerRef.current) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBellRing = (startTime: number) => {
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + 0.6);
        gainNode.connect(audioCtx.destination);

        const freqs = [880, 1200, 1760];
        freqs.forEach((f) => {
          const osc = audioCtx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, audioCtx.currentTime + startTime);
          osc.connect(gainNode);
          osc.start(audioCtx.currentTime + startTime);
          osc.stop(audioCtx.currentTime + startTime + 0.6);
        });
      };

      playBellRing(0);
      playBellRing(0.4);
      playBellRing(0.8);
    } catch (err) {
      console.warn('Audio Context error:', err);
    }
  };

  const playSuperiorPointsSound = () => {
    if (!soundBuzzerRef.current) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };

      playTone(523.25, 0, 0.15);
      playTone(659.25, 0.15, 0.15);
      playTone(783.99, 0.3, 0.15);
      playTone(1046.50, 0.45, 0.35);
    } catch (err) {
      console.warn('Audio Context sound error:', err);
    }
  };

  const playHansokuAlarm = () => {
    if (!soundBuzzerRef.current) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playAlarmTone = (start: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.8, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + 0.4);
      };

      playAlarmTone(0);
      playAlarmTone(0.5);
      playAlarmTone(1.0);
    } catch (err) {
      console.warn('Alarm sound error:', err);
    }
  };

  // Setup broadcast channel receiver
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const channel = new BroadcastChannel('wkf-scoreboard-sync');
      broadcastChannelRef.current = channel;

      const isStream = searchParams.get('stream') === 'true' || searchParams.get('overlay') === 'true';
      const key = isStream ? 'ts_show_point_history_stream' : 'ts_show_point_history_public';
      setShowPointHistory(searchParams.get('history') === 'true' || localStorage.getItem(key) === 'true');

      // Send initial connect notification
      channel.postMessage({ type: 'SPECTATOR_CONNECTED' });

      const handleUnload = () => {
        channel.postMessage({ type: 'SPECTATOR_DISCONNECTED' });
      };
      window.addEventListener('beforeunload', handleUnload);

      channel.onmessage = (event) => {
        const data = event.data;

        // Respond to heartbeat pings from the controller
        if (data.type === 'PING') {
          channel.postMessage({ type: 'PONG' });
          return;
        }

        if (data.type === 'MATCH_FINISHED') {
          setWinnerSide(data.winnerSide);
          setWinMethod('Completed');
          playBuzzer();
          return;
        }

        if (data.boutId) {
          // If the controller shifted to a new match, update our active target boutId
          if (data.boutId !== activeBoutId) {
            setActiveBoutId(data.boutId);
          }
          setAkaName(data.akaName);
          setAkaClub(data.akaClub);
          setAoName(data.aoName);
          setAoClub(data.aoClub);
          setScoreAka(data.scoreAka);
          setScoreAo(data.scoreAo);
          setSenshuAka(data.senshuAka);
          setSenshuAo(data.senshuAo);
          setPenaltiesAka(data.penaltiesAka || []);
          setPenaltiesAo(data.penaltiesAo || []);
          setC1Aka(data.c1Aka || 0);
          setC1Ao(data.c1Ao || 0);
          setEventsAka(data.eventsAka || []);
          setEventsAo(data.eventsAo || []);
          setTimeLeft(data.timeLeft);
          setTimerActive(data.timerActive);

          if (data.showPointHistory !== undefined) {
            setShowPointHistory(data.showPointHistory || searchParams.get('history') === 'true');
          }
          setWinnerSide(data.winner);
          setWinMethod(data.winMethod);
        }
      };

      return () => {
        window.removeEventListener('beforeunload', handleUnload);
        channel.postMessage({ type: 'SPECTATOR_DISCONNECTED' });
        channel.close();
      };
    }
  }, [activeBoutId, searchParams]);

  // Initial load from Database client
  useEffect(() => {
    if (!mounted || !activeBoutId) return;

    const fetchBout = async () => {
      try {
        setLoading(true);
        const [boutsList, partsList, categoriesList] = await Promise.all([
          db.bouts.list(),
          db.participants.list(),
          db.categories.list()
        ]);

        const bout = boutsList.find(b => b.id === activeBoutId);
        if (bout) {
          const compAka = partsList.find(p => p.id === bout.participant_a_id);
          const compAo = partsList.find(p => p.id === bout.participant_b_id);
          const cat = categoriesList.find(c => c.id === bout.category_id);

          setAkaName(compAka?.full_name || 'TBD Red');
          setAkaClub(compAka?.club_id ? 'Senshi Karate Academy' : 'Senshi Club');
          setAoName(compAo?.full_name || 'TBD Blue');
          setAoClub(compAo?.club_id ? 'Goju-Ryu Karate Club' : 'Goju-Ryu Club');
          
          setCategoryName(cat?.name || 'Kumite Open Division');
          setTatamiName(bout.tatami || 'Tatami 1');
          setBoutNo(bout.bout_no);
          setRoundNo(bout.round_no);

          setScoreAka(bout.score_a ?? 0);
          setScoreAo(bout.score_b ?? 0);
          setSenshuAka(bout.senshu_a ?? false);
          setSenshuAo(bout.senshu_b ?? false);
          let parsedEventsAka: { fighter: string; points: number; technique: string; timestamp: number; matchId: string }[] = [];
          let parsedEventsAo: { fighter: string; points: number; technique: string; timestamp: number; matchId: string }[] = [];

          if (bout.points_aka_history) {
            if (bout.points_aka_history.startsWith('[')) {
              try {
                parsedEventsAka = JSON.parse(bout.points_aka_history);
              } catch (e) {
                console.error(e);
              }
            } else {
              const pointsList = bout.points_aka_history.split(',').map(Number).filter(Boolean);
              parsedEventsAka = pointsList.map((pts: number) => ({
                fighter: 'AKA',
                points: pts,
                technique: pts === 1 ? 'Yuko' : pts === 2 ? 'Waza-ari' : pts === 3 ? 'Ippon' : 'Point',
                timestamp: 0,
                matchId: bout.id
              }));
            }
          }

          if (bout.points_ao_history) {
            if (bout.points_ao_history.startsWith('[')) {
              try {
                parsedEventsAo = JSON.parse(bout.points_ao_history);
              } catch (e) {
                console.error(e);
              }
            } else {
              const pointsList = bout.points_ao_history.split(',').map(Number).filter(Boolean);
              parsedEventsAo = pointsList.map((pts: number) => ({
                fighter: 'AO',
                points: pts,
                technique: pts === 1 ? 'Yuko' : pts === 2 ? 'Waza-ari' : pts === 3 ? 'Ippon' : 'Point',
                timestamp: 0,
                matchId: bout.id
              }));
            }
          }

          setEventsAka(parsedEventsAka);
          setEventsAo(parsedEventsAo);
          setPenaltiesAka(bout.penalties_a ? bout.penalties_a.split(',').filter(Boolean) : []);
          setPenaltiesAo(bout.penalties_b ? bout.penalties_b.split(',').filter(Boolean) : []);
          
          setC1Aka(bout.penalties_c1_a ? parseInt(bout.penalties_c1_a) || 0 : 0);
          setC1Ao(bout.penalties_c1_b ? parseInt(bout.penalties_c1_b) || 0 : 0);

          setTimeLeft((bout.timer_seconds ?? 180) * 10);
          setTimerActive(bout.timer_active ?? false);
        }
      } catch (e) {
        console.error('Fetch bout error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchBout();
  }, [mounted, activeBoutId]);

  // Supabase Realtime fallback subscription
  useEffect(() => {
    if (!supabase || !activeBoutId) return;

    const channel = supabase
      .channel(`display-bout-${activeBoutId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bouts', filter: `id=eq.${activeBoutId}` },
        async (payload: any) => {
          const updated = payload.new;
          if (updated) {
            setScoreAka(updated.score_a ?? 0);
            setScoreAo(updated.score_b ?? 0);
            setSenshuAka(updated.senshu_a ?? false);
            setSenshuAo(updated.senshu_b ?? false);
            let parsedEventsAka: { fighter: string; points: number; technique: string; timestamp: number; matchId: string }[] = [];
            let parsedEventsAo: { fighter: string; points: number; technique: string; timestamp: number; matchId: string }[] = [];

            if (updated.points_aka_history) {
              if (updated.points_aka_history.startsWith('[')) {
                try {
                  parsedEventsAka = JSON.parse(updated.points_aka_history);
                } catch (e) {
                  console.error(e);
                }
              } else {
                const pointsList = updated.points_aka_history.split(',').map(Number).filter(Boolean);
                parsedEventsAka = pointsList.map((pts: number) => ({
                  fighter: 'AKA',
                  points: pts,
                  technique: pts === 1 ? 'Yuko' : pts === 2 ? 'Waza-ari' : pts === 3 ? 'Ippon' : 'Point',
                  timestamp: 0,
                  matchId: activeBoutId!
                }));
              }
            }

            if (updated.points_ao_history) {
              if (updated.points_ao_history.startsWith('[')) {
                try {
                  parsedEventsAo = JSON.parse(updated.points_ao_history);
                } catch (e) {
                  console.error(e);
                }
              } else {
                const pointsList = updated.points_ao_history.split(',').map(Number).filter(Boolean);
                parsedEventsAo = pointsList.map((pts: number) => ({
                  fighter: 'AO',
                  points: pts,
                  technique: pts === 1 ? 'Yuko' : pts === 2 ? 'Waza-ari' : pts === 3 ? 'Ippon' : 'Point',
                  timestamp: 0,
                  matchId: activeBoutId!
                }));
              }
            }

            setEventsAka(parsedEventsAka);
            setEventsAo(parsedEventsAo);
            setPenaltiesAka(updated.penalties_a ? updated.penalties_a.split(',').filter(Boolean) : []);
            setPenaltiesAo(updated.penalties_b ? updated.penalties_b.split(',').filter(Boolean) : []);
            
            setC1Aka(updated.penalties_c1_a ? parseInt(updated.penalties_c1_a) || 0 : 0);
            setC1Ao(updated.penalties_c1_b ? parseInt(updated.penalties_c1_b) || 0 : 0);

            setTimeLeft((updated.timer_seconds ?? 180) * 10);
            setTimerActive(updated.timer_active ?? false);
            
            if (updated.status === 'Completed') {
              setWinnerSide(updated.winner_id === updated.participant_a_id ? 'aka' : 'ao');
              setWinMethod('Completed');
              playBuzzer();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [activeBoutId]);

  // Clock Countdown interval (for displays running timer locally)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            playBuzzer();
            return 0;
          }
          const nextVal = prev - 1;
          // Beep once when exactly 15 seconds remaining
          if (nextVal === 150) {
            playBeep();
          }
          return nextVal;
        });
      }, 100);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  // Format countdown clock
  const formatMainTime = (tenths: number) => {
    const mins = Math.floor(tenths / 600);
    const secs = Math.floor((tenths % 600) / 10);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDecsTime = (tenths: number) => {
    const decs = tenths % 10;
    return `.${decs}0`;
  };

  if (!mounted) return null;

  return (
    <div
      className="h-[100dvh] max-h-[100dvh] w-full bg-black text-white flex flex-col overflow-hidden select-none font-sans p-4 lg:p-6 relative"
      onMouseMove={resetHideTimer}
    >

      {/* Floating Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer backdrop-blur-sm border ${
          showControls || !isFullscreen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        } ${
          isFullscreen
            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            : 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/30'
        }`}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
      {/* Top Details bar (Projector optimized size) */}
      <div className="flex justify-between items-center border-b-2 border-white/10 pb-4 mb-4 shrink-0">
        <div>
          <span className="text-yellow-400 font-black tracking-widest text-lg uppercase">
            {tatamiName} • BOUT #{boutNo} • ROUND {roundNo}
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white/80 line-clamp-1 mt-1">
            {categoryName}
          </h1>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">
            TOURNAMENT HUB
          </span>
          <p className="text-lg font-black text-white/70 tracking-tight">
            {tournamentName || 'Kelab Karate Do Senshi Goju-Ryu'}
          </p>
        </div>
      </div>

      {/* Hansoku Disqualification Blinking Banner */}
      {(c1Aka >= 5 || c1Ao >= 5) && !winnerSide && (
        <div className="bg-red-600 text-white font-black text-center py-2 text-2xl rounded-2xl mb-3 animate-pulse tracking-widest uppercase border-2 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.6)] z-20 shrink-0">
          🚨 HANSOKU – {c1Aka >= 5 ? 'AKA' : 'AO'} 🚨
        </div>
      )}

      {/* Dynamic Winner Alert Header */}
      {winnerSide && (
        <div className={`p-2 lg:p-3 mb-3 shrink-0 rounded-2xl flex items-center justify-center font-black text-lg lg:text-xl tracking-widest uppercase border-2 shadow-xl animate-pulse z-20 ${
          winnerSide === 'aka'
            ? 'bg-red-950/90 text-red-400 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)]'
            : 'bg-blue-950/90 text-blue-400 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.5)]'
        }`}>
          {winMethod === 'HANSOKU' ? '🚨' : '🏆'} WINNER BY {
            winMethod === 'Points' ? 'POINTS ADVANTAGE' :
            winMethod === 'SENSHU' ? 'SENSHU ADVANTAGE' :
            winMethod === 'Superior Points' ? 'SUPERIOR POINTS' :
            winMethod === 'Hantei' ? 'HANTEI DECISION' :
            winMethod === 'HANSOKU' ? 'HANSOKU DISQUALIFICATION' :
            winMethod === 'Kiken' ? 'KIKEN (WITHDRAWAL)' :
            winMethod || 'POINTS ADVANTAGE'
          }: {winnerSide === 'aka' ? akaName : aoName} {winMethod === 'HANSOKU' ? '🚨' : '🏆'}
        </div>
      )}

      {/* Main Scoreboard Arena Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 lg:gap-6 overflow-hidden pb-2">
        {/* AKA RED CARD */}
        <div className={`col-span-3 h-full rounded-[40px] p-8 flex flex-col justify-between relative shadow-[0_0_80px_rgba(239,68,68,0.1)] transition-all duration-500 ${
          winnerSide === 'aka'
            ? 'bg-red-950/80 border-4 border-red-500 shadow-[inset_0_0_100px_rgba(239,68,68,0.4),0_0_80px_rgba(239,68,68,0.8)]'
            : 'bg-[#150000] border-4 border-red-600/40 text-white'
        }`}>
          <div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              {senshuAka && (
                <span className="bg-yellow-500 text-black font-black text-sm lg:text-base uppercase px-4 py-1 rounded-xl tracking-widest animate-pulse border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)] flex items-center justify-center gap-1.5 w-max max-w-full mx-auto">
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>
                  先取 SENSHU
                </span>
              )}
              <span className={`text-3xl lg:text-4xl font-black uppercase tracking-wider leading-none ${
                winnerSide === 'aka' && winMethod === 'Superior Points' ? 'text-red-400' : 'text-red-500'
              }`}>AKA RED</span>

              {/* Fighter Name directly under AKA RED */}
              <div className="w-full px-2 mt-1.5">
                <h2 className="font-competitor text-[clamp(24px,3.2vw,40px)] font-extrabold tracking-tight truncate max-w-full text-center uppercase leading-none" title={akaName}>
                  {akaName}
                </h2>
                <p className={`${
                  winnerSide === 'aka' && winMethod === 'Superior Points' ? 'text-green-400/50' : 'text-red-400/50'
                } text-sm font-bold mt-1 uppercase tracking-wider text-center truncate max-w-full`}>
                  {akaClub}
                </p>
              </div>
            </div>
          </div>

          {/* Huge Score (DIN 1451 Bold 140-220px) */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-2">
            <span className={`font-din text-[clamp(140px,18vh,220px)] font-black leading-none select-none tracking-tight transition-all duration-300 ${
              winnerSide === 'aka'
                ? 'text-red-500 animate-blink drop-shadow-[0_0_80px_rgba(239,68,68,0.7)] scale-110'
                : scoreAka - scoreAo >= 8 
                  ? 'text-red-500 animate-pulse scale-105 drop-shadow-[0_0_80px_rgba(239,68,68,0.7)]' 
                  : 'text-red-500 drop-shadow-[0_0_55px_rgba(239,68,68,0.3)]'
            }`}>
              {scoreAka}
            </span>
            {showPointHistory && eventsAka.length > 0 && (
              <div className="flex items-center flex-wrap gap-y-1.5 mt-2 justify-center overflow-x-auto max-w-[90%]">
                {eventsAka.map((ev, idx) => (
                  <div key={idx} className="flex items-center">
                    {idx > 0 && (
                      <span className="text-white/20 text-[10px] font-bold mx-1.5 select-none">→</span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-red-950/80 border border-red-500/30 whitespace-nowrap">
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">+{ev.points}({ev.technique})</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AKA Warnings Row */}
          <div className="border-t-2 border-red-900/30 pt-3">
            <div className="flex items-center gap-2">
              <span className="font-din text-xs lg:text-sm font-bold text-red-500/70 shrink-0 uppercase tracking-widest">PEN</span>
              <div className="flex-1 grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => {
                  const isActive = c1Aka >= level;
                  const labels = ['', 'C1', 'C2', 'C3', 'HC', 'H'];
                  return (
                    <div
                      key={level}
                      className={`flex items-center justify-center h-9 lg:h-11 rounded-xl font-din text-[clamp(14px,2.2vh,24px)] font-bold transition-all border ${
                        isActive
                          ? 'bg-red-500 text-black border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                          : 'bg-transparent text-white/10 border-white/5'
                      }`}
                    >
                      {labels[level]}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: TIMER */}
        <div className="col-span-6 flex flex-col justify-center items-center h-full text-center px-4">
          <div className="bg-black/60 backdrop-blur-xl border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-[40px] w-full h-full p-8 flex flex-col justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            {/* Top Area: Label */}
            <div className="mt-4">
              <span className="text-xl lg:text-2xl uppercase font-black text-white/40 tracking-[0.3em]">
                MATCH TIME
              </span>
            </div>
            
            {/* Giant digital timer (DIN 1451 Bold White 160-260px) */}
            <div className={`font-din text-[clamp(160px,24vh,260px)] font-bold leading-none tracking-tight transition-all duration-300 select-none flex items-baseline justify-center relative z-10 w-full ${
              timeLeft <= 150 && timeLeft > 0 
                ? 'text-red-500 scale-105 animate-pulse drop-shadow-[0_0_40px_rgba(239,68,68,0.5)]' 
                : 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]'
            }`}>
              <span>{formatMainTime(timeLeft)}</span>
              <span className={`font-din text-[clamp(80px,12vh,130px)] font-bold ml-1 lg:ml-2 ${
                timeLeft <= 150 && timeLeft > 0 ? 'text-red-500/60' : 'text-white/70'
              }`}>
                {formatDecsTime(timeLeft)}
              </span>
            </div>

            {/* Bottom Area: Status & Warnings */}
            <div className="mb-4 flex flex-col items-center gap-4 relative z-10 h-24 justify-end">
              {Math.abs(scoreAka - scoreAo) >= 8 && (
                <div className="bg-red-500/20 text-red-500 border border-red-500/30 px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-widest animate-bounce">
                  8-Point Gap Decision
                </div>
              )}
              <div className="flex flex-col items-center gap-2">
                <span className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full ${timerActive ? 'bg-green-500 animate-ping shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`} />
                <span className="text-xs lg:text-sm font-black uppercase text-white/50 tracking-[0.2em] mt-1">
                  {timerActive ? 'RUNNING' : 'PAUSED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AO BLUE CARD */}
        <div className={`col-span-3 h-full rounded-[40px] p-8 flex flex-col justify-between relative shadow-[0_0_80px_rgba(59,130,246,0.1)] transition-all duration-500 ${
          winnerSide === 'ao'
            ? 'bg-blue-950/80 border-4 border-blue-500 shadow-[inset_0_0_100px_rgba(59,130,246,0.4),0_0_80px_rgba(59,130,246,0.8)]'
            : 'bg-[#000515] border-4 border-blue-600/40 text-white'
        }`}>
          <div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              {senshuAo && (
                <span className="bg-yellow-500 text-black font-black text-sm lg:text-base uppercase px-4 py-1 rounded-xl tracking-widest animate-pulse border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)] flex items-center justify-center gap-1.5 w-max max-w-full mx-auto">
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>
                  先取 SENSHU
                </span>
              )}
              <span className={`text-3xl lg:text-4xl font-black uppercase tracking-wider leading-none ${
                winnerSide === 'ao' ? 'text-blue-400' : 'text-blue-400'
              }`}>AO BLUE</span>

              {/* Fighter Name directly under AO BLUE */}
              <div className="w-full px-2 mt-1.5">
                <h2 className="font-competitor text-[clamp(24px,3.2vw,40px)] font-extrabold tracking-tight truncate max-w-full text-center uppercase leading-none" title={aoName}>
                  {aoName}
                </h2>
                <p className={`${
                  winnerSide === 'ao' && winMethod === 'Superior Points' ? 'text-green-400/50' : 'text-blue-400/50'
                } text-sm font-bold mt-1 uppercase tracking-wider text-center truncate max-w-full`}>
                  {aoClub}
                </p>
              </div>
            </div>
          </div>

          {/* Huge Score (DIN 1451 Bold 140-220px) */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-2">
            <span className={`font-din text-[clamp(140px,18vh,220px)] font-black leading-none select-none tracking-tight transition-all duration-300 ${
              winnerSide === 'ao'
                ? 'text-blue-400 animate-blink drop-shadow-[0_0_80px_rgba(59,130,246,0.7)] scale-110'
                : scoreAo - scoreAka >= 8 
                  ? 'text-blue-400 animate-pulse scale-105 drop-shadow-[0_0_80px_rgba(59,130,246,0.7)]' 
                  : 'text-blue-400 drop-shadow-[0_0_35px_rgba(59,130,246,0.3)]'
            }`}>
              {scoreAo}
            </span>
            {showPointHistory && eventsAo.length > 0 && (
              <div className="flex items-center flex-wrap gap-y-1.5 mt-2 justify-center overflow-x-auto max-w-[90%]">
                {eventsAo.map((ev, idx) => (
                  <div key={idx} className="flex items-center">
                    {idx > 0 && (
                      <span className="text-white/20 text-[10px] font-bold mx-1.5 select-none">→</span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/30 whitespace-nowrap">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">+{ev.points}({ev.technique})</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AO Warnings Row */}
          <div className="border-t-2 border-blue-900/30 pt-3">
            <div className="flex items-center gap-2">
              <span className="font-din text-xs lg:text-sm font-bold text-blue-400/70 shrink-0 uppercase tracking-widest">PEN</span>
              <div className="flex-1 grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => {
                  const isActive = c1Ao >= level;
                  const labels = ['', 'C1', 'C2', 'C3', 'HC', 'H'];
                  return (
                    <div
                      key={level}
                      className={`flex items-center justify-center h-9 lg:h-11 rounded-xl font-din text-[clamp(14px,2.2vh,24px)] font-bold transition-all border ${
                        isActive
                          ? 'bg-blue-500 text-black border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                          : 'bg-transparent text-white/10 border-white/5'
                      }`}
                    >
                      {labels[level]}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

export default function SpectatorDisplayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/40 text-xl font-black tracking-widest animate-pulse">LOADING DISPLAY...</div>
      </div>
    }>
      <SpectatorDisplayContent />
    </Suspense>
  );
}

