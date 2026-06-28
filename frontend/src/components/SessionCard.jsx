import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SessionCard({ session }) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onClick={() => navigate(`/session/${session.id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setMenuOpen(false); }}
      style={{
        background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        minHeight: 140,
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 500,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {session.name}
        </div>

        {/* Menu button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={e => {
              e.stopPropagation();
              setMenuOpen(o => !o);
            }}
            style={{
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              color: 'var(--text-tertiary)',
              background: menuOpen ? 'var(--bg-elevated)' : 'transparent',
              transition: 'background 0.12s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="3" r="1.3" fill="currentColor" />
              <circle cx="8" cy="8" r="1.3" fill="currentColor" />
              <circle cx="8" cy="13" r="1.3" fill="currentColor" />
            </svg>
          </button>

          {menuOpen && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 30,
                right: 0,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: 4,
                zIndex: 5,
                minWidth: 120,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              {['Rename', 'Duplicate', 'Delete'].map(action => (
                <div
                  key={action}
                  style={{
                    padding: '7px 10px',
                    fontSize: 12.5,
                    borderRadius: 5,
                    color:
                      action === 'Delete'
                        ? 'var(--accent-red)'
                        : 'var(--text-secondary)',
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  {action}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
        {session.lastUpdated} · {session.fileCount} source{session.fileCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}