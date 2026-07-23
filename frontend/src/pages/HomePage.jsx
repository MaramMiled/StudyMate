import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Avatar from '../components/Avatar.jsx';
import SessionCard from '../components/SessionCard.jsx';
import { GoogleLogin } from '@react-oauth/google';

export default function HomePage({
  isLoggedIn,
  user,
  sessions,
  onLogin,
  onLogout,
  onAddSession
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filtered = sessions.filter(s =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

const createSession = async () => {
  console.log("CREATE SESSION CLICKED");

  if (!isLoggedIn) return onLogin();

  const res = await fetch('http://localhost:5000/sessions', {
    method: 'POST',
    headers: {
    "Content-Type": "application/json",
  },
    body: JSON.stringify({
      title: 'Untitled notebook',
      user_id: user?.id,   
      files: [],
    }),
  });

  const newSession = await res.json();

  navigate(`/session/${newSession.id}`);
};

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>

      {/* TOP NAV */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 32px',
      }}>
        <Logo />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isLoggedIn ? (
            <GoogleLogin
              theme="filled_black"
              size="large"
              shape="pill"
              text="signin_with"
              onSuccess={(credentialResponse) => {
                onLogin(credentialResponse);
              }}
              onError={() => {
                console.log('Login Failed');
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{user?.name}</span>
              <Avatar user={user} size={34} onClick={onLogout} />
            </div>
          )}
        </div>
      </nav>

      {/* MAIN */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 32px 60px' }}>

        {/* HERO */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 600 }}>
            {isLoggedIn
              ? `Welcome back, ${user?.name?.split(' ')[0]}`
              : 'Your study workspace'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Upload course materials and get AI study tools.
          </p>
        </div>

        {/* ACTION ROW */}
        <div style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 32,
          flexWrap: 'wrap',
        }}>

          {/* ADD SESSION BUTTON (NO MODAL) */}
          <button
            onClick={createSession}
            style={{
              padding: '18px 24px',
              background: 'var(--accent-purple)',
              color: '#1B1C1F',
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + Add new session
          </button>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search sessions"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              maxWidth: 320,
              padding: '14px 16px',
              borderRadius: 99,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
            }}
          />
        </div>

        {/* TITLE */}
        <h2 style={{ marginBottom: 16 }}>
          {searchQuery ? `Results for "${searchQuery}"` : 'Recent sessions'}
        </h2>

        {/* EMPTY STATE */}
        {filtered.length === 0 ? (
          <div style={{
            border: '1px dashed var(--border)',
            borderRadius: 12,
            padding: 56,
            textAlign: 'center',
          }}>

            <h3>
              {searchQuery ? 'No sessions found' : 'No sessions yet'}
            </h3>

            <p style={{ color: 'var(--text-secondary)' }}>
              {searchQuery
                ? 'Try another search'
                : 'Create your first session to start studying'}
            </p>

            {!searchQuery && (
              <button
                onClick={createSession}
                style={{
                  marginTop: 16,
                  padding: '10px 22px',
                  background: 'var(--accent-purple)',
                  borderRadius: 99,
                  fontWeight: 600,
                }}
              >
                Create first session
              </button>
            )}
          </div>
        ) : (
          /* GRID */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
          }}>
            {filtered.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}