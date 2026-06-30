import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, FileText, Video, Image as ImageIcon } from 'lucide-react';
import axios from '../../axios';

export const MaterialRepository: React.FC = () => {
  // Live States
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'>('Physics');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'Note' | 'PDF' | 'Diagram' | 'Video'>('Note');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch from DB
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('mht_cet_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get('http://localhost:5000/api/student/materials', { headers });
      setMaterials(response.data);
    } catch (err) {
      console.error('Error fetching study materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !topic || !content) {
      alert('Please fill in required fields.');
      return;
    }

    try {
      const token = localStorage.getItem('mht_cet_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post('http://localhost:5000/api/faculty/materials', {
        title,
        subject,
        topic,
        format: type,
        file_url: url || 'N/A',
        is_published: true
      }, { headers });

      alert('Study asset successfully published to database!');
      // Reset Form
      setTitle('');
      setTopic('');
      setContent('');
      setUrl('');
      setShowAddForm(false);
      fetchMaterials();
    } catch (err) {
      console.error('Error publishing study asset:', err);
      alert('Failed to publish study asset.');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Note': return <BookOpen size={14} />;
      case 'PDF': return <FileText size={14} />;
      case 'Diagram': return <ImageIcon size={14} />;
      case 'Video': return <Video size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getSubjectBadge = (subj: string) => {
    switch (subj) {
      case 'Physics': return 'badge-physics';
      case 'Chemistry': return 'badge-chemistry';
      case 'Mathematics': return 'badge-mathematics';
      case 'Biology': return 'badge-biology';
      default: return '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            Study Material Repository Manager
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Publish board notes, download cheat-sheets, link video lectures, and diagram guidelines.
          </p>
        </div>
        <button onClick={() => setShowAddForm(prev => !prev)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> {showAddForm ? 'Close Editor' : 'Publish Study Asset'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Create New Reference Asset</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Asset Title</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Chemical Kinetics integrated law formulas"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Subject</label>
              <select className="form-select" value={subject} onChange={(e) => setSubject(e.target.value as any)}>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Syllabus Topic Chapter</label>
              <input
                type="text"
                className="form-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g. Chemical Kinetics"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Asset Format</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="Note">Revision Notes (Markdown)</option>
                <option value="PDF">PDF Download Link</option>
                <option value="Diagram">Concept Diagram</option>
                <option value="Video">Video Lecture URL</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">External URL Link (if applicable)</label>
              <input
                type="url"
                className="form-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="E.g. https://education.gov/syllabus/materials.pdf"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Content Summary or Notes Markdown</label>
            <textarea
              className="form-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste Markdown formulas or description details here..."
              style={{ minHeight: '120px' }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
            Publish Study Asset
          </button>
        </form>
      )}

      {/* Materials List Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Active Syllabus Materials</h3>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading materials...</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Topic</th>
                  <th>Format</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(sm => (
                  <tr key={sm.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sm.title}</td>
                    <td>
                      <span className={`badge ${getSubjectBadge(sm.subject)}`}>{sm.subject}</span>
                    </td>
                    <td>{sm.topic}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                        {getIcon(sm.type)}
                        <span>{sm.type}</span>
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={async () => { 
                          if (confirm('Delete this study material?')) {
                            try {
                              const token = localStorage.getItem('mht_cet_token');
                              const headers = token ? { Authorization: `Bearer ${token}` } : {};
                              await axios.delete(`http://localhost:5000/api/faculty/materials/${sm.id}`, { headers });
                              fetchMaterials();
                            } catch (err) {
                              console.error('Error deleting study material:', err);
                              alert('Failed to delete study material.');
                            }
                          }
                        }} 
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No study materials published yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
