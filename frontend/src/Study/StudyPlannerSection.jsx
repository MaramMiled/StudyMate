import React, { useState } from 'react';

export default function StudyPlannerSection() {
  const [examDate, setExamDate] = useState('');
  const [dailyTime, setDailyTime] = useState(2);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const daysUntil = examDate
    ? Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const handleGenerate = () => {
    if (!examDate || daysUntil <= 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setGenerated(true); }, 1400);
  };

  const mockPlan = daysUntil > 0
    ? [
        { phase: 'Review', days: Math.floor(daysUntil * 0.4), color: 'var(--accent-purple)' },
        { phase: 'Practice', days: Math.floor(daysUntil * 0.35), color: 'var(--accent-cyan)' },
        { phase: 'Weak areas', days: Math.floor(daysUntil * 0.15), color: 'var(--accent-amber)' },
        { phase: 'Final revision', days: Math.max(1, Math.floor(daysUntil * 0.1)), color: 'var(--accent-green)' },
      ]
    : [];

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 7 }}>
            Exam date
          </label>
          <input
            type="date"
            min={today}
            value={examDate}
            onChange={e => { setExamDate(e.target.value); setGenerated(false); }}
            style={{
              width: '100%',
              padding: '9px 12px',
              fontSize: 13,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              background: 'var(--bg-input)',
              colorScheme: 'dark',
              cursor: 'pointer',
            }}
          />
          {daysUntil !== null && daysUntil > 0 && (
            <div style={{ fontSize: 12, color: 'var(--accent-purple)', marginTop: 6 }}>
              {daysUntil} days until exam
            </div>
          )}
          {daysUntil !== null && daysUntil <= 0 && (
            <div style={{ fontSize: 12, color: 'var(--accent-red)', marginTop: 6 }}>
              Choose a future date
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Daily study time
            </label>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-purple)' }}>
              {dailyTime}h / day
            </span>
          </div>
          <input
            type="range"
            min={0.5} max={8} step={0.5}
            value={dailyTime}
            onChange={e => { setDailyTime(+e.target.value); setGenerated(false); }}
            style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!examDate || daysUntil <= 0 || loading}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 99,
          background: examDate && daysUntil > 0 && !loading ? 'var(--accent-purple)' : 'var(--bg-elevated)',
          color: examDate && daysUntil > 0 && !loading ? '#1B1C1F' : 'var(--text-tertiary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: examDate && daysUntil > 0 && !loading ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginBottom: 12,
        }}
      >
        {loading ? (
          <>
            <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1B1C1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Building plan…
          </>
        ) : 'Generate study plan'}
      </button>

      {generated && !loading && mockPlan.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          animation: 'slideUp 0.18s ease',
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent-purple)' }}>
              {daysUntil}-day study plan
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {dailyTime}h/day · {Math.round(daysUntil * dailyTime)} total hours
            </div>
          </div>
          {mockPlan.map((phase, i) => (
            <div
              key={phase.phase}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderBottom: i < mockPlan.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: phase.color }} />
                <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>{phase.phase}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{phase.days}d</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}