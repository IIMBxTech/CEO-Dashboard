'use client';
import React, { useState, useEffect } from 'react';

export default function Kanban() {
  const [kanbanData, setKanbanData] = useState({ needsAttention: [], onTrack: [], opportunities: [] });

  useEffect(() => {
    // Live execution fetching structured JSON from Gemini Endpoint
    fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryResult: "TRIGGER_LIVE_ANALYSIS" })
    })
      .then(res => res.json())
      .then(json => {
         if (json.success && json.insights) {
             setKanbanData({
                needsAttention: json.insights.needsAttention || [],
                onTrack: json.insights.onTrack || [],
                opportunities: json.insights.opportunities || []
             });
         }
      })
      .catch(err => console.error("Failed to fetch Kanban AI Insights:", err));
  }, []);

  return (
    <div className="glass-panel" style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>AI Insights Board</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Auto-categorized Live via Gemini 2.0 Flash.</p>
      
      <div className="kanban-grid">
        <div className="kanban-column">
            <div className="kanban-column-header">
                <span style={{color: 'var(--danger)'}}>●</span> Needs Attention
            </div>
            {kanbanData.needsAttention.map((card: any, idx: number) => (
                <div key={idx} className="kanban-card">
                    <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}>{card.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{card.desc}</p>
                </div>
            ))}
        </div>

        <div className="kanban-column">
            <div className="kanban-column-header">
                <span style={{color: 'var(--accent-color)'}}>●</span> On Track
            </div>
             {kanbanData.onTrack.map((card: any, idx: number) => (
                <div key={idx} className="kanban-card">
                    <h4 style={{ color: '#fff', fontSize: '1rem',  marginBottom: '0.5rem' }}>{card.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{card.desc}</p>
                </div>
            ))}
        </div>

        <div className="kanban-column">
            <div className="kanban-column-header">
                <span style={{color: 'var(--success)'}}>●</span> Strategic Opportunities
            </div>
             {kanbanData.opportunities.map((card: any, idx: number) => (
                <div key={idx} className="kanban-card">
                    <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}>{card.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{card.desc}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
