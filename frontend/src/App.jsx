import React, { useState, useEffect } from 'react';
import { HardDrive, MessageSquare, LogOut, Command, LayoutGrid, Menu, X } from 'lucide-react';
import DrivePicker from './components/DrivePicker';
import Chat from './components/Chat';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncComplete, setIsSyncComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Generate or retrieve Session ID
    let storedSessionId = localStorage.getItem('gemini_session_id');
    if (!storedSessionId) {
      storedSessionId = crypto.randomUUID();
      localStorage.setItem('gemini_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);

    if (storedSessionId) {
      checkAuthStatus(storedSessionId);
    }

    // Enforce dark mode
    document.documentElement.classList.add('dark');
  }, []);

  const checkAuthStatus = async (sid) => {
    try {
      const response = await fetch('http://localhost:5678/api/auth/status', {
        headers: {
          'x-session-id': sid || sessionId
        }
      });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (err) {
      console.error("Auth check failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5678/api/auth/login', {
        headers: {
          'x-session-id': sessionId
        }
      });
      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5678/api/auth/logout', {
        headers: {
          'x-session-id': sessionId
        }
      });
      setIsAuthenticated(false);
      setIsSyncComplete(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-primary-light dark:bg-primary/20 rounded-xl mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text overflow-hidden transition-colors duration-300 font-sans">

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-dark-sidebar rounded-md shadow-md"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar (Left Panel) */}
      {isAuthenticated && (
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-40 w-[280px] h-full bg-gray-50 dark:bg-dark-sidebar border-r border-gray-200 dark:border-dark-border flex flex-col transition-transform duration-300 ease-in-out`}>

          {/* Sidebar Header */}
          <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-dark-border">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm">
              <Command size={18} />
            </div>
            <div>
              <h1 className="text-lg font-medium tracking-tight text-gray-900 dark:text-white">
                Gemini Drive
              </h1>
            </div>
          </div>

          {/* Drive Picker (Content) */}
          <div className="flex-1 overflow-hidden p-2">
            <DrivePicker onSyncComplete={() => setIsSyncComplete(true)} sessionId={sessionId} />
          </div>

          {/* Sidebar Footer (User & Theme) */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-border space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content (Right Panel) */}
      <div className="flex-1 h-full flex flex-col relative bg-white dark:bg-dark-bg">
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
              <div className="w-20 h-20 bg-primary-light dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                <LayoutGrid size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Connect your Google Drive to start chatting with your documents.
                </p>
              </div>
              <button
                onClick={handleLogin}
                className="w-full btn-primary px-6 py-3 font-semibold text-lg flex items-center justify-center gap-3"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 h-full overflow-hidden relative">
            <ErrorBoundary>
              {isSyncComplete ? (
                <Chat sessionId={sessionId} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 text-gray-400 dark:text-gray-500">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ready to Chat?</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    Select files from the sidebar and click <strong>Sync</strong> to start.
                  </p>
                </div>
              )}
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
