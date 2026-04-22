'use client';
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function Hub({ onSegmentClick }: { onSegmentClick?: (name: string) => void }) {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(json => setData(json.data || []))
      .catch(err => console.error('Failed to fetch Hub data', err));
  }, []);

  return (
    <div className="glass-panel" style={{ height: '100%', minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Overall % Completion</h2>

      {/* Pie Chart */}
      <div style={{ width: '100%', height: '200px' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              onClick={(_, index) => {
                const name = data[index]?.name;
                if (name) { setActive(name); onSegmentClick?.(name); }
              }}
              style={{ cursor: 'pointer', outline: 'none' }}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={active && active !== entry.name ? 0.4 : 1}
                  stroke={active === entry.name ? '#fff' : 'transparent'}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(val: number) => [`${val}%`, 'Completion']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ── Inline Legend ── */}
      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.map((entry) => (
          <div
            key={entry.name}
            onClick={() => { setActive(entry.name); onSegmentClick?.(entry.name); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: '0.35rem 0.6rem',
              borderRadius: '8px',
              background: active === entry.name ? 'rgba(255,255,255,0.07)' : 'transparent',
              transition: 'background 0.2s ease',
            }}
          >
            {/* Colour dot + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: entry.color, flexShrink: 0,
                boxShadow: `0 0 6px ${entry.color}88`
              }} />
              <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 500 }}>{entry.name}</span>
            </div>

            {/* Completion pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Mini progress bar */}
              <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${entry.value}%`, height: '100%', background: entry.color, borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: entry.color, minWidth: '36px', textAlign: 'right' }}>
                {entry.value}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
