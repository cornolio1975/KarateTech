import { 
  Country, Club, Coach, Category, Team, Participant, 
  TeamMember, ParticipantCategory, Payment, MedicalRecord, 
  Document, ActivityLog, AuditLog, Bout
} from './types';

// Seed data
const SEED_COUNTRIES: Country[] = [
  { code: 'MAS', name: 'Malaysia', flag_emoji: '🇲🇾' },
  { code: 'SGP', name: 'Singapore', flag_emoji: '🇸🇬' },
  { code: 'THA', name: 'Thailand', flag_emoji: '🇹🇭' },
  { code: 'INA', name: 'Indonesia', flag_emoji: '🇮🇩' },
  { code: 'JPN', name: 'Japan', flag_emoji: '🇯🇵' },
  { code: 'BRU', name: 'Brunei', flag_emoji: '🇧🇳' },
  { code: 'VIE', name: 'Vietnam', flag_emoji: '🇻🇳' },
  { code: 'PHI', name: 'Philippines', flag_emoji: '🇵🇭' }
];

const SEED_CLUBS: Club[] = [
  { id: 'club-1', name: 'Senshi Karate Academy', city: 'Kuala Lumpur', state: 'W.P. Kuala Lumpur' },
  { id: 'club-2', name: 'Goju-Ryu Karate Club', city: 'Petaling Jaya', state: 'Selangor' },
  { id: 'club-3', name: 'Tiger Claw Dojo', city: 'Penang', state: 'Penang' },
  { id: 'club-4', name: 'Budokan Singapore', city: 'Singapore', state: 'Central' },
  { id: 'club-5', name: 'Kyokushin Jakarta', city: 'Jakarta', state: 'DKI Jakarta' }
];

const SEED_COACHES: Coach[] = [
  { id: 'coach-1', name: 'Sensei Haris', email: 'haris@senshikarate.com', phone: '+6012-3456789', club_id: 'club-1' },
  { id: 'coach-2', name: 'Sensei Tan', email: 'tan@gojuryu.com', phone: '+6013-9876543', club_id: 'club-2' },
  { id: 'coach-3', name: 'Coach Somchai', email: 'somchai@tigerclaw.com', phone: '+66-81-234-5678', club_id: 'club-3' }
];

const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Male Kumite -60kg (18+)', gender: 'Male', min_age: 18, max_age: 99, min_weight: 0, max_weight: 60, capacity: 32, status: 'Open' },
  { id: 'cat-2', name: 'Male Kumite -67kg (18+)', gender: 'Male', min_age: 18, max_age: 99, min_weight: 60.01, max_weight: 67, capacity: 32, status: 'Open' },
  { id: 'cat-3', name: 'Male Kumite -75kg (18+)', gender: 'Male', min_age: 18, max_age: 99, min_weight: 67.01, max_weight: 75, capacity: 32, status: 'Open' },
  { id: 'cat-4', name: 'Male Kumite +75kg (18+)', gender: 'Male', min_age: 18, max_age: 99, min_weight: 75.01, max_weight: 999, capacity: 32, status: 'Open' },
  { id: 'cat-5', name: 'Female Kumite -50kg (18+)', gender: 'Female', min_age: 18, max_age: 99, min_weight: 0, max_weight: 50, capacity: 16, status: 'Open' },
  { id: 'cat-6', name: 'Female Kumite -55kg (18+)', gender: 'Female', min_age: 18, max_age: 99, min_weight: 50.01, max_weight: 55, capacity: 16, status: 'Open' },
  { id: 'cat-7', name: 'Female Kumite +55kg (18+)', gender: 'Female', min_age: 18, max_age: 99, min_weight: 55.01, max_weight: 999, capacity: 16, status: 'Open' },
  { id: 'cat-8', name: 'Male Kata (18+)', gender: 'Male', min_age: 18, max_age: 99, min_weight: 0, max_weight: 999, capacity: 32, status: 'Open' },
  { id: 'cat-9', name: 'Female Kata (18+)', gender: 'Female', min_age: 18, max_age: 99, min_weight: 0, max_weight: 999, capacity: 32, status: 'Open' },
  { id: 'cat-10', name: 'Junior Male Kumite -55kg (16-17)', gender: 'Male', min_age: 16, max_age: 17, min_weight: 0, max_weight: 55, capacity: 16, status: 'Open' },
  { id: 'cat-11', name: 'Junior Male Kumite -61kg (16-17)', gender: 'Male', min_age: 16, max_age: 17, min_weight: 55.01, max_weight: 61, capacity: 16, status: 'Open' },
  { id: 'cat-12', name: 'Junior Female Kumite -48kg (16-17)', gender: 'Female', min_age: 16, max_age: 17, min_weight: 0, max_weight: 48, capacity: 16, status: 'Open' }
];

