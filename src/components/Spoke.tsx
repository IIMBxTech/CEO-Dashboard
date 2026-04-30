'use client';
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceArea, ReferenceLine,
} from 'recharts';

// ── Stage abbreviations ──────────────────────────────────────────────
const STAGE_ABBREV: Record<string, string> = {
  'recording':    'Rec',
  'edit notes':   'EN',
  'editing':      'Edit',
  'course build': 'CB',
  'qa':           'QA',
};

function abbrev(stage: string): string {
  return STAGE_ABBREV[stage.toLowerCase()] ?? stage.slice(0, 4);
}

// ── Module colours (alternating subtle bands) ────────────────────────
const MODULE_BAND_COLORS = [
  'rgba(59,130,246,0.07)',   // blue
  'rgba(139,92,246,0.07)',   // purple
  'rgba(16,185,129,0.07)',   // green
  'rgba(245,158,11,0.07)',   // amber
  'rgba(236,72,153,0.07)',   // pink
  'rgba(6,182,212,0.07)',    // cyan
];

// ── Module label colors (matching bands but brighter) ────────────────
const MODULE_LABEL_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4',
];

type RawStage = { stage: string; completion: number };

type EnrichedStage = {
  key: string;
  stage: string;
  displayName: string;
  module: number;
  completion: number;
  isSeparator?: boolean;  // invisible spacer bar between modules
};

type ModuleGroup = {
  module: number;
  startKey: string;
  endKey: string;
  separatorKey?: string;  // key of the spacer after this module
  label: string;
};

// ── Build enriched data + module groups ──────────────────────────────
function enrichStages(raw: RawStage[]): { data: EnrichedStage[]; groups: ModuleGroup[] } {
  // First pass: assign module numbers
  const seenInModule = new Set<string>();
  let moduleNum = 1;
  const staged: (EnrichedStage)[] = [];

  raw.forEach((item, idx) => {
    const stageKey = item.stage.toLowerCase();
    if (seenInModule.has(stageKey)) {
      seenInModule.clear();
      moduleNum++;
    }
    seenInModule.add(stageKey);
    staged.push({
      key: `M${moduleNum}-${abbrev(item.stage)}-${idx}`,
      stage: item.stage,
      displayName: abbrev(item.stage),
      module: moduleNum,
      completion: item.completion,
    });
  });

  const totalModules = moduleNum;

  // Second pass: interleave spacer entries between modules
  const data: EnrichedStage[] = [];
  const groups: ModuleGroup[] = [];
  let moduleStartKey = '';
  let prevModule = 0;

  staged.forEach((item, idx) => {
    if (item.module !== prevModule) {
      // New module starting
      if (prevModule > 0 && prevModule < totalModules) {
        // Insert spacer BEFORE this item (between modules)
        const sepKey = `SEP-${prevModule}`;
        data.push({ key: sepKey, stage: '', displayName: '', module: prevModule, completion: 0, isSeparator: true });
        // Update the previous group's separatorKey
        if (groups.length > 0) groups[groups.length - 1].separatorKey = sepKey;
      }
      moduleStartKey = item.key;
      prevModule = item.module;
    }
    data.push(item);
  });

  // Build groups from data (excluding separators)
  const realData = data.filter(d => !d.isSeparator);
  for (let m = 1; m <= totalModules; m++) {
    const moduleItems = realData.filter(d => d.module === m);
    if (!moduleItems.length) continue;
    const startKey = moduleItems[0].key;
    const endKey   = moduleItems[moduleItems.length - 1].key;
    const sepKey   = `SEP-${m}`;
    groups.push({
      module: m,
      startKey,
      endKey,
      separatorKey: m < totalModules ? sepKey : undefined,
      label: `M${m}`,
    });
  }

  // Close last module group (kept for compat)
  if (moduleStartKey && data.length > 0) {
    // already handled above
  }

  // Close last module group
  if (moduleStartKey && data.length > 0) {
    groups.push({
      // already populated above — skip duplicate
      module: 0, startKey: '', endKey: '', label: '',
    });
    groups.pop(); // remove the dummy
  }

  return { data, groups };
}

// ── Custom X-axis tick: shows abbreviated stage name, hidden for separators ──
const StageTick = (props: any) => {
  const { x, y, payload } = props;
  if (!payload?.value) return null;
  // Separator keys start with "SEP-" — hide their tick
  if (String(payload.value).startsWith('SEP-')) return null;
  // Key format: "M1-Rec-0" → extract index-1 part
  const parts = String(payload.value).split('-');
  const label = parts[1] ?? payload.value;
  return (
    <g transform={`translate(${x},${y + 6})`}>
      <text x={0} y={0} textAnchor="middle" fill="#8a9cc0" fontSize={10} fontWeight={600}>
        {label}
      </text>
    </g>
  );
};

// ── Custom tooltip ────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as EnrichedStage;
  const color = d.completion > 80 ? '#10b981' : d.completion > 40 ? '#3b82f6' : '#ef4444';
  return (
    <div style={{
      background: '#0d1528',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '10px',
      padding: '0.6rem 0.9rem',
      fontSize: '0.8rem',
      color: '#fff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#cbd5e1' }}>
        M{d.module} · {d.stage}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <span style={{ color: '#94a3b8' }}>Completion</span>
        <strong style={{ color }}>{d.completion}%</strong>
      </div>
    </div>
  );
};

