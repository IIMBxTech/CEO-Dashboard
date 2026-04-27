'use client';
import React, { useState, useRef, useEffect } from 'react';

type Message = { role: 'ai' | 'user'; text: string };

const WELCOME: Message = {
  role: 'ai',
  text: 'Hello Executive. I have visibility into all 6 active programmes. Ask me anything — completion rates, blockers, or strategic recommendations.',
};

export default function ChatPanel() {
  const [isOpen,   setIsOpen]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res  = await fetch('/api/gemini', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mode: 'chat', message: text }),
      });
      const json = await res.json();
      const reply = json.reply || 'I could not generate a response. Please try again.';
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Connection error. Please check your network and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <>
      {/* Toggle button */}
      <button
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="AI Advisor"
        aria-label="Open AI chat"
      >
        {isOpen ? '×' : '✧'}
      </button>

      {/* Panel */}
      <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: 'var(--green)', boxShadow: '0 0 8px var(--green)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <h3 style={{ margin: 0 }}>AI Advisor</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
            aria-label="Close"
          >×</button>
        </div>

        {/* Messages */}
        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <strong>{msg.role === 'ai' ? 'Gemini AI' : 'You'}</strong>
              {msg.text}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="chat-message ai" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong>Gemini AI</strong>
              <span style={{ display: 'flex', gap: '4px' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: 'var(--green)',
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask about any programme…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button
            className="chat-send"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            {loading ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </>
  );
}
