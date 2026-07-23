import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Avatar from '../components/Avatar.jsx';
import FileUploadPanel from '../sessionComponents/FileUploadPanel.jsx';
import ChatPanel from '../sessionComponents/ChatPanel.jsx';
import SummarySection from '../Study/SummarySection.jsx';
import QuizSection from '../Study/QuizSection.jsx';
import StudyPlannerSection from '../Study/StudyPlannerSection.jsx';
import ChatbotInfoBox from '../Study/ChatbotInfoBox.jsx';
import { mockUser } from '../data/mockData.js';

function StudioBlock({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      background: 'var(--bg-panel)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '13px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: open ? '1px solid var(--border-light)' : 'none',
        }}
      >
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>{icon}</span>
          {title}
        </span>

        <span style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: '0.2s',
        }}>
          ▼
        </span>
      </button>

      {open && (
        <div style={{ padding: '14px 16px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function SessionPage({
  isLoggedIn,
  user: propUser,
  sessions,
  onLogin,
  onAddSession
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);

useEffect(() => {
  const loadSession = async () => {
    try {
      setLoading(true);

      const res = await fetch(`http://localhost:5000/sessions/${id}`);
      const data = await res.json();

      setSession(data);
    } catch (err) {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  loadSession();
}, [id]);

useEffect(() => {
  if (!session) return;
  console.log("FILES FROM BACKEND:", session.files);

  setSessionTitle(session.title || 'Unnamed session');
  setTitleInput(session.title || 'Unnamed session');

console.log(session.files);
  setFiles(
  (session.files || []).map(f => ({
    id: f.id,
    name: f.title,
    size: null,
    content: f.content,
    uploaded: true,
  }))
);
}, [session]);

  console.log("URL id:", id);
  console.log("sessions:", sessions);

  const user = propUser || (isLoggedIn ? mockUser : null);

  const [sessionTitle, setSessionTitle] = useState(session?.title || 'Unnamed session');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(sessionTitle);
  const [uploaded, setUploaded] = useState(false);

const [files, setFiles] = useState(() => {
  return Array.isArray(session?.files) ? session.files : [];
});

useEffect(() => {
  if (!id) return;

  const uploadFiles = async () => {
  const pendingFiles = files.filter(f => f.file && !f.uploaded);

  if (pendingFiles.length === 0) return;

  for (const f of pendingFiles) {
    const formData = new FormData();
    formData.append("file", f.file);

    const res = await fetch(`http://localhost:5000/sessions/${id}/files`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("UPLOAD RESPONSE:", data);

    setFiles(prev =>
      prev.map(file =>
        file.id === f.id ? { ...file, uploaded: true } : file
      )
    );
  }
};

  uploadFiles();
}, [files, id]);


  const handleTitleSave = async () => {
  const newTitle = titleInput.trim() || "Unnamed session";

  setSessionTitle(newTitle);
  setEditingTitle(false);

  try {
    await fetch(`http://localhost:5000/sessions/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newTitle,
      }),
    });

  } catch (err) {
    console.error("TITLE UPDATE ERROR:", err);
  }
};

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
  };

  const handleNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
    };

    onAddSession(newSession);
    navigate(`/session/${newSession.id}`);
  };

  const hasFiles = files.length > 0;

  const [loading, setLoading] = useState(true);


if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
if (!session) return <div style={{ padding: 40 }}>Session not found</div>;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-app)',
      overflow: 'hidden'
    }}>

      {/* TOP BAR */}
      <header style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        borderBottom: '1px solid var(--border)',
        gap: 14,
      }}>
        <Link to="/">
          <Logo size="sm" />
        </Link>

        <div style={{ flex: 1, textAlign: 'center' }}>
          {editingTitle ? (
            <input
              autoFocus
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') setEditingTitle(false);
              }}
              style={{
                fontSize: 14,
                padding: 6,
                borderRadius: 6,
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}
            />
          ) : (
            <button onClick={() => setEditingTitle(true)}>
              {sessionTitle}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleShare}>Share</button>

          <button onClick={handleNewSession}>
            New session
          </button>

          {user ? (
            <Avatar user={user} size={32} />
          ) : (
            <button onClick={onLogin}>Login</button>
          )}
        </div>
      </header>

      {/* BODY */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '340px 1fr 380px',
        overflow: 'hidden'
      }}>

        {/* LEFT */}
        <div style={{ padding: 16, overflowY: 'auto' }}>
          <h4>Sources</h4>
          <FileUploadPanel files={files} onFilesChange={setFiles} />
        </div>

        {/* CENTER */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px',
          minHeight: 0,
          overflow: 'hidden',
          background: 'var(--bg-app)',
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}>
            Discussion
          </div>

          <ChatPanel hasFiles={hasFiles} id={id} />
        </div>

        {/* RIGHT */}
        <div style={{ padding: 16, overflowY: 'auto' }}>
          <h4>Studio</h4>

          <StudioBlock title="Summary">
            <SummarySection hasFiles={hasFiles} documentId={files[0]?.id}/>
          </StudioBlock>

          <StudioBlock title="Quiz">
            <QuizSection 
              hasFiles={hasFiles}
              documentId={files[0]?.id}
            />
          </StudioBlock>

          <StudioBlock title="Planner">
            <StudyPlannerSection />
          </StudioBlock>

          <ChatbotInfoBox />
        </div>
      </div>
    </div>
  );
}