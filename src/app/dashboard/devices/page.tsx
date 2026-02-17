'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Device {
  uid: string;
  name: string;
  club_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  last_activity_at?: string | null;
}

export default function Devices() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    club_id: '',
    uid: '',
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    deviceUid: string | null;
    deviceName: string;
  }>({
    isOpen: false,
    deviceUid: null,
    deviceName: ''
  });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    device: Device | null;
  }>({
    isOpen: false,
    device: null,
  });
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Fetch devices on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/devices');

        if (!response.ok) {
          throw new Error(`Failed to fetch devices: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setDevices(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching devices:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch devices');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleLogout = () => {
    router.push('/');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const payload = {
        name: formData.name,
        club_id: formData.club_id || null,
        uid: formData.uid || undefined, // Optional custom UID
      };

      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create device');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setDevices([...devices, data.data]);
        setFormData({
          name: '',
          club_id: '',
          uid: '',
        });
      }
    } catch (err) {
      console.error('Error creating device:', err);
      alert('Failed to create device');
    }
  };

  const handleDeleteClick = (device: Device) => {
    setDeleteModal({
      isOpen: true,
      deviceUid: device.uid,
      deviceName: `${device.name} (${device.uid})`
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.deviceUid) return;

    try {
      const response = await fetch(`/api/devices/${deleteModal.deviceUid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete device');
      }

      setDevices(devices.filter(d => d.uid !== deleteModal.deviceUid));
    } catch (err) {
      console.error('Error deleting device:', err);
      alert('Failed to delete device');
    } finally {
      setDeleteModal({
        isOpen: false,
        deviceUid: null,
        deviceName: ''
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      deviceUid: null,
      deviceName: ''
    });
  };

  const handleEditClick = (device: Device) => {
    setEditModal({
      isOpen: true,
      device: { ...device }
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!editModal.device) return;

    setEditModal(prev => ({
      ...prev,
      device: prev.device ? {
        ...prev.device,
        [name]: value
      } : null
    }));
  };

  const handleEditConfirm = async () => {
    if (!editModal.device) return;

    try {
      const response = await fetch(`/api/devices/${editModal.device.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editModal.device.name,
          club_id: editModal.device.club_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update device');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setDevices(devices.map(d =>
          d.uid === editModal.device!.uid ? data.data : d
        ));
      }
    } catch (err) {
      console.error('Error updating device:', err);
      alert('Failed to update device');
    } finally {
      setEditModal({
        isOpen: false,
        device: null
      });
    }
  };

  const handleEditCancel = () => {
    setEditModal({
      isOpen: false,
      device: null
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUid(text);
    setTimeout(() => {
      setCopiedUid(null);
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1
                onClick={handleBack}
                className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Playfolio Admin Dashboard | Devices
              </h1>
            </div>
            <button
              onClick={handleLogout}
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
                Register New Kiosk Device
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Register a kiosk device to track activities. Each kiosk needs a unique device ID.
              </p>

              {/* Device Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Device Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                    placeholder="e.g., Main Lobby Kiosk, Room 101 Kiosk"
                  />
                </div>

                <div>
                  <label htmlFor="club_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Club ID
                  </label>
                  <input
                    type="text"
                    id="club_id"
                    name="club_id"
                    value={formData.club_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm font-mono"
                    placeholder="club_xxxxxx (optional)"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Associate this device with a specific club
                  </p>
                </div>

                <div>
                  <label htmlFor="uid" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Device ID (Optional)
                  </label>
                  <input
                    type="text"
                    id="uid"
                    name="uid"
                    value={formData.uid}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm font-mono"
                    placeholder="Leave empty to auto-generate UUID"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Optionally provide a custom device ID (must be unique)
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                  >
                    Register Device
                  </button>
                </div>
              </form>

              {/* Existing Devices List */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Registered Devices
                </h3>

                {loading ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      Loading devices...
                    </p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-center">
                      Error: {error}
                    </p>
                  </div>
                ) : devices.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      No devices registered. Register your first device above.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Device Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Device ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Club ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Last Activity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
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
                                  title={copiedUid === device.uid ? "Copied!" : "Copy device ID to clipboard"}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                              {device.club_id || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {device.last_activity_at ? formatDate(device.last_activity_at) : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(device.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditClick(device)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                                  title="Edit device"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(device)}
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

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Delete Device
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete device &quot;{deleteModal.deviceName}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
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

      {/* Edit Modal */}
      {editModal.isOpen && editModal.device && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Edit Device
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEditConfirm(); }} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Device Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={editModal.device.name}
                  onChange={handleEditInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                  placeholder="Enter device name"
                />
              </div>

              <div>
                <label htmlFor="edit-club_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Club ID
                </label>
                <input
                  type="text"
                  id="edit-club_id"
                  name="club_id"
                  value={editModal.device.club_id || ''}
                  onChange={handleEditInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm font-mono"
                  placeholder="club_xxxxxx"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleEditCancel}
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
    </div>
  );
}
