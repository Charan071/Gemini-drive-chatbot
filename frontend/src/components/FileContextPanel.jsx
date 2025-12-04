import React from 'react';

const FileContextPanel = ({ files, onRemoveFile, onAddFiles, syncStatus }) => {
    return (
        <div className="w-80 bg-bg-secondary/50 border-l border-white/10 flex flex-col h-full backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Context
                </h2>
                <button
                    onClick={onAddFiles}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-accent transition-colors"
                    title="Add Files"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                </button>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary/50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-2 opacity-50">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                        <p className="text-xs">No files selected</p>
                    </div>
                ) : (
                    files.map((file) => (
                        <div
                            key={file.id}
                            className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                        >
                            <div className="text-lg flex-shrink-0 text-text-secondary">
                                {file.mimeType.includes('pdf') ? '📄' : file.mimeType.includes('folder') ? '📁' : '📝'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary truncate leading-tight" title={file.name}>
                                    {file.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {/* Minimal Status Indicators */}
                                    {syncStatus?.status === 'complete' ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Indexed"></div>
                                    ) : syncStatus?.status === 'info' || syncStatus?.status === 'processing' ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" title="Syncing"></div>
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-text-secondary/30" title="Ready"></div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => onRemoveFile(file)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 text-text-secondary hover:text-red-500 transition-all"
                                title="Remove file"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Sync Status Footer */}
            {syncStatus && syncStatus.status !== 'complete' && syncStatus.status !== 'error' && (
                <div className="p-3 border-t border-white/10 bg-bg-secondary/30 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-medium text-text-primary">Syncing...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileContextPanel;
