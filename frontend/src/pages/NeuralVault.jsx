import React, { useState, useEffect } from 'react';
import { Book, Brain, Plus, Trash2, X, Check, Save, Layers, Clock, Zap, UploadCloud, FileText } from 'lucide-react';
import api from '../services/api';

export const NeuralVault = () => {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'flashcards' | 'study'
  const [loading, setLoading] = useState(true);
  
  // Notes State
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });

  // Flashcards State
  const [flashcards, setFlashcards] = useState([]);
  const [dueCards, setDueCards] = useState([]);
  const [cardForm, setCardForm] = useState({ front: '', back: '', deckName: 'General' });
  const [showCardForm, setShowCardForm] = useState(false);

  // Study Mode State
  const [studyQueue, setStudyQueue] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // AI Generator State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourseUnit, setSelectedCourseUnit] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notesRes, cardsRes, dueRes, coursesRes] = await Promise.all([
        api.vault.getNotes(),
        api.vault.getFlashcards(),
        api.vault.getDueFlashcards(),
        api.courses.getAll()
      ]);
      setNotes(notesRes.data || []);
      setFlashcards(cardsRes.data || []);
      setDueCards(dueRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- NOTES LOGIC ---
  const handleSaveNote = async () => {
    if (!noteForm.title || !noteForm.content) return;
    try {
      if (selectedNote && selectedNote._id) {
        const res = await api.vault.updateNote(selectedNote._id, noteForm);
        setNotes(notes.map(n => n._id === selectedNote._id ? res.data : n));
        setSelectedNote(res.data);
      } else {
        const res = await api.vault.createNote(noteForm);
        setNotes([res.data, ...notes]);
        setSelectedNote(res.data);
      }
      setIsEditingNote(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await api.vault.deleteNote(id);
      setNotes(notes.filter(n => n._id !== id));
      if (selectedNote?._id === id) {
        setSelectedNote(null);
        setIsEditingNote(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createNewNote = () => {
    setSelectedNote(null);
    setNoteForm({ title: '', content: '' });
    setIsEditingNote(true);
  };

  // --- FLASHCARDS LOGIC ---
  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!cardForm.front || !cardForm.back) return;
    try {
      const res = await api.vault.createFlashcard(cardForm);
      setFlashcards([res.data, ...flashcards]);
      setCardForm({ front: '', back: '', deckName: cardForm.deckName });
      setShowCardForm(false);
      // Re-fetch due cards just in case
      const dueRes = await api.vault.getDueFlashcards();
      setDueCards(dueRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      await api.vault.deleteFlashcard(id);
      setFlashcards(flashcards.filter(c => c._id !== id));
      setDueCards(dueCards.filter(c => c._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const startStudySession = () => {
    if (dueCards.length === 0) return;
    setStudyQueue([...dueCards]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setActiveTab('study');
  };

  const handleReview = async (quality) => {
    const card = studyQueue[currentCardIndex];
    try {
      await api.vault.reviewFlashcard(card._id, quality);
      
      if (currentCardIndex + 1 < studyQueue.length) {
        setCurrentCardIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        // Finished queue
        setActiveTab('flashcards');
        fetchData(); // refresh due counts
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setGenerating(true);
    try {
      await api.vault.generateFromMaterial(selectedFile, selectedCourseUnit);
      setShowGenerateModal(false);
      setSelectedFile(null);
      setSelectedCourseUnit('');
      await fetchData(); // Refresh all data to show new generated items
    } catch (err) {
      console.error("Failed to generate:", err);
      alert("AI Generation Failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // --- UI RENDERERS ---

  const renderNotesTab = () => (
    <div className="flex h-[calc(100vh-160px)] gap-6 animate-fade-in">
      {/* Sidebar List */}
      <div className="w-1/3 glass-panel rounded-3xl border border-white/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
            <Book className="h-4 w-4 text-cyan-400" /> My Notes
          </h3>
          <button onClick={createNewNote} className="p-2 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {notes.map(note => (
            <div 
              key={note._id}
              onClick={() => { setSelectedNote(note); setIsEditingNote(false); setNoteForm({ title: note.title, content: note.content }); }}
              className={`p-4 rounded-xl cursor-pointer transition-all ${selectedNote?._id === note._id ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <p className="font-bold text-white truncate">{note.title}</p>
              <p className="text-xs text-slate-500 truncate mt-1">{note.content.substring(0, 50)}...</p>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm font-bold">No notes found. Create one.</div>
          )}
        </div>
      </div>

      {/* Editor/View Area */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/10 flex flex-col overflow-hidden relative">
        {isEditingNote ? (
          <div className="flex-1 flex flex-col h-full bg-navy-900/40">
            <div className="p-4 border-b border-white/5 flex items-center gap-4">
              <input 
                type="text" 
                placeholder="Note Title..." 
                value={noteForm.title}
                onChange={e => setNoteForm({...noteForm, title: e.target.value})}
                className="flex-1 bg-transparent text-xl font-black text-white focus:outline-none placeholder-slate-600"
              />
              <button onClick={handleSaveNote} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-colors">
                <Save className="h-4 w-4" /> Save
              </button>
              {selectedNote && (
                <button onClick={() => setIsEditingNote(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <textarea 
              value={noteForm.content}
              onChange={e => setNoteForm({...noteForm, content: e.target.value})}
              placeholder="Start typing your structured knowledge here..."
              className="flex-1 w-full bg-transparent p-6 text-slate-300 resize-none focus:outline-none custom-scrollbar"
            />
          </div>
        ) : selectedNote ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="p-6 border-b border-white/5 flex items-start justify-between bg-white/[0.02]">
              <div>
                <h2 className="text-2xl font-black text-white">{selectedNote.title}</h2>
                <p className="text-xs text-slate-500 mt-2">Last updated: {new Date(selectedNote.updatedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditingNote(true)} className="p-2 hover:bg-white/10 text-slate-300 rounded-lg transition-colors">
                  <Book className="h-4 w-4" />
                </button>
                <button onClick={() => handleDeleteNote(selectedNote._id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">
                {selectedNote.content}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Book className="h-16 w-16 mb-4 opacity-20" />
            <p className="font-bold">Select a note or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderFlashcardsTab = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats & Study Button */}
      <div className="glass-panel rounded-3xl border border-white/10 p-8 flex items-center justify-between relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <Brain className="w-64 h-64 text-cyan-500" />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black uppercase tracking-widest text-white flex items-center gap-3">
            <Zap className="h-6 w-6 text-cyan-400" /> Spaced Repetition Engine
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-2 max-w-lg">
            Active recall is the fastest path to neural retention. You have <strong className="text-cyan-400">{dueCards.length} cards</strong> due for review today.
          </p>
        </div>
        <div className="relative z-10">
          <button 
            onClick={startStudySession}
            disabled={dueCards.length === 0}
            className="flex items-center gap-3 px-8 py-4 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Layers className="h-5 w-5" /> Start Review
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Card Creation */}
        <div className="w-1/3">
          <div className="glass-panel rounded-3xl border border-white/10 p-6">
            <h3 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2 mb-6">
              <Plus className="h-4 w-4 text-cyan-400" /> Create Flashcard
            </h3>
            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Deck Name</label>
                <input required type="text" value={cardForm.deckName} onChange={e => setCardForm({...cardForm, deckName: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Front (Question)</label>
                <textarea required rows="3" value={cardForm.front} onChange={e => setCardForm({...cardForm, front: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Back (Answer)</label>
                <textarea required rows="3" value={cardForm.back} onChange={e => setCardForm({...cardForm, back: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-white hover:text-cyan-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                Add Card
              </button>
            </form>
          </div>
        </div>

        {/* Card List */}
        <div className="w-2/3">
          <div className="glass-panel rounded-3xl border border-white/10 p-6 h-[calc(100vh-340px)] flex flex-col">
            <h3 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2 mb-6">
              <Layers className="h-4 w-4 text-cyan-400" /> All Cards ({flashcards.length})
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
              {flashcards.map(card => (
                <div key={card._id} className="p-4 bg-navy-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/50 bg-cyan-500/10 px-2 py-1 rounded inline-block mb-2">{card.deckName}</span>
                      <p className="text-sm font-bold text-white mb-2">{card.front}</p>
                      <p className="text-sm text-slate-400 border-l-2 border-white/10 pl-3">{card.back}</p>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due: {new Date(card.nextReviewDate).toLocaleDateString()}</span>
                        <span>Level: {card.repetition}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCard(card._id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {flashcards.length === 0 && (
                <div className="text-center text-slate-500 py-10 font-bold">No flashcards yet. Build your deck.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudyMode = () => {
    const card = studyQueue[currentCardIndex];
    if (!card) return null;

    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center animate-fade-in">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => {setActiveTab('flashcards'); fetchData();}} className="text-slate-500 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors">
              <X className="h-4 w-4" /> Exit Review
            </button>
            <div className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">
              Card {currentCardIndex + 1} of {studyQueue.length}
            </div>
          </div>

          {/* The Card */}
          <div className="relative w-full aspect-video perspective-1000">
            <div className={`w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute w-full h-full backface-hidden glass-panel border border-cyan-500/30 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-[0_20px_50px_rgba(6,182,212,0.15)] bg-gradient-to-b from-navy-900/90 to-navy-800/90">
                <span className="absolute top-6 left-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{card.deckName}</span>
                <p className="text-3xl font-black text-white leading-tight">{card.front}</p>
              </div>
              {/* Back */}
              <div className="absolute w-full h-full backface-hidden rotate-y-180 glass-panel border border-green-500/30 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-[0_20px_50px_rgba(34,197,94,0.15)] bg-gradient-to-b from-navy-900/90 to-navy-800/90">
                 <span className="absolute top-6 left-6 text-[10px] font-black uppercase tracking-widest text-green-500/50">Answer</span>
                 <p className="text-2xl font-bold text-slate-300 leading-relaxed">{card.back}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-10 flex justify-center h-16">
            {!isFlipped ? (
              <button 
                onClick={() => setIsFlipped(true)}
                className="px-10 py-4 bg-cyan-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-1"
              >
                Reveal Answer
              </button>
            ) : (
              <div className="flex gap-4 animate-fade-in">
                <button onClick={() => handleReview(0)} className="px-6 py-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                  Blackout (1)
                </button>
                <button onClick={() => handleReview(2)} className="px-6 py-4 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all">
                  Hard (2)
                </button>
                <button onClick={() => handleReview(4)} className="px-6 py-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all">
                  Good (4)
                </button>
                <button onClick={() => handleReview(5)} className="px-6 py-4 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all">
                  Perfect (5)
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <Brain className="h-8 w-8 text-cyan-400" />
            Neural Vault
          </h1>
          <p className="text-slate-400 mt-2 font-semibold">Knowledge Retention & Active Recall Engine</p>
        </div>
        
        {activeTab !== 'study' && (
          <div className="flex bg-navy-900 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'notes' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'flashcards' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Flashcards
            </button>
          </div>
        )}
        
        <button 
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 hover:shadow-glow-purple rounded-lg font-black text-xs uppercase tracking-widest transition-all"
        >
          <Zap className="h-4 w-4 text-purple-400" /> Neural Extraction
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      ) : (
        <>
          {activeTab === 'notes' && renderNotesTab()}
          {activeTab === 'flashcards' && renderFlashcardsTab()}
          {activeTab === 'study' && renderStudyMode()}
        </>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel max-w-md w-full rounded-3xl border border-purple-500/30 p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] relative overflow-hidden">
            {generating && (
               <div className="absolute inset-0 bg-navy-950/90 z-20 flex flex-col items-center justify-center backdrop-blur-md animate-fade-in">
                 <div className="relative">
                   <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                   <Brain className="h-12 w-12 text-purple-400 m-4 animate-pulse" />
                 </div>
                 <p className="mt-6 text-sm font-black uppercase tracking-widest text-purple-300 animate-pulse">Running Neural Extraction...</p>
                 <p className="mt-2 text-xs text-slate-400 font-semibold max-w-[250px] text-center">Gemini is analyzing your document, formulating concepts, and creating spaced-repetition flashcards.</p>
               </div>
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-400" /> Neural Extraction
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-2">Upload a syllabus or lecture PDF to automatically generate study notes and SM-2 flashcards.</p>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-500 hover:text-white transition-colors p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Select Course Unit (Optional)</label>
                <select 
                  value={selectedCourseUnit}
                  onChange={(e) => setSelectedCourseUnit(e.target.value)}
                  className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 appearance-none"
                >
                  <option value="">-- General Knowledge --</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.unitCode} - {c.unitName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Upload Material (PDF/TXT)</label>
                <div className="border-2 border-dashed border-white/10 hover:border-purple-500/50 rounded-xl p-8 text-center transition-colors bg-navy-900/50 relative">
                   <input 
                     type="file" 
                     accept=".pdf,.txt"
                     onChange={(e) => setSelectedFile(e.target.files[0])}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                   {selectedFile ? (
                     <div className="flex flex-col items-center gap-2">
                       <FileText className="h-8 w-8 text-purple-400" />
                       <span className="text-sm font-bold text-white">{selectedFile.name}</span>
                       <span className="text-xs text-slate-400">Ready to extract</span>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-2 text-slate-500">
                       <UploadCloud className="h-8 w-8" />
                       <span className="text-sm font-bold">Click or drag file here</span>
                       <span className="text-[10px] uppercase tracking-widest">PDF & TXT Supported</span>
                     </div>
                   )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={!selectedFile || generating}
                className="w-full py-4 bg-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-400 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                <Brain className="h-4 w-4" /> Start Extraction
              </button>
            </form>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
};

export default NeuralVault;
