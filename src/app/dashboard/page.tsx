'use client';
import React, { useState, useEffect } from 'react';
import Hub from '@/components/Hub';
import Spoke from '@/components/Spoke';
import Kanban from '@/components/Kanban';
import ChatPanel from '@/components/ChatPanel';

// ── Types ──────────────────────────────────────────────────────────
type Course = { name: string; value: number; color: string };
type ModalType = 'total' | 'avg' | 'attention' | 'ontrack' | null;

// ── KPI Card definitions ────────────────────────────────────────────
const KPI_META = [
  { id: 'total',     label: 'Total Courses',   value: '6',   sub: 'Active programmes',  icon: '📚', accent: '#3b82f6', trend: '+2 this month' },
  { id: 'avg',       label: 'Avg Completion',  value: '74%', sub: 'Across all courses', icon: '🎯', accent: '#10b981', trend: '+8% vs last month' },
  { id: 'attention', label: 'Needs Attention', value: '2',   sub: 'Courses flagged',    icon: '⚠️', accent: '#ef4444', trend: 'Requires action' },
  { id: 'ontrack',   label: 'On Track',        value: '4',   sub: 'Running smoothly',   icon: '✅', accent: '#8b5cf6', trend: 'All milestones met' },
];

// ── Modal content builder ───────────────────────────────────────────
function ModalContent({ type, courses }: { type: ModalType; courses: Course[] }) {
  const attention = courses.filter(c => c.value < 70);
  const ontrack   = courses.filter(c => c.value >= 70);
  const avg       = courses.length ? Math.round(courses.reduce((s, c) => s + c.value, 0) / courses.length) : 0;

  if (type === 'total') return (
    <div>
      <p style={{ color: '#94a3b8', marginBottom: '1.25rem', fontSize: '0.875rem' }}>All active programmes and their current completion rate.</p>
      {courses.map(c => (
        <div key={c.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1rem', marginBottom:'0.6rem', background:'rgba(255,255,255,0.04)', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:c.color, display:'inline-block' }} />
            <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{c.name}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <div style={{ width:'80px', height:'5px', background:'rgba(255,255,255,0.08)', borderRadius:'4px' }}>
              <div style={{ width:`${c.value}%`, height:'100%', background:c.color, borderRadius:'4px' }} />
            </div>
            <span style={{ fontWeight:700, color:c.color, fontSize:'0.875rem', minWidth:'38px' }}>{c.value}%</span>
          </div>
        </div>
      ))}
    </div>
  );

  if (type === 'avg') return (
    <div>
      <p style={{ color:'#94a3b8', marginBottom:'1.25rem', fontSize:'0.875rem' }}>Portfolio-wide average is <strong style={{color:'#10b981'}}>{avg}%</strong>. Breakdown per programme:</p>
      {courses.sort((a,b) => b.value - a.value).map(c => (
        <div key={c.name} style={{ marginBottom:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
            <span style={{ fontSize:'0.85rem', fontWeight:500 }}>{c.name}</span>
            <span style={{ fontSize:'0.85rem', fontWeight:700, color: c.value >= 80 ? '#10b981' : c.value >= 60 ? '#f59e0b' : '#ef4444' }}>{c.value}%</span>
          </div>
          <div style={{ height:'6px', background:'rgba(255,255,255,0.07)', borderRadius:'4px' }}>
            <div style={{ width:`${c.value}%`, height:'100%', background: c.value>=80?'#10b981': c.value>=60?'#f59e0b':'#ef4444', borderRadius:'4px', transition:'width 0.6s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (type === 'attention') return (
    <div>
      <p style={{ color:'#94a3b8', marginBottom:'1.25rem', fontSize:'0.875rem' }}>{attention.length} programme(s) are below 70% completion and require executive attention.</p>
      {attention.map(c => (
        <div key={c.name} style={{ padding:'1rem', marginBottom:'0.75rem', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', borderLeft:'3px solid #ef4444' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
            <span style={{ fontWeight:700 }}>{c.name}</span>
            <span style={{ fontWeight:700, color:'#ef4444' }}>{c.value}% complete</span>
          </div>
          <div style={{ height:'5px', background:'rgba(255,255,255,0.07)', borderRadius:'4px', marginBottom:'0.5rem' }}>
            <div style={{ width:`${c.value}%`, height:'100%', background:'#ef4444', borderRadius:'4px' }} />
          </div>
          <p style={{ fontSize:'0.8rem', color:'#94a3b8', margin:0 }}>Completion is {70 - c.value}% below the 70% threshold. Review checkpoint stages immediately.</p>
        </div>
      ))}
      {attention.length === 0 && <p style={{ color:'#10b981' }}>✅ All programmes are above the attention threshold.</p>}
    </div>
  );

  if (type === 'ontrack') return (
    <div>
      <p style={{ color:'#94a3b8', marginBottom:'1.25rem', fontSize:'0.875rem' }}>{ontrack.length} programme(s) are at or above 70% completion and progressing well.</p>
      {ontrack.map(c => (
        <div key={c.name} style={{ padding:'1rem', marginBottom:'0.75rem', background:'rgba(139,92,246,0.07)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:'10px', borderLeft:'3px solid #8b5cf6' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
            <span style={{ fontWeight:700 }}>{c.name}</span>
            <span style={{ fontWeight:700, color: c.value >= 90 ? '#10b981' : '#8b5cf6' }}>{c.value}% complete</span>
          </div>
          <div style={{ height:'5px', background:'rgba(255,255,255,0.07)', borderRadius:'4px', marginBottom:'0.5rem' }}>
            <div style={{ width:`${c.value}%`, height:'100%', background: c.value >= 90 ? '#10b981' : '#8b5cf6', borderRadius:'4px' }} />
          </div>
          <p style={{ fontSize:'0.8rem', color:'#94a3b8', margin:0 }}>
            {c.value >= 90 ? '🏆 Excellent — on track for early completion.' : '✅ Good progress — maintaining schedule.'}
          </p>
        </div>
      ))}
    </div>
  );

  return null;
}

// ── Modal titles ────────────────────────────────────────────────────
const MODAL_TITLES: Record<string, string> = {
  total:     '📚 All Active Programmes',
  avg:       '🎯 Completion Breakdown',
  attention: '⚠️ Programmes Needing Attention',
  ontrack:   '✅ On-Track Programmes',
};

// ── Main Dashboard Page ─────────────────────────────────────────────
export default function DashboardPage() {
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>('Analytics Bootcamp');
  const [currentTime, setCurrentTime]       = useState('');
  const [courses, setCourses]               = useState<Course[]>([]);
  const [modal, setModal]                   = useState<ModalType>(null);

  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(j => setCourses(j.data || []));
  }, []);

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleString('en-IN', {
      timeZone:'Asia/Kolkata', weekday:'short', year:'numeric',
      month:'short', day:'numeric', hour:'2-digit', minute:'2-digit',
    }));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dash-root">

      {/* ── Nav ── */}
      <header className="dash-nav">
        <div className="dash-nav-left">
          <div className="dash-logo">
            <span className="dash-logo-icon">⬡</span>
            <span className="dash-logo-text">IIMBxTech</span>
          </div>
          <nav className="dash-nav-links">
            <a className="dash-nav-link active" href="/dashboard">Overview</a>
            <a className="dash-nav-link" href="#">Programmes</a>
            <a className="dash-nav-link" href="#">Reports</a>
            <a className="dash-nav-link" href="#">Settings</a>
          </nav>
        </div>
        <div className="dash-nav-right">
          <span className="dash-live-badge"><span className="dash-live-dot" />Live Sync</span>
          <span className="dash-time">{currentTime}</span>
          <div className="dash-avatar">CE</div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="dash-body">
        <div className="dash-title-row">
          <div>
            <h1 className="dash-title">Executive Operations</h1>
            <p className="dash-subtitle">Real-time programme intelligence · synced from Google Sheets → cPanel</p>
          </div>
        </div>

        {/* ── KPI Cards (clickable) ── */}
        <div className="kpi-grid">
          {KPI_META.map((k) => (
            <div
              key={k.id}
              className="kpi-card"
              style={{ '--card-accent': k.accent, cursor: 'pointer' } as React.CSSProperties}
              onClick={() => setModal(k.id as ModalType)}
              title={`Click to see ${k.label} details`}
            >
              <div className="kpi-top">
                <span className="kpi-icon">{k.icon}</span>
                <span className="kpi-trend">{k.trend}</span>
              </div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-sub">{k.sub}</div>
              <div className="kpi-bar" />
              {/* Click hint */}
              <div style={{ position:'absolute', bottom:'0.75rem', right:'0.85rem', fontSize:'0.7rem', color:'rgba(255,255,255,0.25)', fontWeight:500 }}>
                tap to expand ↗
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts ── */}
        <div className="charts-grid">
          <Hub onSegmentClick={setSelectedCourse} />
          <Spoke selectedCourse={selectedCourse} />
        </div>

        <Kanban />
      </main>

      <ChatPanel />

      {/* ── Modal Overlay ── */}
      {modal && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'fadeIn 0.2s ease' }}
          onClick={() => setModal(null)}
        >
          <div
            style={{ background:'#0d1528', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'100%', maxWidth:'520px', maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(0,0,0,0.7)', animation:'slideUp 0.3s ease' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ padding:'1.5rem 1.75rem', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:700 }}>{MODAL_TITLES[modal]}</h2>
              <button
                onClick={() => setModal(null)}
                style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}
              >×</button>
            </div>
            {/* Modal body */}
            <div style={{ padding:'1.5rem 1.75rem', overflowY:'auto' }}>
              <ModalContent type={modal} courses={courses} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(20px); opacity:0 } to { transform:translateY(0); opacity:1 } }
      `}</style>
    </div>
  );
}
