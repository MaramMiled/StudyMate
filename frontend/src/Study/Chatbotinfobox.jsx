import React from 'react';

export default function ChatbotInfoBox() {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 26, height: 26,
          borderRadius: 7,
          background: 'var(--accent-purple-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: 'var(--accent-purple)',
        }}>
          C
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Chatbot mode</div>
      </div>

      <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 12 }}>
        Your AI assistant operates exclusively on the documents you upload no internet access, ensuring private and focused study sessions.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[
          {text: 'Private & document-scoped only' },
          {text: 'Reads PDFs, DOCX, PPT & images' },
          {text: 'Cites exact sections from your files' },
        ].map(item => (
          <div key={item.text} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: 'var(--text-tertiary)',
          }}>
            <span style={{ fontSize: 13 }}></span>
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}