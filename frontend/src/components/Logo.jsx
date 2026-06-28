import React from 'react';

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: {text: 18 },
    md: {text: 22 },
    lg: {text: 26 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        fontSize: s.text,
        fontWeight: 1000,
        color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
      }}>
        StudyMate
      </span>
    </div>
  );
}