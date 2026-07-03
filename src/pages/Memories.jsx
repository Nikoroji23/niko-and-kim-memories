import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createMemory, listMemories, subscribeToSharedTable } from '../utils/sharedData';

function Memories({ user }) {
  const [memories, setMemories] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Vacations');
  const [emoji, setEmoji] = useState('Photo');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const fileInputRef = useRef(null);

  const categories = useMemo(() => ['Vacations', 'Food Dates', 'Birthdays', 'Holidays', 'Random Moments'], []);

  const memoryGroups = useMemo(() => {
    const groups = [...new Set(memories.map((memory) => memory.category || 'Uncategorized'))];
    return groups.length ? groups : categories;
  }, [memories, categories]);

  const fetchMemories = useCallback(async () => {
    try {
      const list = await listMemories();
      setMemories(list);
    } catch (err) {
      console.error(err);
      setError('Unable to load shared memories. Run the Supabase schema and check storage policies.');
    }
  }, []);

  useEffect(() => {
    fetchMemories();
    const unsubscribeMemories = subscribeToSharedTable('shared_memories', fetchMemories);
    const unsubscribeMedia = subscribeToSharedTable('shared_memory_media', fetchMemories);
    const interval = setInterval(fetchMemories, 8000);
    return () => {
      unsubscribeMemories();
      unsubscribeMedia();
      clearInterval(interval);
    };
  }, [fetchMemories]);

  useEffect(() => {
    const nextPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      media_type: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setPreviews(nextPreviews);
    return () => nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [files]);

  const mediaFor = (memory) => memory.shared_memory_media || [];
  const coverMedia = (memory) => mediaFor(memory)[0];

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const removeSelectedFile = (fileToRemove) => {
    setFiles((selectedFiles) => selectedFiles.filter((file) => file !== fileToRemove));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearSelectedFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddMemory = async (event) => {
    event.preventDefault();
    setError('');
    if (!title.trim()) return setError('Enter a memory title.');

    setLoading(true);
    try {
      const saved = await createMemory(user, { title: title.trim(), emoji, category }, files);
      setMemories((prev) => [saved, ...prev]);
      setTitle('');
      clearSelectedFiles();
    } catch (err) {
      console.error(err);
      setError('Unable to save memory. Check that the Supabase media bucket and shared tables exist.');
    } finally {
      setLoading(false);
    }
  };

  const openMemory = (memory) => setSelectedMemory(memory);
  const closeMemory = () => setSelectedMemory(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 p-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/dashboard" className="text-pink-600 font-bold hover:underline text-lg mb-4 inline-block">Back to Dashboard</Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">Memory Gallery</h1>
            <p className="text-gray-600 text-lg">Photos and videos sync for Niko and Kim.</p>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-3xl shadow-lg p-8 border-3 border-orange-200 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6 gap-4 flex-col md:flex-row">
            <div>
              <h2 className="text-2xl font-bold text-orange-600">Add a New Memory</h2>
              <p className="text-gray-600">Upload one or many photos/videos for both of you.</p>
            </div>
            <span className="rounded-full bg-orange-100 px-4 py-2 text-orange-700">{memories.length} memories saved</span>
          </div>

          {error && <div className="mb-4 rounded-2xl bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>}

          <form onSubmit={handleAddMemory} className="grid gap-4 md:grid-cols-4">
            <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="rounded-3xl border-2 border-orange-200 px-4 py-3 bg-orange-50 focus:border-orange-400 focus:outline-none" placeholder="Emoji or label" />
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-3xl border-2 border-orange-200 px-4 py-3 bg-orange-50 focus:border-orange-400 focus:outline-none md:col-span-2" placeholder="Memory title" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-3xl border-2 border-orange-200 px-4 py-3 bg-orange-50 focus:border-orange-400 focus:outline-none">
              {categories.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <label className="md:col-span-4 rounded-3xl border-2 border-orange-200 px-4 py-3 bg-orange-50 flex items-center justify-between cursor-pointer text-gray-700">
              <span>{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Choose photos or videos'}</span>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />
            </label>
            {previews.length > 0 && (
              <div className="md:col-span-4 rounded-3xl border border-orange-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Selected uploads</p>
                  <button
                    type="button"
                    onClick={clearSelectedFiles}
                    className="rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-100"
                  >
                    Remove all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {previews.map((preview) => (
                  <div key={preview.url} className="relative overflow-hidden rounded-2xl border border-orange-100 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(preview.file)}
                      className="absolute right-2 top-2 z-10 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-red-600 shadow hover:bg-red-50"
                    >
                      Remove
                    </button>
                    {preview.media_type === 'video' ? (
                      <video src={preview.url} className="h-28 w-full object-cover" controls />
                    ) : (
                      <img src={preview.url} alt={preview.file.name} className="h-28 w-full object-cover" />
                    )}
                    <p className="truncate px-2 py-1 text-xs text-slate-600">{preview.file.name}</p>
                  </div>
                ))}
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="md:col-span-4 rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 hover:opacity-95 transition disabled:opacity-60">
              {loading ? 'Uploading...' : 'Save Shared Memory'}
            </button>
          </form>
        </motion.div>

        <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {memories.length === 0 ? (
            <motion.div className="rounded-3xl border border-orange-200 bg-orange-50 p-10 text-center text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              No memories yet. Add one to start your shared gallery.
            </motion.div>
          ) : (
            memoryGroups.map((section) => {
              const sectionMemories = memories.filter((item) => item.category === section);
              if (sectionMemories.length === 0) return null;
              return (
                <div key={section} className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-2xl font-bold text-orange-600">{section}</h3>
                      <p className="text-sm text-slate-600">{sectionMemories.length} saved moment{sectionMemories.length > 1 ? 's' : ''}</p>
                    </div>
                    <span className="rounded-full bg-orange-100 px-4 py-2 text-orange-700 font-semibold">Shared</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sectionMemories.map((memory, index) => {
                      const cover = coverMedia(memory);
                      return (
                        <motion.button key={memory.id} onClick={() => openMemory(memory)} className="group relative overflow-hidden rounded-3xl border-2 border-orange-200 bg-white p-6 text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-xl font-bold text-orange-600">{memory.emoji}</div>
                            <div className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-purple-700">by {memory.created_by_name || 'Niko'}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-lg font-bold text-gray-800 truncate">{memory.title || 'Untitled memory'}</div>
                            <p className="text-sm text-slate-500">{memory.created_at ? new Date(memory.created_at).toLocaleString() : ''}</p>
                            <p className="text-sm text-gray-600">{mediaFor(memory).length} file{mediaFor(memory).length === 1 ? '' : 's'}</p>
                          </div>
                          {cover ? (
                            <div className="mt-5 rounded-3xl border border-orange-100 overflow-hidden bg-slate-50">
                              {cover.media_type === 'video' ? (
                                <video src={cover.url} className="h-40 w-full object-cover" muted />
                              ) : (
                                <img src={cover.url} alt={memory.title || 'Memory'} className="h-40 w-full object-cover transition duration-200 group-hover:scale-105" />
                              )}
                            </div>
                          ) : (
                            <div className="mt-5 rounded-3xl border border-dashed border-orange-200 bg-orange-50 p-6 text-center text-orange-700">No media attached</div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </motion.div>

        {selectedMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeMemory}>
            <motion.div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200" initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} onClick={(event) => event.stopPropagation()}>
              <button type="button" onClick={closeMemory} className="absolute right-4 top-4 rounded-full bg-slate-100 p-3 text-slate-600 hover:bg-slate-200">Close</button>
              <div className="mb-6 pr-20">
                <div className="text-xl font-bold text-orange-600">{selectedMemory.emoji}</div>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">{selectedMemory.title}</h2>
                <p className="text-sm uppercase tracking-[0.24em] text-orange-600 mt-2">{selectedMemory.category}</p>
                <p className="mt-2 text-sm text-slate-500">Saved by {selectedMemory.created_by_name || 'Niko'}</p>
              </div>
              {mediaFor(selectedMemory).length === 0 ? (
                <div className="rounded-3xl bg-orange-50 p-8 text-center text-orange-700">No media in this memory.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {mediaFor(selectedMemory).map((item) => (
                    <div key={item.id || item.url} className="overflow-hidden rounded-3xl border border-orange-200 bg-slate-50">
                      {item.media_type === 'video' ? (
                        <video src={item.url} className="max-h-[520px] w-full bg-black object-contain" controls />
                      ) : (
                        <img src={item.url} alt={item.file_name || selectedMemory.title} className="max-h-[520px] w-full object-contain" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Memories;
