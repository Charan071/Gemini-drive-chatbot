import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Bot, User, Send, AlertCircle, Loader2 } from 'lucide-react';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const userMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5678/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage.content }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Chat failed');
            }

            const botMessage = { role: 'bot', content: data.response };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'error', content: `Error: ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        "Summarize the selected documents",
        "What are the key takeaways?",
        "Find specific dates mentioned",
        "Explain the main concepts"
    ];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-dark-bg">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-0 animate-fade-in animate-delay-100">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400">
                            <Sparkles size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">How can I help you today?</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                I've analyzed your files. Ask me anything about them, or try one of these suggestions:
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSend(suggestion)}
                                    className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-sidebar border border-gray-200 dark:border-dark-border rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-dark-surface transition-all shadow-sm hover:shadow-md"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6 pb-4">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-green-600 text-white'
                                    }`}>
                                    {msg.role === 'user' ? <span className="text-xs font-bold">U</span> : <Bot size={18} />}
                                </div>

                                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border text-gray-800 dark:text-gray-100 rounded-tl-none'
                                        }`}>
                                        {msg.role === 'user' ? (
                                            msg.content
                                        ) : (
                                            <div className="prose prose-sm max-w-none prose-indigo dark:prose-invert">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-4 animate-fade-in">
                                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shrink-0 text-white">
                                    <Bot size={18} />
                                </div>
                                <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-dark-bg border-t border-gray-100 dark:border-dark-border">
                <div className="max-w-3xl mx-auto relative">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="relative group"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Send a message..."
                            className="w-full pl-5 pr-12 py-4 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                        AI can make mistakes. Please verify important information.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Chat;
