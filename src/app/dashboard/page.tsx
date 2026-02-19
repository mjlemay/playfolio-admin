'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // Clear any authentication state here if needed
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
               Playfolio Admin Dashboard
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
          <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-96">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Welcome to the Admin Dashboard!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  You have successfully logged in. This is where you can manage your Playfolio application.
                </p>
                
                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  <Link 
                    href="/dashboard/clubs"
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block"
                  >
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Clubs
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Manage Club account generation
                    </p>
                  </Link>
                  
                  <Link
                    href="/dashboard/devices"
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block"
                  >
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Devices
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Register and manage club devices
                    </p>
                  </Link>

                  <Link
                    href="/dashboard/players"
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block"
                  >
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Players
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Add, edit, and remove players
                    </p>
                  </Link>

                  <Link
                    href="/dashboard/keychains"
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block"
                  >
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Keychains
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      View and issue player keys per club
                    </p>
                  </Link>

                  <Link
                    href="/dashboard/activities"
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block"
                  >
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Activities
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      View kiosk login and attendance events
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}