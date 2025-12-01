import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Send, AlertCircle, Loader2 } from 'lucide-react';

const Chat = ({ sessionId }) => {
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
                    'x-session-id': sessionId || ''
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
                        <div className="w-16 h-16 bg-primary-light dark:bg-primary/20 rounded-2xl flex items-center justify-center shadow-sm text-primary">
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
                                    className="p-4 text-left text-sm font-medium text-gray-300 bg-[#292727] border border-dark-border rounded-xl hover:border-primary/50 hover:bg-dark-sidebar transition-all shadow-sm hover:shadow-md"
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
                                className={`flex flex-col gap-1 animate-fade-in ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed max-w-[85%] ${msg.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-sm'
                                    : 'bg-transparent text-gray-100 pl-0'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <div className="prose prose-sm max-w-none prose-invert prose-p:leading-relaxed prose-pre:bg-[#292727] prose-pre:border prose-pre:border-gray-700">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-center gap-2 animate-fade-in pl-1 mt-2">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce animate-delay-100"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce animate-delay-200"></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-t border-gray-200 dark:border-dark-border sticky bottom-0 z-10">
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
                            className="w-full pl-5 pr-12 py-4 bg-[#292727] border border-transparent focus:border-primary/30 rounded-full focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-white placeholder-gray-400 shadow-sm"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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
