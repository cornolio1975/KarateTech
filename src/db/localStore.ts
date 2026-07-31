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
        // Ensure valid UUID format for Supabase if needed
        let syncId = db.tournament.id;
        if (!syncId.includes('-') || syncId.length < 32) {
          // Format deterministic UUID for legacy non-UUID string IDs
          syncId = '00000000-0000-4000-8000-' + syncId.replace(/[^0-9a-fA-F]/g, '0').padStart(12, '0').slice(-12);
        }

        const nowIso = new Date().toISOString();
        const payload: Record<string, any> = {
          id: syncId,
          name: db.tournament.name || 'Untitled Tournament',
          status: db.tournament.status || 'Draft',
          organizer: db.tournament.organizer || 'KarateTech Organizer',
          venue: db.tournament.venue || 'Main Stadium',
          city: db.tournament.city || 'Local City',
          date: db.tournament.date || new Date().toLocaleDateString(),
          date_iso: db.tournament.date_iso || nowIso,
          registration_close: db.tournament.registration_close || new Date().toLocaleDateString(),
          registration_close_iso: db.tournament.registration_close_iso || nowIso,
          data: db,
          last_modified: db.tournament.last_modified || nowIso
        };

        const { error } = await supabase.from('tournaments').upsert(payload, { onConflict: 'id' });
        
        if (error) {
          console.warn('Supabase Cloud Sync Error:', error.message || error);
        } else {
          console.log('✅ Successfully synced tournament to Supabase Cloud:', db.tournament.name);
        }
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

    // Merge cloud tournaments (excluding deleted ones)
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { data, error } = await supabase.from('tournaments')
          .select('id, name, status, last_modified, deleted_at')
          .is('deleted_at', null)
          .neq('status', 'Deleted');

        if (!error && data) {
          for (const c of data) {
            if (c.status === 'Deleted' || c.deleted_at) continue;
            
            const existingIdx = allTournaments.findIndex(t => {
              if (t.id === c.id) return true;
              let tSyncId = t.id;
              if (!tSyncId.includes('-') || tSyncId.length < 32) {
                tSyncId = '00000000-0000-4000-8000-' + tSyncId.replace(/[^0-9a-fA-F]/g, '0').padStart(12, '0').slice(-12);
              }
              return tSyncId === c.id;
            });

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
    
    // Filter out any locally marked deleted records & sort by last_modified descending
    return allTournaments
      .filter(t => t.status !== 'Deleted')
      .sort((a, b) => {
        const dateA = new Date(a.last_modified || a.created_at || 0).getTime();
        const dateB = new Date(b.last_modified || b.created_at || 0).getTime();
        return dateB - dateA;
      });
  },

  /**
   * Delete a tournament from IndexedDB and Supabase.
   */
  async deleteTournament(id: string): Promise<void> {
    // Format deterministic UUID fallback for Supabase
    let syncId = id;
    if (!syncId.includes('-') || syncId.length < 32) {
      syncId = '00000000-0000-4000-8000-' + syncId.replace(/[^0-9a-fA-F]/g, '0').padStart(12, '0').slice(-12);
    }

    // 1. Remove from Local IndexedDB (both raw id and prefixed keys)
    await dbStore.removeItem(`ktournament_${id}`);
    await dbStore.removeItem(`ktournament_${syncId}`);

    // 2. Remove from Supabase Cloud
    if (supabase) {
      try {
        // Delete using valid UUID syncId
        const { error } = await supabase.from('tournaments').delete().eq('id', syncId);
        if (error) {
          console.warn('Cloud hard delete failed, marking deleted_at soft delete:', error);
          await supabase.from('tournaments').update({ 
            status: 'Deleted', 
            deleted_at: new Date().toISOString() 
          }).eq('id', syncId);
        }
      } catch (e) {
        console.warn('Cloud delete failed', e);
      }
    }
  }
};
