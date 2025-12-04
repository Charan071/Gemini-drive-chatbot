import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { API_BASE_URL } from '../config';

const Chat = ({ syncedFileCount = 0 }) => {
    const [messages, setMessages] = useState([
        {
            role: 'model', text: syncedFileCount > 0
                ? `Hello! I have indexed your ${syncedFileCount} file${syncedFileCount !== 1 ? 's' : ''}. Ask me anything about them.`
                : 'Hello! I have indexed your documents. Ask me anything about them.'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setLoading(true);

        try {
            const sessionId = localStorage.getItem('session_id');
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId
                },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages(prev => [...prev, { role: 'model', text: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', text: `Error: ${data.detail || 'Something went wrong'}` }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: 'Error: Failed to connect to server.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-bg-primary relative">
            {/* Context Header */}
            {syncedFileCount > 0 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-bg-secondary/80 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full shadow-sm fade-in">
                    <span className="text-xs font-medium text-text-secondary flex items-center gap-2">
                        <span className="text-base">📚</span>
                        {syncedFileCount} File{syncedFileCount !== 1 ? 's' : ''} Indexed
                    </span>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-16">
                <div className="max-w-4xl mx-auto space-y-8">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {/* Avatar for Model */}
                            {msg.role === 'model' && (
                                <div className="w-9 h-9 rounded-lg bg-accent flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                    C
                                </div>
                            )}

                            <div
                                className={`relative px-5 py-4 rounded-2xl max-w-[80%] md:max-w-[70%] text-[15px] leading-relaxed
                ${msg.role === 'user'
                                        ? 'bg-accent text-white rounded-br-md shadow-lg shadow-accent/20'
                                        : 'bg-bg-secondary text-text-primary border border-white/10 rounded-bl-md shadow-md'
                                    }
              `}
                            >
                                {msg.role === 'model' ? (
                                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                )}
                            </div>

                            {/* Avatar for User */}
                            {msg.role === 'user' && (
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                    Y
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-4">
                            <div className="w-9 h-9 rounded-lg bg-accent flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                C
                            </div>
                            <div className="bg-bg-secondary px-5 py-4 rounded-2xl rounded-bl-md border border-white/10 flex items-center gap-2 shadow-md">
                                <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 bg-bg-primary/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto p-4 md:p-6">
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={syncedFileCount > 0 ? `Ask about your ${syncedFileCount} file${syncedFileCount !== 1 ? 's' : ''}...` : "Ask CIRA about your documents..."}
                            rows={1}
                            className="w-full bg-bg-secondary text-text-primary rounded-2xl pl-5 pr-14 py-4 border border-white/10 focus:border-accent/40 focus:ring-2 focus:ring-accent/20 resize-none max-h-48 transition-all placeholder:text-text-secondary/60 text-[15px] leading-relaxed"
                            style={{ scrollbarWidth: 'thin' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="absolute right-3 bottom-3 p-2 bg-accent text-white rounded-xl hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-center text-xs text-text-secondary/70 mt-3">
                        CIRA can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Chat;
