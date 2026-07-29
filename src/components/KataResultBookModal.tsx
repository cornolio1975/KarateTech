'use client';

import React from 'react';
import { X, Printer, Trophy, Award, CheckCircle2, FileText, ShieldAlert, Flag } from 'lucide-react';
import { Bout, Participant, Category, Club } from '@/db/types';

interface KataResultBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  bout: Bout | null;
  category?: Category;
  participantA?: Participant;
  participantB?: Participant;
  clubA?: Club;
  clubB?: Club;
  judgeScoresA: number[];
  judgeScoresB: number[];
  totalScoreA: number;
  totalScoreB: number;
  kataA: string;
  kataB: string;
  winnerId: string | null;
  clubsList?: Club[];
}

export default function KataResultBookModal({
  isOpen,
  onClose,
  bout,
  category,
  participantA,
  participantB,
  clubA,
  clubB,
  judgeScoresA,
  judgeScoresB,
  totalScoreA,
  totalScoreB,
  kataA,
  kataB,
  winnerId,
  clubsList = []
}: KataResultBookModalProps) {
  if (!isOpen || !bout) return null;

  // Helper to determine discarded scores (highest and lowest)
  const getScoreStatus = (scores: number[], index: number) => {
    if (!scores || scores.length < 3) return 'active';
    const sorted = [...scores].sort((a, b) => a - b);
    const minVal = sorted[0];
    const maxVal = sorted[sorted.length - 1];

    const val = scores[index];
    if (val === minVal && scores.indexOf(val) === index) return 'min';
    if (val === maxVal && scores.lastIndexOf(val) === index) return 'max';
    return 'active';
  };

  const handlePrint = () => {
    window.print();
  };

  const isWinnerA = winnerId === participantA?.id;
  const isWinnerB = winnerId === participantB?.id;

  const isFlagsMatch = judgeScoresA.every(s => s === 0 || s === 1) && judgeScoresB.every(s => s === 0 || s === 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#0b0c10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white my-8 print:shadow-none print:border-none print:m-0 print:w-full">
        
        {/* Top Header Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400/10 rounded-lg border border-yellow-400/20 text-yellow-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">WKF Official Kata Result Sheet & Book</h2>
              <p className="text-xs text-gray-400">Official Match Verification & Scorecard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-yellow-400/20"
            >
              <Printer className="h-4 w-4" />
              Print / Export Sheet
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="p-6 md:p-8 space-y-6 print:p-4 print:space-y-4 print:text-black print:bg-white">
          
          {/* Official Tournament Banner */}
          <div className="text-center border-b border-white/10 pb-6 print:border-gray-300">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-2 print:border-gray-400 print:text-gray-800">
              WORLD KARATE FEDERATION (WKF) KATA PROTOCOL
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent print:text-black">
              Official Match Scorecard {isFlagsMatch && <span className="text-yellow-400 text-lg ml-2">(Flags System)</span>}
            </h1>
            <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-gray-400 mt-2 print:text-gray-700">
              <span>Category: <strong className="text-white print:text-black">{category?.name || 'Kata Division'}</strong></span>
              <span>•</span>
              <span>Bout #: <strong className="text-yellow-400 print:text-black">{bout.bout_no}</strong></span>
              <span>•</span>
              <span>Round: <strong className="text-white print:text-black">Round {bout.round_no}</strong></span>
              <span>•</span>
              <span>Tatami: <strong className="text-white print:text-black">{bout.tatami || 'Tatami 1'}</strong></span>
            </div>
          </div>

          {/* Athletes Comparison Header */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {/* AKA Box */}
            <div className={`p-4 rounded-xl border ${isWinnerA ? 'bg-red-950/40 border-red-500 shadow-lg shadow-red-900/20' : 'bg-red-950/20 border-red-500/30'} print:border-red-600 print:bg-red-50`}>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 bg-red-600 text-white font-black text-xs rounded uppercase tracking-wider">
                  AKA 🔴
                </span>
                {isWinnerA && (
                  <span className="flex items-center gap-1 text-xs font-black text-yellow-400 print:text-red-700 uppercase">
                    <Trophy className="h-4 w-4" /> WINNER
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white print:text-black">{participantA?.full_name || 'AKA Competitor'}</h3>
              <p className="text-xs text-gray-400 print:text-gray-600 font-medium">{clubA?.name || 'Independent Dojo'}</p>
              <div className="mt-3 pt-2 border-t border-red-500/20 flex justify-between items-center text-xs">
                <span className="text-gray-400 print:text-gray-600">Declared Kata:</span>
                <span className="font-bold text-red-300 print:text-red-800">{kataA || 'Suparinpei'}</span>
              </div>
            </div>

            {/* AO Box */}
            <div className={`p-4 rounded-xl border ${isWinnerB ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-900/20' : 'bg-blue-950/20 border-blue-500/30'} print:border-blue-600 print:bg-blue-50`}>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 bg-blue-600 text-white font-black text-xs rounded uppercase tracking-wider">
                  AO 🔵
                </span>
                {isWinnerB && (
                  <span className="flex items-center gap-1 text-xs font-black text-yellow-400 print:text-blue-700 uppercase">
                    <Trophy className="h-4 w-4" /> WINNER
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white print:text-black">{participantB?.full_name || 'AO Competitor'}</h3>
              <p className="text-xs text-gray-400 print:text-gray-600 font-medium">{clubB?.name || 'Independent Dojo'}</p>
              <div className="mt-3 pt-2 border-t border-blue-500/20 flex justify-between items-center text-xs">
                <span className="text-gray-400 print:text-gray-600">Declared Kata:</span>
                <span className="font-bold text-blue-300 print:text-blue-800">{kataB || 'Anan Dai'}</span>
              </div>
            </div>
          </div>

          {/* Detailed Judge Score Matrix Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 print:text-gray-800">
              Judge Panel Score Breakdown ({isFlagsMatch ? 'Flags Voting Matrix' : '7-Judge WKF Matrix'})
            </h4>
            <div className="overflow-x-auto border border-white/10 rounded-xl print:border-gray-300">
              <table className="w-full text-xs text-left border-collapse min-w-[300px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-gray-300 print:bg-gray-100 print:text-black">
                    <th className="p-3 font-bold">Judge #</th>
                    <th className="p-3 font-bold text-center text-red-400 print:text-red-700">AKA Score 🔴</th>
                    <th className="p-3 font-bold text-center text-blue-400 print:text-blue-700">AO Score 🔵</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-gray-200">
                  {Array.from({ length: judgeScoresA.length }).map((_, idx) => {
                    const statusA = getScoreStatus(judgeScoresA, idx);
                    const statusB = getScoreStatus(judgeScoresB, idx);

                    const scoreA = judgeScoresA[idx] !== undefined ? judgeScoresA[idx].toFixed(1) : '-';
                    const scoreB = judgeScoresB[idx] !== undefined ? judgeScoresB[idx].toFixed(1) : '-';
                    
                    const isFlagA = judgeScoresA[idx] === 1;
                    const isFlagB = judgeScoresB[idx] === 1;

                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] print:hover:bg-transparent">
                        <td className="p-3 font-bold text-gray-400 print:text-black">
                          Judge {idx + 1}
                        </td>
                        
                        {/* AKA Score Cell */}
                        <td className="p-3 text-center font-mono text-sm font-bold">
                          {isFlagsMatch ? (
                            isFlagA ? <Flag className="inline-block h-5 w-5 fill-red-500 text-red-500" /> : <span className="text-gray-600 opacity-30">-</span>
                          ) : statusA !== 'active' ? (
                            <span className="line-through text-red-400/50 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20 print:bg-red-100 print:text-red-600 print:border-red-300">
                              {scoreA} ({statusA === 'max' ? 'MAX Discard' : 'MIN Discard'})
                            </span>
                          ) : (
                            <span className="text-red-300 print:text-black font-extrabold">{scoreA}</span>
                          )}
                        </td>

                        {/* AO Score Cell */}
                        <td className="p-3 text-center font-mono text-sm font-bold">
                          {isFlagsMatch ? (
                            isFlagB ? <Flag className="inline-block h-5 w-5 fill-blue-500 text-blue-500" /> : <span className="text-gray-600 opacity-30">-</span>
                          ) : statusB !== 'active' ? (
                            <span className="line-through text-blue-400/50 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/20 print:bg-blue-100 print:text-blue-600 print:border-blue-300">
                              {scoreB} ({statusB === 'max' ? 'MAX Discard' : 'MIN Discard'})
                            </span>
                          ) : (
                            <span className="text-blue-300 print:text-black font-extrabold">{scoreB}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Totals Row */}
                  <tr className="bg-white/10 font-black text-sm border-t-2 border-white/20 print:bg-gray-200 print:text-black">
                    <td className="p-3 uppercase">{isFlagsMatch ? 'Total Flags Awarded' : 'Total Calculated Score (5 Middle Sum)'}</td>
                    <td className="p-3 text-center font-mono text-base text-red-400 print:text-red-800">
                      {isFlagsMatch ? (
                        <div className="flex flex-wrap items-center justify-center gap-0.5">
                          {Array.from({ length: Math.round(totalScoreA) }).map((_, i) => (
                            <Flag key={`red-flag-${i}`} className="h-5 w-5 fill-red-500 text-red-500" />
                          ))}
                        </div>
                      ) : (
                        totalScoreA.toFixed(2)
                      )}
                    </td>
                    <td className="p-3 text-center font-mono text-base text-blue-400 print:text-blue-800">
                      {isFlagsMatch ? (
                        <div className="flex flex-wrap items-center justify-center gap-0.5">
                          {Array.from({ length: Math.round(totalScoreB) }).map((_, i) => (
                            <Flag key={`blue-flag-${i}`} className="h-5 w-5 fill-blue-500 text-blue-500" />
                          ))}
                        </div>
                      ) : (
                        totalScoreB.toFixed(2)
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Signatures Section (For Print) */}
          <div className="pt-8 border-t border-white/10 grid grid-cols-2 gap-8 text-center text-xs text-gray-400 print:border-gray-300 print:text-black print:pt-4">
            <div>
              <div className="border-b border-gray-600 print:border-black w-48 mx-auto mb-1 h-8"></div>
              <p className="font-bold">Chief Referee Signature</p>
            </div>
            <div>
              <div className="border-b border-gray-600 print:border-black w-48 mx-auto mb-1 h-8"></div>
              <p className="font-bold">Tatami Manager Signature</p>
            </div>
          </div>

        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="flex justify-end px-6 py-4 bg-white/5 border-t border-white/10 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close Sheet
          </button>
        </div>

      </div>
    </div>
  );
}