const SEED_PARTICIPANTS: Participant[] = [
  {
    id: 'part-1',
    registration_no: 'REG-2026-001',
    photo_url: '',
    full_name: 'Ahmad Daniel',
    gender: 'Male',
    dob: '2005-04-12', // 21 years old
    nationality_code: 'MAS',
    passport_ic: '050412-14-1235',
    email: 'daniel@example.com',
    phone: '+6017-1234567',
    emergency_contact_name: 'Fatimah Ali',
    emergency_contact_phone: '+6017-9999999',
    club_id: 'club-1',
    coach_id: 'coach-1',
    weight: 64.5,
    height: 172.0,
    status: 'Confirmed',
    medical_status: 'Cleared',
    payment_status: 'Paid',
    remarks: 'Pre-selected for national selections',
    created_at: '2026-06-15T08:30:00Z'
  },
  {
    id: 'part-2',
    registration_no: 'REG-2026-002',
    photo_url: '',
    full_name: 'Chloe Tan',
    gender: 'Female',
    dob: '2004-09-22', // 21 years old
    nationality_code: 'MAS',
    passport_ic: '040922-10-8888',
    email: 'chloe@example.com',
    phone: '+6012-9876543',
    emergency_contact_name: 'Tan Kok Wai',
    emergency_contact_phone: '+6012-1112222',
    club_id: 'club-2',
    coach_id: 'coach-2',
    weight: 52.0,
    height: 161.0,
    status: 'Confirmed',
    medical_status: 'Cleared',
    payment_status: 'Paid',
    remarks: 'None',
    created_at: '2026-06-16T09:15:00Z'
  },
  {
    id: 'part-3',
    registration_no: 'REG-2026-003',
    photo_url: '',
    full_name: 'Subramaniam Krishnan',
    gender: 'Male',
    dob: '2000-01-15', // 26 years old
    nationality_code: 'MAS',
    passport_ic: '000115-08-5431',
    email: 'subra@example.com',
    phone: '+6011-2223334',
    emergency_contact_name: 'Krishnan Murugan',
    emergency_contact_phone: '+6011-8889999',
    club_id: 'club-1',
    coach_id: 'coach-1',
    weight: 78.2,
    height: 178.0,
    status: 'Checked In',
    medical_status: 'Cleared',
    payment_status: 'Paid',
    remarks: 'Ready for draw',
    created_at: '2026-06-18T14:22:00Z'
  },
  {
    id: 'part-4',
    registration_no: 'REG-2026-004',
    photo_url: '',
    full_name: 'Muhammad Ryan',
    gender: 'Male',
    dob: '2009-08-30', // 16 years old
    nationality_code: 'MAS',
    passport_ic: '090830-14-1111',
    email: 'ryan@example.com',
    phone: '+6019-3334445',
    emergency_contact_name: 'Rohana Ahmad',
    emergency_contact_phone: '+6019-2222111',
    club_id: 'club-3',
    coach_id: 'coach-3',
    weight: 58.5,
    height: 168.0,
    status: 'Pending',
    medical_status: 'Review Needed',
    payment_status: 'Pending',
    remarks: 'Requires guardian waiver sign-off',
    created_at: '2026-06-20T10:05:00Z'
  },
  {
    id: 'part-5',
    registration_no: 'REG-2026-005',
    photo_url: '',
    full_name: 'Kenji Sato',
    gender: 'Male',
    dob: '1998-11-05', // 27 years old
    nationality_code: 'JPN',
    passport_ic: 'TK1234567',
    email: 'kenji@example.jp',
    phone: '+81-90-1234-5678',
    emergency_contact_name: 'Yoko Sato',
    emergency_contact_phone: '+81-90-8765-4321',
    club_id: 'club-5',
    weight: 72.0,
    height: 175.0,
    status: 'Confirmed',
    medical_status: 'Cleared',
    payment_status: 'Paid',
    remarks: 'International entry',
    created_at: '2026-06-22T11:45:00Z'
  },
  {
    id: 'part-6',
    registration_no: 'REG-2026-006',
    photo_url: '',
    full_name: 'Anisha Putri',
    gender: 'Female',
    dob: '2002-05-18', // 24 years old
    nationality_code: 'INA',
    passport_ic: 'B9876543',
    email: 'anisha@example.id',
    phone: '+62-812-345-678',
    emergency_contact_name: 'Budi Putri',
    emergency_contact_phone: '+62-812-999-888',
    club_id: 'club-5',
    weight: 48.5,
    height: 158.0,
    status: 'Pending',
    medical_status: 'Action Required',
    payment_status: 'Unpaid',
    remarks: 'ECG certificate needed',
    created_at: '2026-06-25T13:12:00Z'
  },
  {
    id: 'part-7',
    registration_no: 'REG-2026-007',
    photo_url: '',
    full_name: 'Ethan Lim',
    gender: 'Male',
    dob: '2005-12-01', // 20 years old
    nationality_code: 'SGP',
    passport_ic: 'T0599999A',
    email: 'ethan@example.sg',
    phone: '+65-9876-5432',
    emergency_contact_name: 'Lim Guan Eng',
    emergency_contact_phone: '+65-8123-4567',
    club_id: 'club-4',
    weight: 66.8,
    height: 170.0,
    status: 'Checked In',
    medical_status: 'Cleared',
    payment_status: 'Paid',
    remarks: 'No accommodations requested',
    created_at: '2026-06-26T15:40:00Z'
  },
  {
    id: 'part-8',
    registration_no: 'REG-2026-008',
    photo_url: '',
    full_name: 'Somporn Yodrak',
    gender: 'Male',
    dob: '1995-07-14', // 30 years old
    nationality_code: 'THA',
    passport_ic: 'AA112233',
    email: 'somporn@example.th',
    phone: '+66-89-999-8888',
    emergency_contact_name: 'Yodrak Sen',
    emergency_contact_phone: '+66-89-111-2222',
    club_id: 'club-3',
    coach_id: 'coach-3',
    weight: 84.0,
    height: 182.0,
    status: 'Disqualified',
    medical_status: 'Cleared',
    payment_status: 'Paid',
    remarks: 'Missed official weigh-in limits initially, re-registered',
    created_at: '2026-06-27T16:10:00Z'
  }
];

