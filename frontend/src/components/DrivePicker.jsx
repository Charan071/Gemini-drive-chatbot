import React, { useState, useEffect } from 'react';
import { Folder, FileText, Check, Loader2, RefreshCw, ChevronRight, AlertCircle, HardDrive } from 'lucide-react';

const DrivePicker = ({ onSyncComplete, sessionId }) => {
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', name: 'My Drive' }]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [syncStatus, setSyncStatus] = useState(null); // 'idle', 'syncing', 'success', 'error'
    const [syncMessage, setSyncMessage] = useState('');

    useEffect(() => {
        fetchFiles(currentFolderId);
        setSelectedItems([]);
    }, [currentFolderId]);

    const fetchFiles = async (folderId) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`http://localhost:5678/api/drive/list?folder_id=${folderId}`, {
                headers: {
                    'x-session-id': sessionId || ''
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to fetch files');
            setFiles(data.files);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = (folder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
    };

    const handleBreadcrumbClick = (index) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
    };

    const toggleSelection = (file) => {
        setSelectedItems(prev => {
            const exists = prev.find(item => item.id === file.id);
            if (exists) {
                return prev.filter(item => item.id !== file.id);
            } else {
                return [...prev, { id: file.id, name: file.name, mimeType: file.mimeType }];
            }
        });
    };

    const handleSync = async () => {
        if (selectedItems.length === 0) {
            setError('Please select at least one file or folder.');
            return;
        }

        setSyncing(true);
        setSyncStatus('syncing');
        setSyncMessage('Initializing sync...');
        setError('');

        try {
            const response = await fetch('http://localhost:5678/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',

                    'x-session-id': sessionId || '',
                },
                body: JSON.stringify({ items: selectedItems }),
            });

            if (response.status === 401) {
                window.location.reload();
                return;
            }

            if (!response.ok) {
                throw new Error('Sync request failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);

                        // Update status message based on the log
                        if (data.status === 'progress' || data.status === 'info') {
                            setSyncMessage(data.detail || data.message);
                        }

                        if (data.status === 'complete') {
                            setSyncStatus('success');
                            setSyncMessage('Sync complete!');
                            onSyncComplete();
                        } else if (data.status === 'error') {
                            setSyncStatus('error');
                            setError(data.message);
                        }
                    } catch (e) {
                        console.error("Error parsing JSON stream", e);
                    }
                }
            }

        } catch (err) {
            setSyncStatus('error');
            setError(err.message);
        } finally {
            setSyncing(false);
            // Reset status after a delay if successful
            if (syncStatus !== 'error') {
                setTimeout(() => {
                    setSyncStatus(null);
                    setSyncMessage('');
                }, 3000);
            }
        }
    };

    return (
        <div className="h-full flex flex-col bg-transparent">
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Folder size={16} /> Files
                </h2>
                {selectedItems.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-primary-light dark:bg-primary/20 text-primary dark:text-primary-light rounded-full animate-fade-in flex items-center gap-1">
                        <Check size={10} /> {selectedItems.length}
                    </span>
                )}
            </div>

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 mb-4 text-xs text-gray-500 overflow-x-auto pb-2 scrollbar-hide">
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                        {index > 0 && <ChevronRight size={12} className="text-gray-300" />}
                        <button
                            onClick={() => handleBreadcrumbClick(index)}
                            className={`whitespace-nowrap transition-colors px-2 py-1 rounded-md flex items-center gap-1 ${index === breadcrumbs.length - 1
                                ? 'font-semibold text-primary bg-primary-light dark:bg-primary/10'
                                : 'hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800'
                                }`}
                        >
                            {index === 0 && <HardDrive size={12} />}
                            {crumb.name}
                        </button>
                    </React.Fragment>
                ))}
            </nav>

            {/* File List */}
            <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-1 min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-full text-gray-400 gap-3">
                        <Loader2 size={24} className="animate-spin text-primary" />
                        <span className="text-xs font-medium">Loading files...</span>
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full text-gray-400 text-sm gap-2">
                        <Folder size={32} className="opacity-20" />
                        <p>No files found in this folder</p>
                    </div>
                ) : (
                    <ul className="space-y-1.5">
                        {files.map((file) => {
                            const isSelected = selectedItems.some(item => item.id === file.id);
                            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

                            return (
                                <li
                                    key={file.id}
                                    className={`group p-2 rounded-lg flex items-center justify-between cursor-pointer transition-all border ${isSelected
                                        ? 'bg-primary-light dark:bg-primary/20 border-primary/20 dark:border-primary/30'
                                        : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    onClick={() => toggleSelection(file)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${isSelected
                                            ? 'text-primary'
                                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                            }`}>
                                            {isSelected ? (
                                                <Check size={16} />
                                            ) : isFolder ? (
                                                <Folder size={16} />
                                            ) : (
                                                <FileText size={16} />
                                            )}
                                        </div>

                                        <span className={`truncate text-sm ${isSelected ? 'text-primary font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {file.name}
                                        </span>
                                    </div>

                                    {isFolder && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFolderClick(file);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-all text-xs font-medium text-primary hover:text-primary-hover bg-primary-light hover:bg-primary/20 px-3 py-1.5 rounded-lg ml-2"
                                        >
                                            Open
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Sync Status / Actions */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                {syncStatus === 'syncing' ? (
                    <div className="bg-gray-50 dark:bg-dark-surface rounded-xl p-4 border border-gray-200 dark:border-dark-border animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                                <RefreshCw size={12} className="animate-spin" /> Syncing...
                            </span>
                        </div>

                        {/* Stepper UI */}
                        <div className="space-y-3 pl-2">
                            {[
                                "Downloading data",
                                "Sending file to File Search",
                                "Indexing and chunking",
                                "Providing context to the LLM"
                            ].map((step, idx) => {
                                // Determine active step based on syncMessage
                                let isActive = false;
                                let isCompleted = false;

                                // Simple logic to map backend messages to steps
                                if (syncMessage.includes("Downloading")) {
                                    if (idx === 0) isActive = true;
                                } else if (syncMessage.includes("Sending")) {
                                    if (idx === 0) isCompleted = true;
                                    if (idx === 1) isActive = true;
                                } else if (syncMessage.includes("Indexing")) {
                                    if (idx <= 1) isCompleted = true;
                                    if (idx === 2) isActive = true;
                                } else if (syncMessage.includes("Providing context")) {
                                    if (idx <= 2) isCompleted = true;
                                    if (idx === 3) isActive = true;
                                } else if (syncMessage.includes("complete")) {
                                    isCompleted = true;
                                }

                                return (
                                    <div key={idx} className="flex items-center gap-3 relative">
                                        {/* Line connector */}
                                        {idx < 3 && (
                                            <div className={`absolute left-[5px] top-5 w-0.5 h-4 ${isCompleted ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                        )}

                                        {/* Dot / Indicator */}
                                        <div className={`w-3 h-3 rounded-full z-10 transition-all duration-300 ${isCompleted ? 'bg-primary' :
                                            isActive ? 'bg-primary ring-4 ring-primary-light dark:ring-primary/20 animate-bounce' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}></div>

                                        <span className={`text-xs transition-colors duration-300 ${isActive || isCompleted ? 'text-primary font-medium' : 'text-gray-400 dark:text-gray-600'
                                            }`}>
                                            {step}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="text-[10px] text-primary mt-4 truncate font-mono bg-primary-light dark:bg-primary/10 p-1.5 rounded">
                            {syncMessage}
                        </p>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={handleSync}
                            disabled={syncing || loading || selectedItems.length === 0}
                            className="w-full btn-primary py-3 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 dark:shadow-none flex items-center justify-center gap-2"
                        >
                            {syncStatus === 'success' ? (
                                <><Check size={18} /> Sync Complete</>
                            ) : (
                                <><RefreshCw size={18} /> Sync Selected {selectedItems.length > 0 && `(${selectedItems.length})`}</>
                            )}
                        </button>
                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-xs mt-3 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DrivePicker;
