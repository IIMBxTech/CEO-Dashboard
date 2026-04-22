'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Spoke({ selectedCourse }: { selectedCourse?: string }) {
  const [subStageData, setSubStageData] = useState([]);

  useEffect(() => {
    if (selectedCourse) {
      // Live dynamic fetch for Sub-Stage metrics
      fetch(`/api/stages?course=${encodeURIComponent(selectedCourse)}`)
        .then(res => res.json())
        .then(json => setSubStageData(json.data || []))
        .catch(err => console.error("Failed to fetch Spoke data"));
    }
  }, [selectedCourse]);

  return (
    <div className="glass-panel" style={{ height: '100%', minHeight: '300px' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        {selectedCourse ? `${selectedCourse} - Stage Drill-down` : 'Select a course to drill down'}
      </h2>
      <div style={{ width: '100%', height: '250px' }}>
        <ResponsiveContainer>
          <BarChart data={subStageData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
            <XAxis dataKey="stage" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            />
            <Bar dataKey="completion" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1000}>
                {subStageData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.completion > 90 ? '#10b981' : entry.completion > 40 ? '#3b82f6' : '#ef4444'} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
