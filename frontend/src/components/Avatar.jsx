import React from 'react';

const palette = ['#A78BFA', '#67E8F9', '#4ADE80', '#FBBF24', '#F87171', '#F472B6'];

export default function Avatar({ user, size = 36, onClick }) {
  const color = palette[(user?.name?.charCodeAt(0) || 0) % palette.length];
  const initials = user?.initials || user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';

  return (
    <div
      onClick={onClick}
      title={user?.name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        color: '#1B1C1F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        userSelect: 'none',
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  );
}