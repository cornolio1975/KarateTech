'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db, supabase, basePath } from '@/db/dbClient';
import { Bout, Participant, Category, Club, DisplayPlaylist, DisplayPlaylistSlide, isKataCategory } from '@/db/types';
import { ShieldAlert, Zap, Award, Trophy, Volume2, Maximize2, Minimize2, Play, Pause, SkipForward, SkipBack, List, Monitor, Clock, Layers, Calendar, Flag } from 'lucide-react';
import { useTournament } from '@/context/TournamentContext';
import DisplayPlaylistModal from '@/components/DisplayPlaylistModal';

function SpectatorDisplayContent() {
  const searchParams = useSearchParams();
  const urlBoutId = searchParams.get('boutId');
  const urlPlaylistId = searchParams.get('playlistId');

  const [activeBoutId, setActiveBoutId] = useState<string | null>(null);
  const { tournamentName } = useTournament();

  // Playlist Presentation Engine States
  const [playlists, setPlaylists] = useState<DisplayPlaylist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<DisplayPlaylist | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [slideTimeLeft, setSlideTimeLeft] = useState<number>(25);
  const [isPlaylistPaused, setIsPlaylistPaused] = useState<boolean>(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);

  // General Presentation Data
  const [allBouts, setAllBouts] = useState<Bout[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);

  // Sync activeBoutId & mode & panelSize with URL query params initially or when they change
  useEffect(() => {
    if (urlBoutId) {
      setActiveBoutId(urlBoutId);
    }
    const urlMode = searchParams.get('mode');
    if (urlMode === 'Flags' || urlMode === 'flags') {
      setScoringMethod('Flags');
    } else if (urlMode === 'Points' || urlMode === 'points') {
      setScoringMethod('Points');
    }
    const urlPanelSize = searchParams.get('panelSize');
    if (urlPanelSize) {
      const parsed = parseInt(urlPanelSize);
      if (parsed === 5 || parsed === 7) setPanelSize(parsed);
    }
  }, [urlBoutId, searchParams]);

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

  // Kata spectator states
  const [isKata, setIsKata] = useState<boolean>(false);
  const [kataA, setKataA] = useState<string>('');
  const [kataB, setKataB] = useState<string>('');
  const [judgeScoresA, setJudgeScoresA] = useState<number[]>([]);
  const [judgeScoresB, setJudgeScoresB] = useState<number[]>([]);
  const [panelSize, setPanelSize] = useState<number>(5);
  const [scoringMethod, setScoringMethod] = useState<'Points' | 'Flags'>('Flags');

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

  // Load Playlist & Presentation Data
  useEffect(() => {
    const loadPresentationData = async () => {
      try {
        const [plList, bList, cList, pList, clList] = await Promise.all([
          db.displayPlaylists.list(),
          db.bouts.list(),
          db.categories.list(),
          db.participants.list(),
          db.clubs.list()
        ]);
        setPlaylists(plList);
        setAllBouts(bList);
        setAllCategories(cList);
        setAllParticipants(pList);
        setAllClubs(clList);

        if (urlPlaylistId) {
          const targetPl = plList.find(p => p.id === urlPlaylistId);
          if (targetPl) {
            setActivePlaylist(targetPl);
            setCurrentSlideIndex(0);
            setSlideTimeLeft(targetPl.slides[0]?.duration_seconds || 25);
          }
        }
      } catch (err) {
        console.error('Error loading presentation data:', err);
      }
    };
    loadPresentationData();
  }, [urlPlaylistId]);

  // Playlist Slide Rotation Timer Effect
  useEffect(() => {
    if (!activePlaylist || !activePlaylist.slides || activePlaylist.slides.length === 0 || isPlaylistPaused) return;

    const timer = setInterval(() => {
      setSlideTimeLeft((prev) => {
        if (prev <= 1) {
          setCurrentSlideIndex((curr) => {
            const nextIdx = (curr + 1) % activePlaylist.slides.length;
            setSlideTimeLeft(activePlaylist.slides[nextIdx]?.duration_seconds || 25);
            return nextIdx;
          });
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activePlaylist, isPlaylistPaused]);

  const handleNextSlide = () => {
    if (!activePlaylist || !activePlaylist.slides.length) return;
    const nextIdx = (currentSlideIndex + 1) % activePlaylist.slides.length;
    setCurrentSlideIndex(nextIdx);
    setSlideTimeLeft(activePlaylist.slides[nextIdx]?.duration_seconds || 25);
  };

  const handlePrevSlide = () => {
    if (!activePlaylist || !activePlaylist.slides.length) return;
    const prevIdx = (currentSlideIndex - 1 + activePlaylist.slides.length) % activePlaylist.slides.length;
    setCurrentSlideIndex(prevIdx);
    setSlideTimeLeft(activePlaylist.slides[prevIdx]?.duration_seconds || 25);
  };

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

          if (data.isKata !== undefined) {
            setIsKata(data.isKata);
          } else if (data.kataA || data.judgeScoresA) {
            setIsKata(true);
          }

          if (data.kataA) setKataA(data.kataA);
          if (data.kataB) setKataB(data.kataB);
          if (data.judgeScoresA) setJudgeScoresA(data.judgeScoresA);
          if (data.judgeScoresB) setJudgeScoresB(data.judgeScoresB);
          if (data.panelSize) setPanelSize(data.panelSize);
          if (data.scoringMethod) setScoringMethod(data.scoringMethod);

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

          const kataBout = isKataCategory(cat);
          setIsKata(kataBout);

          if (kataBout) {
            setKataA(bout.kata_a || '');
            setKataB(bout.kata_b || '');
            if (bout.judge_scores_a && Array.isArray(bout.judge_scores_a)) setJudgeScoresA(bout.judge_scores_a);
            if (bout.judge_scores_b && Array.isArray(bout.judge_scores_b)) setJudgeScoresB(bout.judge_scores_b);
            setScoreAka(bout.total_score_a || bout.score_a || 0);
            setScoreAo(bout.total_score_b || bout.score_b || 0);
            if (bout.winner_id) {
              setWinnerSide(bout.winner_id === compAka?.id ? 'aka' : bout.winner_id === compAo?.id ? 'ao' : null);
            }
          }

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

  const currentSlide = activePlaylist?.slides[currentSlideIndex];
  const currentSlideType = currentSlide?.type || 'live_scoreboard';

  if (!mounted) return null;

  return (
    <div
      className="min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] w-full bg-black text-white flex flex-col lg:overflow-hidden select-none font-sans p-4 lg:p-6 relative"
      onMouseMove={resetHideTimer}
    >
      {/* Display Playlist Modal */}
      <DisplayPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onSelectPlaylist={(pl) => {
          setActivePlaylist(pl);
          setCurrentSlideIndex(0);
          setSlideTimeLeft(pl.slides[0]?.duration_seconds || 25);
          setIsPlaylistModalOpen(false);
        }}
      />

      {/* Top Controls Bar (Playlist & Fullscreen) */}
      <div className={`fixed top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none transition-all duration-300 ${
        showControls || !isFullscreen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}>
        {/* Playlist Controls Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xl border border-yellow-400 cursor-pointer uppercase tracking-wider transition"
          >
            <List className="h-4 w-4" />
            <span>Display Playlists</span>
          </button>

          {activePlaylist && (
            <div className="flex items-center gap-2.5 bg-black/85 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-2xl">
              <div className="flex items-center gap-1.5 text-yellow-400">
                <Monitor className="h-4 w-4" />
                <span className="max-w-[140px] truncate">{activePlaylist.name}</span>
              </div>
              <span className="text-white/30">|</span>
              <span className="text-white/90">
                SLIDE {currentSlideIndex + 1}/{activePlaylist.slides.length}: {currentSlide?.title}
              </span>
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-md font-mono text-[11px] font-black">
                ⏱ {slideTimeLeft}s
              </span>

              <div className="flex items-center gap-1 ml-1 border-l border-white/20 pl-2">
                <button
                  onClick={handlePrevSlide}
                  className="p-1 hover:bg-white/20 rounded text-white cursor-pointer transition"
                  title="Previous Slide"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsPlaylistPaused(!isPlaylistPaused)}
                  className="p-1 hover:bg-white/20 rounded text-yellow-400 cursor-pointer transition"
                  title={isPlaylistPaused ? 'Resume Rotation' : 'Pause Rotation'}
                >
                  {isPlaylistPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
                </button>
                <button
                  onClick={handleNextSlide}
                  className="p-1 hover:bg-white/20 rounded text-white cursor-pointer transition"
                  title="Next Slide"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer backdrop-blur-md border shadow-xl ${
            isFullscreen
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              : 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/30'
          }`}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {/* RENDER NON-SCOREBOARD PRESENTATION SLIDES */}
      {currentSlideType === 'kata_scoreboard' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 bg-gradient-to-b from-slate-950 via-black to-slate-950 rounded-3xl border border-white/10 shadow-2xl my-12">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-yellow-400" />
            <h2 className="text-3xl font-extrabold uppercase tracking-widest text-yellow-400">WKF 7-Judge Kata Performance</h2>
          </div>

          <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
            {/* AKA RED KATA */}
            <div className="bg-red-950/40 border-2 border-red-600/50 rounded-2xl p-6 flex flex-col items-center justify-between space-y-4">
              <span className="text-red-400 font-extrabold text-2xl tracking-wider">AKA (RED)</span>
              <h3 className="text-3xl font-black text-white">{akaName}</h3>
              <p className="text-sm font-bold text-red-300/60 uppercase">{akaClub}</p>
              <div className="w-full bg-red-900/30 p-3 rounded-xl border border-red-500/30 text-center">
                <span className="text-xs text-red-300 font-bold block uppercase mb-1">Total Kata Score</span>
                <span className="text-5xl font-black text-red-400 font-mono">24.65</span>
              </div>
            </div>

            {/* AO BLUE KATA */}
            <div className="bg-blue-950/40 border-2 border-blue-600/50 rounded-2xl p-6 flex flex-col items-center justify-between space-y-4">
              <span className="text-blue-400 font-extrabold text-2xl tracking-wider">AO (BLUE)</span>
              <h3 className="text-3xl font-black text-white">{aoName}</h3>
              <p className="text-sm font-bold text-blue-300/60 uppercase">{aoClub}</p>
              <div className="w-full bg-blue-900/30 p-3 rounded-xl border border-blue-500/30 text-center">
                <span className="text-xs text-blue-300 font-bold block uppercase mb-1">Total Kata Score</span>
                <span className="text-5xl font-black text-blue-400 font-mono">25.10</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentSlideType === 'bracket' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 bg-slate-950/90 rounded-3xl border border-white/10 my-12 overflow-hidden">
          <div className="flex items-center gap-3">
            <Layers className="h-8 w-8 text-yellow-400" />
            <h2 className="text-3xl font-extrabold uppercase tracking-widest text-yellow-400">Live Category Brackets & Progress</h2>
          </div>
          <div className="w-full max-w-5xl bg-secondary/10 border border-white/10 rounded-2xl p-6 text-center space-y-4">
            <h3 className="text-2xl font-black text-white uppercase">{categoryName}</h3>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {allCategories.slice(0, 3).map(cat => (
                <div key={cat.id} className="bg-black/60 border border-white/10 p-4 rounded-xl text-left space-y-2">
                  <span className="text-xs font-bold text-yellow-400 uppercase">{cat.discipline || 'Kumite'}</span>
                  <h4 className="text-sm font-bold text-white truncate">{cat.name}</h4>
                  <div className="flex justify-between text-[11px] text-white/60 font-mono">
                    <span>Status: {cat.status}</span>
                    <span>Max: {cat.capacity || 32}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentSlideType === 'medals' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 bg-slate-950/90 rounded-3xl border border-white/10 my-12 overflow-hidden">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h2 className="text-3xl font-extrabold uppercase tracking-widest text-yellow-400">Club Medal Standings Leaderboard</h2>
          </div>
          <div className="w-full max-w-4xl bg-black/60 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-6 p-4 bg-white/5 font-black text-xs text-white/60 uppercase border-b border-white/10">
              <span className="col-span-3">Dojo / Club Academy</span>
              <span className="text-center text-yellow-400">🥇 Gold</span>
              <span className="text-center text-slate-300">🥈 Silver</span>
              <span className="text-center text-amber-600">🥉 Bronze</span>
            </div>
            <div className="divide-y divide-white/10 text-sm font-bold">
              {allClubs.slice(0, 5).map((cl, idx) => (
                <div key={cl.id} className="grid grid-cols-6 p-4 items-center hover:bg-white/5 transition">
                  <span className="col-span-3 text-white font-extrabold">{idx + 1}. {cl.name}</span>
                  <span className="text-center font-mono text-yellow-400 font-extrabold">{3 - idx > 0 ? 3 - idx : 0}</span>
                  <span className="text-center font-mono text-slate-300">{2 - idx > 0 ? 2 - idx : 0}</span>
                  <span className="text-center font-mono text-amber-600">{1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentSlideType === 'schedule' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 bg-slate-950/90 rounded-3xl border border-white/10 my-12 overflow-hidden">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-yellow-400" />
            <h2 className="text-3xl font-extrabold uppercase tracking-widest text-yellow-400">Upcoming Tatami Match Schedule</h2>
          </div>
          <div className="w-full max-w-4xl bg-black/60 border border-white/10 rounded-2xl p-4 divide-y divide-white/10">
            {allBouts.slice(0, 4).map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between text-sm font-bold">
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 font-mono text-xs font-black">BOUT #{b.bout_no}</span>
                  <span className="text-white/80">{b.tatami || 'Tatami 1'}</span>
                </div>
                <span className="text-xs bg-white/10 px-3 py-1 rounded-md text-white/70 font-mono">{b.scheduled_time || '09:30 AM'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentSlideType === 'announcement' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 bg-gradient-to-br from-yellow-950/40 via-black to-slate-950 rounded-3xl border-2 border-yellow-500/40 shadow-2xl my-12 text-center">
          <Volume2 className="h-16 w-16 text-yellow-400 animate-bounce" />
          <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-widest text-yellow-400 leading-tight">
            {currentSlide?.announcement_text || 'Welcome to KarateTech Open Championship 2026!'}
          </h2>
          <p className="text-lg font-bold text-white/60 uppercase tracking-wider">
            {tournamentName || 'Kelab Karate Do Senshi Goju-Ryu'}
          </p>
        </div>
      )}

      {/* WKF KATA SPECTATOR DISPLAY */}
      {currentSlideType === 'live_scoreboard' && isKata && (
        <div className="flex-1 flex flex-col justify-between my-auto max-w-7xl mx-auto w-full pt-8 pb-4 space-y-6">
          {/* Top Category Header */}
          <div className="flex justify-between items-center border-b-2 border-white/10 pb-4 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-5 w-5 text-yellow-400" />
                <span className="text-yellow-400 font-black tracking-widest text-sm uppercase">
                  WKF KATA SPECTATOR SCOREBOARD • {tatamiName} • BOUT #{boutNo}
                </span>
                <button
                  onClick={() => setScoringMethod(prev => prev === 'Points' ? 'Flags' : 'Points')}
                  title="Click to toggle spectator mode (WKF Points / WKF Flags)"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] uppercase font-black transition cursor-pointer bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 border border-yellow-400/40 shadow-sm"
                >
                  <Flag className="h-3 w-3" />
                  <span>MODE: {scoringMethod === 'Flags' ? 'WKF FLAGS' : 'WKF POINTS'}</span>
                </button>
                <button
                  disabled
                  title="Judge panel locked to 5 Judges standard"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] uppercase font-black transition cursor-default bg-blue-400/20 text-blue-400 border border-blue-400/40 shadow-sm opacity-80"
                >
                  <span>PANEL: {panelSize} JUDGES (STANDARD)</span>
                </button>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white line-clamp-1">
                {categoryName}
              </h1>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">
                OFFICIAL TOURNAMENT
              </span>
              <p className="text-lg font-black text-white/70 tracking-tight">
                {tournamentName || 'Kelab Karate Do Senshi Goju-Ryu'}
              </p>
            </div>
          </div>

          {/* Winner Reveal Banner */}
          {winnerSide && (
            <div className={`py-4 px-6 rounded-2xl text-center flex items-center justify-center gap-4 animate-bounce shadow-2xl border-2 font-black uppercase tracking-widest text-2xl lg:text-3xl ${
              winnerSide === 'aka'
                ? 'bg-red-600/90 text-white border-red-400 shadow-red-600/50 ring-4 ring-red-500/30'
                : 'bg-blue-600/90 text-white border-blue-400 shadow-blue-600/50 ring-4 ring-blue-500/30'
            }`}>
              <Trophy className="h-9 w-9 text-yellow-300 animate-spin" />
              <span>{winnerSide === 'aka' ? akaName : aoName} — {winnerSide === 'aka' ? 'AKA WINNER 🔴' : 'AO WINNER 🔵'}</span>
            </div>
          )}

          {/* AKA & AO Competitor Cards */}
          {(() => {
            const displayScoresA = (judgeScoresA.length > 0 ? judgeScoresA : Array(panelSize).fill(8.0)).slice(0, panelSize);
            const displayScoresB = (judgeScoresB.length > 0 ? judgeScoresB : Array(panelSize).fill(8.0)).slice(0, panelSize);
            const displayFlagsA = (judgeScoresA.length > 0 ? judgeScoresA : Array(panelSize).fill(1)).slice(0, panelSize);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-stretch">
                {/* AKA RED CARD */}
                <div className={`relative rounded-3xl p-6 lg:p-8 flex flex-col justify-between border-2 transition-all duration-500 shadow-2xl overflow-hidden ${
                  winnerSide === 'aka'
                    ? 'bg-gradient-to-br from-red-950/90 via-red-900/60 to-black border-red-500 shadow-red-600/40 ring-4 ring-red-500/50'
                    : 'bg-gradient-to-br from-red-950/40 via-red-950/20 to-black/80 border-red-600/40'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3.5 py-1 bg-red-600/30 border border-red-500/50 text-red-400 font-black text-xs uppercase tracking-widest rounded-lg">
                        AKA (RED)
                      </span>
                      {kataA && (
                        <span className="text-xs font-extrabold uppercase tracking-wider text-red-300 bg-black/60 px-3.5 py-1.5 rounded-xl border border-red-500/30 font-mono">
                          KATA: {kataA}
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md truncate">
                      {akaName}
                    </h2>
                    <p className="text-sm lg:text-base font-bold text-red-300/70 uppercase tracking-wide truncate mt-1">
                      {akaClub}
                    </p>
                  </div>

                  {/* Judge Scorecard Breakdown */}
                  {scoringMethod === 'Points' ? (
                    <div className="my-4">
                      <div className="text-[10px] uppercase font-bold text-red-400/80 tracking-widest mb-2 flex items-center justify-between">
                        <span>Judge Score Breakdown ({displayScoresA.length} Judges)</span>
                        <span className="text-gray-400 text-[9px]">Min & Max Trimmed</span>
                      </div>
                      <div className={`grid gap-1.5 bg-black/60 p-3 rounded-2xl border border-red-500/20 font-mono text-center ${
                        displayScoresA.length === 5 ? 'grid-cols-5' : 'grid-cols-7'
                      }`}>
                        {displayScoresA.map((score, idx) => {
                          const status = getScoreStatusIndex(displayScoresA, idx);
                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-xl border flex flex-col items-center transition ${
                                status === 'min' || status === 'max'
                                  ? 'bg-white/5 border-white/10 text-gray-500 opacity-40 line-through scale-90'
                                  : 'bg-red-500/20 border-red-500/40 text-red-300 font-black shadow-sm scale-100'
                              }`}
                            >
                              <span className="text-[9px] text-gray-400 block font-sans">J{idx + 1}</span>
                              <span className="text-base lg:text-lg font-black">{score.toFixed(1)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Flags Mode Scorecard */
                    <div className="my-4">
                      <div className="text-[10px] uppercase font-bold text-red-400/80 tracking-widest mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Flag className="h-3.5 w-3.5 text-red-400 fill-red-400" />
                          WKF Flag Votes ({displayFlagsA.length} Judges)
                        </span>
                        <span className="text-red-300 text-[9px]">Red Flag Voted</span>
                      </div>
                      <div className={`grid gap-2 bg-black/60 p-3 rounded-2xl border border-red-500/20 font-mono text-center ${
                        displayFlagsA.length === 5 ? 'grid-cols-5' : 'grid-cols-7'
                      }`}>
                        {displayFlagsA.map((vote, idx) => {
                          const isRedVote = vote === 1;
                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-xl border flex flex-col items-center justify-between transition ${
                                isRedVote
                                  ? 'bg-red-600/40 border-red-500 text-red-300 font-black shadow-lg shadow-red-600/40 scale-105'
                                  : 'bg-white/5 border-white/10 text-gray-600 opacity-30 scale-90'
                              }`}
                            >
                              <span className="text-[9px] text-gray-400 block font-sans">J{idx + 1}</span>
                              <div className="my-1">
                                {isRedVote ? (
                                  <Flag className="h-5 w-5 text-red-400 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                ) : (
                                  <Flag className="h-4 w-4 text-gray-600 opacity-30" />
                                )}
                              </div>
                              <span className="text-[8px] font-black uppercase text-red-400 tracking-tighter">
                                {isRedVote ? 'AKA' : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Total Score / Total Flags */}
                  <div className="bg-red-950/60 border border-red-500/40 rounded-2xl p-4 lg:p-6 text-center flex items-center justify-between shadow-inner">
                    <div className="text-left">
                      <span className="text-xs uppercase font-extrabold tracking-widest text-red-400 block">
                        {scoringMethod === 'Flags' ? 'Total WKF Flags' : 'Total Kata Score'}
                      </span>
                      <span className="text-[11px] font-bold text-red-300/70">
                        {scoringMethod === 'Flags' ? 'Flags Awarded' : 'WKF Calculated'}
                      </span>
                    </div>
                    <div className="text-5xl lg:text-7xl font-black font-mono tracking-tight text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center gap-3">
                      {scoringMethod === 'Flags' ? (
                        <>
                          <span>{judgeScoresA.length > 0 ? judgeScoresA.filter(s => s === 1).length : Math.round(scoreAka)}</span>
                          <Flag className="h-9 w-9 text-red-500 fill-red-500 inline-block drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                        </>
                      ) : (
                        scoreAka.toFixed(2)
                      )}
                    </div>
                  </div>
                </div>

                {/* AO BLUE CARD */}
                <div className={`relative rounded-3xl p-6 lg:p-8 flex flex-col justify-between border-2 transition-all duration-500 shadow-2xl overflow-hidden ${
                  winnerSide === 'ao'
                    ? 'bg-gradient-to-br from-blue-950/90 via-blue-900/60 to-black border-blue-500 shadow-blue-600/40 ring-4 ring-blue-500/50'
                    : 'bg-gradient-to-br from-blue-950/40 via-blue-950/20 to-black/80 border-blue-600/40'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3.5 py-1 bg-blue-600/30 border border-blue-500/50 text-blue-400 font-black text-xs uppercase tracking-widest rounded-lg">
                        AO (BLUE)
                      </span>
                      {kataB && (
                        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-300 bg-black/60 px-3.5 py-1.5 rounded-xl border border-blue-500/30 font-mono">
                          KATA: {kataB}
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md truncate">
                      {aoName}
                    </h2>
                    <p className="text-sm lg:text-base font-bold text-blue-300/70 uppercase tracking-wide truncate mt-1">
                      {aoClub}
                    </p>
                  </div>

                  {/* Judge Scorecard Breakdown */}
                  {scoringMethod === 'Points' ? (
                    <div className="my-4">
                      <div className="text-[10px] uppercase font-bold text-blue-400/80 tracking-widest mb-2 flex items-center justify-between">
                        <span>Judge Score Breakdown ({displayScoresB.length} Judges)</span>
                        <span className="text-gray-400 text-[9px]">Min & Max Trimmed</span>
                      </div>
                      <div className={`grid gap-1.5 bg-black/60 p-3 rounded-2xl border border-blue-500/20 font-mono text-center ${
                        displayScoresB.length === 5 ? 'grid-cols-5' : 'grid-cols-7'
                      }`}>
                        {displayScoresB.map((score, idx) => {
                          const status = getScoreStatusIndex(displayScoresB, idx);
                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-xl border flex flex-col items-center transition ${
                                status === 'min' || status === 'max'
                                  ? 'bg-white/5 border-white/10 text-gray-500 opacity-40 line-through scale-90'
                                  : 'bg-blue-500/20 border-blue-500/40 text-blue-300 font-black shadow-sm scale-100'
                              }`}
                            >
                              <span className="text-[9px] text-gray-400 block font-sans">J{idx + 1}</span>
                              <span className="text-base lg:text-lg font-black">{score.toFixed(1)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Flags Mode Scorecard */
                    <div className="my-4">
                      <div className="text-[10px] uppercase font-bold text-blue-400/80 tracking-widest mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Flag className="h-3.5 w-3.5 text-blue-400 fill-blue-400" />
                          WKF Flag Votes ({displayFlagsA.length} Judges)
                        </span>
                        <span className="text-blue-300 text-[9px]">Blue Flag Voted</span>
                      </div>
                      <div className={`grid gap-2 bg-black/60 p-3 rounded-2xl border border-blue-500/20 font-mono text-center ${
                        displayFlagsA.length === 5 ? 'grid-cols-5' : 'grid-cols-7'
                      }`}>
                        {displayFlagsA.map((vote, idx) => {
                          const isBlueVote = vote === 0;
                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-xl border flex flex-col items-center justify-between transition ${
                                isBlueVote
                                  ? 'bg-blue-600/40 border-blue-500 text-blue-300 font-black shadow-lg shadow-blue-600/40 scale-105'
                                  : 'bg-white/5 border-white/10 text-gray-600 opacity-30 scale-90'
                              }`}
                            >
                              <span className="text-[9px] text-gray-400 block font-sans">J{idx + 1}</span>
                              <div className="my-1">
                                {isBlueVote ? (
                                  <Flag className="h-5 w-5 text-blue-400 fill-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                ) : (
                                  <Flag className="h-4 w-4 text-gray-600 opacity-30" />
                                )}
                              </div>
                              <span className="text-[8px] font-black uppercase text-blue-400 tracking-tighter">
                                {isBlueVote ? 'AO' : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Total Score / Total Flags */}
                  <div className="bg-blue-950/60 border border-blue-500/40 rounded-2xl p-4 lg:p-6 text-center flex items-center justify-between shadow-inner">
                    <div className="text-left">
                      <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 block">
                        {scoringMethod === 'Flags' ? 'Total WKF Flags' : 'Total Kata Score'}
                      </span>
                      <span className="text-[11px] font-bold text-blue-300/70">
                        {scoringMethod === 'Flags' ? 'Flags Awarded' : 'WKF Calculated'}
                      </span>
                    </div>
                    <div className="text-5xl lg:text-7xl font-black font-mono tracking-tight text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center gap-3">
                      {scoringMethod === 'Flags' ? (
                        <>
                          <span>{judgeScoresA.length > 0 ? judgeScoresA.filter(s => s === 0).length : Math.round(scoreAo)}</span>
                          <Flag className="h-9 w-9 text-blue-500 fill-blue-500 inline-block drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                        </>
                      ) : (
                        scoreAo.toFixed(2)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* STANDARD WKF KUMITE SCOREBOARD DISPLAY (Preserved baseline setup) */}
      {currentSlideType === 'live_scoreboard' && !isKata && (
        <>
          {/* Top Details bar (Projector optimized size) */}
          <div className="flex justify-between items-center border-b-2 border-white/10 pb-4 mb-4 shrink-0 mt-8">
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
      <div className="flex-1 min-h-0 grid grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6 pb-2">
        {/* AKA RED CARD */}
        <div className={`col-span-1 lg:col-span-3 order-2 lg:order-1 h-full rounded-[40px] p-2 lg:p-8 flex flex-col justify-between relative shadow-[0_0_80px_rgba(239,68,68,0.1)] transition-all duration-500 ${
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
              <div className="w-full px-2 mt-1.5 flex flex-col items-center relative z-10">
                <h2 className="font-competitor text-[clamp(24px,3.2vw,40px)] font-extrabold tracking-tight truncate max-w-full text-center uppercase leading-none" title={akaName}>
                  {akaName}
                </h2>
                <p className={`${
                  winnerSide === 'aka' && winMethod === 'Superior Points' ? 'text-green-400/50' : 'text-red-400/50'
                } text-sm font-bold mt-1 uppercase tracking-wider text-center truncate max-w-full`}>
                  {akaClub}
                </p>

                {showPointHistory && eventsAka.length > 0 && (
                  <div className="absolute right-0 top-full mt-1 pr-1 lg:pr-2 flex justify-end w-full pointer-events-none z-20">
                    <div className="grid grid-rows-6 grid-flow-col gap-x-0.5 gap-y-0.5 lg:gap-x-1 lg:gap-y-1 max-w-[45%] pointer-events-auto">
                      {eventsAka.map((ev, idx) => (
                        <div key={idx} className="flex items-center justify-end">
                          <span className={`inline-flex items-center gap-0.5 rounded bg-red-950/80 border border-red-500/30 whitespace-nowrap transition-all ${
                            eventsAka.length > 15 ? 'px-0.5 py-[1px] text-[5px] lg:text-[6px]' :
                            eventsAka.length > 5 ? 'px-1 py-[1px] text-[6px] lg:text-[8px]' :
                            'px-1.5 py-[2px] text-[8px] lg:text-[10px]'
                          }`}>
                            <span className="font-black text-red-400 uppercase tracking-widest">+{ev.points}({ev.technique.substring(0, 1)})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Huge Score (DIN 1451 Bold 140-220px) */}
          <div className={`flex-1 flex flex-col items-center justify-center min-h-0 py-2 w-full transition-all duration-500 ${
            showPointHistory && eventsAka.length > 0 ? 'pr-[40%] lg:pr-[45%]' : ''
          }`}>
            <span className={`font-din text-[clamp(40px,12vh,220px)] lg:text-[clamp(140px,18vh,220px)] font-black leading-none select-none tracking-tight transition-all duration-300 ${
              winnerSide === 'aka'
                ? 'text-red-500 animate-blink drop-shadow-[0_0_80px_rgba(239,68,68,0.7)] scale-110'
                : scoreAka - scoreAo >= 8 
                  ? 'text-red-500 animate-pulse scale-105 drop-shadow-[0_0_80px_rgba(239,68,68,0.7)]' 
                  : 'text-red-500 drop-shadow-[0_0_55px_rgba(239,68,68,0.3)]'
            }`}>
              {scoreAka}
            </span>
          </div>

          {/* AKA Warnings Row */}
          <div className="border-t-2 border-red-900/30 pt-3 mt-auto">
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 grid grid-cols-5 gap-2 lg:gap-3">
                {[1, 2, 3, 4, 5].map((level) => {
                  const isActive = c1Aka >= level;
                  const labels = ['', 'C1', 'C2', 'C3', 'HC', 'H'];
                  return (
                    <div
                      key={level}
                      className={`flex items-center justify-center h-12 lg:h-16 rounded-xl font-din text-[clamp(20px,3.5vh,36px)] font-black transition-all border ${
                        isActive
                          ? 'bg-red-500 text-black border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                          : 'bg-transparent text-white/20 border-white/10'
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
        <div className="col-span-2 lg:col-span-6 order-1 lg:order-2 flex flex-col justify-center items-center h-full text-center px-1 lg:px-4">
          <div className="bg-black/60 backdrop-blur-xl border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-[40px] w-full h-full p-2 lg:p-8 flex flex-col justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            {/* Top Area: Label */}
            <div className="mt-4">
              <span className="text-xl lg:text-2xl uppercase font-black text-white/40 tracking-[0.3em]">
                MATCH TIME
              </span>
            </div>
            
            {/* Giant digital timer (DIN 1451 Bold White 160-260px) */}
            <div className={`font-din text-[clamp(60px,15vh,260px)] lg:text-[clamp(160px,24vh,260px)] font-bold leading-none tracking-tight transition-all duration-300 select-none flex items-baseline justify-center relative z-10 w-full ${
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
        <div className={`col-span-1 lg:col-span-3 order-3 lg:order-3 h-full rounded-[40px] p-2 lg:p-8 flex flex-col justify-between relative shadow-[0_0_80px_rgba(59,130,246,0.1)] transition-all duration-500 ${
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
              <div className="w-full px-2 mt-1.5 flex flex-col items-center relative z-10">
                <h2 className="font-competitor text-[clamp(24px,3.2vw,40px)] font-extrabold tracking-tight truncate max-w-full text-center uppercase leading-none" title={aoName}>
                  {aoName}
                </h2>
                <p className={`${
                  winnerSide === 'ao' && winMethod === 'Superior Points' ? 'text-green-400/50' : 'text-blue-400/50'
                } text-sm font-bold mt-1 uppercase tracking-wider text-center truncate max-w-full`}>
                  {aoClub}
                </p>

                {showPointHistory && eventsAo.length > 0 && (
                  <div className="absolute right-0 top-full mt-1 pr-1 lg:pr-2 flex justify-end w-full pointer-events-none z-20">
                    <div className="grid grid-rows-6 grid-flow-col gap-x-0.5 gap-y-0.5 lg:gap-x-1 lg:gap-y-1 max-w-[45%] pointer-events-auto">
                      {eventsAo.map((ev, idx) => (
                        <div key={idx} className="flex items-center justify-end">
                          <span className={`inline-flex items-center gap-0.5 rounded bg-blue-950/80 border border-blue-500/30 whitespace-nowrap transition-all ${
                            eventsAo.length > 15 ? 'px-0.5 py-[1px] text-[5px] lg:text-[6px]' :
                            eventsAo.length > 5 ? 'px-1 py-[1px] text-[6px] lg:text-[8px]' :
                            'px-1.5 py-[2px] text-[8px] lg:text-[10px]'
                          }`}>
                            <span className="font-black text-blue-400 uppercase tracking-widest">+{ev.points}({ev.technique.substring(0, 1)})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Huge Score (DIN 1451 Bold 140-220px) */}
          <div className={`flex-1 flex flex-col items-center justify-center min-h-0 py-2 w-full transition-all duration-500 ${
            showPointHistory && eventsAo.length > 0 ? 'pr-[40%] lg:pr-[45%]' : ''
          }`}>
            <span className={`font-din text-[clamp(40px,12vh,220px)] lg:text-[clamp(140px,18vh,220px)] font-black leading-none select-none tracking-tight transition-all duration-300 ${
              winnerSide === 'ao'
                ? 'text-blue-400 animate-blink drop-shadow-[0_0_80px_rgba(59,130,246,0.7)] scale-110'
                : scoreAo - scoreAka >= 8 
                  ? 'text-blue-400 animate-pulse scale-105 drop-shadow-[0_0_80px_rgba(59,130,246,0.7)]' 
                  : 'text-blue-400 drop-shadow-[0_0_35px_rgba(59,130,246,0.3)]'
            }`}>
              {scoreAo}
            </span>
          </div>

          {/* AO Warnings Row */}
          <div className="border-t-2 border-blue-900/30 pt-3 mt-auto">
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 grid grid-cols-5 gap-2 lg:gap-3">
                {[1, 2, 3, 4, 5].map((level) => {
                  const isActive = c1Ao >= level;
                  const labels = ['', 'C1', 'C2', 'C3', 'HC', 'H'];
                  return (
                    <div
                      key={level}
                      className={`flex items-center justify-center h-12 lg:h-16 rounded-xl font-din text-[clamp(20px,3.5vh,36px)] font-black transition-all border ${
                        isActive
                          ? 'bg-blue-500 text-black border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                          : 'bg-transparent text-white/20 border-white/10'
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
    </>
  )}

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

