'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Club, ClubKey, Keychain } from '../../lib/types';

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    revoked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    expired: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`;
};

const memberLabel = (m: { player_uid: string; meta: Record<string,string> | null }) =>
  m.meta?.name ?? m.meta?.displayName ?? m.player_uid;

export default function Keychains() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState('');
  const [keys, setKeys] = useState<ClubKey[]>([]);
  const [keychainById, setKeychainById] = useState<Record<string, Keychain>>({});
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [resolvedKeychain, setResolvedKeychain] = useState<Keychain | null>(null);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; key: ClubKey | null }>({
    isOpen: false, key: null,
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const fetchKeysForClubs = async (clubList: Club[]) => {
    setDataLoading(true);
    try {
      const results = await Promise.all(
        clubList.map((c) => fetch(`/api/clubs/${c.uid}/keys`).then((r) => r.ok ? r.json() : { data: [] }))
      );
      setKeys(results.flatMap((r) => r.keys || []));
      setPage(1);
    } catch (err) {
      console.error('Error fetching keys:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const lookupAuthCode = useCallback(async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setLookupStatus('idle');
      setResolvedKeychain(null);
      return;
    }
    setLookupStatus('loading');
    try {
      const response = await fetch(`/api/keychains/lookup?auth_code=${encodeURIComponent(trimmed)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setResolvedKeychain(data.data);
          setLookupStatus('found');
        } else {
          setResolvedKeychain(null);
          setLookupStatus('notfound');
        }
      } else {
        setResolvedKeychain(null);
        setLookupStatus('notfound');
      }
    } catch {
      setResolvedKeychain(null);
      setLookupStatus('notfound');
    }
  }, []);

  const handleAuthCodeChange = (value: string) => {
    setAuthCodeInput(value);
    setResolvedKeychain(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => lookupAuthCode(value), 400);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [clubsRes, keychainsRes] = await Promise.all([
          fetch('/api/clubs'),
          fetch('/api/keychains'),
        ]);

        let loadedClubs: Club[] = [];
        if (clubsRes.ok) {
          const data = await clubsRes.json();
          if (data.success && data.clubs) {
            loadedClubs = data.clubs;
            setClubs(loadedClubs);
          }
        }
        if (keychainsRes.ok) {
          const data = await keychainsRes.json();
          if (data.keychains) {
            const map: Record<string, Keychain> = {};
            for (const kc of data.keychains) map[kc.uid] = kc;
            setKeychainById(map);
          }
        }

        await fetchKeysForClubs(loadedClubs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setClubsLoading(false);
      }
    };
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClubChange = async (uid: string) => {
    setSelectedClub(uid);
    setAuthCodeInput('');
    setResolvedKeychain(null);
    setLookupStatus('idle');

    if (!uid) {
      await fetchKeysForClubs(clubs);
    } else {
      setDataLoading(true);
      try {
        const response = await fetch(`/api/clubs/${uid}/keys`);
        if (response.ok) {
          const data = await response.json();
          setKeys(data.keys || []);
          setPage(1);
        }
      } catch (err) {
        console.error('Error fetching keys:', err);
      } finally {
        setDataLoading(false);
      }
    }
  };

  const handleCreateKey = async () => {
    if (!selectedClub || !resolvedKeychain) return;

    try {
      const response = await fetch(`/api/clubs/${selectedClub}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_code: authCodeInput.trim().toUpperCase() }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to create key: ${response.statusText}`);
      }

      const data = await response.json();
      const newKey: ClubKey = data.data || data;
      setKeys((prev) => [newKey, ...prev]);
      if (newKey.keychain_id && !keychainById[newKey.keychain_id]) {
        setKeychainById((prev) => ({ ...prev, [resolvedKeychain.uid]: resolvedKeychain }));
      }
      setAuthCodeInput('');
      setResolvedKeychain(null);
      setLookupStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.key) return;
    const { key, originating_club_id } = deleteModal.key;

    try {
      const response = await fetch(`/api/clubs/${originating_club_id}/keys/${key}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to revoke key: ${response.statusText}`);
      }
      setKeys((prev) => prev.filter((k) => k.key !== key));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    } finally {
      setDeleteModal({ isOpen: false, key: null });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const clubByUid = Object.fromEntries(clubs.map((c) => [c.uid, c]));
  const showingAll = selectedClub === '';
  const selectedClubName = clubs.find((c) => c.uid === selectedClub)?.displayName;

  const totalPages = Math.max(1, Math.ceil(keys.length / PAGE_SIZE));
  const pagedKeys = keys.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1
              onClick={() => router.push('/dashboard')}
              className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Playfolio Admin Dashboard | Keychains
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

          {/* Error banner */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 ml-4 text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Club Keychains</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Issue keys to keychains. Each keychain links one or more device accounts to the same identity. A device presents its key at a kiosk to identify itself.
              </p>

              {/* Club + auth code selector */}
              <div className="flex space-x-4 items-start">
                <div className="flex-1">
                  <label htmlFor="club-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filter by Club
                  </label>
                  <select
                    id="club-select"
                    value={selectedClub}
                    onChange={(e) => handleClubChange(e.target.value)}
                    disabled={clubsLoading}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm disabled:opacity-50"
                  >
                    <option value="">{clubsLoading ? 'Loading clubs...' : 'All clubs'}</option>
                    {!clubsLoading && clubs.map((club) => (
                      <option key={club.uid} value={club.uid}>{club.displayName} — {club.uid}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label htmlFor="auth-code-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Issue Key To (Auth Code)
                  </label>
                  <input
                    id="auth-code-input"
                    type="text"
                    value={authCodeInput}
                    onChange={(e) => handleAuthCodeChange(e.target.value)}
                    disabled={!selectedClub}
                    placeholder={!selectedClub ? 'Select a club first' : 'e.g. CORAL-4821'}
                    autoComplete="off"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm disabled:opacity-50 font-mono uppercase"
                  />
                  <div className="mt-1 h-5">
                    {lookupStatus === 'loading' && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">Looking up...</p>
                    )}
                    {lookupStatus === 'found' && resolvedKeychain && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ {resolvedKeychain.players.length === 0
                          ? 'Empty keychain'
                          : resolvedKeychain.players.length === 1
                            ? memberLabel(resolvedKeychain.players[0])
                            : `${memberLabel(resolvedKeychain.players[0])} +${resolvedKeychain.players.length - 1} more`
                        }
                      </p>
                    )}
                    {lookupStatus === 'notfound' && (
                      <p className="text-xs text-red-500 dark:text-red-400">Not found</p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 pt-6">
                  <button
                    onClick={handleCreateKey}
                    disabled={!selectedClub || lookupStatus !== 'found'}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                  >
                    Issue Key
                  </button>
                </div>
              </div>

              {/* Keys table */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Keys
                  {selectedClubName && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      for {selectedClubName}
                    </span>
                  )}
                  {!dataLoading && keys.length > 0 && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      — {keys.length} total, {keys.filter(k => k.status === 'active').length} active
                    </span>
                  )}
                </h3>

                {dataLoading ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">Loading...</p>
                  </div>
                ) : keys.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      No keys issued{selectedClub ? ' for this club' : ''} yet.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Keychain / Devices</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Auth Code</th>
                          {showingAll && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Club</th>
                          )}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Key</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Issued</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Used</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Uses</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {pagedKeys.map((k) => {
                          const keychain = keychainById[k.keychain_id];
                          const club = clubByUid[k.originating_club_id];
                          const members = keychain?.players ?? [];

                          return (
                            <tr key={k.key} className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <td className="px-6 py-4 text-sm">
                                {members.length === 0 ? (
                                  <span className="text-gray-400 dark:text-gray-600 italic text-xs">No linked devices</span>
                                ) : (
                                  <div className="space-y-0.5">
                                    {members.map((m) => (
                                      <div key={m.player_uid}>
                                        <div className="font-medium text-gray-900 dark:text-white">{memberLabel(m)}</div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{m.player_uid}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {keychain ? (
                                  <span className="font-mono text-xs text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    {keychain.auth_code}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-600 text-xs font-mono">{k.keychain_id}</span>
                                )}
                              </td>
                              {showingAll && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                  {club?.displayName ?? k.originating_club_id}
                                </td>
                              )}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                <div className="flex items-center space-x-2">
                                  <span className="truncate max-w-[180px]">{k.key}</span>
                                  <button
                                    onClick={() => copyToClipboard(k.key)}
                                    className={`p-1 rounded transition-colors cursor-pointer flex-shrink-0 ${
                                      copiedKey === k.key
                                        ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
                                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                    title={copiedKey === k.key ? 'Copied!' : 'Copy key'}
                                  >
                                    {copiedKey === k.key ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={statusBadge(k.status)}>{k.status}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(k.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : <span className="text-gray-400 dark:text-gray-600">Never</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {k.usage_count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => setDeleteModal({ isOpen: true, key: k })}
                                  disabled={k.status !== 'active'}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={k.status !== 'active' ? `Key already ${k.status}` : 'Revoke key'}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {keys.length > 0 && (
                      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, keys.length)} of {keys.length}
                        </p>
                        <div className="flex items-center space-x-1">
                          {totalPages > 1 && <><button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            «
                          </button>
                          <button
                            onClick={() => setPage((p) => p - 1)}
                            disabled={page === 1}
                            className="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            ‹
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                            .reduce<(number | '…')[]>((acc, p, i, arr) => {
                              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
                              acc.push(p);
                              return acc;
                            }, [])
                            .map((p, i) =>
                              p === '…' ? (
                                <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-gray-400">…</span>
                              ) : (
                                <button
                                  key={p}
                                  onClick={() => setPage(p as number)}
                                  className={`px-3 py-1 text-sm rounded transition-colors ${
                                    page === p
                                      ? 'bg-blue-600 text-white'
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {p}
                                </button>
                              )
                            )}
                          <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page === totalPages}
                            className="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            ›
                          </button>
                          <button
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                            className="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            »
                          </button></>}
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

      {/* Revoke confirmation modal */}
      {deleteModal.isOpen && deleteModal.key && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revoke Key</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Are you sure you want to revoke this key?
            </p>
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 mb-4 break-all">
              {deleteModal.key.key}
            </p>
            {(() => {
              const kc = keychainById[deleteModal.key.keychain_id];
              const members = kc?.players ?? [];
              return (
                <div className="mb-6">
                  {kc && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Keychain{' '}
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1 rounded">{kc.auth_code}</span>
                    </p>
                  )}
                  {members.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Linked device{members.length > 1 ? 's' : ''}:{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {members.map(memberLabel).join(', ')}
                      </span>
                      {' '}will no longer be able to identify using this key.
                    </p>
                  )}
                </div>
              );
            })()}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, key: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
