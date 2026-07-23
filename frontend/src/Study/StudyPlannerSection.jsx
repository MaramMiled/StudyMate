import React, { useState } from 'react';

export default function StudyPlannerSection() {
  const [examDate, setExamDate] = useState('');
  const [dailyTime, setDailyTime] = useState(2);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const daysUntil = examDate
    ? Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const handleGenerate = async () => {
    if (!examDate || daysUntil <= 0) return;

    setLoading(true);
    setPlan(null);

    try {
      const res = await fetch(
        "http://localhost:5000/planner",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exam_date: examDate,
            daily_hours: dailyTime,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      console.log("PLAN DATA:", data);

      setPlan(data);

    } catch (err) {
      console.error("PLANNER ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

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

      {plan && !loading && (
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
          {plan.sessions.map((session, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderBottom: '1px solid var(--border-light)'
              }}
            >

              <div>
                <div style={{
                  fontSize: 12.5,
                  color: 'var(--text-primary)'
                }}>
                  Study session
                </div>

                <div style={{
                  fontSize: 11.5,
                  color: 'var(--text-tertiary)'
                }}>
                  {session.start_time}
                </div>
              </div>


              <div style={{
                fontSize: 12,
                color: 'var(--text-tertiary)'
              }}>
                {session.duration} min
              </div>


            </div>
          ))}
        </div>
      )}
    </div>
  );
}