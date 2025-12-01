import React, { useState, useEffect, useRef } from 'react';

const DrivePicker = ({ onSyncComplete }) => {
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', name: 'My Drive' }]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [syncedFiles, setSyncedFiles] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [progressLogs, setProgressLogs] = useState([]);
    const logsEndRef = useRef(null);

    useEffect(() => {
        fetchFiles(currentFolderId);
        setSelectedItems([]);
    }, [currentFolderId]);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [progressLogs]);

    const fetchFiles = async (folderId) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`http://localhost:5678/api/drive/list?folder_id=${folderId}`);
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
        setError('');
        setSyncedFiles([]);
        setProgressLogs([]);

        try {
            const response = await fetch('http://localhost:5678/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items: selectedItems }),
            });

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
                        setProgressLogs(prev => [...prev, data]);

                        if (data.status === 'complete') {
                            setSyncedFiles(data.files || []);
                            onSyncComplete();
                        } else if (data.status === 'error') {
                            setError(data.message);
                        }
                    } catch (e) {
                        console.error("Error parsing JSON stream", e);
                    }
                }
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="minimal-card rounded-2xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Files</h2>
                {selectedItems.length > 0 && (
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                        {selectedItems.length} selected
                    </span>
                )}
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 overflow-x-auto pb-2 scrollbar-hide">
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                        {index > 0 && <span className="text-gray-300">/</span>}
                        <button
                            onClick={() => handleBreadcrumbClick(index)}
                            className={`whitespace-nowrap transition-colors ${index === breadcrumbs.length - 1
                                    ? 'font-medium text-gray-900'
                                    : 'hover:text-gray-700'
                                }`}
                        >
                            {crumb.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-1 min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-full text-gray-400 gap-3">
                        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-400 text-sm">No files found</div>
                ) : (
                    <ul className="space-y-1">
                        {files.map((file) => {
                            const isSelected = selectedItems.some(item => item.id === file.id);
                            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

                            return (
                                <li
                                    key={file.id}
                                    className={`group p-2 rounded-lg flex items-center justify-between cursor-pointer transition-all border ${isSelected
                                            ? 'bg-gray-50 border-gray-200'
                                            : 'bg-white border-transparent hover:bg-gray-50'
                                        }`}
                                    onClick={() => toggleSelection(file)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300 group-hover:border-gray-400'
                                            }`}>
                                            {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>

                                        <span className="text-lg opacity-80">
                                            {isFolder ? '📁' : '📄'}
                                        </span>

                                        <span className={`truncate text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                            {file.name}
                                        </span>
                                    </div>

                                    {isFolder && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFolderClick(file);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-gray-400 hover:text-gray-900 px-2 py-1"
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

            {/* Progress Log */}
            {(syncing || progressLogs.length > 0) && (
                <div className="mb-4 bg-gray-50 rounded-lg p-3 font-mono text-[10px] h-32 overflow-y-auto border border-gray-100">
                    {progressLogs.map((log, index) => (
                        <div key={index} className="mb-1.5 last:mb-0">
                            <div className="flex gap-2">
                                <span className={`font-bold shrink-0 ${log.status === 'error' ? 'text-red-500' :
                                        log.status === 'success' ? 'text-green-600' :
                                            log.status === 'complete' ? 'text-blue-600' : 'text-gray-500'
                                    }`}>
                                    {log.status.toUpperCase()}
                                </span>
                                <span className="text-gray-600">{log.message}</span>
                            </div>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100">
                <button
                    onClick={handleSync}
                    disabled={syncing || loading || selectedItems.length === 0}
                    className="w-full btn-primary py-2.5 rounded-xl font-medium text-sm disabled:opacity-50"
                >
                    {syncing ? 'Syncing...' : `Sync Selected`}
                </button>
                {error && (
                    <div className="text-red-500 text-xs mt-2 text-center">{error}</div>
                )}
            </div>
        </div>
    );
};

export default DrivePicker;
