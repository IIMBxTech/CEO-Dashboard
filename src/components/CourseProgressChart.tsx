'use client';
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, LabelList,
} from 'recharts';

type ModuleBar = {
  module: string;
  shortName: string;
  completion: number;
  color: string;
};

const STAGE_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16',
];

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// Custom axis tick that wraps long labels
const WrappedTick = (props: any) => {
  const { x, y, payload } = props;
  if (!payload?.value) return null;
  const words = String(payload.value).split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > 14) {
      if (current) lines.push(current.trim());
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
  }
  if (current) lines.push(current.trim());
  const lineH = 13;
  return (
    <g transform={`translate(${x},${y + 6})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={i * lineH}
          textAnchor="middle"
          fill="#8a9cc0"
          fontSize={10}
          fontWeight={500}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ModuleBar;
  return (
    <div style={{
      background: '#0d1528',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '10px',
      padding: '0.75rem 1rem',
      color: '#fff',
      fontSize: '0.82rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      minWidth: '200px',
    }}>
      <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: d?.color || '#94a3b8' }}>
        {label}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <span style={{ color: '#94a3b8' }}>Avg. Total Completion</span>
        <strong style={{ color: '#10b981' }}>{d?.completion?.toFixed(1)}%</strong>
      </div>
    </div>
  );
};

export default function CourseProgressChart({ program }: { program?: string }) {
  const [data, setData] = useState<ModuleBar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = program
      ? `/api/courses?program=${encodeURIComponent(program)}`
      : '/api/courses';
    fetch(url)
      .then(r => r.json())
      .then(j => {
        const raw: { name: string; value: number; color?: string }[] = j.data || [];
        const mapped: ModuleBar[] = raw.map((item, i) => ({
          module: item.name,
          shortName: truncate(item.name, 22),
          completion: item.value,
          color: item.color || STAGE_COLORS[i % STAGE_COLORS.length],
        }));
        setData(mapped);
      })
      .catch(err => console.error('CourseProgressChart fetch error:', err))
      .finally(() => setLoading(false));
  }, [program]);

  if (loading) {
    return (
      <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton-shimmer" style={{ width: '100%', height: '280px', borderRadius: '8px' }} />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div style={{
        height: '280px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: '#4f617d',
      }}>
        <div style={{ fontSize: '2.5rem', opacity: 0.4 }}>📋</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: '#8a9cc0', marginBottom: '0.4rem', fontSize: '0.95rem' }}>
            No data connected for this programme yet
          </p>
          <p style={{ fontSize: '0.8rem', color: '#4f617d', maxWidth: '380px', lineHeight: 1.6 }}>
            To connect a spreadsheet, add the sheet name as an environment variable
            (e.g. <code style={{ background:'rgba(255,255,255,0.06)', padding:'0.1rem 0.4rem', borderRadius:'4px', fontFamily:'monospace' }}>{program?.toUpperCase().replace(/\s/g,'_')}_SHEET</code>)
            and set <code style={{ background:'rgba(255,255,255,0.06)', padding:'0.1rem 0.4rem', borderRadius:'4px', fontFamily:'monospace' }}>{program?.toUpperCase().replace(/\s/g,'_')}_ENABLED=true</code> in your .env file.
          </p>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.completion), 100);

  return (
    <div style={{ width: '100%', height: '340px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: -10, bottom: 80 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="shortName"
            tick={<WrappedTick />}
            interval={0}
            axisLine={false}
            tickLine={false}
            height={80}
          />
          <YAxis
            domain={[0, maxVal]}
            tickFormatter={(v) => `${v}%`}
            stroke="#4f617d"
            fontSize={11}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="completion" radius={[5, 5, 0, 0]} animationDuration={900}>
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} fillOpacity={0.9} />
            ))}
            <LabelList
              dataKey="completion"
              position="top"
              formatter={(v: any) => `${v}`}
              style={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
