'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FilterState {
  gender: string[];
  payment_status: string[];
  medical_status: string[];
  status: string[];
  club_id: string[];
  coach_id: string[];
  nationality_code: string[];
}

interface TournamentContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  isAddOpen: boolean;
  setIsAddOpen: (open: boolean) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  refreshKey: number;
  triggerRefresh: () => void;
  tournamentName: string;
  setTournamentName: (name: string) => void;
}

const initialFilters: FilterState = {
  gender: [],
  payment_status: [],
  medical_status: [],
  status: [],
  club_id: [],
  coach_id: [],
  nationality_code: [],
};

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [refreshKey, setRefreshKey] = useState(0);
  const [tournamentName, setTournamentName] = useState('1st Kelab Senshi Goju-Ryu Championship 2026');

  // Initialize theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = stored || (prefersDark ? 'dark' : 'light');
      
      setTheme(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <TournamentContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        resetFilters,
        selectedIds,
        setSelectedIds,
        isAddOpen,
        setIsAddOpen,
        isFilterOpen,
        setIsFilterOpen,
        theme,
        toggleTheme,
        refreshKey,
        triggerRefresh,
        tournamentName,
        setTournamentName,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}
