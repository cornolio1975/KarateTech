import localforage from 'localforage';
import { TournamentDatabase, Tournament } from './types';
import { supabase } from './dbClient';

// Initialize the tournaments store
const dbStore = localforage.createInstance({
  name: 'KarateTechDB',
  storeName: 'tournaments'
});

// --- Debounced cloud sync queue ---
// Holds one pending upsert per tournament ID. Rapid saves collapse into one upload.
const syncTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const activeSyncs: Record<string, boolean> = {};
const pendingPayloads: Record<string, Record<string, unknown>> = {};
const SYNC_DEBOUNCE_MS = 2000; // wait 2s after last save before uploading
const SYNC_MAX_RETRIES = 3;

async function cloudUpsertWithRetry(
  payload: Record<string, unknown>,
  attempt = 1
): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('tournaments').upsert(payload, { onConflict: 'id' });
    if (error) {
      const isTimeout =
        error.message?.includes('timeout') ||
        error.message?.includes('canceling statement') ||
        (error as { code?: string }).code === '57014';

      if (isTimeout && attempt <= SYNC_MAX_RETRIES) {
        const delay = 3000 * attempt; // 3s, 6s, 12s
        console.warn(`Cloud sync timeout (attempt ${attempt}/${SYNC_MAX_RETRIES}), retrying in ${delay / 1000}s…`);
        await new Promise(res => setTimeout(res, delay));
        return cloudUpsertWithRetry(payload, attempt + 1);
      }
      console.warn('Supabase Cloud Sync Error:', error.message || error);
    } else {
      console.log('✅ Successfully synced tournament to Supabase Cloud:', payload.name);
    }
  } catch (e) {
    console.warn('Cloud sync failed, data is saved locally.', e);
  }
}

async function processPending(syncId: string) {
  if (activeSyncs[syncId]) return; // Already uploading, will automatically pick up the new payload next
  activeSyncs[syncId] = true;
  
  while (pendingPayloads[syncId]) {
    const payload = pendingPayloads[syncId];
    delete pendingPayloads[syncId]; // Clear pending so we don't upload the same one twice
    await cloudUpsertWithRetry(payload);
  }
  
  delete activeSyncs[syncId];
}

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

    // Resolve the canonical UUID to use for both IndexedDB key and Supabase
    let syncId = db.tournament.id;
    const isProperUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(syncId);
    if (!isProperUUID) {
      // Legacy tr_... IDs: derive a deterministic UUID so both stores use the same key
      syncId = '00000000-0000-4000-8000-' + syncId.replace(/[^0-9a-fA-F]/g, '0').padStart(12, '0').slice(-12);
      // Promote the id in the object so future saves use the UUID
      db.tournament.id = syncId;
    }

    // 1. Save to Local IndexedDB immediately (always fast)
    await dbStore.setItem(`ktournament_${syncId}`, db);

    // 2. Debounced cloud sync — collapses rapid saves into one upload
    if (supabase) {
      if (syncTimers[syncId]) clearTimeout(syncTimers[syncId]);
      syncTimers[syncId] = setTimeout(async () => {
        delete syncTimers[syncId];
        const nowIso = new Date().toISOString();

        const payload: Record<string, unknown> = {
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
        pendingPayloads[syncId] = payload;
        processPending(syncId);
      }, SYNC_DEBOUNCE_MS);
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
    
    // Final deduplication by id (handles cases where same tournament is stored under multiple keys)
    const seenIds = new Set<string>();
    const deduped = allTournaments.filter(t => {
      if (seenIds.has(t.id)) return false;
      seenIds.add(t.id);
      return true;
    });

    // Filter out any locally marked deleted records & sort by last_modified descending
    return deduped
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
    if (!id) return;

    let syncId = id;
    if (!syncId.includes('-') || syncId.length < 32) {
      syncId = '00000000-0000-4000-8000-' + syncId.replace(/[^0-9a-fA-F]/g, '0').padStart(12, '0').slice(-12);
    }

    // 1. Remove all matching keys from Local IndexedDB
    try {
      const keys = await dbStore.keys();
      for (const key of keys) {
        if (key.startsWith('ktournament_')) {
          if (key === `ktournament_${id}` || key === `ktournament_${syncId}`) {
            await dbStore.removeItem(key);
          } else {
            const item = await dbStore.getItem<TournamentDatabase>(key);
            if (item?.tournament?.id === id || item?.tournament?.id === syncId) {
              await dbStore.removeItem(key);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error purging IndexedDB keys:', e);
    }

    // 2. Remove from Supabase Cloud
    if (supabase) {
      try {
        // Attempt deletion by syncId first
        await supabase.from('tournaments').delete().eq('id', syncId);
        // Attempt deletion by raw id if valid
        if (id !== syncId && id.includes('-')) {
          await supabase.from('tournaments').delete().eq('id', id);
        }
      } catch (e) {
        console.warn('Cloud delete failed', e);
      }
    }
  }
};
