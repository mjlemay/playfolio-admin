'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Activity, Club } from '../../lib/types';

const FORMAT_OPTIONS = ['kiosk_login', 'login', 'attendance', 'custom'];

const formatBadge = (format: string) => {
  const styles: Record<string, string> = {
    kiosk_login: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    login: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    attendance: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    custom: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
  };
  return `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[format] ?? styles.custom}`;
};

const triggerBadge = (trigger: string | null | undefined) => {
  if (!trigger) return null;
  const styles: Record<string, string> = {
    rfid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    qr: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    qr_code: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    manual: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
  return `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[trigger] ?? styles.manual}`;
};

const PAGE_SIZE = 50;

export default function Activities() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubById, setClubById] = useState<Record<string, Club>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [filterClub, setFilterClub] = useState('');
  const [filterFormat, setFilterFormat] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchActivities = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((p - 1) * PAGE_SIZE),
      });
      if (filterClub) params.set('club_id', filterClub);
      if (filterFormat) params.set('format', filterFormat);
      if (filterStartDate) params.set('start_date', new Date(filterStartDate).toISOString());
      if (filterEndDate) params.set('end_date', new Date(filterEndDate + 'T23:59:59').toISOString());

      const response = await fetch(`/api/activities?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch activities: ${response.statusText}`);
      const data = await response.json();
      setActivities(data.activities || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [filterClub, filterFormat, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetch('/api/clubs')
      .then((r) => r.ok ? r.json() : { clubs: [] })
      .then((data) => {
        const list: Club[] = data.clubs || [];
        setClubs(list);
        setClubById(Object.fromEntries(list.map((c) => [c.uid, c])));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    fetchActivities(1);
  }, [fetchActivities]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchActivities(p);
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchActivities(1);
  };

  const handleClearFilters = () => {
    setFilterClub('');
    setFilterFormat('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const playerLabel = (a: Activity) =>
    a.meta?.kiosk_player_name || a.player_uid;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1
              onClick={() => router.push('/dashboard')}
              className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Playfolio Admin Dashboard | Activities
            </h1>
            <button
              onClick={() => router.push('/')}
              className="border border-red-900 text-red-900 hover:bg-red-900 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 ml-4 text-xs font-medium">Dismiss</button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Activity Log</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Player login and attendance events synced from kiosk devices.</p>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-end mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Club</label>
                  <select
                    value={filterClub}
                    onChange={(e) => setFilterClub(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All clubs</option>
                    {clubs.map((c) => (
                      <option key={c.uid} value={c.uid}>{c.displayName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
                  <select
                    value={filterFormat}
                    onChange={(e) => setFilterFormat(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All formats</option>
                    {FORMAT_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Apply
                </button>

                {(filterClub || filterFormat || filterStartDate || filterEndDate) && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Table */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Events
                  {!loading && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      {total} total
                    </span>
                  )}
                </h3>

                {loading ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No activities found.</p>
                  </div>
                ) : (
                  <div className="shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">When</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Format</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Player</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Club</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Device</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trigger</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {activities.map((a) => {
                          const trigger = a.meta?.login_trigger;
                          const club = clubById[a.club_id];
                          return (
                            <tr key={a.uid} className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <div>{new Date(a.created_at).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">{new Date(a.created_at).toLocaleTimeString()}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span className={formatBadge(a.format)}>{a.format}</span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">{playerLabel(a)}</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate max-w-[180px]">{a.player_uid}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {club?.displayName ?? <span className="font-mono text-xs text-gray-400">{a.club_id}</span>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-400 dark:text-gray-500">
                                {a.device_id ? (
                                  <span className="truncate max-w-[120px] block">{a.device_id}</span>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {trigger ? (
                                  <span className={triggerBadge(trigger) ?? ''}>{trigger}</span>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {total > PAGE_SIZE && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                        </p>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handlePageChange(1)}
                            disabled={page === 1}
                            className="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >«</button>
                          <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >‹</button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                            .reduce<(number | '…')[]>((acc, p, i, arr) => {
                              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
                              acc.push(p);
                              return acc;
                            }, [])
                            .map((p, i) =>
                              p === '…' ? (
                                <span key={`e-${i}`} className="px-2 py-1 text-sm text-gray-400">…</span>
                              ) : (
                                <button
                                  key={p}
                                  onClick={() => handlePageChange(p as number)}
                                  className={`px-3 py-1 text-sm rounded transition-colors ${page === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                                >{p}</button>
                              )
                            )}
                          <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >›</button>
                          <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={page === totalPages}
                            className="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >»</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
