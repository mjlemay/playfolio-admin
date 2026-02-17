'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Club, Device } from '../../lib/types';

export default function Devices() {
  const router = useRouter();
  const [selectedClub, setSelectedClub] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    device: Device | null;
    name: string;
  }>({ isOpen: false, device: null, name: '' });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    device: Device | null;
  }>({ isOpen: false, device: null });

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setClubsLoading(true);
        setError(null);
        const response = await fetch('/api/clubs');
        if (!response.ok) throw new Error(`Failed to fetch clubs: ${response.statusText}`);
        const data = await response.json();
        if (data.success && data.clubs) {
          setClubs(data.clubs);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching clubs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch clubs');
      } finally {
        setClubsLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const handleClubChange = async (uid: string) => {
    setSelectedClub(uid);
    setDevices([]);
    if (!uid) return;

    setDevicesLoading(true);
    try {
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices((data.devices || []).filter((d: Device) => d.club_id === uid));
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setDevicesLoading(false);
    }
  };

  const handleAddDevice = async () => {
    if (!selectedClub || !deviceName.trim()) return;

    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deviceName.trim(), club_id: selectedClub }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to create device: ${response.statusText}`);
      }

      const data = await response.json();
      setDevices((prev) => [data.data, ...prev]);
      setDeviceName('');
    } catch (err) {
      console.error('Error creating device:', err);
      alert(err instanceof Error ? err.message : 'Failed to create device');
    }
  };

  const handleEditConfirm = async () => {
    if (!editModal.device || !editModal.name.trim()) return;

    try {
      const response = await fetch(`/api/devices/${editModal.device.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editModal.name.trim(), club_id: editModal.device.club_id }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to update device: ${response.statusText}`);
      }

      const data = await response.json();
      setDevices((prev) => prev.map((d) => d.uid === data.data.uid ? data.data : d));
    } catch (err) {
      console.error('Error updating device:', err);
      alert(err instanceof Error ? err.message : 'Failed to update device');
    } finally {
      setEditModal({ isOpen: false, device: null, name: '' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.device) return;

    try {
      const response = await fetch(`/api/devices/${deleteModal.device.uid}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to delete device: ${response.statusText}`);
      }
      setDevices((prev) => prev.filter((d) => d.uid !== deleteModal.device!.uid));
    } catch (err) {
      console.error('Error deleting device:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete device');
    } finally {
      setDeleteModal({ isOpen: false, device: null });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUid(text);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const selectedClubName = clubs.find((c) => c.uid === selectedClub)?.displayName;

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
              Playfolio Admin Dashboard | Devices
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Manage Devices
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create and manage devices associated with a club.
              </p>

              {/* Add Device Form */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label htmlFor="club-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Club
                  </label>
                  <select
                    id="club-select"
                    value={selectedClub}
                    onChange={(e) => handleClubChange(e.target.value)}
                    disabled={clubsLoading}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm disabled:opacity-50"
                  >
                    <option value="">
                      {clubsLoading ? 'Loading clubs...' : error ? 'Error loading clubs' : 'Select a club...'}
                    </option>
                    {!clubsLoading && !error && clubs.map((club) => (
                      <option key={club.uid} value={club.uid}>
                        {club.displayName} - {club.uid}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label htmlFor="device-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Device Name
                  </label>
                  <input
                    id="device-name"
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDevice()}
                    disabled={!selectedClub}
                    placeholder={selectedClub ? 'e.g. Entrance Reader 1' : 'Select a club first'}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm disabled:opacity-50"
                  />
                </div>

                <div className="flex-shrink-0 flex items-end">
                  <button
                    onClick={handleAddDevice}
                    disabled={!selectedClub || !deviceName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                  >
                    Add Device
                  </button>
                </div>
              </div>

              {/* Devices Table */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Devices
                  {selectedClubName && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      for {selectedClubName}
                    </span>
                  )}
                </h3>

                {!selectedClub ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      Select a club above to view and manage its devices.
                    </p>
                  </div>
                ) : devicesLoading ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">Loading devices...</p>
                  </div>
                ) : devices.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      No devices for this club yet. Add one above.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">UID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {devices.map((device) => (
                          <tr key={device.uid} className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {device.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                              <div className="flex items-center space-x-2">
                                <span className="truncate max-w-xs">{device.uid}</span>
                                <button
                                  onClick={() => copyToClipboard(device.uid)}
                                  className={`p-1 rounded transition-colors cursor-pointer flex-shrink-0 ${
                                    copiedUid === device.uid
                                      ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
                                      : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  title={copiedUid === device.uid ? 'Copied!' : 'Copy UID'}
                                >
                                  {copiedUid === device.uid ? (
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(device.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditModal({ isOpen: true, device, name: device.name })}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                                  title="Edit device"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setDeleteModal({ isOpen: true, device })}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                                  title="Delete device"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Device</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEditConfirm(); }} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Device Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, device: null, name: '' })}
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
      {deleteModal.isOpen && deleteModal.device && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Delete Device</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete &quot;{deleteModal.device.name}&quot;? This cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, device: null })}
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
