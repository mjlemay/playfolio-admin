export type AttendanceStatus = 'present' | 'absent' | 'banned' | 'unknown' | 'inactive';

export type ClubMember = {
  player: { uid: string; meta: Record<string,string> | null; pin: string | null; status: string | null; created_at: string; updated_at: string | null; };
  role: string;
  joined_date: string;
  status: string;
}

export type Device = {
  uid: string;
  name: string;
  club_id: string;
  created_at: string;
  updated_at: string | null;
}

export type ClubKey = {
  key: string;
  player_uid: string;
  originating_club_id: string;
  status: string;
  meta: Record<string,string> | null;
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  usage_count: number;
}

export type Club = {
    uid: string,
    displayName: string,
    safeName: string,
    meta: Record<string,string> | null,
    status: AttendanceStatus | null,
    created_at: string,
    updated_at: string | null,
}