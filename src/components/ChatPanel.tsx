'use client';
import React, { useState } from 'react';

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="chat-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        ✧
      </button>

      <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
            <h3 style={{ margin: 0 }}>AI Advisor</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        
        <div className="chat-body">
            <div className="chat-message ai">
                <strong style={{ display: 'block', color: 'var(--success)', marginBottom: '0.2rem' }}>Gemini Pro:</strong> Hello Executive. Based on the cPanel sync, 2 courses require immediate attention. How would you like me to process the data?
            </div>
            <div className="chat-message user">
                <strong style={{ display: 'block', color: 'var(--accent-color)', marginBottom: '0.2rem' }}>You:</strong> What's blocking the Analytics Bootcamp?
            </div>
            <div className="chat-message ai">
                <strong style={{ display: 'block', color: 'var(--success)', marginBottom: '0.2rem' }}>Gemini Pro:</strong> Running natural language SQL query on `Course_Stages`... The sub-stage CP1 is marked at 80% progress but past its assigned Due Date of Oct 15th.
            </div>
        </div>

        <div className="chat-input-container">
            <input type="text" className="chat-input" placeholder="Query course metrics..." />
            <button className="chat-send">Send</button>
        </div>
      </div>
    </>
  );
}
