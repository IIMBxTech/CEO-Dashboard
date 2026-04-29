'use client';
import React, { useState, useEffect } from 'react';

export type FilterState = {
  course: string;
  stage: string;
  threshold: number; // 0-100
  program?: string;
};

type FilterBarProps = {
  filter: FilterState;
  onChange: (f: FilterState) => void;
};

export default function FilterBar({ filter, onChange }: FilterBarProps) {
  const [courses, setCourses] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  
  useEffect(() => {
    fetch('/api/sheets/discover')
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          setCourses(j.data.courses || []);
          setStages(j.data.stages || []);
        }
      })
      .catch(e => console.error('Failed to discover sheet metadata:', e));
  }, []);

  return (
    <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', padding: '0.85rem 1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Programme:</label>
        <select 
          className="filter-select"
          value={filter.course}
          onChange={e => onChange({ ...filter, course: e.target.value })}
          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '6px', outline: 'none' }}
        >
          <option value="All">All Programmes</option>
          {courses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Stage:</label>
        <select 
          className="filter-select"
          value={filter.stage}
          onChange={e => onChange({ ...filter, stage: e.target.value })}
          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '6px', outline: 'none' }}
        >
          <option value="All">All Stages</option>
          {stages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Min Completion ({filter.threshold}%):</label>
        <input 
          type="range" 
          min="0" max="100" 
          value={filter.threshold}
          onChange={e => onChange({ ...filter, threshold: parseInt(e.target.value) })}
          style={{ width: '100px', cursor: 'pointer' }}
        />
      </div>

      <div style={{ marginLeft: 'auto' }}>
        <button 
          className="filter-reset-btn"
          onClick={() => onChange({ course: 'All', stage: 'All', threshold: 0 })}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '0.4rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
