import React, { useState, useEffect } from 'react';
import { HardDrive, MessageSquare, LogOut, Command, LayoutGrid } from 'lucide-react';
import DrivePicker from './components/DrivePicker';
import Chat from './components/Chat';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncComplete, setIsSyncComplete] = useState(false);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      <div className="w-full max-w-7xl animate-fade-in">

        {/* Header */}
        <header className="flex justify-between items-center mb-8 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Command size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Gemini Drive
              </h1>
              <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">AI Assistant</p>
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors px-4 py-2 rounded-lg hover:bg-indigo-50"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
              Sign Out
            </button>
          )}
        </header>

        {/* Main Content */}
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-24">
            <div className="glass-panel p-12 rounded-3xl max-w-lg w-full text-center shadow-xl relative overflow-hidden">
              {/* Decorative Background Blob */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner text-indigo-600">
                <LayoutGrid size={40} />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 mb-10 text-base leading-relaxed">
                Connect your Google Drive to start chatting with your documents using the power of Gemini AI.
              </p>
              <button
                onClick={handleLogin}
                className="w-full btn-primary px-6 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 shadow-indigo-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Sign in with Google
              </button>
              <p className="mt-6 text-xs text-gray-400">
                Secure access via Google OAuth 2.0
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
            {/* Sidebar / Drive Picker */}
            <div className="lg:col-span-4 h-full animate-fade-in animate-delay-100">
              <DrivePicker onSyncComplete={() => setIsSyncComplete(true)} />
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-8 h-full animate-fade-in animate-delay-200">
              <ErrorBoundary>
                {isSyncComplete ? (
                  <Chat />
                ) : (
                  <div className="h-full minimal-card rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-white/80 border-dashed border-2 border-indigo-100">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm text-indigo-600">
                      <MessageSquare size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Chat?</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                      Select files from the left panel and click <strong>Sync</strong> to start the conversation.
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
