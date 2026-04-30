'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Hub from '@/components/Hub';
import Spoke from '@/components/Spoke';
import Kanban from '@/components/Kanban';
import FilterBar, { FilterState } from '@/components/FilterBar';
import TrendLine from '@/components/TrendLine';
import DrillModal from '@/components/DrillModal';
import CourseProgressChart from '@/components/CourseProgressChart';
import StageSectionGrid from '@/components/StageSectionGrid';

// ── Types ──────────────────────────────────────────────────────────
type Course = { name: string; value: number; color: string };
type ModalType = 'total' | 'avg' | 'attention' | 'ontrack' | null;

// ── 7 Programs ──────────────────────────────────────────────────────
const PROGRAMS = [
  { id: 'Airlines',  label: 'Airlines',  color: '#3b82f6' },
  { id: 'BBA DBE',   label: 'BBA DBE',   color: '#8b5cf6' },
  { id: 'eDX',       label: 'eDX',       color: '#06b6d4' },
  { id: 'FinTech',   label: 'FinTech',   color: '#f59e0b' },
  { id: 'HM',        label: 'HM',        color: '#10b981' },
  { id: 'iGot',      label: 'iGot',      color: '#ec4899' },
  { id: 'Swayam',    label: 'Swayam',    color: '#ef4444' },
];

