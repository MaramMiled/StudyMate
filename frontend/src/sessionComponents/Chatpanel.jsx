import React, { useState, useRef, useEffect } from 'react';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 10,
      marginBottom: 18,
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: 28, height: 28,
        borderRadius: '50%',
        background: isUser ? 'var(--bg-elevated)' : 'var(--accent-purple-dim)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: isUser ? 'var(--text-secondary)' : 'var(--accent-purple)',
        fontWeight: 600,
        flexShrink: 0,
      }}>
        {isUser ? 'U' : 'C'}
      </div>

      <div style={{ maxWidth: '82%' }}>
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: isUser ? 'var(--bg-elevated)' : 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: 13.5,
          lineHeight: 1.6,
          border: '1px solid var(--border-light)',
          whiteSpace: 'pre-line',
        }}>
          {message.content}
        </div>

        <div style={{
          fontSize: 10.5,
          color: 'var(--text-tertiary)',
          marginTop: 4,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 18 }}>
      <div style={{
        width: 28, height: 28,
        borderRadius: '50%',
        background: 'var(--accent-purple-dim)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: 'var(--accent-purple)',
        fontWeight: 600,
      }}>
        C
      </div>

      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        display: 'flex',
        gap: 5,
        alignItems: 'center',
      }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--accent-purple)',
              animation: `bounce 1.2s ${delay}s infinite`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatPanel({ hasFiles, id }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
  console.log("ChatPanel MOUNTED");
  }, []);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:5000/sessions/${id}`)
      .then(res => res.json())
      .then(data => {
        setMessages(prev => {
          if (prev.length === 0) return data.messages || [];
          return prev;
        });
      })
      .catch(() => setMessages([]));
  }, [id]);

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

const sendMessage = async () => {
  const trimmed = input.trim();
  if (!trimmed || !id) return;

  setInput('');
  setIsTyping(true);

  try {
    const res = await fetch(`http://localhost:5000/sessions/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: trimmed }),
    });

    const data = await res.json();

    console.log("RESPONSE:", data);

    if (!data.userMessage || !data.aiMessage) {
      throw new Error("Invalid response from server");
    }

    setMessages(prev => [
      ...prev,
      data.userMessage,
      data.aiMessage,
    ]);

  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
  } finally {
    setIsTyping(false);
  }
};

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    'Explain the key concepts',
    'Create a summary',
    'Quiz me on this material',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: 4,
        minHeight: 0,
      }}>
        {messages.map(msg => (
          <MessageBubble key={msg.id + msg.role} message={msg} />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 3 && (
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap',
          padding: '10px 0',
          flexShrink: 0,
        }}>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setInput(s); textareaRef.current?.focus(); }}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 500,
                border: '1px solid var(--border)',
                borderRadius: 99,
                color: 'var(--text-secondary)',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; e.currentTarget.style.color = 'var(--accent-purple)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '10px 12px',
        flexShrink: 0,
        transition: 'border-color 0.15s',
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={e => e.currentTarget.parentElement.style.borderColor = 'var(--border-focus)'}
          onBlur={e => e.currentTarget.parentElement.style.borderColor = 'var(--border)'}
          placeholder={hasFiles ? "Ask a question about your sources…" : "Upload sources to start chatting…"}
          rows={1}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            fontSize: 13.5,
            color: 'var(--text-primary)',
            resize: 'none',
            lineHeight: 1.5,
            maxHeight: 100,
            overflow: 'auto',
          }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          style={{
            width: 32, height: 32,
            borderRadius: '50%',
            background: input.trim() && !isTyping ? 'var(--accent-purple)' : 'var(--bg-elevated)',
            color: input.trim() && !isTyping ? '#1B1C1F' : 'var(--text-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M3 10L17 10M17 10L11 4M17 10L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}