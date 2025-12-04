import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

const ApiKeyModal = ({ isOpen, onSave }) => {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!apiKey.trim()) {
            setError('Please enter a valid API Key');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const sessionId = localStorage.getItem('session_id');
            const response = await fetch(`${API_BASE_URL}/api/auth/apikey`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId
                },
                body: JSON.stringify({ api_key: apiKey })
            });

            if (!response.ok) throw new Error('Failed to save API Key');

            onSave();
        } catch (err) {
            setError('Failed to save API Key. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 fade-in">
            <div className="bg-bg-primary w-full max-w-md rounded-2xl shadow-xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary">Enter API Key</h2>
                        <p className="text-sm text-text-secondary">Required for Gemini access</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="apiKey" className="block text-sm font-medium text-text-primary">
                            Gemini API Key
                        </label>
                        <input
                            type="password"
                            id="apiKey"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full px-4 py-2 rounded-lg border border-white/10 bg-bg-secondary text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-text-secondary/50"
                        />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>

                    <div className="bg-accent/5 p-4 rounded-xl flex gap-3 items-start border border-accent/10">
                        <div className="mt-1 text-accent">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                        </div>
                        <div className="text-sm text-text-secondary">
                            <p className="font-medium text-text-primary mb-1">Don't have a key?</p>
                            <p>
                                You can get a free Gemini API key from Google AI Studio.
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block mt-1 text-accent hover:underline"
                                >
                                    Get API Key &rarr;
                                </a>
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Save API Key'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ApiKeyModal;
