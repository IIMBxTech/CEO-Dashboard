'use client';
import React, { useState, useEffect } from 'react';

// The 5 stage sections shown in the Tableau EaSE Dashboard
const STAGE_SECTIONS = ['Recording', 'Edit Notes', 'Editing', 'Course Build', 'QA'];

type CourseRow = {
  name: string;
  completion: number;
};

type SectionData = {
  stage: string;
  courses: CourseRow[];
};

function CompletionBar({ value }: { value: number }) {
  const color = value >= 80 ? '#10b981' : value >= 50 ? '#3b82f6' : '#f59e0b';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
      <div style={{
        flex: 1,
        height: '5px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '4px',
        overflow: 'hidden',
        minWidth: '60px',
      }}>
        <div style={{
          width: `${Math.min(100, value)}%`,
          height: '100%',
          background: color,
          borderRadius: '4px',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{
        fontSize: '0.78rem',
        fontWeight: 700,
        color,
        minWidth: '38px',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function SectionPanel({ section, courses }: { section: string; courses: CourseRow[] }) {
  const sectionColors: Record<string, string> = {
    'Recording':    '#3b82f6',
    'Edit Notes':   '#8b5cf6',
    'Editing':      '#10b981',
    'Course Build': '#f59e0b',
    'QA':           '#06b6d4',
  };
  const color = sectionColors[section] || '#94a3b8';

  return (
    <div className="stage-section-panel" style={{ '--section-color': color } as React.CSSProperties}>
      <div className="stage-section-header">
        <span className="stage-section-dot" style={{ background: color }} />
        <span className="stage-section-title">{section}</span>
        <span className="stage-section-badge">{courses.length}</span>
      </div>
      <div className="stage-section-list">
        {courses.length === 0 ? (
          <div style={{ color: '#4f617d', fontSize: '0.8rem', padding: '0.5rem 0', fontStyle: 'italic' }}>
            No stage data
          </div>
        ) : (
          courses.map((c, i) => (
            <div key={i} className="stage-section-row">
              <span className="stage-section-name" title={c.name}>{c.name}</span>
              <CompletionBar value={c.completion} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// No-data placeholder shown when a program isn't connected yet
function NoDataPlaceholder() {
  return (
    <div style={{
      gridColumn: '1 / -1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '2.5rem',
      background: 'rgba(255,255,255,0.02)',
      border: '1px dashed rgba(255,255,255,0.08)',
      borderRadius: '14px',
    }}>
      <span style={{ fontSize: '2rem', opacity: 0.3 }}>🔌</span>
      <p style={{ color: '#4f617d', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
        Stage-level data not yet connected for this programme
      </p>
    </div>
  );
}

export default function StageSectionGrid({ program }: { program?: string }) {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setHasData(false);

    const url = program
      ? `/api/courses?program=${encodeURIComponent(program)}`
      : '/api/courses';

    fetch(url)
      .then(r => r.json())
      .then(async j => {
        const courses: { name: string; value: number }[] = j.data || [];

        // If the program has no courses at all, show the no-data placeholder
        if (courses.length === 0) {
          setSections([]);
          setHasData(false);
          return;
        }

        // Build a stage map by fetching stages for each course
        // Use accumulators: stageSumMap[section][courseName] = { sum, count }
        const stageSumMap: Record<string, Record<string, { sum: number; count: number }>> = {};
        STAGE_SECTIONS.forEach(s => { stageSumMap[s] = {}; });

        await Promise.all(
          courses.slice(0, 20).map(async (course) => {
            try {
              const stageUrl = `/api/stages?course=${encodeURIComponent(course.name)}${program ? `&program=${encodeURIComponent(program)}` : ''}`;
              const res = await fetch(stageUrl);
              const js = await res.json();
              const stageData: { stage: string; completion: number }[] = js.data || [];

              stageData.forEach(sd => {
                // Match stage name to one of our 5 known section names
                const matched = STAGE_SECTIONS.find(s =>
                  s.toLowerCase() === sd.stage.toLowerCase() ||
                  sd.stage.toLowerCase().includes(s.toLowerCase()) ||
                  s.toLowerCase().includes(sd.stage.toLowerCase())
                );
                if (matched && stageSumMap[matched]) {
                  // Accumulate all module values for this stage section
                  if (!stageSumMap[matched][course.name]) {
                    stageSumMap[matched][course.name] = { sum: 0, count: 0 };
                  }
                  stageSumMap[matched][course.name].sum += sd.completion;
                  stageSumMap[matched][course.name].count += 1;
                }
              });
            } catch {
              // silently skip failed courses
            }
          })
        );

        // Convert accumulators into averaged CourseRow arrays
        const stageMap: Record<string, CourseRow[]> = {};
        STAGE_SECTIONS.forEach(s => {
          stageMap[s] = Object.entries(stageSumMap[s]).map(([name, { sum, count }]) => ({
            name,
            completion: count > 0 ? Math.round(sum / count) : 0,
          }));
        });

        // Check if we got any real stage data — NO fallback to overall values
        const totalRows = STAGE_SECTIONS.reduce((sum, s) => sum + stageMap[s].length, 0);
        setHasData(totalRows > 0);

        const result = STAGE_SECTIONS.map(s => ({
          stage: s,
          courses: stageMap[s].sort((a, b) => b.completion - a.completion),
        }));
        setSections(result);
      })
      .catch(err => {
        console.error('StageSectionGrid error:', err);
        setSections([]);
        setHasData(false);
      })
      .finally(() => setLoading(false));
  }, [program]);

  if (loading) {
    return (
      <div className="stage-section-grid" style={{ marginBottom: '2rem' }}>
        {STAGE_SECTIONS.map(s => (
          <div key={s} className="stage-section-panel" style={{ minHeight: '200px' }}>
            <div className="skeleton-shimmer" style={{ width: '80px', height: '14px', borderRadius: '4px', marginBottom: '1rem' }} />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-shimmer" style={{ width: '100%', height: '10px', borderRadius: '4px', marginBottom: '0.5rem' }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // No courses at all for this program (not connected)
  if (!hasData && sections.length === 0) {
    return (
      <div className="stage-section-grid" style={{ marginBottom: '2rem' }}>
        <NoDataPlaceholder />
      </div>
    );
  }

  return (
    <div className="stage-section-grid" style={{ marginBottom: '2rem' }}>
      {sections.map(sec => (
        <SectionPanel key={sec.stage} section={sec.stage} courses={sec.courses} />
      ))}
    </div>
  );
}