const SEED_TEAMS: Team[] = [
  { id: 'team-1', name: 'Senshi Warriors', club_id: 'club-1', coach_id: 'coach-1', captain_id: 'part-1', score: 120, ranking: 1 },
  { id: 'team-2', name: 'PJ Tigers', club_id: 'club-2', coach_id: 'coach-2', captain_id: 'part-2', score: 90, ranking: 2 },
  { id: 'team-3', name: 'Penang Tiger Dojo', club_id: 'club-3', coach_id: 'coach-3', score: 45, ranking: 3 }
];

const SEED_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm-1', team_id: 'team-1', participant_id: 'part-1' },
  { id: 'tm-2', team_id: 'team-1', participant_id: 'part-3' },
  { id: 'tm-3', team_id: 'team-2', participant_id: 'part-2' }
];

const SEED_PARTICIPANT_CATEGORIES: ParticipantCategory[] = [
  { id: 'pc-1', participant_id: 'part-1', category_id: 'cat-2', manual_override: false },
  { id: 'pc-2', participant_id: 'part-2', category_id: 'cat-6', manual_override: false },
  { id: 'pc-3', participant_id: 'part-3', category_id: 'cat-4', manual_override: false },
  { id: 'pc-4', participant_id: 'part-4', category_id: 'cat-11', manual_override: false },
  { id: 'pc-5', participant_id: 'part-5', category_id: 'cat-3', manual_override: false },
  { id: 'pc-6', participant_id: 'part-6', category_id: 'cat-5', manual_override: false },
  { id: 'pc-7', participant_id: 'part-7', category_id: 'cat-2', manual_override: false },
  { id: 'pc-8', participant_id: 'part-8', category_id: 'cat-4', manual_override: false }
];

const SEED_PAYMENTS: Payment[] = [
  { id: 'pay-1', participant_id: 'part-1', amount: 150.00, status: 'Paid', payment_method: 'Credit Card', transaction_id: 'TXN-9871625', created_at: '2026-06-15T08:35:00Z' },
  { id: 'pay-2', participant_id: 'part-2', amount: 150.00, status: 'Paid', payment_method: 'Bank Transfer', transaction_id: 'TXN-1284729', created_at: '2026-06-16T09:20:00Z' },
  { id: 'pay-3', participant_id: 'part-3', amount: 150.00, status: 'Paid', payment_method: 'Cash', created_at: '2026-06-18T14:25:00Z' },
  { id: 'pay-4', participant_id: 'part-5', amount: 200.00, status: 'Paid', payment_method: 'PayPal', transaction_id: 'TXN-9988221', created_at: '2026-06-22T11:50:00Z' },
  { id: 'pay-5', participant_id: 'part-7', amount: 200.00, status: 'Paid', payment_method: 'Credit Card', transaction_id: 'TXN-8877112', created_at: '2026-06-26T15:45:00Z' },
  { id: 'pay-6', participant_id: 'part-8', amount: 150.00, status: 'Paid', payment_method: 'Cash', created_at: '2026-06-27T16:15:00Z' }
];

const SEED_MEDICAL_RECORDS: MedicalRecord[] = [
  { id: 'med-1', participant_id: 'part-1', conditions: 'None', allergies: 'Peanuts', blood_type: 'O+', has_clearance: true, remarks: 'Cleared for high impact' },
  { id: 'med-2', participant_id: 'part-2', conditions: 'Mild Asthma', allergies: 'Dust', blood_type: 'A+', has_clearance: true, remarks: 'Uses inhaler when needed' },
  { id: 'med-3', participant_id: 'part-3', conditions: 'None', allergies: 'Penicillin', blood_type: 'B-', has_clearance: true, remarks: 'Excellent physical conditioning' },
  { id: 'med-4', participant_id: 'part-4', conditions: 'None', allergies: 'None', blood_type: 'O-', has_clearance: false, remarks: 'Guardian consent signature pending' },
  { id: 'med-5', participant_id: 'part-5', conditions: 'None', allergies: 'None', blood_type: 'AB+', has_clearance: true, remarks: 'Full clearance submitted' },
  { id: 'med-6', participant_id: 'part-6', conditions: 'Heart Murmur history', allergies: 'None', blood_type: 'A-', has_clearance: false, remarks: 'Needs doctor review letter' }
];

const SEED_DOCUMENTS: Document[] = [
  { id: 'doc-1', participant_id: 'part-1', name: 'Passport Copy.pdf', doc_type: 'Identity', file_url: '/mock/docs/daniel_passport.pdf', uploaded_at: '2026-06-15T08:32:00Z' },
  { id: 'doc-2', participant_id: 'part-2', name: 'Waiver Form.pdf', doc_type: 'Waiver', file_url: '/mock/docs/chloe_waiver.pdf', uploaded_at: '2026-06-16T09:18:00Z' },
  { id: 'doc-3', participant_id: 'part-3', name: 'Medical Release.pdf', doc_type: 'Medical', file_url: '/mock/docs/subra_medical.pdf', uploaded_at: '2026-06-18T14:24:00Z' }
];

