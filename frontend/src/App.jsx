import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DrivePicker from './components/DrivePicker';
import Chat from './components/Chat';
import SettingsModal from './components/SettingsModal';
import FileContextPanel from './components/FileContextPanel';
import { API_BASE_URL } from './config';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState('picker');
  const [user, setUser] = useState({ email: 'User' });

  // Lifted State for Files & Sync
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncedFileCount, setSyncedFileCount] = useState(0);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Theme State - Default to system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    checkAuthStatus();

    // Apply initial theme
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Update theme when state changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const checkAuthStatus = async () => {
    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) return;

      const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
        headers: { 'x-session-id': sessionId }
      });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      setIsApiKeySet(data.isApiKeySet);

      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check failed", error);
    }
  };

  const handleLogin = async () => {
    const sessionId = crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      headers: { 'x-session-id': sessionId }
    });
    const data = await response.json();
    window.location.href = data.url;
  };

  const handleLogout = async () => {
    const sessionId = localStorage.getItem('session_id');
    if (sessionId) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        headers: { 'x-session-id': sessionId }
      });
    }
    localStorage.removeItem('session_id');
    setIsAuthenticated(false);
    setIsApiKeySet(false);
    setIsSettingsOpen(false);
    setView('picker');
    setSelectedFiles([]);
    setSyncStatus(null);
  };

  const handleSaveApiKey = async (newKey) => {
    try {
      const sessionId = localStorage.getItem('session_id');
      await fetch(`${API_BASE_URL}/api/auth/apikey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ api_key: newKey })
      });
      setIsApiKeySet(true);
      setApiKey(newKey);
    } catch (error) {
      console.error("Failed to save API key", error);
    }
  };

  const handleSyncComplete = (count) => {
    setSyncedFileCount(count);
    setView('chat');
  };

  // Check for auth query param from redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      checkAuthStatus();
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileToRemove.id));
    // Note: In a real implementation, this might trigger a re-sync or API call
    // For now, it just updates the UI state.
    if (view === 'chat') {
      // If removing files while chatting, we might want to warn user or auto-switch to picker
      // to re-sync.
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden transition-colors duration-300">
        {/* Background Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

        <div className="glass-panel p-8 md:p-12 max-w-md w-full mx-4 text-center relative z-10 fade-in">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight text-text-primary">Welcome to CIRA</h1>
          <p className="text-text-secondary mb-8">Your personal Content Indexing & Retrieval Agent. Connect your Drive to start chatting.</p>

          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-text-primary text-bg-primary font-medium rounded-xl hover:bg-text-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const handleNewChat = () => {
    setView('picker');
    setSelectedFiles([]);
    setSyncStatus(null);
    setSyncedFileCount(0);
  };

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden transition-colors duration-300">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-white/10 flex items-center justify-between bg-bg-primary/80 backdrop-blur-md z-40 sticky top-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-semibold text-text-primary">CIRA</span>
          <div className="w-8"></div>
        </div>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden fade-in"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 overflow-hidden relative flex">
          {/* Center Workspace */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            {view === 'picker' ? (
              <DrivePicker
                onSyncComplete={handleSyncComplete}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                syncStatus={syncStatus}
                setSyncStatus={setSyncStatus}
              />
            ) : (
              <Chat syncedFileCount={syncedFileCount} />
            )}
          </div>

          {/* Right Panel - Persistent File Context */}
          <div className="hidden lg:block h-full">
            <FileContextPanel
              files={selectedFiles}
              onRemoveFile={handleRemoveFile}
              onAddFiles={() => setView('picker')}
              syncStatus={syncStatus}
            />
          </div>
        </main>

        <SettingsModal
          isOpen={isSettingsOpen || (!isApiKeySet && isAuthenticated)}
          onClose={() => setIsSettingsOpen(false)}
          apiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}

export default App;
