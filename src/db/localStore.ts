import localforage from 'localforage';
import { TournamentDatabase, Tournament } from './types';
import { supabase } from './dbClient';

// Initialize the tournaments store
const dbStore = localforage.createInstance({
  name: 'KarateTechDB',
  storeName: 'tournaments'
});

export const localStore = {
  /**
   * Save a complete tournament database to IndexedDB and sync to Supabase.
   */
  async saveTournament(db: TournamentDatabase): Promise<void> {
    if (!db || !db.tournament || !db.tournament.id) {
      throw new Error('Invalid tournament database: Missing ID');
    }
    
    // Always update last modified before saving
    db.tournament.last_modified = new Date().toISOString();
    
    // 1. Save to Local IndexedDB (fast, synchronous-feeling, offline capability)
    await dbStore.setItem(`ktournament_${db.tournament.id}`, db);

    // 2. Sync to Supabase Cloud
    if (supabase) {
      try {
        await supabase.from('tournaments').upsert({
          id: db.tournament.id,
          name: db.tournament.name,
          status: db.tournament.status,
          data: db,
          last_modified: db.tournament.last_modified
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn('Cloud sync failed, data is saved locally.', e);
      }
    }
  },

  /**
   * Load a complete tournament database from Cloud or IndexedDB.
   */
  async loadTournament(id: string): Promise<TournamentDatabase | null> {
    let cloudDb: TournamentDatabase | null = null;
    
    // Attempt to load from Cloud first if available
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
       try {
         const { data, error } = await supabase.from('tournaments').select('data').eq('id', id).single();
         if (!error && data?.data) {
           cloudDb = data.data as TournamentDatabase;
           // Cache it locally!
           await dbStore.setItem(`ktournament_${id}`, cloudDb);
         }
       } catch (e) {
         console.warn('Cloud load failed, falling back to local.', e);
       }
    }
    
    if (cloudDb) return cloudDb;
    
    return await dbStore.getItem<TournamentDatabase>(`ktournament_${id}`);
  },

  /**
   * Get a list of all saved tournaments (merging Local + Cloud).
   */
  async listTournaments(): Promise<Tournament[]> {
    const keys = await dbStore.keys();
    const tournamentKeys = keys.filter(key => key.startsWith('ktournament_'));
    
    const localTournaments: Tournament[] = [];
    for (const key of tournamentKeys) {
      const db = await dbStore.getItem<TournamentDatabase>(key);
      if (db && db.tournament) {
        localTournaments.push(db.tournament);
      }
    }
    
    const allTournaments = [...localTournaments];

    // Merge cloud tournaments
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { data, error } = await supabase.from('tournaments').select('id, name, status, last_modified');
        if (!error && data) {
          for (const c of data) {
            const existingIdx = allTournaments.findIndex(t => t.id === c.id);
            if (existingIdx >= 0) {
              const localT = allTournaments[existingIdx];
              const localTime = new Date(localT.last_modified || 0).getTime();
              const cloudTime = new Date(c.last_modified || 0).getTime();
              if (cloudTime > localTime) {
                allTournaments[existingIdx] = { ...localT, name: c.name, status: c.status, last_modified: c.last_modified };
              }
            } else {
              // Not in local store at all
              allTournaments.push({
                 id: c.id,
                 name: c.name,
                 status: c.status,
                 last_modified: c.last_modified,
                 created_at: c.last_modified,
                 organizer: 'Cloud Backup',
                 date: '',
                 date_iso: '',
                 venue: '',
                 city: '',
                 registration_close: '',
                 registration_close_iso: ''
              });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch cloud tournaments list', e);
      }
    }
    
    // Sort by last_modified descending
    return allTournaments.sort((a, b) => {
      const dateA = new Date(a.last_modified || a.created_at || 0).getTime();
      const dateB = new Date(b.last_modified || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  },

  /**
   * Delete a tournament from IndexedDB and Supabase.
   */
  async deleteTournament(id: string): Promise<void> {
    await dbStore.removeItem(`ktournament_${id}`);
    if (supabase) {
      try {
        await supabase.from('tournaments').delete().eq('id', id);
      } catch (e) {
        console.warn('Cloud delete failed', e);
      }
    }
  }
};
