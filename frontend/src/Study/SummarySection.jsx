import React, { useState } from 'react';

const summaryTypes = [
  { id: 'short', label: 'Short Summary' },
  { id: 'detailed', label: 'Detailed Summary' },
  { id: 'keypoints', label: 'Key Points' },
  { id: 'definitions', label: 'Definitions' },
];

export default function SummarySection({ hasFiles, documentId }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState(null);

  const handleGenerate = async () => {
      console.log("SUMMARY DATA:", {
    selected,
    hasFiles,
    documentId
  });
  
    if (!selected || !hasFiles || !documentId) return;

    setLoading(true);
    setSummary(null);

    try {
      const res = await fetch(
        `http://localhost:5000/documents/${documentId}/summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: selected,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSummary(data);

    } catch (err) {
      console.error("SUMMARY ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {summaryTypes.map(type => (
          <button
            key={type.id}
            onClick={() => {
              setSelected(type.id);
              setSummary(null);
            }}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${selected === type.id ? 'var(--accent-purple)' : 'var(--border)'}`,
              background: selected === type.id ? 'rgba(167,139,250,0.08)' : 'var(--bg-card)',
              textAlign: 'left',
              transition: 'all 0.12s',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 5 }}></div>
            <div style={{ fontSize: 12, fontWeight: 500, color: selected === type.id ? 'var(--accent-purple)' : 'var(--text-primary)', lineHeight: 1.3 }}>
              {type.label}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={!selected || !hasFiles || loading}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 99,
          background: selected && hasFiles && !loading ? 'var(--accent-purple)' : 'var(--bg-elevated)',
          color: selected && hasFiles && !loading ? '#1B1C1F' : 'var(--text-tertiary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: selected && hasFiles && !loading ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        {loading ? (
          <>
            <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1B1C1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Generating…
          </>
        ) : 'Generate summary'}
      </button>

      {!hasFiles && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
          Add sources to enable summaries
        </p>
      )}

      {summary && !loading && (
        <div style={{
          marginTop: 12,
          padding: '12px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          whiteSpace: "pre-line",
        }}>
          <div style={{
            fontWeight: 600,
            color: 'var(--accent-purple)',
            marginBottom: 8,
            fontSize: 12
          }}>
            ✓ {summaryTypes.find(s => s.id === selected)?.label}
          </div>

          {summary.content}
        </div>
      )}
    </div>
  );
}