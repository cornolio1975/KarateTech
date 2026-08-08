'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, UsersRound, Tags, GitPullRequest, 
  CalendarDays, Sword, ShieldCheck, Award, FileText, Settings, Trophy, Tv, LogOut, Zap,
  CalendarCheck, History, Globe, ExternalLink, MonitorPlay
} from 'lucide-react';
import { useTournament } from '@/context/TournamentContext';
import { basePath } from '@/db/dbClient';

const MENU_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { name: 'Participants', icon: Users, path: '/participants' },
  { name: 'Teams', icon: UsersRound, path: '/teams' },
  { name: 'Dojos', icon: Award, path: '/clubs' },
  { name: 'Categories', icon: Tags, path: '/categories' },
  { name: 'Draws', icon: GitPullRequest, path: '/draws', badge: 'Draft' },
  { name: 'Schedule', icon: CalendarDays, path: '/schedule' },

  { name: 'Bracket Console Hub', icon: MonitorPlay, path: '/bracket-hub', badge: 'Live' },
  { name: 'Kumite S-Board', icon: Zap, path: '/dashboard/scoreboard', badge: 'WKF', isYellow: true },
  { name: 'Kata S-Board', icon: Award, path: '/dashboard/kata-scoreboard', badge: 'WKF', isYellow: true },
  { name: 'Officials', icon: ShieldCheck, path: '/officials' },
  { name: 'Public Scoreboard', icon: Tv, path: '/public', badge: 'Live' },
  { name: 'Upcoming Tournaments', icon: CalendarCheck, path: '/public/tournaments', badge: 'New' },
  { name: 'Past Tournaments', icon: History, path: '/public/past-tournaments' },
  { name: 'Project Config', icon: Trophy, path: '/admin/tournaments', badge: 'Active' },
  { name: 'Reports', icon: FileText, path: '/reports' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userRole, userEmail, logout, logoUrl } = useTournament();

  const getInitials = () => {
    if (!userRole) return 'AD';
    if (userRole === 'Co-Admin') return 'CO';
    return 'AD';
  };

  return (
    <aside
      className={`
        no-print
        bg-card border-r border-border h-screen flex flex-col shrink-0
        transition-all duration-300 ease-in-out overflow-hidden
        fixed top-0 left-0 z-40
        md:static md:z-auto
        ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full border-none px-0'}
      `}
    >
      <a 
        href="https://spsportdatasolution.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="h-16 flex items-center gap-3 px-6 border-b border-border hover:bg-secondary/40 transition-colors group cursor-pointer"
        title="Open Corporate Home Showcase (spsportdatasolution.org/karatetech)"
      >
        <div className="h-10 w-10 rounded-full overflow-hidden border border-white/20 bg-slate-900 shrink-0 group-hover:scale-105 group-hover:border-primary transition-all">
          <img src={logoUrl || `${basePath}/karatetech-logo.png`} alt="Logo" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col leading-none">
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '0.95rem', lineHeight: 1, letterSpacing: '0.01em' }}>
            <span style={{ color: '#b91c2e' }}>Karate</span>
            <span style={{ color: '#38bdf8' }}>Tech</span>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '1px', verticalAlign: 'super' }}>©</span>
          </div>
          <div style={{ height: '1.5px', background: 'linear-gradient(90deg, #b91c2e 60%, transparent 100%)', marginTop: '1.5px', marginBottom: '1.5px', borderRadius: '1px' }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.01em', color: '#818cf8', lineHeight: 1.15 }} className="group-hover:underline flex items-center gap-1">
            SP SportData Solution <ExternalLink className="inline h-2.5 w-2.5 opacity-70" />
          </span>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.45rem', letterSpacing: '0.08em', color: '#94a3b8', lineHeight: 1.2, marginTop: '1.5px' }}>
            • PRECISION. • SPEED. • RESULTS. •
          </span>
        </div>
      </a>

      {/* Navigation Links */}
      <nav className={`flex-1 overflow-y-auto px-4 py-4 ${userRole === 'Viewer' ? 'space-y-3 py-6' : 'space-y-1'}`}>
        {MENU_ITEMS.map((item) => {
          // If the user is a Viewer, only show the Public Scoreboard and other public pages
          if (userRole === 'Viewer' && !item.path.startsWith('/public')) {
            return null;
          }

          const isActive = pathname === item.path;
          const Icon = item.icon;
          const isYellow = item.isYellow;
          const isViewer = userRole === 'Viewer';

          return (
            <Link
              key={item.name}
              href={item.path}
              prefetch={false}
              onClick={onClose}
              className={`flex items-center gap-3.5 rounded-xl transition-all duration-200 group ${
                isViewer
                  ? 'px-4 py-3 text-sm md:text-base font-bold border border-border/40 hover:border-primary/50'
                  : 'px-3 py-2.5 rounded-lg text-sm font-medium'
              } ${
                isYellow
                  ? isActive
                    ? 'bg-yellow-400/20 text-yellow-400 font-bold border-l-4 border-yellow-400 pl-3.5 shadow-sm'
                    : 'text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300 font-semibold'
                  : isActive
                  ? 'bg-primary/15 text-foreground shadow-md border-l-4 border-primary pl-3.5 font-extrabold'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <Icon className={`shrink-0 transition-transform group-hover:scale-110 ${isViewer ? 'h-5 w-5' : 'h-4.5 w-4.5'} ${
                isYellow
                  ? 'text-yellow-400'
                  : isActive
                  ? 'text-primary'
                  : 'text-muted-foreground group-hover:text-foreground'
              }`} />
              <span className="truncate">{item.name}</span>
              
              {item.badge && (
                <span className={`ml-auto font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isViewer ? 'text-xs px-2.5 py-0.5 border border-primary/30 bg-primary/20 text-primary' : 'text-[10px] px-1.5 py-0.5'
                } ${
                  isYellow
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className={`p-4 border-t border-border bg-secondary/20 space-y-3 shrink-0 ${userRole === 'Viewer' ? 'p-5 space-y-4' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`rounded-full bg-primary/15 text-primary font-black flex items-center justify-center border border-primary/20 ${userRole === 'Viewer' ? 'h-11 w-11 text-base' : 'h-9 w-9 text-sm'}`}>
            {getInitials()}
          </div>
          <div className="min-w-0 flex-1">
            <span className={`font-bold block text-foreground truncate ${userRole === 'Viewer' ? 'text-sm' : 'text-xs'}`}>{userRole || 'Admin'} Director</span>
            <span className={`text-muted-foreground truncate block ${userRole === 'Viewer' ? 'text-xs' : 'text-[10px]'}`}>{userEmail || 'admin@spsportdatasolution.org'}</span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className={`w-full flex items-center justify-center gap-2 border border-border text-red-500 hover:bg-red-500/10 rounded-xl font-bold transition cursor-pointer ${userRole === 'Viewer' ? 'px-4 py-2.5 text-xs' : 'px-3 py-2 text-xs'}`}
        >
          <LogOut className={userRole === 'Viewer' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
