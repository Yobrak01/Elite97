import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Save, Trash2, Tag, LayoutTemplate } from 'lucide-react';
import api from '../services/api';

export const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states for active note
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const fetchNotes = async () => {
    try {
      const res = await api.notes.getAll();
      setNotes(res.data || []);
      if (!activeNote && res.data && res.data.length > 0) {
        selectNote(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const selectNote = (note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content || '');
    setTags(note.tags ? note.tags.join(', ') : '');
  };

  const handleCreateNew = () => {
    setActiveNote({ isNew: true });
    setTitle('');
    setContent('');
    setTags('');
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    
    const noteData = {
      title,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      if (activeNote.isNew) {
        const res = await api.notes.create(noteData);
        await fetchNotes();
        selectNote(res.data);
      } else {
        const res = await api.notes.update(activeNote._id, noteData);
        await fetchNotes();
        selectNote(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note permanently?")) return;
    try {
      await api.notes.delete(id);
      setActiveNote(null);
      setTitle('');
      setContent('');
      setTags('');
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative h-10 w-10">
          <div className="absolute h-full w-full rounded-full border-4 border-navy-800"></div>
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-fade-in">
      
      {/* Sidebar List */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 max-h-[40vh] lg:max-h-none">
        <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Neural Notes</h2>
          </div>
          <button 
            onClick={handleCreateNew}
            className="p-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 rounded-lg transition-colors border border-cyan-500/30"
            title="New Entry"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto glass-panel rounded-2xl border border-white/10 p-2 space-y-2 custom-scrollbar">
          {notes.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
              No entries found.
            </div>
          ) : (
            notes.map(note => (
              <button
                key={note._id}
                onClick={() => selectNote(note)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${activeNote?._id === note._id ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}`}
              >
                <h3 className={`font-black truncate ${activeNote?._id === note._id ? 'text-cyan-400' : 'text-slate-300'}`}>
                  {note.title}
                </h3>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                    {note.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-navy-800 rounded text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-3">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 glass-panel rounded-2xl border border-white/10 flex flex-col relative overflow-hidden">
        {activeNote ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            
            {/* Editor Header */}
            <div className="p-6 border-b border-white/5 flex flex-col gap-4 relative z-10">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entry Title..."
                  className="bg-transparent text-2xl font-black text-white placeholder-slate-600 focus:outline-none w-full"
                />
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {!activeNote.isNew && (
                    <button 
                      onClick={() => handleDelete(activeNote._id)}
                      className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors border border-transparent hover:border-red-400/20"
                      title="Delete Entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button 
                    onClick={handleSave}
                    disabled={!title.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-glow-cyan"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-cyan-500/50" />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Tags (comma separated)..."
                  className="bg-transparent text-xs font-bold uppercase tracking-widest text-cyan-400 placeholder-slate-600 focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 p-6 relative z-10">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Initialize neural dump..."
                className="w-full h-full bg-transparent text-slate-300 resize-none focus:outline-none custom-scrollbar leading-relaxed"
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
            <LayoutTemplate className="h-16 w-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-black text-slate-400 tracking-widest uppercase">No Entry Selected</h3>
            <p className="text-xs font-semibold text-slate-500 mt-2 max-w-sm">
              Select an entry from the sidebar or initialize a new neural dump to begin documentation.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Notes;
