export type AttendanceStatus = 'present' | 'absent' | 'banned' | 'unknown' | 'inactive';

export type Club = {
    uid: string,
    displayName: string,
    safeName: string,
    meta: Record<string,string> | null,
    status: AttendanceStatus | null,
    created_at: string,
    updated_at: string | null,
}