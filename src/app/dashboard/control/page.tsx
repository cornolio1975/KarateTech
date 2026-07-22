'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, basePath } from '@/db/dbClient';
import { Bout, Participant } from '@/db/types';
import {
  Zap, Play, Square, RotateCcw, X, Award, Timer,
  ChevronLeft, Volume2, VolumeX, RefreshCw, Undo, Save, Check, Award as MedalIcon, Tv, Maximize2, Minimize2
} from 'lucide-react';
import { useTournament } from '@/context/TournamentContext';

export default function ScoreboardControlPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boutId = searchParams.get('boutId');
  const catId = searchParams.get('catId'); // passed from categories page
  const { tournamentName } = useTournament();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bout, setBout] = useState<Bout | null>(null);
  const [competitorAka, setCompetitorAka] = useState<Participant | null>(null);
  const [competitorAo, setCompetitorAo] = useState<Participant | null>(null);

  // Live scoring state
  const [scoreAka, setScoreAka] = useState<number>(0);
  const [scoreAo, setScoreAo] = useState<number>(0);
  const [senshuAka, setSenshuAka] = useState<boolean>(false);
  const [senshuAo, setSenshuAo] = useState<boolean>(false);

  // Track who scored first in the match (null = no one yet, 'aka' or 'ao', 'none' if simultaneous first scores occurred)
  const [firstScorer, setFirstScorer] = useState<'aka' | 'ao' | 'none' | null>(null);

  // Track which fighters scored their first valid point in the current stoppage sequence
  const [stoppageScorers, setStoppageScorers] = useState<('aka' | 'ao')[]>([]);

  // Penalties WKF System: C1, C2, C3, HC, H (0 to 5)
  const [c1Aka, setC1Aka] = useState<number>(0);
  const [c1Ao, setC1Ao] = useState<number>(0);

  // Technique log arrays (storing raw point values e.g. 3, 2, 1 for tie breaks)
  const [pointsAka, setPointsAka] = useState<number[]>([]);
  const [pointsAo, setPointsAo] = useState<number[]>([]);
  const [eventsAka, setEventsAka] = useState<{ fighter: string; points: number; technique: string; timestamp: number; matchId: string }[]>([]);
  const [eventsAo, setEventsAo] = useState<{ fighter: string; points: number; technique: string; timestamp: number; matchId: string }[]>([]);
  const [showPointHistory, setShowPointHistory] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(1800);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [matchDuration, setMatchDuration] = useState<number>(180);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hasTimerRun, setHasTimerRun] = useState<boolean>(false);

  // History stack for Undo
  const [history, setHistory] = useState<any[]>([]);

  // Modal / Saving states
  const [showFinishModal, setShowFinishModal] = useState<boolean>(false);
  const [winnerSide, setWinnerSide] = useState<'aka' | 'ao' | null>(null);
  const [winMethod, setWinMethod] = useState<string>('Points');
  const [saving, setSaving] = useState<boolean>(false);

  // Spectator View launch & management states
  const [spectatorConnected, setSpectatorConnected] = useState<boolean>(false);
  const [popupBlocked, setPopupBlocked] = useState<boolean>(false);
  const [isSpectatorModalOpen, setIsSpectatorModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const lastSpectatorHeartbeat = useRef<number>(0);
  const spectatorWindowRef = useRef<Window | null>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const soundPlayedRef = useRef<string | null>(null);

  // Open Spectator Window helper
  const openSpectatorWindow = useCallback((mode: 'default' | 'new-tab' | 'new-window' = 'default') => {
    if (typeof window === 'undefined') return;
    const specUrl = `${window.location.origin}${basePath}/display?boutId=${boutId}`;
    let specWindow: Window | null = null;
    
    if (mode === 'default') {
      specWindow = window.open(specUrl, 'KarateTechSpectator');
    } else if (mode === 'new-tab') {
      specWindow = window.open(specUrl, '_blank');
    } else if (mode === 'new-window') {
      specWindow = window.open(specUrl, '_blank', 'width=1200,height=800,menubar=no,status=no');
    }
    
    spectatorWindowRef.current = specWindow;
    
    if (!specWindow || specWindow.closed || typeof specWindow.closed === 'undefined') {
      setPopupBlocked(true);
    } else {
      setPopupBlocked(false);
      try {
        specWindow.focus();
      } catch (e) {
        console.warn('Could not focus spectator window:', e);
      }
    }
  }, [boutId]);

  // Setup broadcast channel & heartbeat checks
  useEffect(() => {
    setMounted(true);
    let channel: BroadcastChannel | null = null;

    if (typeof window !== 'undefined') {
      channel = new BroadcastChannel('wkf-scoreboard-sync');
      broadcastChannelRef.current = channel;
      const urlHistory = new URLSearchParams(window.location.search).get('history') === 'true';
      setShowPointHistory(urlHistory || localStorage.getItem('ts_show_point_history_referee') === 'true');

      // Send initial handshake ping
      channel.postMessage({ type: 'PING' });

      // Handle message events
      channel.onmessage = (event) => {
        const data = event.data;
        if (data.type === 'PONG' || data.type === 'SPECTATOR_CONNECTED') {
          lastSpectatorHeartbeat.current = Date.now();
          setSpectatorConnected(true);
        } else if (data.type === 'SPECTATOR_DISCONNECTED') {
          setSpectatorConnected(false);
        }
      };
    }

    // Ping interval to maintain keep-alive
    const pingInterval = setInterval(() => {
      broadcastChannelRef.current?.postMessage({ type: 'PING' });
    }, 1000);

    // Timeout checking connection health
    const healthInterval = setInterval(() => {
      if (lastSpectatorHeartbeat.current > 0 && Date.now() - lastSpectatorHeartbeat.current > 2500) {
        setSpectatorConnected(false);
      }
    }, 1000);

    // Auto-launch spectator window after 500ms if no connection is established
    const autoOpenTimeout = setTimeout(() => {
      if (lastSpectatorHeartbeat.current === 0) {
        openSpectatorWindow('default');
      }
    }, 500);

    return () => {
      clearInterval(pingInterval);
      clearInterval(healthInterval);
      clearTimeout(autoOpenTimeout);
      channel?.close();
    };
  }, [openSpectatorWindow]);

  // Trigger Superior Points fanfare when winner is determined by superior points
  useEffect(() => {
    if (winnerSide && winMethod === 'Superior Points' && soundPlayedRef.current !== winnerSide) {
      soundPlayedRef.current = winnerSide;
      playSuperiorPointsSound();
    } else if (!winnerSide) {
      soundPlayedRef.current = null;
    }
  }, [winnerSide, winMethod]);

  // Fetch bout data
  const loadBoutData = useCallback(async () => {
    if (!boutId) return;
    try {
      setLoading(true);
      const [bList, pList] = await Promise.all([
        db.bouts.list(),
        db.participants.list()
      ]);
      const currentBout = bList.find(b => b.id === boutId);
      if (currentBout) {
        setBout(currentBout);

        const compAka = pList.find(p => p.id === currentBout.participant_a_id) || null;
        const compAo = pList.find(p => p.id === currentBout.participant_b_id) || null;
        setCompetitorAka(compAka);
        setCompetitorAo(compAo);

        setScoreAka(currentBout.score_a ?? 0);
        setScoreAo(currentBout.score_b ?? 0);
        setSenshuAka(currentBout.senshu_a ?? false);
        setSenshuAo(currentBout.senshu_b ?? false);

        let parsedEventsAka: { fighter: string; points: number; technique: string; timestamp: number; matchId: string }[] = [];
        let parsedEventsAo: { fighter: string; points: number; technique: string; timestamp: number; matchId: string }[] = [];
        let savedPointsAka: number[] = [];
        let savedPointsAo: number[] = [];

        if (currentBout.points_aka_history) {
          if (currentBout.points_aka_history.startsWith('[')) {
            try {
              parsedEventsAka = JSON.parse(currentBout.points_aka_history);
              savedPointsAka = parsedEventsAka.map(e => e.points);
            } catch (e) {
              console.error(e);
            }
          } else {
            savedPointsAka = currentBout.points_aka_history.split(',').map(Number).filter(Boolean);
            parsedEventsAka = savedPointsAka.map(pts => ({
              fighter: 'AKA',
              points: pts,
              technique: pts === 1 ? 'Yuko' : pts === 2 ? 'Waza-ari' : pts === 3 ? 'Ippon' : 'Point',
              timestamp: 0,
              matchId: currentBout.id
            }));
          }
        }

        if (currentBout.points_ao_history) {
          if (currentBout.points_ao_history.startsWith('[')) {
            try {
              parsedEventsAo = JSON.parse(currentBout.points_ao_history);
              savedPointsAo = parsedEventsAo.map(e => e.points);
            } catch (e) {
              console.error(e);
            }
          } else {
            savedPointsAo = currentBout.points_ao_history.split(',').map(Number).filter(Boolean);
            parsedEventsAo = savedPointsAo.map(pts => ({
              fighter: 'AO',
              points: pts,
              technique: pts === 1 ? 'Yuko' : pts === 2 ? 'Waza-ari' : pts === 3 ? 'Ippon' : 'Point',
              timestamp: 0,
              matchId: currentBout.id
            }));
          }
        }

        // Determine first scorer from saved history or Senshu columns directly
        if (currentBout.senshu_a) {
          setFirstScorer('aka');
        } else if (currentBout.senshu_b) {
          setFirstScorer('ao');
        } else {
          if (savedPointsAka.length > 0 && savedPointsAo.length > 0) {
            setFirstScorer('none');
          } else {
            setFirstScorer(null);
          }
        }

        setC1Aka(currentBout.penalties_c1_a ? parseInt(currentBout.penalties_c1_a) || 0 : 0);
        setC1Ao(currentBout.penalties_c1_b ? parseInt(currentBout.penalties_c1_b) || 0 : 0);

        setPointsAka(savedPointsAka);
        setPointsAo(savedPointsAo);
        setEventsAka(parsedEventsAka);
        setEventsAo(parsedEventsAo);

        setTimeLeft((currentBout.timer_seconds ?? 180) * 10);
        setMatchDuration(currentBout.timer_seconds ?? 180);
        setHasTimerRun(false);

        // Seed history with clean match start state for complete undo support
        const initialSnap = {
          scoreAka: currentBout.score_a ?? 0,
          scoreAo: currentBout.score_b ?? 0,
          senshuAka: currentBout.senshu_a ?? false,
          senshuAo: currentBout.senshu_b ?? false,
          firstScorer: currentBout.senshu_a ? 'aka' : currentBout.senshu_b ? 'ao' : null,
          hasTimerRun: false,
          c1Aka: currentBout.penalties_c1_a ? parseInt(currentBout.penalties_c1_a) || 0 : 0,
          c1Ao: currentBout.penalties_c1_b ? parseInt(currentBout.penalties_c1_b) || 0 : 0,
          pointsAka: savedPointsAka,
          pointsAo: savedPointsAo,
          stoppageScorers: [],
          eventsAka: parsedEventsAka,
          eventsAo: parsedEventsAo,
          winnerSide: null,
          winMethod: '',
          timeLeft: (currentBout.timer_seconds ?? 180) * 10
        };
        setHistory([initialSnap]);
      }
    } catch (err) {
      console.error('Error loading scoreboard bout details:', err);
    } finally {
      setLoading(false);
    }
  }, [boutId]);

  useEffect(() => {
    if (mounted) {
      loadBoutData();
    }
  }, [mounted, loadBoutData]);

  // Derive Senshu state from firstScorer
  // This ensures Senshu is always consistent with who scored first
  useEffect(() => {
    if (firstScorer === 'aka') {
      setSenshuAka(true);
      setSenshuAo(false);
    } else if (firstScorer === 'ao') {
      setSenshuAo(true);
      setSenshuAka(false);
    } else {
      setSenshuAka(false);
      setSenshuAo(false);
    }
  }, [firstScorer]);

  // Broadcast function to sync displays
  const broadcastState = useCallback(() => {
    if (!broadcastChannelRef.current) return;
    broadcastChannelRef.current.postMessage({
      boutId,
      akaName: competitorAka?.full_name || 'TBD Red',
      akaClub: competitorAka?.club_id ? 'Senshi Karate Academy' : 'Senshi Club',
      aoName: competitorAo?.full_name || 'TBD Blue',
      aoClub: competitorAo?.club_id ? 'Goju-Ryu Karate Club' : 'Goju-Ryu Club',
      scoreAka,
      scoreAo,
      senshuAka,
      senshuAo,
      firstScorer,
      c1Aka,
      c2Aka: 0,
      c3Aka: 0,
      c1Ao,
      c2Ao: 0,
      c3Ao: 0,
      pointsAka,
      pointsAo,
      eventsAka,
      eventsAo,
      showPointHistory,
      timeLeft,
      timerActive,
      winner: winnerSide,
      winMethod,
      matchDuration
    });
  }, [
    boutId, competitorAka, competitorAo, scoreAka, scoreAo,
    senshuAka, senshuAo, firstScorer,
    c1Aka, c1Ao,
    pointsAka, pointsAo, eventsAka, eventsAo, showPointHistory,
    timeLeft, timerActive, winnerSide, winMethod, matchDuration
  ]);

  // Broadcast state updates in real-time
  useEffect(() => {
    if (mounted && bout) {
      broadcastState();

      const saveDraft = async () => {
        try {
          await db.bouts.updateBoutState(boutId!, {
            score_a: scoreAka,
            score_b: scoreAo,
            senshu_a: senshuAka,
            senshu_b: senshuAo,
            penalties_c1_a: String(c1Aka),
            penalties_c2_a: '0',
            penalties_c3_a: '0',
            penalties_c1_b: String(c1Ao),
            penalties_c2_b: '0',
            penalties_c3_b: '0',
            points_aka_history: JSON.stringify(eventsAka),
            points_ao_history: JSON.stringify(eventsAo),
            timer_seconds: Math.round(timeLeft / 10),
            timer_active: timerActive
          });
        } catch (e) {
          console.warn('Background draft save error', e);
        }
      };

      const debounceTimeout = setTimeout(saveDraft, 2000);
      return () => clearTimeout(debounceTimeout);
    }
  }, [
    scoreAka, scoreAo, senshuAka, senshuAo,
    c1Aka, c1Ao,
    pointsAka, pointsAo, eventsAka, eventsAo,
    timeLeft, timerActive, winnerSide, winMethod, mounted, bout, broadcastState, boutId
  ]);

  // Sound generator
  const triggerBuzzer = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(320, audioCtx.currentTime);

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

  const triggerBeep = () => {
    if (!soundEnabled) return;
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
    if (!soundEnabled) return;
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
    if (!soundEnabled) return;
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

  // Helper to determine the winner automatically upon match expiration based on WKF rules
  const autoDetermineWinner = (): { side: 'aka' | 'ao'; method: string } | null => {
    if (scoreAka > scoreAo) {
      return { side: 'aka', method: 'Points' };
    }
    if (scoreAo > scoreAka) {
      return { side: 'ao', method: 'Points' };
    }

    // Tie score: check superior scoring techniques first (highest scoring technique achieved)
    const countTech = (arr: number[], tech: number) => arr.filter(x => x === tech).length;

    // 1. Check Ippon (3 points)
    const ipponAka = countTech(pointsAka, 3);
    const ipponAo = countTech(pointsAo, 3);
    if (ipponAka !== ipponAo) {
      return ipponAka > ipponAo
        ? { side: 'aka', method: 'Superior Points' }
        : { side: 'ao', method: 'Superior Points' };
    }

    // 2. Check Waza-ari (2 points)
    const wazaAka = countTech(pointsAka, 2);
    const wazaAo = countTech(pointsAo, 2);
    if (wazaAka !== wazaAo) {
      return wazaAka > wazaAo
        ? { side: 'aka', method: 'Superior Points' }
        : { side: 'ao', method: 'Superior Points' };
    }

    // 3. Check Yuko (1 point)
    const yukoAka = countTech(pointsAka, 1);
    const yukoAo = countTech(pointsAo, 1);
    if (yukoAka !== yukoAo) {
      return yukoAka > yukoAo
        ? { side: 'aka', method: 'Superior Points' }
        : { side: 'ao', method: 'Superior Points' };
    }

    // 4. Tie score and identical techniques: check Senshu (first scorer advantage)
    if (senshuAka) {
      return { side: 'aka', method: 'SENSHU' };
    }
    if (senshuAo) {
      return { side: 'ao', method: 'SENSHU' };
    }

    // Complete tie: default suggestion is Hantei (referee decision)
    return null;
  };

  // Derive projected winner dynamically when time ends (before saving)
  useEffect(() => {
    if (timeLeft === 0 && !timerActive && bout?.status !== 'Completed') {
      const result = autoDetermineWinner();
      if (result) {
        setWinnerSide(result.side);
        setWinMethod(result.method);
      } else {
        setWinnerSide(null);
        setWinMethod('Hantei');
      }
    }
  }, [timeLeft, timerActive, scoreAka, scoreAo, senshuAka, senshuAo, c1Aka, c1Ao, bout?.status]);

  // Timer runner loop
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            triggerBuzzer();
            return 0;
          }
          const nextVal = prev - 1;
          if (nextVal === 150) {
            triggerBeep();
          }
          return nextVal;
        });
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, autoDetermineWinner]);

  // Save current state to history for undo operations
  const pushHistory = (
    prevScoreAka = scoreAka,
    prevScoreAo = scoreAo,
    prevSenshuAka = senshuAka,
    prevSenshuAo = senshuAo,
    prevFirstScorer = firstScorer,
    prevHasTimerRun = hasTimerRun,
    prevC1Aka = c1Aka,
    prevC1Ao = c1Ao,
    prevPointsAka = pointsAka,
    prevPointsAo = pointsAo,
    prevStoppageScorers = stoppageScorers,
    prevEventsAka = eventsAka,
    prevEventsAo = eventsAo,
    prevWinnerSide = winnerSide,
    prevWinMethod = winMethod,
    prevTimeLeft = timeLeft
  ) => {
    setHistory((prev) => [
      ...prev,
      {
        scoreAka: prevScoreAka,
        scoreAo: prevScoreAo,
        senshuAka: prevSenshuAka,
        senshuAo: prevSenshuAo,
        firstScorer: prevFirstScorer,
        hasTimerRun: prevHasTimerRun,
        c1Aka: prevC1Aka,
        c1Ao: prevC1Ao,
        pointsAka: prevPointsAka,
        pointsAo: prevPointsAo,
        stoppageScorers: prevStoppageScorers,
        eventsAka: prevEventsAka,
        eventsAo: prevEventsAo,
        winnerSide: prevWinnerSide,
        winMethod: prevWinMethod,
        timeLeft: prevTimeLeft
      }
    ]);
  };

  // Undo action: undoes actions all the way back to match start
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setScoreAka(lastState.scoreAka);
    setScoreAo(lastState.scoreAo);
    setSenshuAka(lastState.senshuAka);
    setSenshuAo(lastState.senshuAo);
    setFirstScorer(lastState.firstScorer ?? null);
    setHasTimerRun(lastState.hasTimerRun ?? false);
    setC1Aka(lastState.c1Aka ?? 0);
    setC1Ao(lastState.c1Ao ?? 0);
    setPointsAka(lastState.pointsAka ?? []);
    setPointsAo(lastState.pointsAo ?? []);
    setEventsAka(lastState.eventsAka ?? []);
    setEventsAo(lastState.eventsAo ?? []);
    setStoppageScorers(lastState.stoppageScorers ?? []);
    setWinnerSide(lastState.winnerSide ?? null);
    setWinMethod(lastState.winMethod ?? '');
    if (lastState.timeLeft !== undefined) {
      setTimeLeft(lastState.timeLeft);
    }
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, [history]);

  // Adjust scores with Senshu Award Rules:
  // 1. Start: both OFF
  // 2. First scorer (opponent has 0 points) → award Senshu permanently
  // 3. If both have ever scored at any time → Senshu OFF (no first scorer advantage)
  // 4. If both score in same sequence → Senshu OFF
  // 5. Senshu awarded only when one fighter is first scorer while opponent score is 0
  // 6. Once awarded, Senshu remains with that fighter (cannot transfer)
  // 7. Senshu indicator visible until match ends
  // 8. At end, if tied, use Senshu as tie-break
  const handleAddScore = useCallback((side: 'aka' | 'ao', points: number) => {
    if (bout?.status === 'Completed') return;
    if (c1Aka >= 5 || c1Ao >= 5) return;
    pushHistory();
    let finalScoreAka = scoreAka;
    let finalScoreAo = scoreAo;
    let finalPointsAka = [...pointsAka];
    let finalPointsAo = [...pointsAo];
    let isFirstScoreAka = false;
    let isFirstScoreAo = false;

    const technique = points === 1 ? 'Yuko' : points === 2 ? 'Waza-ari' : points === 3 ? 'Ippon' : 'Point';
    const timestamp = Math.round(timeLeft / 10);
    const newEvent = {
      fighter: side.toUpperCase(),
      points,
      technique,
      timestamp,
      matchId: boutId!
    };

    if (side === 'aka') {
      const newScore = Math.max(0, scoreAka + points);
      setScoreAka(newScore);
      finalScoreAka = newScore;

      if (points > 0) {
        finalPointsAka.push(points);
        setPointsAka(finalPointsAka);
        setEventsAka(prev => [...prev, newEvent]);
        if (scoreAka === 0) {
          isFirstScoreAka = true;
        }
      } else if (points < 0 && finalPointsAka.length > 0) {
        finalPointsAka.pop();
        setPointsAka(finalPointsAka);
        setEventsAka(prev => {
          const next = [...prev];
          let p = Math.abs(points);
          while (p > 0 && next.length > 0) {
            const last = { ...next[next.length - 1] };
            if (last.points <= p) {
              p -= last.points;
              next.pop();
            } else {
              last.points -= p;
              last.technique = last.points === 1 ? 'Yuko' : last.points === 2 ? 'Waza-ari' : last.points === 3 ? 'Ippon' : 'Point';
              next[next.length - 1] = last;
              p = 0;
            }
          }
          return next;
        });
      }
    } else {
      const newScore = Math.max(0, scoreAo + points);
      setScoreAo(newScore);
      finalScoreAo = newScore;

      if (points > 0) {
        finalPointsAo.push(points);
        setPointsAo(finalPointsAo);
        setEventsAo(prev => [...prev, newEvent]);
        if (scoreAo === 0) {
          isFirstScoreAo = true;
        }
      } else if (points < 0 && finalPointsAo.length > 0) {
        finalPointsAo.pop();
        setPointsAo(finalPointsAo);
        setEventsAo(prev => {
          const next = [...prev];
          let p = Math.abs(points);
          while (p > 0 && next.length > 0) {
            const last = { ...next[next.length - 1] };
            if (last.points <= p) {
              p -= last.points;
              next.pop();
            } else {
              last.points -= p;
              last.technique = last.points === 1 ? 'Yuko' : last.points === 2 ? 'Waza-ari' : last.points === 3 ? 'Ippon' : 'Point';
              next[next.length - 1] = last;
              p = 0;
            }
          }
          return next;
        });
      }
    }

    // Determine Senshu state based on current scores and custom first-score rules
    if (points > 0) {
      if (!timerActive) {
        setStoppageScorers((prev) => {
          const next = prev.includes(side) ? prev : [...prev, side];
          if (next.includes('aka') && next.includes('ao')) {
            // Rule 4: Both fighters score in the same stoppage sequence -> Senshu remains OFF
            setFirstScorer('none');
          } else if (firstScorer === null || firstScorer === 'none') {
            // Only one scored in this stoppage sequence and Senshu was OFF -> award Senshu to them
            setFirstScorer(side);
          }
          return next;
        });
      } else {
        // Active play: immediately award Senshu to the scorer if Senshu was OFF
        if (firstScorer === null || firstScorer === 'none') {
          setFirstScorer(side);
        }
      }
    } else {
      // Points subtraction (undo/correction)
      if (finalScoreAka === 0 && finalScoreAo === 0) {
        setFirstScorer(null);
        setStoppageScorers([]);
      } else if (finalScoreAka === 0) {
        setFirstScorer('ao');
        setStoppageScorers((prev) => prev.filter(s => s !== 'aka'));
      } else if (finalScoreAo === 0) {
        setFirstScorer('aka');
        setStoppageScorers((prev) => prev.filter(s => s !== 'ao'));
      }
    }

    // Check for 8-point gap differential rule
    if (Math.abs(finalScoreAka - finalScoreAo) >= 8) {
      setTimerActive(false);
      triggerBuzzer();
      const finalWinner = finalScoreAka > finalScoreAo ? 'aka' : 'ao';
      setWinnerSide(finalWinner);
      setWinMethod('Points');
    }
  }, [scoreAka, scoreAo, senshuAka, senshuAo, firstScorer, hasTimerRun, triggerBuzzer, pointsAka, pointsAo, eventsAka, eventsAo, c1Aka, c1Ao, bout, timerActive]);

  // Manage Penalties WKF System: C1, C2, C3, HC, H (level 1 to 5)
  const handleTogglePenalty = (side: 'aka' | 'ao', level: number) => {
    if (!bout || bout.status === 'Completed') return;
    pushHistory();

    const isAka = side === 'aka';
    let nextVal = 0;

    if (isAka) {
      nextVal = c1Aka === level ? Math.max(0, level - 1) : level;
      setC1Aka(nextVal);
    } else {
      nextVal = c1Ao === level ? Math.max(0, level - 1) : level;
      setC1Ao(nextVal);
    }

    // Hansoku (disqualification) at level 5
    if (nextVal === 5) {
      setTimerActive(false);
      playHansokuAlarm();
      const opponentSide = isAka ? 'ao' : 'aka';
      setWinnerSide(opponentSide);
      setWinMethod('HANSOKU');
    } else if ((isAka && c1Aka >= 5) || (!isAka && c1Ao >= 5)) {
      // Operator reduced penalty back down below 5
      if (winMethod === 'HANSOKU') {
        setWinnerSide(null);
        setWinMethod('');
      }
    }
  };

  // Manage Senshu - manual toggle (referee override only)
  const handleToggleSenshu = (side: 'aka' | 'ao') => {
    if (!bout || bout.status === 'Completed') return;
    pushHistory();
    if (side === 'aka') {
      if (firstScorer === 'aka') {
        setFirstScorer(null);
      } else {
        setFirstScorer('aka');
      }
    } else {
      if (firstScorer === 'ao') {
        setFirstScorer(null);
      } else {
        setFirstScorer('ao');
      }
    }
  };

  // Timer controls
  const handleStartTimer = () => {
    if (timeLeft > 0) setTimerActive(true);
  };

  const handleStopTimer = () => {
    setTimerActive(false);
  };

  const handleResetTimer = () => {
    pushHistory();
    setTimerActive(false);
    setTimeLeft(matchDuration * 10);
    setHasTimerRun(false);
  };

  const handleAdjustTime = (seconds: number) => {
    pushHistory();
    setTimeLeft((prev) => Math.max(0, prev + seconds * 10));
  };

  // Set hasTimerRun to true when timer is active and clear stoppageScorers when active
  useEffect(() => {
    if (timerActive) {
      setHasTimerRun(true);
      setStoppageScorers([]);
    }
  }, [timerActive]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName;
      if (activeEl === 'INPUT' || activeEl === 'TEXTAREA' || activeEl === 'SELECT') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setTimerActive(prev => !prev);
          break;
        case 'KeyR':
          handleAddScore('aka', 1);
          break;
        case 'KeyF':
          handleAddScore('aka', 2);
          break;
        case 'KeyV':
          handleAddScore('aka', 3);
          break;
        case 'KeyU':
          handleAddScore('ao', 1);
          break;
        case 'KeyJ':
          handleAddScore('ao', 2);
          break;
        case 'KeyM':
          handleAddScore('ao', 3);
          break;
        case 'Backspace':
          e.preventDefault();
          handleUndo();
          break;
        case 'Enter':
          e.preventDefault();
          setTimerActive(false);
          if (c1Aka < 5 && c1Ao < 5) {
            const autoWin = autoDetermineWinner();
            if (autoWin) {
              setWinnerSide(autoWin.side);
              setWinMethod(autoWin.method);
            } else {
              setWinnerSide(null);
              setWinMethod('Hantei');
            }
          }
          setShowFinishModal(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddScore, handleUndo, autoDetermineWinner]);

  // Time formatters
  const formatMainTime = (tenths: number): string => {
    const totalSeconds = Math.floor(tenths / 10);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDecsTime = (tenths: number): string => {
    return `.${tenths % 10}`;
  };

  // Finish Match saving result
  const handleSaveResult = async () => {
    if (!boutId || !bout) return;

    let winnerId: string | null = null;
    if (winnerSide === 'aka') {
      winnerId = bout.participant_a_id;
    } else if (winnerSide === 'ao') {
      winnerId = bout.participant_b_id;
    }

    if (!winnerId) {
      alert('Please select a winner to finish this match.');
      return;
    }

    try {
      setSaving(true);

      await db.bouts.updateBoutState(boutId, {
        status: 'Completed',
        winner_id: winnerId,
        score_a: scoreAka,
        score_b: scoreAo,
        senshu_a: senshuAka,
        senshu_b: senshuAo,
        penalties_c1_a: String(c1Aka),
        penalties_c2_a: '0',
        penalties_c3_a: '0',
        penalties_c1_b: String(c1Ao),
        penalties_c2_b: '0',
        penalties_c3_b: '0',
        points_aka_history: JSON.stringify(eventsAka),
        points_ao_history: JSON.stringify(eventsAo),
        timer_seconds: Math.round(timeLeft / 10),
        victory_method: winMethod
      });

      setShowFinishModal(false);
      // Removed automatic navigation so the operator stays on the completed scoreboard
    } catch (err) {
      console.error('Error saving bout result:', err);
      alert('Failed to save result. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRematch = async () => {
    if (!boutId) return;

    const confirmRematch = window.confirm(
      'Are you sure you want to reset this match and start a rematch? This will clear all scores, penalties, and history, and remove the winner placement in the bracket.'
    );
    if (!confirmRematch) return;

    try {
      setSaving(true);

      // Reset the bout in database / mockStore
      const resetBout = await db.bouts.resetBoutResult(boutId, matchDuration);
      if (resetBout) {
        setBout(resetBout);
      }

      // Reset local state variables
      setScoreAka(0);
      setScoreAo(0);
      setC1Aka(0);
      setC1Ao(0);
      setSenshuAka(false);
      setSenshuAo(false);
      setFirstScorer(null);
      setPointsAka([]);
      setPointsAo([]);
      setEventsAka([]);
      setEventsAo([]);
      setWinnerSide(null);
      setWinMethod('');
      setTimeLeft(matchDuration * 10);
      setTimerActive(false);
      setHistory([]);

      alert('Rematch initialized! Scoreboard and timer options are now unlocked to start a new match.');
    } catch (err) {
      console.error('Error during rematch reset:', err);
      alert('Failed to initialize rematch. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSpectatorIndicatorClick = () => {
    openSpectatorWindow('default');
  };

  const handleSpectatorButtonClick = () => {
    if (spectatorConnected) {
      setIsSpectatorModalOpen(true);
    } else {
      openSpectatorWindow('default');
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0b0b10] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400" />
      </div>
    );
  }

  if (!bout) {
    return (
      <div className="min-h-screen bg-[#0b0b10] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg font-bold mb-4">Bout not found</p>
          <Link href="/bouts" className="text-yellow-400 hover:text-yellow-300">
            Return to Bouts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#0b0b10] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#0b0b10] border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/bouts" className="p-2 hover:bg-white/5 rounded-lg transition">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider">Scoreboard Control</h1>
            <p className="text-xs text-gray-500">{tournamentName || 'Tournament'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <button
            onClick={handleSpectatorIndicatorClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
              spectatorConnected 
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
            }`}
            title={spectatorConnected ? "Focus existing spectator view" : "Launch spectator view"}
          >
            <span className={`w-2 h-2 rounded-full ${spectatorConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span>{spectatorConnected ? 'Spectator Connected' : 'Spectator Closed'}</span>
          </button>

          {/* Spectator View button */}
          <button
            onClick={handleSpectatorButtonClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Tv className="h-3.5 w-3.5" />
            <span>Spectator View</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
              isFullscreen
                ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
            }`}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 hover:bg-white/5 rounded-lg transition"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-xs font-bold transition"
          >
            <Undo className="h-3.5 w-3.5" /> Undo
          </button>
        </div>
      </header>

      {/* Popup Blocked Warning */}
      {popupBlocked && (
        <div className="bg-amber-500 text-black px-6 py-2.5 flex items-center justify-between text-xs font-bold shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>Please allow pop-ups to automatically open the Spectator View on this device.</span>
          </div>
          <button
            onClick={() => openSpectatorWindow('default')}
            className="px-3 py-1 bg-black text-white hover:bg-black/90 rounded-md text-[10px] uppercase tracking-wider font-black transition cursor-pointer"
          >
            Open Spectator View
          </button>
        </div>
      )}


      {/* Main Scoreboard - No Scroll Layout */}
      <main className="flex-1 flex flex-col gap-2 p-2 lg:p-4 overflow-hidden min-h-0">
        {/* Hansoku Disqualification Blinking Banner */}
        {(c1Aka >= 5 || c1Ao >= 5) && !winnerSide && (
          <div className="bg-red-600 text-white font-black text-center py-2 text-xl lg:text-2xl rounded-2xl mb-1 animate-pulse tracking-widest uppercase border-2 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.6)] z-20 shrink-0">
            🚨 HANSOKU DISQUALIFICATION – {c1Aka >= 5 ? 'AKA (RED)' : 'AO (BLUE)'} 🚨
          </div>
        )}

        {/* Dynamic Winner Alert Header */}
        {winnerSide && (
          <div className={`p-2 lg:p-3 mb-1 shrink-0 rounded-2xl flex items-center justify-center font-black text-base lg:text-xl tracking-widest uppercase border-2 shadow-xl animate-pulse z-20 ${
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
            }: {winnerSide === 'aka' ? (competitorAka?.full_name || 'AKA RED') : (competitorAo?.full_name || 'AO BLUE')} {winMethod === 'HANSOKU' ? '🚨' : '🏆'}
          </div>
        )}

        {/* ROW 1: Visual Displays & Controls (3-Column Layout: AKA | TIMER | AO) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-3 flex-1 min-h-0 overflow-hidden">
          
          {/* AKA Display & Control Panel */}
          <section className={`lg:col-span-4 border rounded-3xl p-3 lg:p-4 flex flex-col justify-between items-center transition-all duration-500 overflow-hidden ${
            winnerSide === 'aka'
              ? 'bg-red-950/80 border-red-500 shadow-[inset_0_0_80px_rgba(239,68,68,0.3),0_0_40px_rgba(239,68,68,0.6)]'
              : 'bg-gradient-to-b from-red-950/20 via-red-950/5 to-transparent border-red-900/30'
          }`}>
            {/* Header & Fighter Name */}
            <div className="w-full flex flex-col items-center shrink-0">
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs lg:text-sm font-black uppercase tracking-wider text-red-400">AKA - RED</span>
                {senshuAka && (
                  <div className="flex items-center gap-1 bg-yellow-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>
                    SENSHU
                  </div>
                )}
              </div>

              <div className="w-full text-center mt-0.5">
                <h2 className="font-competitor text-[clamp(16px,1.8vw,22px)] font-extrabold truncate max-w-full text-center uppercase leading-tight" title={competitorAka?.full_name || 'TBD Red'}>
                  {competitorAka?.full_name || 'TBD Red'}
                </h2>
                <p className="text-red-400/60 text-[10px] font-bold text-center truncate max-w-full">
                  {competitorAka?.club_id ? 'Senshi Karate Academy' : 'Senshi Club'}
                </p>
              </div>
            </div>

            {/* Score & Point History */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-1">
              <span className={`font-din text-[clamp(65px,10vh,120px)] font-bold leading-none tracking-tight select-none transition-all duration-300 ${
                winnerSide === 'aka'
                  ? 'text-red-500 animate-blink drop-shadow-[0_0_45px_rgba(239,68,68,0.7)] scale-105'
                  : scoreAka - scoreAo >= 8
                    ? 'text-red-500 animate-pulse scale-105 drop-shadow-[0_0_45px_rgba(239,68,68,0.65)]'
                    : 'text-red-500 drop-shadow-[0_0_35px_rgba(220,38,38,0.25)]'
              }`}>
                {scoreAka}
              </span>

              {showPointHistory && eventsAka.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide max-w-full mt-1 px-1">
                  {eventsAka.map((ev, idx) => (
                    <div key={idx} className="flex items-center shrink-0">
                      {idx > 0 && <span className="text-white/20 text-[8px] font-bold mx-0.5 select-none">→</span>}
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/30 whitespace-nowrap">
                        <span className="text-[8px] font-black text-red-400 uppercase">+{ev.points}({ev.technique})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AKA Controls: Score Buttons + Penalties */}
            <div className="w-full flex flex-col gap-2 pt-2 border-t border-red-900/30 shrink-0">
              {/* Score Buttons */}
              <div className="grid grid-cols-3 gap-1.5 w-full">
                <button
                  onClick={() => handleAddScore('aka', 1)}
                  disabled={bout.status === 'Completed'}
                  className="py-2 bg-red-600/40 hover:bg-red-600/60 border border-red-500/30 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <span className="text-xs md:text-sm font-black uppercase tracking-wider leading-tight">+1</span>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight">Yuko</span>
                </button>
                <button
                  onClick={() => handleAddScore('aka', 2)}
                  disabled={bout.status === 'Completed'}
                  className="py-2 bg-red-600/40 hover:bg-red-600/60 border border-red-500/30 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <span className="text-xs md:text-sm font-black uppercase tracking-wider leading-tight">+2</span>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight">Waza-ari</span>
                </button>
                <button
                  onClick={() => handleAddScore('aka', 3)}
                  disabled={bout.status === 'Completed'}
                  className="py-2 bg-red-600/40 hover:bg-red-600/60 border border-red-500/30 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <span className="text-xs md:text-sm font-black uppercase tracking-wider leading-tight">+3</span>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight">Ippon</span>
                </button>
              </div>

              {/* Penalties Row */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] uppercase font-black tracking-widest text-red-400/60">AKA Penalties</span>
                  <button
                    onClick={() => handleToggleSenshu('aka')}
                    disabled={bout.status === 'Completed'}
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition cursor-pointer ${senshuAka
                        ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                        : 'bg-transparent text-white/40 border-white/15'
                      } disabled:opacity-25 disabled:cursor-not-allowed`}
                  >
                    SENSHU {senshuAka ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const isActive = c1Aka >= level;
                    const labels = ['', 'C1', 'C2', 'C3', 'HC', 'H'];
                    return (
                      <button
                        key={level}
                        onClick={() => handleTogglePenalty('aka', level)}
                        disabled={bout.status === 'Completed'}
                        className={`py-1.5 rounded text-xs font-black transition cursor-pointer border disabled:opacity-25 disabled:cursor-not-allowed ${isActive
                            ? 'bg-red-500 text-black border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.3)]'
                            : 'bg-transparent text-white/30 border-white/5 hover:border-white/15'
                          }`}
                      >
                        {labels[level]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* TIMER Display & Control Panel (Middle Column) */}
          <section className="lg:col-span-4 bg-white/[0.02] border border-white/5 rounded-3xl p-3 lg:p-4 flex flex-col justify-between items-center text-center overflow-hidden">
            <span className="text-xs uppercase font-black text-white/50 tracking-widest shrink-0">Match Timer</span>
            
            {/* Giant Timer */}
            <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 py-1">
              <div className={`font-din text-[clamp(80px,13vh,140px)] font-bold leading-none select-none flex items-baseline justify-center tracking-tight ${
                timeLeft <= 150 && timeLeft > 0 ? 'text-red-500 animate-pulse drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]' : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]'
              }`}>
                <span>{formatMainTime(timeLeft)}</span>
                <span className={`font-din text-[clamp(40px,6vh,70px)] font-bold ml-1 lg:ml-2 ${
                  timeLeft <= 150 && timeLeft > 0 ? 'text-red-500/60' : 'text-white/70'
                }`}>{formatDecsTime(timeLeft)}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${timerActive ? 'bg-green-500 animate-ping' : 'bg-red-500'}`} />
                <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">
                  {timerActive ? 'ACTIVE RUNNING' : 'PAUSED'}
                </span>
              </div>
            </div>

            {/* Integrated Controls */}
            <div className="w-full flex flex-col gap-2 pt-2 border-t border-white/10 shrink-0">
              {/* Primary Controls */}
              <div className="grid grid-cols-4 gap-1.5 w-full">
                <div className="col-span-2">
                  {timerActive ? (
                    <button
                      onClick={handleStopTimer}
                      disabled={bout.status === 'Completed'}
                      className="w-full h-full py-2 bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-red-950/40"
                    >
                      <Square className="h-4 w-4 fill-white" /> Stop Timer
                    </button>
                  ) : (
                    <button
                      onClick={handleStartTimer}
                      disabled={timeLeft === 0 || bout.status === 'Completed'}
                      className="w-full h-full py-2 bg-green-600 hover:bg-green-500 text-white disabled:opacity-40 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-green-950/40"
                    >
                      <Play className="h-4 w-4 fill-white" /> Start Timer
                    </button>
                  )}
                </div>
                
                <button
                  onClick={handleResetTimer}
                  disabled={timerActive || bout.status === 'Completed'}
                  className="py-2 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer border border-white/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
                
                <div className="grid grid-rows-2 gap-1">
                  <button
                    onClick={() => handleAdjustTime(1)}
                    disabled={timerActive || bout.status === 'Completed'}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded font-black text-[10px] uppercase transition cursor-pointer border border-white/20"
                  >
                    +1s
                  </button>
                  <button
                    onClick={() => handleAdjustTime(-1)}
                    disabled={timerActive || bout.status === 'Completed'}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded font-black text-[10px] uppercase transition cursor-pointer border border-white/20"
                  >
                    -1s
                  </button>
                </div>
              </div>

              {/* Secondary Match Actions */}
              <div className="grid grid-cols-2 gap-1.5 w-full">
                <div>
                  <label className="block text-[8px] uppercase font-bold text-gray-400 mb-0.5 text-left">Match Duration</label>
                  <select
                    value={matchDuration}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setMatchDuration(val);
                      setTimeLeft(val * 10);
                    }}
                    disabled={timerActive || bout.status === 'Completed'}
                    className="w-full bg-[#101015] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white disabled:opacity-40 focus:outline-none focus:border-yellow-400 transition cursor-pointer"
                  >
                    <option value={60}>1:00 Minute</option>
                    <option value={90}>1:30 Minutes</option>
                    <option value={120}>2:00 Minutes</option>
                    <option value={180}>3:00 Minutes</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="w-full py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 disabled:opacity-30 border border-yellow-500/20 rounded-lg font-black text-[11px] uppercase transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Undo Action
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* AO Display & Control Panel */}
          <section className={`lg:col-span-4 border rounded-3xl p-3 lg:p-4 flex flex-col justify-between items-center transition-all duration-500 overflow-hidden ${
            winnerSide === 'ao'
              ? 'bg-blue-950/80 border-blue-500 shadow-[inset_0_0_80px_rgba(59,130,246,0.3),0_0_40px_rgba(59,130,246,0.6)]'
              : 'bg-gradient-to-b from-blue-950/20 via-blue-950/5 to-transparent border-blue-900/30'
          }`}>
            {/* Header & Fighter Name */}
            <div className="w-full flex flex-col items-center shrink-0">
              <div className="flex items-center justify-between w-full mb-1">
                {senshuAo && (
                  <div className="flex items-center gap-1 bg-yellow-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>
                    SENSHU
                  </div>
                )}
                <span className="text-xs lg:text-sm font-black uppercase tracking-wider text-blue-400 ml-auto">AO - BLUE</span>
              </div>

              <div className="w-full text-center mt-0.5">
                <h2 className="font-competitor text-[clamp(16px,1.8vw,22px)] font-extrabold truncate max-w-full text-center uppercase leading-tight" title={competitorAo?.full_name || 'TBD Blue'}>
                  {competitorAo?.full_name || 'TBD Blue'}
                </h2>
                <p className="text-blue-400/60 text-[10px] font-bold text-center truncate max-w-full">
                  {competitorAo?.club_id ? 'Goju-Ryu Karate Club' : 'Goju-Ryu Club'}
                </p>
              </div>
            </div>

            {/* Score & Point History */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-1">
              <span className={`font-din text-[clamp(65px,10vh,120px)] font-bold leading-none tracking-tight select-none transition-all duration-300 ${
                winnerSide === 'ao'
                  ? 'text-blue-400 animate-blink drop-shadow-[0_0_45px_rgba(59,130,246,0.7)] scale-105'
                  : scoreAo - scoreAka >= 8
                    ? 'text-blue-400 animate-pulse scale-105 drop-shadow-[0_0_45px_rgba(59,130,246,0.65)]'
                    : 'text-blue-400 drop-shadow-[0_0_35px_rgba(59,130,246,0.3)]'
              }`}>
                {scoreAo}
              </span>

              {showPointHistory && eventsAo.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide max-w-full mt-1 px-1">
                  {eventsAo.map((ev, idx) => (
                    <div key={idx} className="flex items-center shrink-0">
                      {idx > 0 && <span className="text-white/20 text-[8px] font-bold mx-0.5 select-none">→</span>}
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/30 whitespace-nowrap">
                        <span className="text-[8px] font-black text-blue-400 uppercase">+{ev.points}({ev.technique})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AO Controls: Score Buttons + Penalties */}
            <div className="w-full flex flex-col gap-2 pt-2 border-t border-blue-900/30 shrink-0">
              {/* Score Buttons */}
              <div className="grid grid-cols-3 gap-1.5 w-full">
                <button
                  onClick={() => handleAddScore('ao', 1)}
                  disabled={bout.status === 'Completed'}
                  className="py-2 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/30 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <span className="text-xs md:text-sm font-black uppercase tracking-wider leading-tight">+1</span>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight">Yuko</span>
                </button>
                <button
                  onClick={() => handleAddScore('ao', 2)}
                  disabled={bout.status === 'Completed'}
                  className="py-2 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/30 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <span className="text-xs md:text-sm font-black uppercase tracking-wider leading-tight">+2</span>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight">Waza-ari</span>
                </button>
                <button
                  onClick={() => handleAddScore('ao', 3)}
                  disabled={bout.status === 'Completed'}
                  className="py-2 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/30 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <span className="text-xs md:text-sm font-black uppercase tracking-wider leading-tight">+3</span>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight">Ippon</span>
                </button>
              </div>

              {/* Penalties Row */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => handleToggleSenshu('ao')}
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition cursor-pointer ${senshuAo
                        ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                        : 'bg-transparent text-white/40 border-white/15'
                      }`}
                  >
                    SENSHU {senshuAo ? 'ON' : 'OFF'}
                  </button>
                  <span className="text-[9px] uppercase font-black tracking-widest text-blue-400/60">AO Penalties</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const isActive = c1Ao >= level;
                    const labels = ['', 'C1', 'C2', 'C3', 'HC', 'H'];
                    return (
                      <button
                        key={level}
                        onClick={() => handleTogglePenalty('ao', level)}
                        className={`py-1.5 rounded text-xs font-black transition cursor-pointer border ${isActive
                            ? 'bg-blue-500 text-black border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                            : 'bg-transparent text-white/30 border-white/5 hover:border-white/15'
                          }`}
                      >
                        {labels[level]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Keyboard guide footer */}
      <footer className="bg-[#0b0b10] border-t border-white/5 px-6 py-3 flex items-center justify-between text-[10px] text-gray-500 font-semibold shrink-0 flex-wrap gap-4">
        <div className="flex gap-4 items-center">
          <span>Shortcuts:</span>
          <span><b className="text-gray-400">Space</b> Start/Stop</span>
          <span><b className="text-gray-400">R/U</b> AKA/AO +1</span>
          <span><b className="text-gray-400">F/J</b> AKA/AO +2</span>
          <span><b className="text-gray-400">V/M</b> AKA/AO +3</span>
          <span><b className="text-gray-400">Backspace</b> Undo</span>
          <span><b className="text-gray-400">Enter</b> Finish</span>
        </div>

        <div className="flex gap-2 items-center ml-auto">
          {(winnerSide || bout.status === 'Completed') && (
            <button
              onClick={handleRematch}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-95 shadow-md shadow-red-600/10"
            >
              <RotateCcw className="h-4 w-4" /> Rematch
            </button>
          )}

          <button
            onClick={() => {
              setTimerActive(false);
              if (c1Aka < 5 && c1Ao < 5) {
                const autoWin = autoDetermineWinner();
                if (autoWin) {
                  setWinnerSide(autoWin.side);
                  setWinMethod(autoWin.method);
                } else {
                  setWinnerSide(null);
                  setWinMethod('Hantei');
                }
              }
              setShowFinishModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-95 shadow-md shadow-yellow-500/10"
          >
            <Save className="h-4 w-4" /> Save Bout Result
          </button>
        </div>
      </footer>

      {/* Save Result / Finish Match Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`bg-[#0d0d12] border max-w-md w-full rounded-3xl p-6 shadow-2xl transition-all duration-300 ${
            winMethod === 'Superior Points'
              ? 'border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.35)]'
              : 'border-white/10'
          }`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <MedalIcon className="h-5 w-5 text-yellow-400" />
                <h3 className="text-lg font-black tracking-tight">Confirm Match Result</h3>
              </div>
              <button
                onClick={() => setShowFinishModal(false)}
                className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {winMethod === 'Superior Points' && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl p-4 text-xs font-black text-center animate-bounce tracking-wider uppercase">
                  🏆 Winner by Superior Points 🏆
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Declare Winner</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setWinnerSide('aka')}
                    className={`py-3 rounded-xl border text-xs font-black transition cursor-pointer ${winnerSide === 'aka'
                        ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/20'
                        : 'bg-transparent text-white/50 border-white/10 hover:border-white/20'
                      }`}
                  >
                    AKA ({competitorAka?.full_name?.split(' ')[0] || 'Red'})
                  </button>
                  <button
                    onClick={() => setWinnerSide('ao')}
                    className={`py-3 rounded-xl border text-xs font-black transition cursor-pointer ${winnerSide === 'ao'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-950/20'
                        : 'bg-transparent text-white/50 border-white/10 hover:border-white/20'
                      }`}
                  >
                    AO ({competitorAo?.full_name?.split(' ')[0] || 'Blue'})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Winning Decision Method</label>
                <select
                  value={winMethod}
                  onChange={e => setWinMethod(e.target.value)}
                  className="w-full bg-[#101015] border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-yellow-400 transition cursor-pointer"
                >
                  <option value="Points">Points Advantage (Senshu / Gap)</option>
                  <option value="SENSHU">Senshu Advantage (First Score)</option>
                  <option value="Superior Points">Superior Points (Highest Technique)</option>
                  <option value="Hantei">Hantei (Referees Decision)</option>
                  <option value="HANSOKU">Hansoku (Opponent Disqualification)</option>
                  <option value="Kiken">Kiken (Opponent Withdrawal / Kiken)</option>
                </select>
              </div>

              {Math.abs(scoreAka - scoreAo) >= 8 && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-3 text-xs font-black text-center animate-pulse tracking-wide uppercase">
                  ⚠️ 8-Point Lead Differential Reached!
                </div>
              )}

              <div className="bg-[#121218] rounded-xl p-3 border border-white/5 flex items-center justify-between text-xs font-bold">
                <span className="text-gray-400">Final Score Summary</span>
                <span className="font-mono text-sm tracking-widest text-yellow-400">
                  {scoreAka} - {scoreAo}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResult}
                disabled={saving || !winnerSide}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Confirm & Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spectator View Management Modal */}
      {isSpectatorModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#121218] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto">
                <Tv className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">Spectator View Running</h3>
              <p className="text-xs text-gray-400 font-medium">
                Spectator View is already running. Choose an option:
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  openSpectatorWindow('default');
                  setIsSpectatorModalOpen(false);
                }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition text-left px-4 flex items-center justify-between cursor-pointer"
              >
                <span>Focus Existing Window</span>
                <span className="text-[10px] text-gray-500 font-semibold">Reuses active tab</span>
              </button>

              <button
                onClick={() => {
                  openSpectatorWindow('new-tab');
                  setIsSpectatorModalOpen(false);
                }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition text-left px-4 flex items-center justify-between cursor-pointer"
              >
                <span>Open New Tab</span>
                <span className="text-[10px] text-gray-500 font-semibold">Creates another tab</span>
              </button>

              <button
                onClick={() => {
                  openSpectatorWindow('new-window');
                  setIsSpectatorModalOpen(false);
                }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition text-left px-4 flex items-center justify-between cursor-pointer"
              >
                <span>Open New Browser Window</span>
                <span className="text-[10px] text-gray-500 font-semibold">For dual screens</span>
              </button>

              <button
                onClick={() => setIsSpectatorModalOpen(false)}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition text-center mt-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}