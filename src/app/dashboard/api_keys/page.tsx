'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ApiKeys() {
  const router = useRouter();
  const [newKeyName, setNewKeyName] = useState('');
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string; created: string }[]>([]);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleLogout = () => {
    // Clear any authentication state here if needed
    router.push('/');
  };

  const generateApiKey = () => {
    if (!newKeyName.trim()) return;

    const newKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `pk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toLocaleDateString()
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
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
                    <label htmlFor="key-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      API Key Name
                    </label>
                    <input
                      type="text"
                      id="key-name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                      placeholder="e.g., Mobile App Integration"
                    />
                  </div>
                  <div className="flex-shrink-0 flex items-end">
                    <button
                      onClick={generateApiKey}
                      disabled={!newKeyName.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
                </h3>
                {apiKeys.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      No API keys generated yet. Create your first API key above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {apiKey.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Created: {apiKey.created}
                            </p>
                            <div className="mt-2 flex items-center space-x-2">
                              <code className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded font-mono text-gray-800 dark:text-gray-200">
                                {apiKey.key}
                              </code>
                              <button
                                onClick={() => copyToClipboard(apiKey.key)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteApiKey(apiKey.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
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