// ── Dynamic KPI builder (run after courses load) ───────────────────
function buildKpiMeta(courses: Course[], filter: FilterState) {
  let filtered = courses;
  if (filter.course && filter.course !== 'All') {
    filtered = courses.filter(c => c.name === filter.course);
  }
  const total     = filtered.length || 0;
  const avg       = filtered.length ? Math.round(filtered.reduce((s, c) => s + c.value, 0) / filtered.length) : 0;
  const attention = filtered.filter(c => c.value < (filter.threshold || 70)).length;
  const ontrack   = filtered.filter(c => c.value >= (filter.threshold || 70)).length;
  return [
    { id: 'total',     label: 'Total Courses',   value: String(total),     sub: 'Active programmes',  icon: '📚', accent: '#3b82f6', trend: `${total} programmes` },
    { id: 'avg',       label: 'Avg Completion',  value: `${avg}%`,         sub: 'Across selected',    icon: '🎯', accent: '#10b981', trend: avg >= 75 ? '↑ Above target' : '↓ Below target' },
    { id: 'attention', label: 'Needs Attention', value: String(attention), sub: `Below ${filter.threshold || 70}%`, icon: '⚠️', accent: '#ef4444', trend: attention ? 'Requires action' : 'All clear ✓' },
    { id: 'ontrack',   label: 'On Track',        value: String(ontrack),   sub: `Above ${filter.threshold || 70}%`, icon: '✅', accent: '#8b5cf6', trend: 'Milestones met' },
  ];
}

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
          <p style={{ fontSize:'0.8rem', color:'#94a3b8', margin:0 }}>Completion is {70 - c.value}% below the 70% threshold.</p>
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
  const [filter, setFilter] = useState<FilterState>({ course: 'All', stage: 'All', threshold: 70 });
  const [activeProgram, setActiveProgram] = useState<string>('Swayam');
  const [currentTime, setCurrentTime]     = useState('');
  const [courses, setCourses]             = useState<Course[]>([]);
  const [modal, setModal]                 = useState<ModalType>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // DrillModal state
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillModalTitle, setDrillModalTitle] = useState('Data Explorer');

  const selectedCourse = filter.course === 'All' ? undefined : filter.course;

  // Sync program into filter
  const filterWithProgram: FilterState = { ...filter, program: activeProgram };

  useEffect(() => {
    const url = activeProgram ? `/api/courses?program=${encodeURIComponent(activeProgram)}` : '/api/courses';
    fetch(url).then(r => r.json()).then(j => setCourses(j.data || []));
  }, [activeProgram]);

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleString('en-IN', {
      timeZone:'Asia/Kolkata', weekday:'short', year:'numeric',
      month:'short', day:'numeric', hour:'2-digit', minute:'2-digit',
    }));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const activeProg = PROGRAMS.find(p => p.id === activeProgram);

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
            <button
              onClick={handleLogout}
              className="dash-nav-link"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
            >
              Logout
            </button>
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

        {/* ── Title Row ── */}
        <div className="dash-title-row">
          <div>
            <h1 className="dash-title">EaSE Dashboard</h1>
            <p className="dash-subtitle">Course Progress Intelligence · synced live from Google Sheets</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
              onClick={() => { setDrillModalTitle('Data Explorer (All Data)'); setDrillModalOpen(true); }}
            >
              Explore Raw Data
            </button>
          </div>
        </div>

        {/* ── 7-Program Tab Strip ── */}
        <div className="program-tabs">
          {PROGRAMS.map(prog => (
            <button
              key={prog.id}
              className={`program-tab${activeProgram === prog.id ? ' active' : ''}`}
              style={{
                '--tab-color': prog.color,
              } as React.CSSProperties}
              onClick={() => {
                setActiveProgram(prog.id);
                setFilter({ course: 'All', stage: 'All', threshold: 70, program: prog.id });
              }}
            >
              <span
                className="program-tab-dot"
                style={{ background: prog.color }}
              />
              {prog.label}
            </button>
          ))}
        </div>

        {/* ── Course Progress by Modules (Tableau-style main chart) ── */}
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>Course Progress by Modules</h2>
              <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
                Weighted average completion across all stages · Program: <strong style={{ color: activeProg?.color }}>{activeProgram}</strong>
              </p>
            </div>
          </div>
          <CourseProgressChart program={activeProgram} />
        </div>

        {/* ── KPI Cards ── */}
        <div className="kpi-grid">
          {buildKpiMeta(courses, filterWithProgram).map((k) => (
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
              <div style={{ position:'absolute', bottom:'0.75rem', right:'0.85rem', fontSize:'0.7rem', color:'rgba(255,255,255,0.25)', fontWeight:500 }}>
                tap to expand ↗
              </div>
            </div>
          ))}
        </div>

        {/* ── Stage Section Grid (Recording / Edit Notes / Editing / Course Build / QA) ── */}
        <StageSectionGrid program={activeProgram} />

        <FilterBar filter={filterWithProgram} onChange={f => { setFilter(f); }} />

        {/* ── Detail Charts ── */}
        <div className="charts-grid">
          <Hub program={activeProgram} onSegmentClick={(c) => setFilter({ ...filterWithProgram, course: c })} />
          <Spoke
            program={activeProgram}
            selectedCourse={selectedCourse}
            onBarClick={(stage) => {
              setFilter({ ...filterWithProgram, stage });
              setDrillModalTitle(`Data Explorer: ${stage}`);
              setDrillModalOpen(true);
            }}
          />
          <TrendLine selectedCourse={selectedCourse} />
        </div>

        <Kanban program={activeProgram} />
      </main>

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
            <div style={{ padding:'1.5rem 1.75rem', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:700 }}>{MODAL_TITLES[modal]}</h2>
              <button
                onClick={() => setModal(null)}
                style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}
              >×</button>
            </div>
            <div style={{ padding:'1.5rem 1.75rem', overflowY:'auto' }}>
              <ModalContent type={modal} courses={courses} />
            </div>
          </div>
        </div>
      )}

      <DrillModal
        isOpen={drillModalOpen}
        onClose={() => setDrillModalOpen(false)}
        title={drillModalTitle}
        courseFilter={filter.course !== 'All' ? filter.course : undefined}
        stageFilter={filter.stage !== 'All' ? filter.stage : undefined}
      />

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(20px); opacity:0 } to { transform:translateY(0); opacity:1 } }
      `}</style>
    </div>
  );
}
