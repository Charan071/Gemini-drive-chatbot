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
        <div className="minimal-card rounded-2xl flex flex-col h-full overflow-hidden bg-white/80 backdrop-blur-sm relative">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/50">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Assistant</h2>
                    <p className="text-xs text-gray-500 font-medium">Ask questions about your documents</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Sparkles size={16} />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent scrollbar-thin scrollbar-thumb-gray-200">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-white rounded-2xl flex items-center justify-center shadow-sm border border-indigo-50 text-indigo-600">
                            <Bot size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">How can I help you?</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                                I've analyzed your files. Ask me anything or try a suggestion below.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(suggestion)}
                                    className="text-xs text-left p-3 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-gray-600 hover:text-indigo-600"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                        <div
                            className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : msg.role === 'error'
                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                }`}
                        >
                            {msg.role === 'bot' ? (
                                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-a:text-indigo-600 prose-strong:text-gray-900">
                                    <ReactMarkdown
                                        components={{
                                            code({ node, inline, className, children, ...props }) {
                                                return !inline ? (
                                                    <div className="bg-gray-900 text-gray-100 p-3 rounded-lg my-2 overflow-x-auto text-xs font-mono border border-gray-700">
                                                        {children}
                                                    </div>
                                                ) : (
                                                    <code className="bg-gray-100 text-indigo-600 px-1 py-0.5 rounded text-xs font-mono border border-gray-200" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 flex items-center gap-1.5 shadow-sm">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 border-t border-gray-100 backdrop-blur-md">
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all shadow-sm">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your question..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 px-4 text-sm"
                        disabled={loading}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 flex items-center justify-center"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-400">AI can make mistakes. Please verify important information.</p>
                </div>
            </div>
        </div>
    );
};

export default Chat;
