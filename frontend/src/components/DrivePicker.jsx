import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

const DrivePicker = ({ onSyncComplete }) => {
    const [files, setFiles] = useState([]);
    const [currentFolder, setCurrentFolder] = useState('root');
    const [folderStack, setFolderStack] = useState([{ id: 'root', name: 'Drive' }]);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [syncStatus, setSyncStatus] = useState(null); // { status: 'info'|'success'|'error'|'complete', message: '', detail: '' }
    const [syncing, setSyncing] = useState(false);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        fetchFiles(currentFolder);
    }, [currentFolder]);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [syncStatus]);

    const fetchFiles = async (folderId) => {
        setLoading(true);
        try {
            const sessionId = localStorage.getItem('session_id');
            const response = await fetch(`${API_BASE_URL}/api/drive/list?folder_id=${folderId}`, {
                headers: { 'x-session-id': sessionId }
            });
            if (!response.ok) throw new Error('Failed to fetch files');
            const data = await response.json();
            setFiles(data.files);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = (folder) => {
        setCurrentFolder(folder.id);
        setFolderStack([...folderStack, { id: folder.id, name: folder.name }]);
        setSelectedItems([]); // Clear selection on navigation
    };

    const handleBreadcrumbClick = (index) => {
        const newStack = folderStack.slice(0, index + 1);
        setFolderStack(newStack);
        setCurrentFolder(newStack[newStack.length - 1].id);
        setSelectedItems([]);
    };

    const toggleSelection = (item) => {
        if (selectedItems.find(i => i.id === item.id)) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleSync = async () => {
        if (selectedItems.length === 0) return;

        setSyncing(true);
        setSyncStatus({ status: 'info', message: 'Starting sync...', detail: 'Initializing connection' });

        try {
            const sessionId = localStorage.getItem('session_id');
            const response = await fetch(`${API_BASE_URL}/api/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId
                },
                body: JSON.stringify({ items: selectedItems }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Sync failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const update = JSON.parse(line);
                            setSyncStatus(update);
                            // Removed auto-redirect logic here
                        } catch (e) {
                            console.error("Error parsing stream:", e);
                        }
                    }
                }
            }
        } catch (error) {
            setSyncStatus({ status: 'error', message: 'Sync failed', detail: error.message });
        } finally {
            // Keep syncing=true to show success/error state
        }
    };

    const resetSync = () => {
        setSyncing(false);
        setSyncStatus(null);
    };

    return (
        <div className="h-full flex flex-col bg-bg-primary">
            {/* Header / Breadcrumbs */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-bg-primary/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {folderStack.map((folder, index) => (
                        <React.Fragment key={folder.id}>
                            {index > 0 && <span className="text-text-secondary/50 mx-1">/</span>}
                            <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className={`text-sm font-medium whitespace-nowrap px-3 py-1.5 rounded-lg transition-all ${index === folderStack.length - 1
                                    ? 'text-text-primary bg-white/5'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                                    }`}
                            >
                                {folder.name}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex items-center gap-4 ml-4">
                    <span className="text-sm text-text-secondary hidden sm:inline whitespace-nowrap">
                        {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}
                    </span>
                    <button
                        onClick={handleSync}
                        disabled={selectedItems.length === 0 || syncing}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${selectedItems.length > 0 && !syncing
                            ? 'bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:scale-105'
                            : 'bg-white/5 text-text-secondary/50 cursor-not-allowed'
                            }`}
                    >
                        {syncing ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Syncing...
                            </span>
                        ) : (
                            'Sync Selected'
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0">
                {syncing ? (
                    <div className="h-full flex flex-col items-center justify-center fade-in">
                        {syncStatus?.status === 'error' ? (
                            <div className="text-center fade-in">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-3 text-red-500">Sync Failed</h3>
                                <p className="text-text-secondary text-sm max-w-lg text-center leading-relaxed mb-8">{syncStatus?.detail}</p>
                                <button
                                    onClick={resetSync}
                                    className="px-6 py-2 bg-bg-secondary hover:bg-white/10 rounded-xl text-text-primary transition-colors font-medium"
                                >
                                    Go Back
                                </button>
                            </div>
                        ) : syncStatus?.status === 'complete' ? (
                            <div className="text-center fade-in">
                                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-green-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <h3 className="text-3xl font-bold mb-3 text-text-primary">Sync Complete!</h3>
                                <p className="text-text-secondary text-base max-w-lg text-center leading-relaxed mb-8">
                                    Successfully indexed {selectedItems.length} files. You can now chat with them.
                                </p>
                                <button
                                    onClick={() => onSyncComplete(selectedItems.length)}
                                    className="px-8 py-3 bg-accent text-white rounded-xl hover:bg-accent-hover shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105 transition-all font-semibold text-lg flex items-center gap-2 mx-auto"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                    </svg>
                                    Start Conversation
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="w-20 h-20 border-4 border-white/10 border-t-accent rounded-full animate-spin mb-8"></div>
                                <h3 className="text-2xl font-semibold mb-3">{syncStatus?.message || 'Processing...'}</h3>
                                <p className="text-text-secondary text-sm max-w-lg text-center leading-relaxed">{syncStatus?.detail}</p>
                            </>
                        )}
                    </div>
                ) : loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="w-10 h-10 border-3 border-white/10 border-t-accent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto pb-20">
                        {files.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {files.map((file) => {
                                    const isSelected = selectedItems.find(i => i.id === file.id);
                                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

                                    return (
                                        <div
                                            key={file.id}
                                            onClick={() => isFolder ? handleFolderClick(file) : toggleSelection(file)}
                                            className={`group relative p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center text-center gap-3
                            ${isSelected
                                                    ? 'bg-accent/10 border-accent shadow-lg shadow-accent/10 scale-[0.98]'
                                                    : 'bg-bg-secondary/50 border-white/5 hover:bg-bg-secondary hover:border-white/10 hover:shadow-lg hover:scale-[1.02]'
                                                }
                          `}
                                        >
                                            {/* Selection Checkbox */}
                                            {!isFolder && (
                                                <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-accent border-accent opacity-100 scale-100' : 'border-white/30 opacity-0 group-hover:opacity-100 scale-90'}`}>
                                                    {isSelected && (
                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            )}

                                            <div className="w-14 h-14 flex items-center justify-center text-4xl transform group-hover:scale-110 transition-transform duration-200">
                                                {isFolder ? '📁' : file.mimeType.includes('pdf') ? '📄' : '📝'}
                                            </div>

                                            <span className="text-sm font-medium text-text-primary line-clamp-2 break-words w-full px-1">
                                                {file.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-text-secondary">
                                <div className="w-24 h-24 bg-bg-secondary rounded-full flex items-center justify-center mb-6">
                                    <span className="text-4xl">📂</span>
                                </div>
                                <h3 className="text-xl font-medium text-text-primary mb-2">This folder is empty</h3>
                                <p className="text-sm">No files found in this location.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DrivePicker;
