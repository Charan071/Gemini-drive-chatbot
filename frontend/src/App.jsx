import React, { useState, useEffect } from 'react';
import DrivePicker from './components/DrivePicker';
import Chat from './components/Chat';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncComplete, setIsSyncComplete] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:5678/api/auth/status');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (err) {
      console.error("Auth check failed", err);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5678/api/auth/login');
      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5678/api/auth/logout');
      setIsAuthenticated(false);
      setIsSyncComplete(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <header className="flex justify-between items-center mb-10 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              G
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Gemini Drive Agent
            </h1>
          </div>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign Out
            </button>
          )}
        </header>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="minimal-card p-12 rounded-2xl max-w-md w-full text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                📂
              </div>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">Connect Workspace</h2>
              <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                Connect Google Drive to start chatting with your documents.
              </p>
              <button
                onClick={handleLogin}
                className="w-full btn-primary px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-3"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px]">
            <div className="lg:col-span-4 h-full">
              <DrivePicker onSyncComplete={() => setIsSyncComplete(true)} />
            </div>

            <div className="lg:col-span-8 h-full">
              <ErrorBoundary>
                {isSyncComplete ? (
                  <Chat />
                ) : (
                  <div className="h-full minimal-card rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 border-dashed">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 text-2xl shadow-sm border border-gray-100">
                      💬
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Ready to Chat?</h3>
                    <p className="text-gray-400 text-sm">
                      Select files and sync to start.
                    </p>
                  </div>
                )}
              </ErrorBoundary>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
