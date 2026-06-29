'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, UsersRound, Tags, GitPullRequest, 
  CalendarDays, Sword, ShieldCheck, Award, FileText, Settings, Trophy 
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Participants', icon: Users, path: '/participants' },
  { name: 'Teams', icon: UsersRound, path: '/teams' },
  { name: 'Categories', icon: Tags, path: '/categories' },
  { name: 'Draws', icon: GitPullRequest, path: '/draws', badge: 'Draft' },
  { name: 'Schedule', icon: CalendarDays, path: '#' },
  { name: 'Bouts', icon: Sword, path: '#' },
  { name: 'Officials', icon: ShieldCheck, path: '#' },
  { name: 'Certificates', icon: Award, path: '#' },
  { name: 'Reports', icon: FileText, path: '#' },
  { name: 'Settings', icon: Settings, path: '#' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col sticky top-0 z-20 shrink-0">
      {/* Brand Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
        <div className="h-9 w-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm leading-tight block">KUMITE TECH</span>
          <span className="text-xs text-muted-foreground">Tournament Admin</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-secondary text-foreground shadow-sm border-l-2 border-primary pl-2.5'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105 ${
                isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              }`} />
              <span className="truncate">{item.name}</span>
              
              {item.badge && (
                <span className="ml-auto text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-secondary/20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
            AD
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-xs block text-foreground truncate">Admin Director</span>
            <span className="text-[10px] text-muted-foreground truncate block">admin@senshikarate.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
