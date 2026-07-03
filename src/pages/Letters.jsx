import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createLetter, deleteLetter, getPartnerName, getUserKey, isUnlocked, listLetters, subscribeToSharedTable } from '../utils/sharedData';
import { SanrioCornerDecoration } from '../components/SanrioDecorations';

const themes = [
  { name: 'My Melody', tone: 'from-pink-100 to-rose-50 border-pink-200', button: 'from-pink-400 to-rose-500', paper: 'bg-pink-50 border-pink-200' },
  { name: 'Kuromi', tone: 'from-purple-100 to-fuchsia-50 border-purple-200', button: 'from-purple-500 to-fuchsia-500', paper: 'bg-purple-50 border-purple-200' },
  { name: 'Cinnamoroll', tone: 'from-sky-100 to-cyan-50 border-sky-200', button: 'from-sky-400 to-cyan-500', paper: 'bg-sky-50 border-sky-200' },
  { name: 'Hello Kitty', tone: 'from-red-100 to-pink-50 border-red-200', button: 'from-red-400 to-pink-500', paper: 'bg-red-50 border-red-200' },
];

const types = [
  { title: 'Anniversary Letter', helper: 'For milestones and memories.' },
  { title: 'Appreciation Letter', helper: 'For thank-yous and soft moments.' },
  { title: 'Good Morning Letter', helper: 'For a sweet start to the day.' },
  { title: 'Future Letter', helper: 'Locked until the date you choose.' },
];

