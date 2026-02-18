'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Player, Keychain, AttendanceStatus } from '../../lib/types';

const STATUS_OPTIONS: AttendanceStatus[] = ['unknown', 'present', 'absent', 'banned', 'inactive'];

const statusBadge = (status: string | null) => {
  const styles: Record<string, string> = {
    present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    absent: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    banned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
    unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
  };
  const s = status ?? 'unknown';
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[s] ?? styles.unknown}`;
};

const playerLabel = (p: Player) => p.meta?.name ?? p.meta?.displayName ?? p.uid;

type FormState = { name: string; status: AttendanceStatus };
const emptyForm: FormState = { name: '', status: 'unknown' };

export default function Players() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [keychainByPlayerUid, setKeychainByPlayerUid] = useState<Record<string, Keychain>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; player: Player | null; form: FormState }>({
    isOpen: false, player: null, form: emptyForm,
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; player: Player | null }>({
    isOpen: false, player: null,
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [playersRes, keychainsRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/keychains'),
        ]);
        if (!playersRes.ok) throw new Error(`Failed to fetch players: ${playersRes.statusText}`);
        const playersData = await playersRes.json();
        if (playersData.success && playersData.players) {
          setPlayers(playersData.players);
        } else {
          throw new Error('Invalid response format');
        }
        if (keychainsRes.ok) {
          const keychainsData = await keychainsRes.json();
          if (keychainsData.keychains) {
            const map: Record<string, Keychain> = {};
            for (const kc of keychainsData.keychains) {
              for (const member of (kc.players ?? [])) {
                map[member.player_uid] = kc;
              }
            }
            setKeychainByPlayerUid(map);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch players');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta: addForm.name.trim() ? { name: addForm.name.trim() } : null,
          status: addForm.status,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to create player: ${response.statusText}`);
      }

      const data = await response.json();
      const { keychain, ...newPlayer } = data.data;
      setPlayers((prev) => [newPlayer, ...prev]);
      if (keychain) {
        setKeychainByPlayerUid((prev) => ({
          ...prev,
          [newPlayer.uid]: { ...keychain, players: [{ player_uid: newPlayer.uid, joined_at: newPlayer.created_at, meta: null, status: null }] },
        }));
      }
      setAddForm(emptyForm);
    } catch (err) {
      console.error('Error creating player:', err);
      alert(err instanceof Error ? err.message : 'Failed to create player');
    }
  };

  const handleEditConfirm = async () => {
    if (!editModal.player) return;

    try {
      const response = await fetch(`/api/players/${editModal.player.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta: editModal.form.name.trim() ? { name: editModal.form.name.trim() } : null,
          status: editModal.form.status,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to update player: ${response.statusText}`);
      }

      const data = await response.json();
      setPlayers((prev) => prev.map((p) => p.uid === data.data.uid ? data.data : p));
    } catch (err) {
      console.error('Error updating player:', err);
      alert(err instanceof Error ? err.message : 'Failed to update player');
    } finally {
      setEditModal({ isOpen: false, player: null, form: emptyForm });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.player) return;

    try {
      const response = await fetch(`/api/players/${deleteModal.player.uid}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to delete player: ${response.statusText}`);
      }
      setPlayers((prev) => prev.filter((p) => p.uid !== deleteModal.player!.uid));
    } catch (err) {
      console.error('Error deleting player:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete player');
    } finally {
      setDeleteModal({ isOpen: false, player: null });
    }
  };

  const openEdit = (player: Player) => {
    setEditModal({
      isOpen: true,
      player,
      form: {
        name: player.meta?.name ?? player.meta?.displayName ?? '',
        status: (player.status as AttendanceStatus) ?? 'unknown',
      },
    });
  };

  const totalPages = Math.max(1, Math.ceil(players.length / PAGE_SIZE));
  const pagedPlayers = players.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUid(text);
    setTimeout(() => setCopiedUid(null), 2000);
  };

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
              Playfolio Admin Dashboard | Players
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
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Manage Players</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Add, edit, and remove players on the platform.</p>

              {/* Add Player Form */}
              <form onSubmit={handleAdd} className="flex space-x-4">
                <div className="flex-1">
                  <label htmlFor="player-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input
                    id="player-name"
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Jane Smith"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                  />
                </div>

                <div className="w-36">
                  <label htmlFor="player-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    id="player-status"
                    value={addForm.status}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, status: e.target.value as AttendanceStatus }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-shrink-0 flex items-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                  >
                    Add Player
                  </button>
                </div>
              </form>

              {/* Players Table */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Players
                  {!loading && !error && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      {players.length} total
                    </span>
                  )}
                </h3>

                {loading ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">Loading players...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-center">Error: {error}</p>
                  </div>
                ) : players.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">No players yet. Add one above.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">UID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Keychain</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {pagedPlayers.map((player) => {
                          const keychain = keychainByPlayerUid[player.uid];
                          return (
                            <tr key={player.uid} className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {playerLabel(player)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                <div className="flex items-center space-x-2">
                                  <span className="truncate max-w-xs">{player.uid}</span>
                                  <button
                                    onClick={() => copyToClipboard(player.uid)}
                                    className={`p-1 rounded transition-colors cursor-pointer flex-shrink-0 ${
                                      copiedUid === player.uid
                                        ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
                                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                    title={copiedUid === player.uid ? 'Copied!' : 'Copy UID'}
                                  >
                                    {copiedUid === player.uid ? (
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
                                <span className={statusBadge(player.status)}>{player.status ?? 'unknown'}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {keychain ? (
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-xs text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                      {keychain.auth_code}
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(keychain.auth_code)}
                                      className={`p-1 rounded transition-colors cursor-pointer flex-shrink-0 ${
                                        copiedUid === keychain.auth_code
                                          ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
                                          : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                      }`}
                                      title={copiedUid === keychain.auth_code ? 'Copied!' : 'Copy auth code'}
                                    >
                                      {copiedUid === keychain.auth_code ? (
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      ) : (
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(player.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => openEdit(player)}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                                    title="Edit player"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setDeleteModal({ isOpen: true, player })}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                                    title="Delete player"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {players.length > 0 && (
                      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, players.length)} of {players.length}
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

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Player</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEditConfirm(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={editModal.form.name}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, name: e.target.value } }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  value={editModal.form.status}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, status: e.target.value as AttendanceStatus } }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, player: null, form: emptyForm })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && deleteModal.player && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Delete Player</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete &quot;{playerLabel(deleteModal.player)}&quot;? This will also remove all their club and squad memberships.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, player: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
