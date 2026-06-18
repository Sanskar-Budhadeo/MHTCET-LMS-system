import React, { useState } from 'react';
import { useLms } from '../../context/LmsContext';
import { StudyMaterial } from '../../data/mockData';
import { BookOpen, FileText, Video, Image as ImageIcon, ExternalLink, ArrowLeft } from 'lucide-react';

export const StudentMaterials: React.FC = () => {
  const { studyMaterials } = useLms();
  const [selectedSubject, setSelectedSubject] = useState<'All' | 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'>('All');
  const [selectedType, setSelectedType] = useState<'All' | 'Note' | 'PDF' | 'Diagram' | 'Video'>('All');
  const [activeMaterial, setActiveMaterial] = useState<StudyMaterial | null>(null);

  // Filter logic
  const filteredMaterials = studyMaterials.filter(sm => {
    const matchSubject = selectedSubject === 'All' || sm.subject === selectedSubject;
    const matchType = selectedType === 'All' || sm.type === selectedType;
    return matchSubject && matchType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'Note': return <BookOpen size={16} />;
      case 'PDF': return <FileText size={16} />;
      case 'Diagram': return <ImageIcon size={16} />;
      case 'Video': return <Video size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getSubjectBadgeClass = (subject: string) => {
    switch (subject) {
      case 'Physics': return 'badge-physics';
      case 'Chemistry': return 'badge-chemistry';
      case 'Mathematics': return 'badge-mathematics';
      case 'Biology': return 'badge-biology';
      default: return '';
    }
  };

  if (activeMaterial) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setActiveMaterial(null)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Library
          </button>
          <span className={`badge ${getSubjectBadgeClass(activeMaterial.subject)}`}>
            {activeMaterial.subject}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Topic: {activeMaterial.topic}
          </span>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            {activeMaterial.title}
          </h2>
          
          <div style={{ marginTop: '20px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: 'var(--text-main)', fontSize: '0.95rem' }}>
            {/* Simple Markdown Preview simulation */}
            {activeMaterial.content}
          </div>

          {activeMaterial.url && (
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reference Asset Location:</span>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{activeMaterial.url}</p>
              </div>
              <a href={activeMaterial.url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ExternalLink size={16} /> Open Document
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Study Material Repository
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Review board-standard revision notes, equations guides, diagrams, and video resources.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div 
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          padding: '16px 20px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Subject:</span>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value as any)}
            className="form-select"
            style={{ width: '150px', padding: '6px 10px' }}
          >
            <option value="All">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Biology">Biology</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Format:</span>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="form-select"
            style={{ width: '140px', padding: '6px 10px' }}
          >
            <option value="All">All Formats</option>
            <option value="Note">Revision Notes</option>
            <option value="PDF">PDF Sheets</option>
            <option value="Diagram">Diagrams</option>
            <option value="Video">Video Guides</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-light)' }}>
          Showing {filteredMaterials.length} materials
        </div>
      </div>

      {/* Materials Grid list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredMaterials.map(sm => (
          <div key={sm.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className={`badge ${getSubjectBadgeClass(sm.subject)}`}>
                  {sm.subject}
                </span>
                <span 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                  title={`Asset type: ${sm.type}`}
                >
                  {getIcon(sm.type)}
                  <span>{sm.type}</span>
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px', lineBreak: 'anywhere' }}>
                {sm.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '16px' }}>
                Topic: {sm.topic}
              </p>
            </div>
            
            <button 
              onClick={() => setActiveMaterial(sm)} 
              className="btn btn-secondary btn-sm" 
              style={{ width: '100%' }}
            >
              Open Material
            </button>
          </div>
        ))}

        {filteredMaterials.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No study materials match your search parameters.
          </div>
        )}
      </div>
    </div>
  );
};
