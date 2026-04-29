'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const VerticalTick = (props: any) => {
  const { x, y, payload } = props;
  if (!payload || !payload.value) return null;
  const chars = String(payload.value).split('');
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={24} textAnchor="middle" fill="#cbd5e1" fontSize={11} fontWeight={500} letterSpacing="1px">
        {chars.map((char: string, index: number) => (
          <tspan key={index} x={0} dy={index === 0 ? 0 : 12}>{char}</tspan>
        ))}
      </text>
    </g>
  );
};

export default function Spoke({ program, selectedCourse, onBarClick }: { program?: string, selectedCourse?: string, onBarClick?: (stage: string) => void }) {
  const [subStageData, setSubStageData] = useState<{ stage: string; completion: number }[]>([]);

  useEffect(() => {
    if (selectedCourse) {
      let url = `/api/stages?course=${encodeURIComponent(selectedCourse)}`;
      if (program) url += `&program=${encodeURIComponent(program)}`;
      
      fetch(url)
        .then(res => res.json())
        .then(json => setSubStageData(json.data || []))
        .catch(err => console.error("Failed to fetch Spoke data", err));
    }
  }, [selectedCourse, program]);

  // dynamically calculate height to accommodate longest stage name character by character
  const maxChars = subStageData.reduce((max, d: any) => Math.max(max, (d.stage || '').length), 0);
  const axisHeight = Math.max(30, maxChars * 12 + 16);

  return (
    <div className="glass-panel" style={{ height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        {selectedCourse ? `${selectedCourse} - Stage Drill-down` : 'Select a course to drill down'}
      </h2>
      <div style={{ flex: 1, width: '100%', minHeight: `${220 + axisHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={subStageData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
            <XAxis dataKey="stage" stroke="#94a3b8" tick={<VerticalTick />} interval={0} height={axisHeight} />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(val: any) => [`${val}%`, 'Completion']}
            />
            <Bar 
              dataKey="completion" 
              radius={[4, 4, 0, 0]} 
              animationDuration={1000}
              onClick={(data: any) => {
                if (data && data.stage && onBarClick) {
                  onBarClick(data.stage);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
                {subStageData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.completion > 80 ? '#10b981' : entry.completion > 40 ? '#3b82f6' : '#ef4444'} 
                      style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                    />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