function Letters({ user }) {
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [selectedType, setSelectedType] = useState(types[0]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [letters, setLetters] = useState([]);
  const [activeTab, setActiveTab] = useState('received');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const userKey = getUserKey(user);
  const partnerName = getPartnerName(user);
  const isFutureLetter = selectedType.title === 'Future Letter';

  const fetchLetters = useCallback(async () => {
    try {
      setLetters(await listLetters());
    } catch (err) {
      console.error(err);
      setError('Unable to load shared letters. Run the latest Supabase schema first.');
    }
  }, []);

  useEffect(() => {
    fetchLetters();
    const unsubscribe = subscribeToSharedTable('shared_letters', fetchLetters);
    const interval = setInterval(fetchLetters, 6000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchLetters]);

  const sentLetters = useMemo(() => letters.filter((letter) => letter.sender_key === userKey), [letters, userKey]);
  const receivedLetters = useMemo(() => letters.filter((letter) => letter.recipient_key === userKey), [letters, userKey]);

  const handleSaveLetter = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!subject.trim() || !body.trim()) return setError('Please fill in both subject and letter body.');
    if (isFutureLetter && !unlockDate) return setError('Choose the date when this future letter can be opened.');

    setLoading(true);
    try {
      const saved = await createLetter(user, {
        theme: selectedTheme.name,
        type: selectedType.title,
        subject: subject.trim(),
        body: body.trim(),
        unlock_date: isFutureLetter ? unlockDate : null,
      });
      setLetters((prev) => [saved, ...prev]);
      setSubject('');
      setBody('');
      setUnlockDate('');
      setSuccess(isFutureLetter ? `Future letter saved for ${partnerName}.` : `Letter sent to ${partnerName}.`);
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      console.error(err);
      setError('Unable to save the letter. Check the shared_letters table and policies.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLetter(id);
      setLetters((prev) => prev.filter((letter) => letter.id !== id));
    } catch (err) {
      console.error(err);
      setError('Unable to delete this letter.');
    }
  };

  const renderLetter = (letter, canDelete = false) => {
    const theme = themes.find((item) => item.name === letter.theme) || themes[0];
    const unlocked = isUnlocked(letter);
    return (
      <motion.div key={letter.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl border-2 ${theme.paper} p-6 shadow-sm`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.24em] text-purple-600 font-black mb-2">{letter.theme} / {letter.type}</p>
            <p className="text-xs text-slate-500 mb-3">From {letter.sender_name} to {letter.recipient_name}</p>
            {letter.unlock_date && !unlocked ? (
              <div className="rounded-2xl border border-purple-200 bg-white/70 p-5 text-purple-700">
                <h3 className="text-xl font-bold mb-2">Future letter locked</h3>
                <p>This letter opens on {new Date(`${letter.unlock_date}T00:00:00`).toLocaleDateString()}.</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{letter.subject}</h3>
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">{letter.body}</div>
              </>
            )}
          </div>
          {canDelete && (
            <button type="button" onClick={() => handleDelete(letter.id)} className="rounded-2xl bg-white px-3 py-2 text-sm font-bold text-pink-600 border-2 border-pink-200 hover:bg-pink-50 transition">Delete</button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 p-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/dashboard" className="text-pink-600 font-bold hover:underline text-lg mb-4 inline-block">Back to Dashboard</Link>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">Love Letters</h1>
          <p className="text-gray-600 text-lg mt-2">Write letters that sync between Niko and Kim.</p>
        </motion.div>

        <motion.div className="bg-white rounded-3xl shadow-lg p-8 border-3 border-pink-200 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-pink-600 mb-6">Select a Theme</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {themes.map((theme) => (
              <button key={theme.name} type="button" onClick={() => setSelectedTheme(theme)} className={`rounded-2xl p-6 text-center transition shadow-md bg-gradient-to-br ${theme.button} text-white ${selectedTheme.name === theme.name ? 'ring-4 ring-pink-300' : 'hover:shadow-lg'}`}>
                <p className="font-bold">{theme.name}</p>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-3xl shadow-lg p-8 border-3 border-purple-200 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-purple-600 mb-6">Choose a Letter Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {types.map((letterType) => (
              <button key={letterType.title} type="button" onClick={() => setSelectedType(letterType)} className={`rounded-2xl p-6 text-center transition border-2 ${selectedType.title === letterType.title ? 'border-purple-500 bg-purple-100 shadow-lg' : 'border-purple-200 bg-purple-50 hover:shadow-md'}`}>
                <p className="font-bold text-gray-800">{letterType.title}</p>
                <p className="text-xs text-slate-500 mt-2">{letterType.helper}</p>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div className={`rounded-3xl shadow-lg p-8 border-3 mb-8 bg-gradient-to-br ${selectedTheme.tone}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-sky-700 mb-6">Write to {partnerName}</h2>
          {error && <div className="mb-4 rounded-2xl bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>}
          {success && <div className="mb-4 rounded-2xl bg-green-50 border-l-4 border-green-400 p-4 text-green-700">{success}</div>}
          <form onSubmit={handleSaveLetter} className="space-y-6">
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-3xl border-2 border-white/70 px-4 py-3 bg-white/80 focus:outline-none" placeholder="Subject" />
            {isFutureLetter && (
              <div>
                <label className="block text-gray-700 font-bold mb-2">Open this future letter on</label>
                <input type="date" value={unlockDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setUnlockDate(e.target.value)} className="w-full rounded-3xl border-2 border-white/70 px-4 py-3 bg-white/80 focus:outline-none" />
              </div>
            )}
            <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-3xl border-2 border-white/70 px-4 py-4 bg-white/80 focus:outline-none" placeholder="Write something sweet and meaningful..." />
            <button type="submit" disabled={loading} className="w-full rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-fuchsia-500 text-white font-bold py-3 hover:opacity-95 transition disabled:opacity-60">
              {loading ? 'Saving...' : `Send to ${partnerName}`}
            </button>
          </form>
        </motion.div>

        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('received')} className={`flex-1 rounded-2xl py-3 font-bold transition ${activeTab === 'received' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white border-2 border-purple-200 text-purple-600'}`}>From {partnerName} ({receivedLetters.length})</button>
          <button onClick={() => setActiveTab('sent')} className={`flex-1 rounded-2xl py-3 font-bold transition ${activeTab === 'sent' ? 'bg-pink-600 text-white shadow-lg' : 'bg-white border-2 border-pink-200 text-pink-600'}`}>My Letters ({sentLetters.length})</button>
        </div>

        <motion.div className="bg-gradient-to-br from-white via-pink-50 to-purple-50 rounded-3xl shadow-lg p-8 border-3 border-pink-200 relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <SanrioCornerDecoration position="top-left" size="md" />
          <SanrioCornerDecoration position="top-right" size="md" />
          <h2 className="text-2xl font-bold text-pink-600 mb-6">{activeTab === 'received' ? `Letters from ${partnerName}` : 'Letters I Sent'}</h2>
          {(activeTab === 'received' ? receivedLetters : sentLetters).length === 0 ? (
            <p className="text-gray-500 text-lg">No letters here yet.</p>
          ) : (
            <div className="grid gap-5">{(activeTab === 'received' ? receivedLetters : sentLetters).map((letter) => renderLetter(letter, activeTab === 'sent'))}</div>
          )}
          <SanrioCornerDecoration position="bottom-left" size="md" />
          <SanrioCornerDecoration position="bottom-right" size="md" />
        </motion.div>
      </div>
    </div>
  );
}

export default Letters;