// ── Module legend below the chart ────────────────────────────────────
function ModuleLegend({ groups, data }: { groups: ModuleGroup[]; data: EnrichedStage[] }) {
  if (groups.length <= 1) return null;
  const realData = data.filter(d => !d.isSeparator);
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      marginTop: '0.75rem',
      paddingTop: '0.75rem',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      {groups.map(g => {
        const moduleData = realData.filter(d => d.module === g.module);
        const avg = moduleData.length
          ? Math.round(moduleData.reduce((s, d) => s + d.completion, 0) / moduleData.length)
          : 0;
        const color = MODULE_LABEL_COLORS[(g.module - 1) % MODULE_LABEL_COLORS.length];
        const stages = [...new Set(moduleData.map(d => d.displayName))].join(' · ');
        return (
          <div key={g.module} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.7rem',
            borderRadius: '6px',
            background: `${color}18`,
            border: `1px solid ${color}30`,
            fontSize: '0.75rem',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color }}>{g.label}</span>
            <span style={{ color: '#8a9cc0' }}>{stages}</span>
            <span style={{
              marginLeft: '0.25rem',
              fontWeight: 700,
              color: avg >= 80 ? '#10b981' : avg >= 50 ? '#3b82f6' : '#ef4444',
            }}>{avg}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export default function Spoke({
  program,
  selectedCourse,
  onBarClick,
}: {
  program?: string;
  selectedCourse?: string;
  onBarClick?: (stage: string) => void;
}) {
  const [rawData, setRawData] = useState<RawStage[]>([]);

  useEffect(() => {
    if (!selectedCourse) return;
    setRawData([]);
    let url = `/api/stages?course=${encodeURIComponent(selectedCourse)}`;
    if (program) url += `&program=${encodeURIComponent(program)}`;
    fetch(url)
      .then(res => res.json())
      .then(json => setRawData(json.data || []))
      .catch(err => console.error('Spoke fetch error:', err));
  }, [selectedCourse, program]);

  const { data, groups } = enrichStages(rawData);

  const chartHeight = Math.max(280, 220 + (groups.length > 1 ? 0 : 0));

  return (
    <div className="glass-panel" style={{ height: '100%', minHeight: '420px', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
        {selectedCourse ? `${selectedCourse} – Stage Drill-down` : 'Select a course to drill down'}
      </h2>
      {groups.length > 1 && (
        <p style={{ fontSize: '0.8rem', color: '#4f617d', marginBottom: '0.75rem' }}>
          {groups.length} modules detected · hover bars for details
        </p>
      )}

      {!selectedCourse ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f617d', fontSize: '0.875rem' }}>
          Click a course in the chart above to drill down into its stages
        </div>
      ) : data.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f617d', fontSize: '0.875rem' }}>
          No stage data available for this course
        </div>
      ) : (
        <>
          <div style={{ flex: 1, width: '100%', minHeight: `${chartHeight}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 24, right: 20, left: -20, bottom: 20 }}
                barCategoryGap="15%"
              >
                {/* Module band backgrounds — span only real bars */}
                {groups.map(g => (
                  <ReferenceArea
                    key={`band-${g.module}`}
                    x1={g.startKey}
                    x2={g.endKey}
                    fill={MODULE_BAND_COLORS[(g.module - 1) % MODULE_BAND_COLORS.length]}
                    fillOpacity={1}
                    label={{
                      value: g.label,
                      position: 'insideTop',
                      fill: MODULE_LABEL_COLORS[(g.module - 1) % MODULE_LABEL_COLORS.length],
                      fontSize: 11,
                      fontWeight: 800,
                      dy: -18,
                    }}
                  />
                ))}

                {/* Bold separator lines — drawn at the spacer key between modules */}
                {groups
                  .filter(g => g.separatorKey)
                  .map(g => (
                    <ReferenceLine
                      key={`sep-${g.module}`}
                      x={g.separatorKey}
                      stroke={MODULE_LABEL_COLORS[(g.module - 1) % MODULE_LABEL_COLORS.length]}
                      strokeWidth={3}
                    />
                  ))
                }

                <XAxis
                  dataKey="key"
                  tick={<StageTick />}
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                  height={28}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                  stroke="#4f617d"
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar
                  dataKey="completion"
                  radius={[4, 4, 0, 0]}
                  animationDuration={900}
                  onClick={(d: any) => {
                    if (d?.stage && onBarClick) onBarClick(d.stage);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {data.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={
                        entry.isSeparator ? 'transparent'
                        : entry.completion > 80 ? '#10b981'
                        : entry.completion > 40 ? '#3b82f6'
                        : '#ef4444'
                      }
                      fillOpacity={entry.isSeparator ? 0 : 0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Module legend with avg completion */}
          <ModuleLegend groups={groups} data={data} />
        </>
      )}
    </div>
  );
}
