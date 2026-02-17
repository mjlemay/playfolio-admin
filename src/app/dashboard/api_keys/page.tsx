'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Club } from '../../lib/types';

export default function ApiKeys() {
  const router = useRouter();
  const [selectedClub, setSelectedClub] = useState('');
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string; created: string; clubUid: string }[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch clubs from the same API endpoint as the clubs page
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/clubs');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch clubs: ${response.statusText}`);
        }
        
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
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleLogout = () => {
    // Clear any authentication state here if needed
    router.push('/');
  };

  const generateApiKey = () => {
    if (!selectedClub.trim()) return;

    const selectedClubData = clubs.find(club => club.uid === selectedClub);
    const keyName = selectedClubData ? `${selectedClubData.displayName} - API Key` : 'API Key';

    const newKey = {
      id: Date.now().toString(),
      name: keyName,
      key: `pk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toLocaleDateString(),
      clubUid: selectedClub
    };

    setApiKeys([...apiKeys, newKey]);
    // Keep the selected club in the form after generating the key
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Filter API keys based on selected club
  const filteredApiKeys = selectedClub 
    ? apiKeys.filter(key => key.clubUid === selectedClub)
    : [];

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
                Playfolio Admin Dashboard | API Keys
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
                Generate API Keys
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create API keys for external integrations with the Playfolio platform.
              </p>

              {/* API Key Generation Form */}
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label htmlFor="club-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Club
                    </label>
                    <select
                      id="club-select"
                      value={selectedClub}
                      onChange={(e) => setSelectedClub(e.target.value)}
                      disabled={loading}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm disabled:opacity-50"
                    >
                      <option value="">
                        {loading ? 'Loading clubs...' : error ? 'Error loading clubs' : 'Select a club...'}
                      </option>
                      {!loading && !error && clubs.map((club) => (
                        <option key={club.uid} value={club.uid}>
                          {club.displayName} - {club.uid}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-shrink-0 flex items-end">
                    <button
                      onClick={generateApiKey}
                      disabled={!selectedClub.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                    >
                      Generate Key
                    </button>
                  </div>
                </div>
              </div>

              {/* Existing API Keys */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Active API Keys
                  {selectedClub && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      for {clubs.find(club => club.uid === selectedClub)?.displayName}
                    </span>
                  )}
                </h3>
                {!selectedClub ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      Select a club above to view and manage its API keys.
                    </p>
                  </div>
                ) : filteredApiKeys.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      No API keys generated for this club yet. Create your first API key above.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            API Key
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
                        {filteredApiKeys.map((apiKey) => (
                          <tr key={apiKey.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {apiKey.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={apiKey.key}
                                  readOnly
                                  className="text-xs bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 px-2 py-1 rounded font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-text select-all w-full"
                                  onClick={(e) => e.currentTarget.select()}
                                />
                                <button
                                  onClick={() => copyToClipboard(apiKey.key)}
                                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer flex-shrink-0"
                                  title="Copy API key to clipboard"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {apiKey.created}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => deleteApiKey(apiKey.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                                title="Delete API key"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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
    </div>
  );
}