import React, { useState } from 'react';

const quizTypes = [
  { id: 'mcq', label: 'Multiple Choice'},
  { id: 'truefalse', label: 'True / False'},
  { id: 'open', label: 'Open Questions'},
  { id: 'flashcards', label: 'Flashcards'},
  { id: 'fill', label: 'Fill in the Blanks'},
];

const difficulties = ['Easy', 'Medium', 'Hard'];
const difficultyColors = ['var(--accent-green)', 'var(--accent-amber)', 'var(--accent-red)'];

export default function QuizSection({ hasFiles }) {
  const [selectedType, setSelectedType] = useState(null);
  const [difficulty, setDifficulty] = useState(1);
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    if (!selectedType || !hasFiles) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setGenerated(true); }, 1700);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {quizTypes.map(type => (
          <button
            key={type.id}
            onClick={() => { setSelectedType(type.id); setGenerated(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${selectedType === type.id ? 'var(--accent-purple)' : 'var(--border)'}`,
              background: selectedType === type.id ? 'rgba(167,139,250,0.08)' : 'var(--bg-card)',
              transition: 'all 0.12s',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 15 }}></span>
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: selectedType === type.id ? 'var(--accent-purple)' : 'var(--text-primary)',
            }}>
              {type.label}
            </span>
          </button>
        ))}
      </div>


      {/* Number of questions */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>Questions</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[5, 10, 15, 20].map(n => (
              <button
                key={n}
                onClick={() => setNumQuestions(n)}
                style={{
                  width: 30, height: 24,
                  fontSize: 11.5,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: `1px solid ${numQuestions === n ? 'var(--accent-purple)' : 'var(--border)'}`,
                  background: numQuestions === n ? 'rgba(167,139,250,0.08)' : 'transparent',
                  color: numQuestions === n ? 'var(--accent-purple)' : 'var(--text-tertiary)',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!selectedType || !hasFiles || loading}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 99,
          background: selectedType && hasFiles && !loading ? 'var(--accent-purple)' : 'var(--bg-elevated)',
          color: selectedType && hasFiles && !loading ? '#1B1C1F' : 'var(--text-tertiary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: selectedType && hasFiles && !loading ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        {loading ? (
          <>
            <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1B1C1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Building quiz…
          </>
        ) : 'Generate quiz'}
      </button>

      {!hasFiles && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
          Add sources to generate quizzes
        </p>
      )}

      {generated && !loading && (
        <div style={{
          marginTop: 12,
          padding: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          animation: 'slideUp 0.18s ease',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-green)', marginBottom: 6 }}>
            ✓ {numQuestions} {quizTypes.find(t => t.id === selectedType)?.label} questions ready
          </div>
          <span>Difficulty: {difficulties[difficulty]}</span>
          <div style={{ marginTop: 10 }}>
            <button style={{
              padding: '6px 16px', fontSize: 12, fontWeight: 600,
              background: 'var(--accent-green)', color: '#0F1A0F',
              borderRadius: 99,
            }}>
              Start quiz →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}