const SEED_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'act-1', participant_id: 'part-1', operator_name: 'System', action: 'Registration Created', details: 'Ahmad Daniel registered online', created_at: '2026-06-15T08:30:00Z' },
  { id: 'act-2', participant_id: 'part-1', operator_name: 'Admin Haris', action: 'Status Updated', details: 'Status changed from Pending to Confirmed', created_at: '2026-06-15T10:00:00Z' },
  { id: 'act-3', participant_id: 'part-2', operator_name: 'System', action: 'Registration Created', details: 'Chloe Tan registered online', created_at: '2026-06-16T09:15:00Z' }
];

// Helper to check if we are running in browser context
const isClient = () => typeof window !== 'undefined';

// Fetch a key from localStorage or return default seed data
function getStoreData<T>(key: string, seed: T[]): T[] {
  if (!isClient()) return seed;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}

// Write a key to localStorage
function saveStoreData<T>(key: string, data: T[]) {
  if (isClient()) {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// Global Store interface using local persistence
export const mockStore = {
  // 1. Countries
  countries: {
    list: (): Country[] => getStoreData('ts_countries', SEED_COUNTRIES),
  },

  // 2. Clubs
  clubs: {
    list: (): Club[] => getStoreData('ts_clubs', SEED_CLUBS),
    add: (club: Omit<Club, 'id'>): Club => {
      const list = getStoreData('ts_clubs', SEED_CLUBS);
      const newClub = { ...club, id: `club-${Date.now()}` };
      list.push(newClub);
      saveStoreData('ts_clubs', list);
      return newClub;
    }
  },

  // 3. Coaches
  coaches: {
    list: (): Coach[] => getStoreData('ts_coaches', SEED_COACHES),
    add: (coach: Omit<Coach, 'id'>): Coach => {
      const list = getStoreData('ts_coaches', SEED_COACHES);
      const newCoach = { ...coach, id: `coach-${Date.now()}` };
      list.push(newCoach);
      saveStoreData('ts_coaches', list);
      return newCoach;
    }
  },

  // 4. Categories
  categories: {
    list: (): Category[] => getStoreData('ts_categories', SEED_CATEGORIES),
    update: (id: string, updates: Partial<Category>): Category => {
      const list = getStoreData('ts_categories', SEED_CATEGORIES);
      const idx = list.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Category not found');
      const updated = { ...list[idx], ...updates };
      list[idx] = updated;
      saveStoreData('ts_categories', list);
      return updated;
    },
    add: (cat: Omit<Category, 'id'>): Category => {
      const list = getStoreData('ts_categories', SEED_CATEGORIES);
      const newCat = { ...cat, id: `cat-${Date.now()}` };
      list.push(newCat);
      saveStoreData('ts_categories', list);
      return newCat;
    },
    merge: (catIds: string[], mergedName: string): Category => {
      const list = getStoreData('ts_categories', SEED_CATEGORIES);
      const selected = list.filter(c => catIds.includes(c.id));
      if (selected.length < 2) throw new Error('Need at least 2 categories to merge');
      
      // Determine boundaries based on selection
      const minAge = Math.min(...selected.map(s => s.min_age));
      const maxAge = Math.max(...selected.map(s => s.max_age));
      const minWeight = Math.min(...selected.map(s => s.min_weight));
      const maxWeight = Math.max(...selected.map(s => s.max_weight));
      const gender = selected[0].gender;

      const mergedCat = mockStore.categories.add({
        name: mergedName,
        gender,
        min_age: minAge,
        max_age: maxAge,
        min_weight: minWeight,
        max_weight: maxWeight,
        capacity: 32,
        status: 'Open'
      });

      // Reassign participants from old categories to new
      const mappings = getStoreData('ts_participant_categories', SEED_PARTICIPANT_CATEGORIES);
      mappings.forEach(m => {
        if (catIds.includes(m.category_id)) {
          m.category_id = mergedCat.id;
        }
      });
      saveStoreData('ts_participant_categories', mappings);

      // Disable/delete merged categories or close them
      const updatedList = getStoreData('ts_categories', SEED_CATEGORIES).map(c => {
        if (catIds.includes(c.id)) {
          return { ...c, status: 'Closed' as const };
        }
        return c;
      });
      saveStoreData('ts_categories', updatedList);

      return mergedCat;
    },
    split: (catId: string, split1: Omit<Category, 'id' | 'status'>, split2: Omit<Category, 'id' | 'status'>): [Category, Category] => {
      const list = getStoreData('ts_categories', SEED_CATEGORIES);
      const original = list.find(c => c.id === catId);
      if (!original) throw new Error('Original category not found');

      const cat1 = mockStore.categories.add({ ...split1, status: 'Open' });
      const cat2 = mockStore.categories.add({ ...split2, status: 'Open' });

      // Split participants based on new criteria (automatically redistribute or prompt override)
      const participants = mockStore.participants.list();
      const mappings = getStoreData('ts_participant_categories', SEED_PARTICIPANT_CATEGORIES);
      
      mappings.forEach(m => {
        if (m.category_id === catId) {
          const p = participants.find(part => part.id === m.participant_id);
          if (p) {
            const age = mockStore.helpers.calculateAge(p.dob);
            if (
              age >= cat1.min_age && age <= cat1.max_age &&
              p.weight >= cat1.min_weight && p.weight <= cat1.max_weight
            ) {
              m.category_id = cat1.id;
            } else {
              m.category_id = cat2.id;
            }
          }
        }
      });
      saveStoreData('ts_participant_categories', mappings);

      // Close original category
      const updatedList = getStoreData('ts_categories', SEED_CATEGORIES).map(c => {
        if (c.id === catId) {
          return { ...c, status: 'Closed' as const };
        }
        return c;
      });
      saveStoreData('ts_categories', updatedList);

      return [cat1, cat2];
    }
  },

  // 5. Teams
  teams: {
    list: (): Team[] => getStoreData('ts_teams', SEED_TEAMS),
    get: (id: string): Team | undefined => getStoreData('ts_teams', SEED_TEAMS).find(t => t.id === id),
    add: (team: Omit<Team, 'id' | 'score'>): Team => {
      const list = getStoreData('ts_teams', SEED_TEAMS);
      const newTeam = { ...team, id: `team-${Date.now()}`, score: 0 };
      list.push(newTeam);
      saveStoreData('ts_teams', list);
      return newTeam;
    },
    update: (id: string, updates: Partial<Team>): Team => {
      const list = getStoreData('ts_teams', SEED_TEAMS);
      const idx = list.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Team not found');
      const updated = { ...list[idx], ...updates };
      list[idx] = updated;
      saveStoreData('ts_teams', list);
      return updated;
    },
    members: (teamId: string): Participant[] => {
      const mapping = getStoreData('ts_team_members', SEED_TEAM_MEMBERS);
      const participantIds = mapping.filter(m => m.team_id === teamId).map(m => m.participant_id);
      return mockStore.participants.list().filter(p => participantIds.includes(p.id));
    },
    addMember: (teamId: string, participantId: string): TeamMember => {
      const teams = getStoreData('ts_teams', SEED_TEAMS);
      const team = teams.find(t => t.id === teamId);
      if (!team) throw new Error('Team not found');

      const participant = mockStore.participants.get(participantId);
      if (!participant) throw new Error('Participant not found');

      // Auto validation: Only same club allowed
      if (participant.club_id !== team.club_id) {
        throw new Error('Verification failed: Participant must belong to the same club as the team.');
      }

      const mapping = getStoreData('ts_team_members', SEED_TEAM_MEMBERS);
      
      // Check if already in this team
      const existing = mapping.find(m => m.team_id === teamId && m.participant_id === participantId);
      if (existing) return existing;

      const newMember: TeamMember = {
        id: `tm-${Date.now()}`,
        team_id: teamId,
        participant_id: participantId,
        joined_at: new Date().toISOString()
      };
      
      mapping.push(newMember);
      saveStoreData('ts_team_members', mapping);
      return newMember;
    },
    removeMember: (teamId: string, participantId: string): void => {
      const mapping = getStoreData('ts_team_members', SEED_TEAM_MEMBERS);
      const filtered = mapping.filter(m => !(m.team_id === teamId && m.participant_id === participantId));
      saveStoreData('ts_team_members', filtered);
    }
  },

  // 6. Participants
  participants: {
    list: (): Participant[] => {
      const list = getStoreData('ts_participants', SEED_PARTICIPANTS);
      // Filter out soft-deleted
      return list.filter(p => !p.deleted_at);
    },
    listDeleted: (): Participant[] => {
      const list = getStoreData('ts_participants', SEED_PARTICIPANTS);
      return list.filter(p => !!p.deleted_at);
    },
    get: (id: string): Participant | undefined => {
      return getStoreData('ts_participants', SEED_PARTICIPANTS).find(p => p.id === id);
    },
    add: (participant: Omit<Participant, 'id' | 'registration_no' | 'created_at'>): Participant => {
      const list = getStoreData('ts_participants', SEED_PARTICIPANTS);
      const count = list.length + 1;
      const regNo = `REG-2026-${String(count).padStart(3, '0')}`;
      const id = `part-${Date.now()}`;
      
      const newParticipant: Participant = {
        ...participant,
        id,
        registration_no: regNo,
        created_at: new Date().toISOString()
      };

      list.push(newParticipant);
      saveStoreData('ts_participants', list);

      // Initialize medical clearance & payments automatically
      mockStore.medical.create(id, {
        conditions: participant.remarks || 'None',
        allergies: 'None',
        blood_type: 'O+',
        has_clearance: participant.medical_status === 'Cleared',
        remarks: 'Auto-created'
      });

      mockStore.payments.create(id, {
        amount: 150.00,
        status: participant.payment_status,
        payment_method: participant.payment_status === 'Paid' ? 'Credit Card' : undefined
      });

      // Auto-assign category
      mockStore.categories.list(); // Load categories
      mockStore.participants.autoAssignCategory(newParticipant);

      // Create Audit Log
      mockStore.audit.log('System', 'INSERT', 'participants', id, null, newParticipant);
      mockStore.activityLogs.log(id, 'System', 'Registration Created', `Participant ${participant.full_name} registered successfully`);

      return newParticipant;
    },
    update: (id: string, updates: Partial<Participant>, operator = 'Admin'): Participant => {
      const list = getStoreData('ts_participants', SEED_PARTICIPANTS);
      const idx = list.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Participant not found');

      const original = { ...list[idx] };
      const updated = { ...list[idx], ...updates };
      list[idx] = updated;
      saveStoreData('ts_participants', list);

      // Check if age, weight, or gender changed - recalculate category
      const dobChanged = updates.dob && updates.dob !== original.dob;
      const weightChanged = updates.weight && updates.weight !== original.weight;
      const genderChanged = updates.gender && updates.gender !== original.gender;

      if (dobChanged || weightChanged || genderChanged) {
        mockStore.participants.autoAssignCategory(updated);
      }

      // Sync medical record status if changed
      if (updates.medical_status) {
        const med = mockStore.medical.get(id);
        if (med) {
          mockStore.medical.update(med.id, { has_clearance: updates.medical_status === 'Cleared' });
        }
      }

      // Sync payment status if changed
      if (updates.payment_status) {
        const pays = mockStore.payments.list().filter(p => p.participant_id === id);
        if (pays.length > 0) {
          mockStore.payments.update(pays[0].id, { status: updates.payment_status as any });
        }
      }

      // Audit and activity logging
      mockStore.audit.log(operator, 'UPDATE', 'participants', id, original, updated);
      
      const changeDesc: string[] = [];
      if (updates.status && updates.status !== original.status) changeDesc.push(`status changed from ${original.status} to ${updates.status}`);
      if (updates.weight && updates.weight !== original.weight) changeDesc.push(`weight updated to ${updates.weight}kg`);
      if (updates.club_id && updates.club_id !== original.club_id) changeDesc.push(`club reassigned`);
      
      mockStore.activityLogs.log(
        id, 
        operator, 
        'Details Edited', 
        changeDesc.length > 0 ? `Updated details: ${changeDesc.join(', ')}` : 'Personal details updated'
      );

      return updated;
    },
    delete: (id: string, operator = 'Admin'): void => {
      const list = getStoreData('ts_participants', SEED_PARTICIPANTS);
      const idx = list.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Participant not found');

      const original = { ...list[idx] };
      // Soft delete by setting deleted_at
      list[idx].deleted_at = new Date().toISOString();
      saveStoreData('ts_participants', list);

      // Log activity and audit
      mockStore.audit.log(operator, 'DELETE', 'participants', id, original, null);
      mockStore.activityLogs.log(id, operator, 'Soft Deleted', 'Participant soft-deleted from active list');
    },
    restore: (id: string, operator = 'Admin'): Participant => {
      const list = getStoreData('ts_participants', SEED_PARTICIPANTS);
      const idx = list.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Participant not found');

      const original = { ...list[idx] };
      list[idx].deleted_at = undefined;
      saveStoreData('ts_participants', list);

      mockStore.audit.log(operator, 'INSERT', 'participants', id, original, list[idx]);
      mockStore.activityLogs.log(id, operator, 'Restored', 'Participant restored from bin');

      return list[idx];
    },
    autoAssignCategory: (p: Participant): Category | null => {
      const categories = mockStore.categories.list();
      const age = mockStore.helpers.calculateAge(p.dob);
      
      // Find matching category based on age, weight, and gender
      const matched = categories.find(c => {
        return (
          c.gender === p.gender &&
          age >= c.min_age && age <= c.max_age &&
          p.weight >= c.min_weight && p.weight <= c.max_weight &&
          c.status !== 'Closed'
        );
      });

      if (matched) {
        // Save mapping
        const mappings = getStoreData('ts_participant_categories', SEED_PARTICIPANT_CATEGORIES);
        // Remove previous mapping if exists
        const filtered = mappings.filter(m => m.participant_id !== p.id);
        
        filtered.push({
          id: `pc-${Date.now()}`,
          participant_id: p.id,
          category_id: matched.id,
          manual_override: false,
          assigned_at: new Date().toISOString()
        });

        saveStoreData('ts_participant_categories', filtered);
        return matched;
      }
      return null;
    },
    assignCategoryManually: (participantId: string, categoryId: string, operator = 'Admin'): void => {
      const mappings = getStoreData('ts_participant_categories', SEED_PARTICIPANT_CATEGORIES);
      const filtered = mappings.filter(m => m.participant_id !== participantId);
      
      filtered.push({
        id: `pc-${Date.now()}`,
        participant_id: participantId,
        category_id: categoryId,
        manual_override: true,
        assigned_at: new Date().toISOString()
      });
      saveStoreData('ts_participant_categories', filtered);

      const cat = mockStore.categories.list().find(c => c.id === categoryId);
      mockStore.activityLogs.log(
        participantId, 
        operator, 
        'Category Moved (Manual)', 
        `Moved category manually to: ${cat ? cat.name : 'Unknown Category'}`
      );
    },
    getAssignedCategory: (participantId: string): Category | undefined => {
      const mappings = getStoreData('ts_participant_categories', SEED_PARTICIPANT_CATEGORIES);
      const mapping = mappings.find(m => m.participant_id === participantId);
      if (!mapping) return undefined;
      return mockStore.categories.list().find(c => c.id === mapping.category_id);
    }
  },

  // 7. Payments
  payments: {
    list: (): Payment[] => getStoreData('ts_payments', SEED_PAYMENTS),
    create: (participantId: string, pay: Partial<Payment>): Payment => {
      const list = getStoreData('ts_payments', SEED_PAYMENTS);
      const newPay: Payment = {
        id: `pay-${Date.now()}`,
        participant_id: participantId,
        amount: pay.amount || 150.00,
        status: (pay.status as any) || 'Unpaid',
        payment_method: pay.payment_method,
        transaction_id: pay.transaction_id,
        created_at: new Date().toISOString()
      };
      list.push(newPay);
      saveStoreData('ts_payments', list);
      return newPay;
    },
    update: (id: string, updates: Partial<Payment>): Payment => {
      const list = getStoreData('ts_payments', SEED_PAYMENTS);
      const idx = list.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Payment not found');
      const updated = { ...list[idx], ...updates };
      list[idx] = updated;
      saveStoreData('ts_payments', list);
      return updated;
    }
  },

  // 8. Medical Records
  medical: {
    get: (participantId: string): MedicalRecord | undefined => {
      return getStoreData('ts_medical_records', SEED_MEDICAL_RECORDS).find(m => m.participant_id === participantId);
    },
    create: (participantId: string, med: Partial<MedicalRecord>): MedicalRecord => {
      const list = getStoreData('ts_medical_records', SEED_MEDICAL_RECORDS);
      const newMed: MedicalRecord = {
        id: `med-${Date.now()}`,
        participant_id: participantId,
        conditions: med.conditions || 'None',
        allergies: med.allergies || 'None',
        blood_type: med.blood_type || 'O+',
        has_clearance: med.has_clearance !== undefined ? med.has_clearance : true,
        remarks: med.remarks,
        updated_at: new Date().toISOString()
      };
      list.push(newMed);
      saveStoreData('ts_medical_records', list);
      return newMed;
    },
    update: (id: string, updates: Partial<MedicalRecord>): MedicalRecord => {
      const list = getStoreData('ts_medical_records', SEED_MEDICAL_RECORDS);
      const idx = list.findIndex(m => m.id === id);
      if (idx === -1) throw new Error('Medical record not found');
      const updated = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
      list[idx] = updated;
      saveStoreData('ts_medical_records', list);
      return updated;
    }
  },

  // 9. Documents
  documents: {
    list: (participantId: string): Document[] => {
      return getStoreData('ts_documents', SEED_DOCUMENTS).filter(d => d.participant_id === participantId);
    },
    upload: (participantId: string, name: string, doc_type: string, file_url: string): Document => {
      const list = getStoreData('ts_documents', SEED_DOCUMENTS);
      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        participant_id: participantId,
        name,
        doc_type,
        file_url,
        uploaded_at: new Date().toISOString()
      };
      list.push(newDoc);
      saveStoreData('ts_documents', list);
      
      mockStore.activityLogs.log(participantId, 'Admin', 'Document Uploaded', `Uploaded document: ${name} (${doc_type})`);
      return newDoc;
    },
    delete: (id: string): void => {
      const list = getStoreData('ts_documents', SEED_DOCUMENTS);
      const filtered = list.filter(d => d.id !== id);
      saveStoreData('ts_documents', filtered);
    }
  },

  // 10. Activity Logs
  activityLogs: {
    list: (participantId: string): ActivityLog[] => {
      const list = getStoreData('ts_activity_logs', SEED_ACTIVITY_LOGS);
      return list.filter(l => l.participant_id === participantId).sort((a,b) => {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      });
    },
    log: (participantId: string, operator: string, action: string, details: string): ActivityLog => {
      const list = getStoreData('ts_activity_logs', SEED_ACTIVITY_LOGS);
      const newLog: ActivityLog = {
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        participant_id: participantId,
        operator_name: operator,
        action,
        details,
        created_at: new Date().toISOString()
      };
      list.push(newLog);
      saveStoreData('ts_activity_logs', list);
      return newLog;
    }
  },

  // 11. Audit Logs
  audit: {
    list: (): AuditLog[] => {
      return getStoreData<AuditLog>('ts_audit_logs', []).sort((a,b) => {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      });
    },
    log: (operator: string, action: 'INSERT' | 'UPDATE' | 'DELETE', table: string, recordId: string, oldVal: any, newVal: any): AuditLog => {
      const list = getStoreData<AuditLog>('ts_audit_logs', []);
      const newLog: AuditLog = {
        id: `aud-${Date.now()}`,
        user_email: operator.includes('@') ? operator : `${operator.toLowerCase()}@senshikarate.com`,
        action,
        table_name: table,
        record_id: recordId,
        old_values: oldVal,
        new_values: newVal,
        created_at: new Date().toISOString()
      };
      list.push(newLog);
      saveStoreData('ts_audit_logs', list);
      return newLog;
    }
  },

  // 12. Bouts & Brackets Generation
  bouts: {
    list: (): Bout[] => {
      return getStoreData<Bout>('ts_bouts', []);
    },
    listForCategory: (catId: string): Bout[] => {
      return getStoreData<Bout>('ts_bouts', []).filter(b => b.category_id === catId);
    },
    clearDraw: (catId: string): void => {
      const list = getStoreData<Bout>('ts_bouts', []);
      const filtered = list.filter(b => b.category_id !== catId);
      saveStoreData('ts_bouts', filtered);
    },
    generateDraw: (catId: string, drawType: 'Elimination' | 'Round-robin', hasThirdPlace: boolean): Bout[] => {
      const rawpc = localStorage.getItem('ts_participant_categories');
      const mappings = rawpc ? JSON.parse(rawpc) : [];
      const athleteIds = mappings.filter((m: any) => m.category_id === catId).map((m: any) => m.participant_id);
      
      const rawParts = localStorage.getItem('ts_participants');
      const participants: Participant[] = rawParts ? JSON.parse(rawParts) : [];
      const athletes = participants.filter(p => athleteIds.includes(p.id) && !p.deleted_at && p.status !== 'Cancelled');

      if (athletes.length === 0) {
        throw new Error('Cannot generate draws: No active participants in this category.');
      }

      mockStore.bouts.clearDraw(catId);

      const generatedBouts: Bout[] = [];
      const allBouts = getStoreData<Bout>('ts_bouts', []);

      if (drawType === 'Round-robin') {
        let boutIndex = 1;
        for (let i = 0; i < athletes.length; i++) {
          for (let j = i + 1; j < athletes.length; j++) {
            const newBout: Bout = {
              id: `bout-${catId}-${boutIndex}-${Date.now()}`,
              category_id: catId,
              bout_no: boutIndex,
              round_no: 1,
              participant_a_id: athletes[i].id,
              participant_b_id: athletes[j].id,
              winner_id: null,
              score_a: 0,
              score_b: 0,
              status: 'Scheduled',
              tatami: 'Tatami 1'
            };
            generatedBouts.push(newBout);
            boutIndex++;
          }
        }
      } else {
        const count = athletes.length;
        const slots = Math.max(2, Math.pow(2, Math.ceil(Math.log2(count))));
        
        const bracketList: (string | null)[] = [...athletes.map(a => a.id)];
        while (bracketList.length < slots) {
          bracketList.push(null);
        }

        let boutNo = 1;
        const totalRound1Bouts = slots / 2;
        
        for (let i = 0; i < slots; i += 2) {
          const partA = bracketList[i];
          const partB = bracketList[i + 1];
          
          let status: 'Scheduled' | 'Completed' | 'Walkover' = 'Scheduled';
          let winner: string | null = null;
          
          if (partA && !partB) {
            winner = partA;
            status = 'Walkover';
          } else if (!partA && partB) {
            winner = partB;
            status = 'Walkover';
          } else if (!partA && !partB) {
            status = 'Walkover';
          }

          const newBout: Bout = {
            id: `bout-${catId}-r1-${boutNo}-${Date.now()}`,
            category_id: catId,
            bout_no: boutNo,
            round_no: 1,
            participant_a_id: partA,
            participant_b_id: partB,
            winner_id: winner,
            score_a: 0,
            score_b: 0,
            status,
            tatami: `Tatami ${Math.ceil(boutNo / 4) === 1 ? '1' : '2'}`
          };
          generatedBouts.push(newBout);
          boutNo++;
        }

        let currentRoundBoutsCount = totalRound1Bouts;
        let roundNo = 2;
        
        while (currentRoundBoutsCount > 1) {
          const nextRoundBoutsCount = currentRoundBoutsCount / 2;
          for (let b = 1; b <= nextRoundBoutsCount; b++) {
            const newBout: Bout = {
              id: `bout-${catId}-r${roundNo}-${b}-${Date.now()}`,
              category_id: catId,
              bout_no: b,
              round_no: roundNo,
              participant_a_id: null,
              participant_b_id: null,
              winner_id: null,
              score_a: 0,
              score_b: 0,
              status: 'Scheduled',
              tatami: `Tatami 1`
            };
            generatedBouts.push(newBout);
          }
          currentRoundBoutsCount = nextRoundBoutsCount;
          roundNo++;
        }

        if (hasThirdPlace && count >= 4) {
          const newBout: Bout = {
            id: `bout-${catId}-r3rd-1-${Date.now()}`,
            category_id: catId,
            bout_no: 99,
            round_no: 99,
            participant_a_id: null,
            participant_b_id: null,
            winner_id: null,
            score_a: 0,
            score_b: 0,
            status: 'Scheduled',
            tatami: 'Tatami 1'
          };
          generatedBouts.push(newBout);
        }
      }

      saveStoreData('ts_bouts', [...allBouts, ...generatedBouts]);
      return generatedBouts;
    },
    updateBoutResult: (boutId: string, winnerId: string, scoreA: number, scoreB: number): Bout => {
      const list = getStoreData<Bout>('ts_bouts', []);
      const idx = list.findIndex(b => b.id === boutId);
      if (idx === -1) throw new Error('Bout not found');

      const bout = list[idx];
      const updatedBout = {
        ...bout,
        winner_id: winnerId,
        score_a: scoreA,
        score_b: scoreB,
        status: 'Completed' as const
      };
      list[idx] = updatedBout;

      if (bout.round_no !== 99 && bout.round_no < 5) {
        const nextRoundNo = bout.round_no + 1;
        const nextBoutNo = Math.ceil(bout.bout_no / 2);
        const nextBoutIdx = list.findIndex(b => b.category_id === bout.category_id && b.round_no === nextRoundNo && b.bout_no === nextBoutNo);
        
        if (nextBoutIdx !== -1) {
          const isSlotA = bout.bout_no % 2 !== 0;
          const nextBout = list[nextBoutIdx];
          
          if (isSlotA) {
            list[nextBoutIdx] = { ...nextBout, participant_a_id: winnerId };
          } else {
            list[nextBoutIdx] = { ...nextBout, participant_b_id: winnerId };
          }
        }
      }

      saveStoreData('ts_bouts', list);
      return updatedBout;
    }
  },

  // Helper utility functions
  helpers: {
    calculateAge: (dobString: string): number => {
      const dob = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    }
  }
};
