'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournament } from '@/context/TournamentContext';
import { supabase } from '@/db/dbClient';

export default function AuthCallback() {
  const router = useRouter();
  const { login, usersList } = useTournament();
  const [statusMessage, setStatusMessage] = useState('Completing authentication, please wait...');

  useEffect(() => {
    // Wait until usersList has been populated/initialized
    if (usersList.length === 0) return;

    const handleCallback = async () => {
      if (!supabase) {
        router.push('/login');
        return;
      }

      try {
        // Exchange session information
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session retrieval error:', error);
          setStatusMessage(`Session error: ${error.message}. Redirecting...`);
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        if (session?.user) {
          const email = session.user.email;
          if (email) {
            const matchedUser = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (matchedUser) {
              if (matchedUser.status === 'Suspended') {
                setStatusMessage('Your account is suspended. Logging out...');
                await supabase.auth.signOut();
                setTimeout(() => router.push('/login?error=suspended'), 3000);
                return;
              }

              // Login locally to context/localStorage
              login(matchedUser.role, matchedUser.email);
              setStatusMessage(`Logged in as ${matchedUser.role}. Redirecting...`);
              
              // Redirect based on role
              router.push(matchedUser.role === 'Viewer' ? '/public' : '/');
              return;
            } else {
              // If not found in usersList, assign default Viewer role
              login('Viewer', email);
              setStatusMessage('Account not pre-registered. Logged in as Spectator. Redirecting...');
              router.push('/public');
              return;
            }
          }
        }
        
        // No session found
        setStatusMessage('No active session. Redirecting to login...');
        router.push('/login');
      } catch (err: any) {
        console.error('Auth callback exception:', err);
        setStatusMessage('An unexpected error occurred. Redirecting...');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleCallback();
  }, [usersList, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground text-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <div className="space-y-1.5">
          <p className="text-sm font-bold tracking-tight text-foreground">Google Authentication</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{statusMessage}</p>
        </div>
      </div>
    </div>
  );
}
