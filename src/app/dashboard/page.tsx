'use client';
import React, { useState } from 'react';
import Hub from '@/components/Hub';
import Spoke from '@/components/Spoke';
import Kanban from '@/components/Kanban';
import ChatPanel from '@/components/ChatPanel';
import '../globals.css';

export default function DashboardPage() {
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>('Course Prod');

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Executive Operations</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Data dynamically synced from Google Sheets to cPanel Database.</p>
        </div>
        <div>
           <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600}}>
             Live Sync Active
           </span>
        </div>
      </div>
      
      <div className="metrics-grid">
        <Hub onSegmentClick={setSelectedCourse} />
        <Spoke selectedCourse={selectedCourse} />
      </div>

      <Kanban />
      <ChatPanel />
    </div>
  );
}
