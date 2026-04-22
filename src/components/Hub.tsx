'use client';
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function Hub({ onSegmentClick }: { onSegmentClick?: (name: string) => void }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Live dynamic fetch for Recharts Pie injection
    fetch('/api/courses')
      .then(res => res.json())
      .then(json => setData(json.data || []))
      .catch(err => console.error("Failed to fetch Hub data"));
  }, []);

  return (
    <div className="glass-panel" style={{ height: '100%', minHeight: '300px' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Overall % Completion</h2>
      <div style={{ width: '100%', height: '250px' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              onClick={(e, index) => onSegmentClick && onSegmentClick(data[index].name)}
              style={{ cursor: 'pointer', outline: 'none' }}
              animationDuration={800}
            >
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
