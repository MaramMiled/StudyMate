import React, { useState, useRef } from 'react';

const fileTypeConfig = {
  pdf: {label: 'PDF' },
  docx: {label: 'DOCX' },
  doc: {label: 'DOC' },
  pptx: {label: 'PPT' },
  ppt: {label: 'PPT' },
  jpg: {label: 'IMG' },
  jpeg: {label: 'IMG' },
  png: {label: 'IMG' },
};

function getFileConfig(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  return fileTypeConfig[ext] || {color: '#A78BFA', label: ext?.toUpperCase() || 'FILE' };
}

function FileItem({ file, onRemove }) {
  const config = getFileConfig(file.name);
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      borderRadius: 'var(--radius-sm)',
      transition: 'background 0.12s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 15, flexShrink: 0 }}></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, color: 'var(--text-primary)', fontWeight: 400,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {file.name}
        </div>
        {file.size && (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {config.label} · {file.size}
          </div>
        )}
      </div>
      <button
        onClick={() => onRemove(file.name)}
        style={{
          width: 20, height: 20,
          borderRadius: '50%',
          color: 'var(--text-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, flexShrink: 0,
          transition: 'background 0.12s, color 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--accent-red)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
      >
        ✕
      </button>
    </div>
  );
}

export default function FileUploadPanel({ files, onFilesChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef();

  const addFiles = async (newFiles) => {
  const items = Array.from(newFiles).map(f => ({
  id: crypto.randomUUID(),
  name: f.name,
  size: f.size > 1024 * 1024
    ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
    : `${(f.size / 1024).toFixed(0)} KB`,
  file: f  
}));

  onFilesChange(prev => {
    return [...prev, ...items];
  });
};

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
  if (e.target.files?.length) addFiles(e.target.files);
};

  const removeFile = (name) => {
    onFilesChange(prev => prev.filter(f => f.name !== name));
  };

  const quickUpload = (accept) => {
  if (!fileInputRef.current) return;
  fileInputRef.current.accept = accept;
  fileInputRef.current.click();
};

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!fileInputRef.current) return;
          fileInputRef.current.accept = '*/*';
          fileInputRef.current.click();
        }}
        style={{
          border: `1.5px dashed ${isDragging ? 'var(--accent-purple)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '18px 14px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? 'rgba(167,139,250,0.06)' : 'transparent',
          transition: 'all 0.15s',
          marginBottom: 10,
          marginTop: 10,
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 6 }}></div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 2 }}>
          {isDragging ? 'Drop files here' : 'Drag & drop files'}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>PDF, DOCX, PPT, images</div>
      </div>

      {/* Quick upload buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'PDF', accept: '.pdf' },
          { label: 'DOCX', accept: '.docx,.doc' },
          { label: 'PPT', accept: '.pptx,.ppt' },
          { label: 'Image', accept: 'image/*' },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={() => quickUpload(btn.accept)}
            style={{
              padding: '5px 11px',
              fontSize: 11.5,
              fontWeight: 500,
              border: '1px solid var(--border)',
              borderRadius: 99,
              color: 'var(--text-secondary)',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; e.currentTarget.style.color = 'var(--accent-purple)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {/* Select all row */}
      {files.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px',
          fontSize: 12, color: 'var(--text-tertiary)',
          marginBottom: 4,
        }}>
          <span>Sources</span>
          <span>{files.length} selected</span>
        </div>
      )}

      {/* File list */}
      {files.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {files.map(file => (
            <FileItem key={file.id || file.name} file={file} onRemove={removeFile} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '16px 8px',
          fontSize: 12.5,
          color: 'var(--text-tertiary)',
        }}>
          Saved sources will appear here
        </div>
      )}
    </div>
  );
}