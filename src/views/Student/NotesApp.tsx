import React, { useState } from 'react';
import { useLms } from '../../context/LmsContext';
import { UserNote } from '../../data/mockData';
import { Plus, Save, Trash2, Download, BookOpen, FileText } from 'lucide-react';

export const NotesApp: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote } = useLms();
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [title, setTitle] = useState(notes[0]?.title || '');
  const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'>(notes[0]?.subject || 'Physics');
  const [topic, setTopic] = useState(notes[0]?.topic || '');
  const [content, setContent] = useState(notes[0]?.content || '');

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleSelectNote = (note: UserNote) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setSubject(note.subject);
    setTopic(note.topic);
    setContent(note.content);
  };

  const handleNewNote = () => {
    const tempTitle = 'New Note';
    const tempSubject = 'Physics';
    const tempTopic = 'General';
    const tempContent = '# Title\nType notes here...';
    
    addNote({
      title: tempTitle,
      subject: tempSubject,
      topic: tempTopic,
      content: tempContent
    });

    // Automatically select the newly created note (which goes to index 0)
    // We defer setting values until state updates
  };

  // Sync state if notes array changes (e.g. after adding/deleting)
  React.useEffect(() => {
    if (notes.length > 0) {
      const current = notes.find(n => n.id === activeNoteId) || notes[0];
      if (current && current.id !== activeNoteId) {
        handleSelectNote(current);
      }
    } else {
      setActiveNoteId('');
      setTitle('');
      setTopic('');
      setContent('');
    }
  }, [notes]);

  const handleSave = () => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, content, title);
    // Alert user with standard non-blocking notification
    alert('Note saved successfully!');
  };

  const handleDelete = () => {
    if (!activeNoteId) return;
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(activeNoteId);
    }
  };

  // Compile a structured HTML/print view and trigger print/PDF generation
  const handleDownloadPDF = () => {
    if (!activeNoteId) return;

    // Create a new window for print format isolation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to export note as PDF.');
      return;
    }

    // Convert markdown headers and lists for simple rendering
    const htmlContent = content
      .replace(/^# (.*$)/gim, '<h1 style="font-family:\'Outfit\',sans-serif;font-size:24pt;color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="font-family:\'Outfit\',sans-serif;font-size:18pt;color:#334155;margin-top:16pt;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="font-family:\'Outfit\',sans-serif;font-size:14pt;color:#475569;">$1</h3>')
      .replace(/^\- (.*$)/gim, '<li style="margin-left:20px;font-family:\'Inter\',sans-serif;font-size:11pt;color:#334155;line-height:1.6;">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .split('\n')
      .map(line => line.trim().startsWith('<h') || line.trim().startsWith('<li') ? line : `<p style="font-family:\'Inter\',sans-serif;font-size:11pt;color:#334155;line-height:1.6;margin-bottom:8px;">${line}</p>`)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - MHT-CET Notes</title>
          <style>
            @media print {
              body { padding: 20mm; }
              .no-print { display: none; }
            }
            body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1e293b; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 24px; }
            .meta { font-size: 9pt; color: #64748b; margin-top: 4px; display: flex; gap: 16px; }
            .content { margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0;font-size:16pt;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;">MHT-CET STUDY ENGINE</h2>
            <div class="meta">
              <span>Subject: <strong>${subject}</strong></span>
              <span>Topic: <strong>${topic}</strong></span>
              <span>Compiled: <strong>${new Date().toLocaleDateString()}</strong></span>
            </div>
          </div>
          <div class="content">
            ${htmlContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              // Optional: close window after print dialog is closed
              // window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
            Personal Notes Canvas
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Jot down key mathematical formulas, organic reactions mechanism, and quick biological mnemonics.
          </p>
        </div>
        <button onClick={handleNewNote} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> New Note Sheet
        </button>
      </div>

      <div className="notes-layout">
        {/* Left List Pane */}
        <div className="notes-list">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, paddingBottom: '8px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
            Saved Sheets
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notes.map(note => (
              <div 
                key={note.id} 
                className={`notes-list-item ${activeNoteId === note.id ? 'active' : ''}`}
                onClick={() => handleSelectNote(note)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className={`badge ${getSubjectBadge(note.subject)}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                    {note.subject}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{note.lastUpdated}</span>
                </div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {note.title}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  Topic: {note.topic}
                </p>
              </div>
            ))}

            {notes.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>
                No note files. Click 'New Note Sheet' to begin.
              </p>
            )}
          </div>
        </div>

        {/* Right Editor Area */}
        {activeNoteId ? (
          <div className="note-editor">
            {/* Editor Toolbar Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>Note Sheet Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="E.g. Vectors cross product rules"
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>Subject</label>
                <select 
                  className="form-select" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value as any)}
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>Sub-Topic Chapter</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  placeholder="E.g. Vectors"
                />
              </div>
            </div>

            {/* Note Body Textarea */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Content (supports simple Markdown style)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 400 }}>
                  Use # for Headings, - for Bullets, ** for Bold
                </span>
              </label>
              
              <textarea 
                className="form-textarea" 
                value={content} 
                onChange={(e) => setContent(e.target.value)}
                placeholder="Markdown details..."
                style={{ flex: 1, minHeight: '300px', fontFamily: 'monospace', fontSize: '0.9rem', padding: '16px' }}
              />
            </div>

            {/* Editor Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px' }}>
              <button onClick={handleDelete} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}>
                <Trash2 size={16} /> Delete Sheet
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleDownloadPDF} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={16} /> Export as PDF (Print)
                </button>
                <button onClick={handleSave} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>Select a note file from the left sidebar or create a new one to begin editing.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
