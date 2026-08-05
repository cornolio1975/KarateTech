'use server';

import { createClient } from '@supabase/supabase-js';
import { TournamentDatabase } from '@/db/types';

export async function fetchSpectatorData(tournamentId?: string | null) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (url && key) {
    const supabaseAdmin = createClient(url, key, {
      auth: { persistSession: false }
    });

    try {
      if (tournamentId) {
        const { data: tournamentRow, error: tournamentError } = await supabaseAdmin
          .from('tournaments')
          .select('id, status, deleted_at, data')
          .eq('id', tournamentId)
          .maybeSingle();

        if (tournamentError) {
          throw tournamentError;
        }

        if (tournamentRow?.status && !['Archived', 'Deleted'].includes(tournamentRow.status) && !tournamentRow.deleted_at) {
          const tournamentDb = tournamentRow.data as TournamentDatabase | null;

          if (tournamentDb) {
            return {
              playlists: tournamentDb.display_playlists || [],
              bouts: tournamentDb.bouts || [],
              categories: tournamentDb.categories || [],
              participants: (tournamentDb.participants || []).filter(participant => !participant.deleted_at),
              clubs: tournamentDb.clubs || [],
              isSupabase: true
            };
          }
        }
      }

      const [plRes, bRes, cRes, pRes, clRes] = await Promise.all([
        supabaseAdmin.from('display_playlists').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('bouts').select('*').order('bout_no', { ascending: true }),
        supabaseAdmin.from('categories').select('*').order('name', { ascending: true }),
        supabaseAdmin.from('participants').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabaseAdmin.from('clubs').select('*').order('name', { ascending: true })
      ]);

      return {
        playlists: plRes.data || [],
        bouts: bRes.data || [],
        categories: cRes.data || [],
        participants: pRes.data || [],
        clubs: clRes.data || [],
        isSupabase: true
      };
    } catch (e) {
      console.error('Server action fetch error:', e);
      return { isSupabase: false };
    }
  }

  return { isSupabase: false };
}
