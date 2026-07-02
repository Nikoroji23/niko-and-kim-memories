import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getMemories, saveMemory } from '../utils/localDB';
import { uploadToBucket, insertRow, subscribeToTable } from '../utils/supabaseClient';

function Memories({ user }) {
  const [memories, setMemories] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Vacations');
  const [emoji, setEmoji] = useState('📸');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [selectedMemory, setSelectedMemory] = useState(null);

  const categories = useMemo(() => ['Vacations', 'Food Dates', 'Birthdays', 'Holidays', 'Random Moments'], []);

  const memoryGroups = useMemo(() => {
    const groups = [...new Set(memories.map((memory) => memory.category || 'Uncategorized'))];
    return groups.length ? groups : categories;
  }, [memories, categories]);

  const fetchMemories = useCallback(async () => {
    try {
      const list = await getMemories(user.id);
      const mapped = list.map((m) => ({
        ...m,
        photo_url: m.photo_blob ? URL.createObjectURL(m.photo_blob) : null,
      }));
      setMemories(mapped.reverse());
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview('');
      return;
    }
    const previewUrl = URL.createObjectURL(photo);
    setPhotoPreview(previewUrl);
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [photo]);

  useEffect(() => {
    if (user?.id) {
      fetchMemories();
      let unsubscribe = null;
      try {
        unsubscribe = subscribeToTable('memories', (payload) => {
          const row = payload?.new || payload?.record || payload;
          if (!row) return;
          const mapped = {
            ...row,
            photo_url: row.media_url || row.photo_url || null,
          };
          setMemories((prev) => [{ ...mapped }, ...prev]);
        });
      } catch (err) {
        // Supabase not configured, continue using local DB
      }
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user?.id, fetchMemories]);

  const handleAddMemory = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Enter a memory title.');
      return;
    }
    try {
      const saved = await saveMemory(user.id, { title: title.trim(), emoji, category, photoFile: photo, createdBy: { id: user.id, name: user.name } });
      const withUrl = { ...saved, photo_url: saved.photo_blob ? URL.createObjectURL(saved.photo_blob) : null };
      setMemories((prev) => [withUrl, ...prev]);
      // Attempt to upload photo to Supabase Storage and insert a row for cross-device sync
      try {
        let mediaUrl = null;
        if (photo) {
          mediaUrl = await uploadToBucket('media', photo, `${user.id}/${Date.now()}-${photo.name}`);
        }
        await insertRow('memories', {
          title: title.trim(),
          emoji,
          category,
          media_url: mediaUrl,
          created_by: { id: user.id, name: user.name },
        });
      } catch (err) {
        // ignore supabase errors — app continues to work offline/local
        // console.warn('Supabase memory upload/insert failed', err);
      }
      setTitle('');
      setPhoto(null);
    } catch (err) {
      setError('Unable to save memory.');
      console.error(err);
    }
  };

  const openMemory = (memory) => setSelectedMemory(memory);
  const closeMemory = () => setSelectedMemory(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 p-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/dashboard" className="text-pink-600 font-bold hover:underline text-lg mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="text-center">
            <motion.div className="text-6xl mb-3 inline-block" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              📸
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Memory Gallery
            </h1>
            <p className="text-gray-600 text-lg">Capture and save your favorite moments together 💕</p>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-3xl shadow-lg p-8 border-3 border-orange-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6 gap-4 flex-col md:flex-row">
            <div>
              <h2 className="text-2xl font-bold text-orange-600">Add a New Memory</h2>
              <p className="text-gray-600">Save a moment today and keep it forever.</p>
            </div>
            <span className="rounded-full bg-orange-100 px-4 py-2 text-orange-700">{memories.length} memories saved</span>
          </div>

          {error && <div className="mb-4 rounded-2xl bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>}

          <form onSubmit={handleAddMemory} className="grid gap-4 md:grid-cols-4">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="rounded-3xl border-2 border-orange-200 px-4 py-3 bg-orange-50 focus:border-orange-400 focus:outline-none"
              placeholder="Emoji"
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-3xl border-2 border-orange-200 px-4 py-3 bg-orange-50 focus:border-orange-400 focus:outline-none md:col-span-2"
              placeholder="Memory title"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-3xl border-2 border-orange-200 px-4 py-3 bg-orange-50 focus:border-orange-400 focus:outline-none"
            >
              {categories.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <label className="rounded-3xl border-2 border-orange-200 px-4 py-3 bg-orange-50 flex items-center justify-between cursor-pointer text-gray-700">
              <span>{photo ? photo.name : 'Choose a photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            {photo && (
              <div className="md:col-span-4 rounded-3xl border border-orange-200 bg-white p-4 shadow-sm flex items-center gap-4">
                <img
                  src={photoPreview}
                  alt={title || 'Preview'}
                  className="h-20 w-20 rounded-3xl object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Preview</p>
                  <p className="text-sm text-slate-500">This will open as a cute photo folder when saved.</p>
                </div>
              </div>
            )}
            <button
              type="submit"
              className="md:col-span-4 rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 hover:opacity-95 transition"
            >
              Save Memory
            </button>
          </form>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {memories.length === 0 ? (
            <motion.div
              className="rounded-3xl border border-orange-200 bg-orange-50 p-10 text-center text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No memories yet. Add a memory to see your gallery grow.
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
                      <span className="rounded-full bg-orange-100 px-4 py-2 text-orange-700 font-semibold">Folder style</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {sectionMemories.map((memory, idx) => (
                        <motion.button
                          key={memory.id}
                          onClick={() => openMemory(memory)}
                          className="group relative overflow-hidden rounded-3xl border-2 border-orange-200 bg-white p-6 text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.04 }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-4xl">{memory.emoji}</div>
                            <div className="flex flex-col gap-2 items-end">
                              <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                                {memory.title ? 'Folder' : 'Note'}
                              </div>
                              {memory.created_by && (
                                <div className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
                                  by {memory.created_by.name}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600 uppercase tracking-[0.18em]">Open folder</div>
                          <div className="space-y-3">
                            <div className="text-lg font-bold text-gray-800 truncate">{memory.title || 'Untitled memory'}</div>
                            <p className="text-sm text-slate-500">{memory.created_at || ''}</p>
                            <p className="text-sm text-gray-600">{memory.category}</p>
                          </div>
                          {memory.photo_url ? (
                            <div className="mt-5 rounded-3xl border border-orange-100 overflow-hidden bg-slate-50">
                              <img src={memory.photo_url} alt={memory.title || 'Memory'} className="h-40 w-full object-cover transition duration-200 group-hover:scale-105" />
                            </div>
                          ) : (
                            <div className="mt-5 rounded-3xl border border-dashed border-orange-200 bg-orange-50 p-6 text-center text-orange-700">
                              Add a photo to open the cute view
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              })
          )}
        </motion.div>
      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeMemory}>
          <motion.div
            className="relative w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeMemory}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
            >
              ✕
            </button>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1 rounded-[2rem] overflow-hidden border border-orange-200 bg-slate-100">
                {selectedMemory.photo_url ? (
                  <img
                    src={selectedMemory.photo_url}
                    alt={selectedMemory.title}
                    className="h-96 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-96 items-center justify-center bg-orange-50 text-orange-600 text-center p-8">
                    No photo available yet.
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="text-3xl">{selectedMemory.emoji}</div>
                  <h2 className="text-3xl font-bold text-slate-900 mt-3">{selectedMemory.title}</h2>
                  <p className="text-sm uppercase tracking-[0.24em] text-orange-600 mt-2">{selectedMemory.category}</p>
                </div>
                <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
                  <p className="text-sm text-slate-700">This memory is saved in a cute folder for us. Open it anytime to remember our special moment.</p>
                  <p className="mt-3 text-xs text-slate-500">Saved on {selectedMemory.created_at || 'unknown date'}</p>
                </div>
                {selectedMemory.photo_url && (
                  <button
                    type="button"
                    onClick={closeMemory}
                    className="w-full rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 hover:opacity-95 transition"
                  >
                    Close folder
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </div>
    </div>
  );
}

export default Memories;
