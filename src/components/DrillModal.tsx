'use client';
import React, { useState, useEffect } from 'react';

type DrillModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  courseFilter?: string; // If provided, filter rows by this course name
  stageFilter?: string;  // If provided, filter by this stage name
};

const TABS = [
  "EaSE Dasboard Skeleton",
  "Overview Timeline Mother Sheet",
  "Mother_Sheet_Finance_July_25",
  "Checklist_Finance_July_25",
  "Checklist_Jan_26",
  "Checklist_Finance_Jan_26",
  "Checklist_July_26",
  "Overview Timeline",
  "Copy of Overview Timeline Mother Sheet",
  "New Courses",
  "Finance Checklist",
  "Sheet7"
];

export default function DrillModal({ isOpen, onClose, title, courseFilter, stageFilter }: DrillModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [activeTab, setActiveTab] = useState("EaSE Dasboard Skeleton");

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      fetch(`/api/sheets?sheetName=${encodeURIComponent(activeTab)}`)
        .then(r => r.json())
        .then(j => {
          if (j.success && j.data) {
            setHeaders(j.headers || []);
            let rows = j.data;
            if (activeTab === "EaSE Dasboard Skeleton") {
              if (courseFilter && courseFilter !== 'All') {
                rows = rows.filter((r: any) => r['Course Name'] === courseFilter || r['Course Title'] === courseFilter);
              }
              if (stageFilter && stageFilter !== 'All') {
                rows = rows.filter((r: any) => r['Stage'] === stageFilter || r['Stage Name'] === stageFilter);
              }
            }
            setData(rows);
          } else {
            setData([]);
            setHeaders([]);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, courseFilter, stageFilter, activeTab]);

  if (!isOpen) return null;

  const sortedData = [...data].sort((a, b) => {
    if (!sortCol) return 0;
    const aVal = a[sortCol] || '';
    const bVal = b[sortCol] || '';
    // Try numeric sort first
    const aNum = parseFloat(aVal.replace('%', '').trim());
    const bNum = parseFloat(bVal.replace('%', '').trim());
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortAsc ? aNum - bNum : bNum - aNum;
    }
    return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const handleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '1000px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{title}</h2>
            <select
              title="Sheet Selector"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '300px'
              }}
            >
              {TABS.map(tab => (
                <option key={tab} value={tab} style={{ color: '#000' }}>{tab}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={onClose}
            title="Close"
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cbd5e1', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >×</button>
        </div>

        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <div className="loader">Loading underlying data...</div>
            </div>
          ) : data.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>
              No data records found for the selected filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    {headers.map((h, i) => {
                      if (!h.trim()) return null; // skip empty headers
                      return (
                        <th 
                          key={i} 
                          onClick={() => handleSort(h)}
                          style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: '#cbd5e1', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.2)' }}
                        >
                          {h} {sortCol === h ? (sortAsc ? '↑' : '↓') : ''}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      {headers.map((h, i) => {
                        if (!h.trim()) return null;
                        const cellVal = String(row[h] || '');
                        // Color code completion percentages
                        const isPerc = cellVal.includes('%');
                        const numVal = isPerc ? parseFloat(cellVal.replace('%', '')) : null;
                        let color = '#f1f5f9';
                        if (isPerc && numVal !== null && !isNaN(numVal)) {
                          if (numVal >= 80) color = '#10b981';
                          else if (numVal >= 50) color = '#f59e0b';
                          else color = '#ef4444';
                        }
                        return (
                          <td key={i} style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color }}>
                            {cellVal || '-'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .loader {
          border: 3px solid rgba(255,255,255,0.1);
          border-radius: 50%;
          border-top: 3px solid #3b82f6;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
