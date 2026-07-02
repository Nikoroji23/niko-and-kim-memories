import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getLetters, saveLetter, deleteLetter } from '../utils/localDB';
import { insertRow, subscribeToTable } from '../utils/supabaseClient';

// Quick partner email mapping. Update these if you use different accounts.
const NIKO_EMAIL = 'alfonsoaninias0527@gmail.com';
const KIM_EMAIL = 'decastrokimfaith@gmail.com';
import { SanrioCornerDecoration } from '../components/SanrioDecorations';

// Using client-side IndexedDB storage; no server API

function Letters({ user }) {
  const letterThemes = [
    { id: 1, name: 'My Melody', emoji: '🎀', color: 'from-pink-400 to-pink-600' },
    { id: 2, name: 'Kuromi', emoji: '😠', color: 'from-purple-400 to-purple-600' },
    { id: 3, name: 'Cinnamoroll', emoji: '☁️', color: 'from-yellow-400 to-yellow-600' },
    { id: 4, name: 'Hello Kitty', emoji: '😸', color: 'from-red-400 to-red-600' },
  ];

  const letterTypes = [
    { title: 'Anniversary Letter', emoji: '💕' },
    { title: 'Appreciation Letter', emoji: '🙏' },
    { title: 'Good Morning Letter', emoji: '☀️' },
    { title: 'Future Letter', emoji: '🔮' },
  ];

  const [selectedTheme, setSelectedTheme] = useState(letterThemes[0]);
  const [selectedType, setSelectedType] = useState(letterTypes[0]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sentLetters, setSentLetters] = useState([]);
  const [receivedLetters, setReceivedLetters] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importToken, setImportToken] = useState('');
  const [qrPreview, setQrPreview] = useState('');
  const [partnerId, setPartnerId] = useState(null);
  const [sendToPartner, setSendToPartner] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [editingPartnerEmail, setEditingPartnerEmail] = useState(false);
  const [activeTab, setActiveTab] = useState('sent');

  const fetchLetters = async () => {
    try {
      const list = await getLetters(user.id);
      // local implementation: treat stored letters as sent letters
      setSentLetters((list || []).reverse());
      setReceivedLetters([]);
      setPartnerId(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load letters.');
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchLetters();
      // keep local fetch, and also subscribe to Supabase realtime inserts
      const interval = setInterval(fetchLetters, 3000);
      let unsubscribe = null;
      try {
        unsubscribe = subscribeToTable('letters', (payload) => {
          const row = payload?.new || payload?.record || payload;
          if (!row) return;
          // If this row is addressed to this user, add to received
          if (String(row.sent_to_id) === String(user.id)) {
            setReceivedLetters((prev) => [{ ...row }, ...prev]);
          }
          // If this row was created by this user, add to sent
          if (String(row.created_by?.id) === String(user.id)) {
            setSentLetters((prev) => [{ ...row }, ...prev]);
          }
        });
      } catch (err) {
        // Supabase not configured or subscribe failed — continue with local polling
        // console.warn('Supabase subscribe failed', err);
      }

      return () => {
        clearInterval(interval);
        if (unsubscribe) unsubscribe();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('partnerEmail');
      if (stored) setPartnerEmail(stored);
    } catch (err) {
      // ignore
    }
  }, []);

  const exportTokenForLetter = async (letter) => {
    try {
      const payload = JSON.stringify(letter);
      const token = btoa(unescape(encodeURIComponent(payload)));
      await navigator.clipboard.writeText(token);
      setSuccess('Share token copied to clipboard!');
      // show QR preview
      setQrPreview(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(token)}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Export failed', err);
      setError('Unable to create share token.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleImportToken = async () => {
    setError('');
    setSuccess('');
    if (!importToken.trim()) {
      setError('Paste a valid token or scan QR first.');
      return;
    }
    try {
      const decoded = decodeURIComponent(escape(atob(importToken.trim())));
      const parsed = JSON.parse(decoded);
      // avoid duplicates by subject + created_at
      const existing = sentLetters.find((l) => l.subject === parsed.subject && l.created_at === parsed.created_at);
      if (existing) {
        setError('This letter is already in your saved letters.');
        return;
      }
      // Save as a received letter (keep original created_by)
      const createdBy = parsed.created_by || { id: parsed.user_id, name: parsed.created_by?.name || 'Partner' };
      const saved = await saveLetter(user.id, {
        theme: parsed.theme,
        type: parsed.type,
        subject: parsed.subject,
        body: parsed.body,
        send_to_partner: parsed.send_to_partner || 0,
      }, createdBy);
      if (createdBy.id !== user.id) {
        setReceivedLetters((prev) => [{ ...saved }, ...prev]);
      } else {
        setSentLetters((prev) => [{ ...saved }, ...prev]);
      }
      setImportModalOpen(false);
      setImportToken('');
      setQrPreview('');
      setSuccess('Imported letter from partner!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Import failed', err);
      setError('Invalid token.');
    }
  };

  const handleSaveLetter = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!subject.trim() || !body.trim()) {
      setError('Please fill in both subject and letter body.');
      return;
    }

    if (sendToPartner && !partnerId) {
      setError('You must be connected with a partner to send a letter.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        theme: selectedTheme.name,
        type: selectedType.title,
        subject: subject.trim(),
        body: body.trim(),
        send_to_partner: sendToPartner ? 1 : 0,
      };
      const saved = await saveLetter(user.id, payload, { id: user.id, name: user.name });
      setSentLetters((prev) => [{ ...saved }, ...prev]);
      // Try to mirror into Supabase for cross-device sync (graceful fallback)
      try {
        await insertRow('letters', {
          theme: payload.theme,
          type: payload.type,
          subject: payload.subject,
          body: payload.body,
          send_to_partner: payload.send_to_partner,
          sent_to_id: sendToPartner ? partnerId || null : null,
          created_by: { id: user.id, name: user.name },
        });
      } catch (err) {
        // ignore supabase errors — local save still works
        // console.warn('Supabase insert failed', err);
      }
      // Optionally open default mail client to notify partner when sending
      if (sendToPartner) {
        try {
          const partner = partnerEmail || ((user?.email && user.email === NIKO_EMAIL) || user?.id === 'niko' ? KIM_EMAIL : NIKO_EMAIL);
          const mailto = `mailto:${partner}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body.trim())}`;
          window.open(mailto, '_blank');
        } catch (err) {
          // ignore mailto errors
        }
      }
      setSubject('');
      setBody('');
      setSendToPartner(false);
      setSuccess(sendToPartner ? '💌 Letter saved and sent to your partner!' : '💌 Letter saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save the letter.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLetter(id);
      setSentLetters((prev) => prev.filter((letter) => letter.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

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
                        <div className="flex flex-col gap-2">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            onClick={() => exportTokenForLetter(letter)}
                            className="rounded-2xl bg-white px-3 py-2 text-sm font-bold text-pink-600 border-2 border-pink-200 hover:bg-pink-50 hover:border-pink-400 transition flex-shrink-0"
                          >
                            📤 Share
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={() => handleDelete(letter.id)}
                            className="rounded-2xl bg-white px-3 py-2 text-sm font-bold text-pink-600 border-2 border-pink-200 hover:bg-pink-50 hover:border-pink-400 transition flex-shrink-0"
                          >
                            🗑️ Delete
                          </motion.button>
                        </div>
            <p className="text-gray-600 text-lg">
              {partnerId ? 'Share heartfelt letters with your partner 💝' : 'Connect with a partner to share letters 💝'}
            </p>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-3xl shadow-lg p-8 border-3 border-pink-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-pink-600 mb-6">Select a Theme 🎀</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {letterThemes.map((theme) => (
              <motion.button
                key={theme.id}
                type="button"
                onClick={() => setSelectedTheme(theme)}
                whileHover={{ scale: 1.03 }}
                className={`rounded-2xl p-6 text-center transition shadow-md ${theme.color} text-white ${selectedTheme.id === theme.id ? 'ring-4 ring-pink-300' : 'hover:shadow-lg'}`}
              >
                <div className="text-4xl mb-2">{theme.emoji}</div>
                <p className="font-bold">{theme.name}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="rounded-2xl bg-white border-2 border-pink-200 px-4 py-2 text-pink-600 font-bold hover:bg-pink-50 transition"
          >
            📥 Import from Partner
          </button>
          <p className="text-sm text-gray-500">Or have your partner tap “Share” on a letter to copy a token/QR.</p>
          <div className="ml-4 flex items-center gap-2">
            <input
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="Partner email (optional)"
              className="rounded-2xl border-2 border-pink-200 px-3 py-2 bg-white"
            />
            <button
              type="button"
              onClick={() => { try { localStorage.setItem('partnerEmail', partnerEmail); setEditingPartnerEmail(false); } catch (e) {} }}
              className="rounded-2xl bg-pink-600 text-white px-3 py-2 font-semibold"
            >
              Save
            </button>
          </div>
        </div>

        <motion.div
          className="bg-white rounded-3xl shadow-lg p-8 border-3 border-purple-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-purple-600 mb-6">Choose a Letter Type 💕</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {letterTypes.map((letterType) => (
              <motion.button
                key={letterType.title}
                type="button"
                onClick={() => setSelectedType(letterType)}
                whileHover={{ scale: 1.03 }}
                className={`rounded-2xl p-6 text-center transition border-2 ${selectedType.title === letterType.title ? 'border-purple-500 bg-purple-100 shadow-lg' : 'border-purple-200 bg-purple-50 hover:shadow-md'}`}
              >
                <div className="text-3xl mb-2">{letterType.emoji}</div>
                <p className="font-bold text-gray-800">{letterType.title}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-3xl shadow-lg p-8 border-3 border-sky-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-sky-600 mb-6">Write Your Letter ✍️</h2>
          {error && <div className="mb-4 rounded-2xl bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>}
          {success && <div className="mb-4 rounded-2xl bg-green-50 border-l-4 border-green-400 p-4 text-green-700">{success}</div>}
          <form onSubmit={handleSaveLetter} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-3xl border-2 border-purple-200 px-4 py-3 bg-purple-50 focus:border-purple-400 focus:outline-none"
                placeholder="My love note for you..."
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Letter Body</label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-3xl border-2 border-purple-200 px-4 py-4 bg-purple-50 focus:border-purple-400 focus:outline-none"
                placeholder="Write something sweet and meaningful..."
              />
            </div>
            {partnerId && (
              <label className="flex items-center gap-3 cursor-pointer bg-pink-50 p-4 rounded-2xl border-2 border-pink-200">
                <input
                  type="checkbox"
                  checked={sendToPartner}
                  onChange={(e) => setSendToPartner(e.target.checked)}
                  className="w-5 h-5 accent-pink-600 cursor-pointer"
                />
                <span className="font-semibold text-gray-700">📮 Send this letter to my partner</span>
              </label>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-lavender-500 text-white font-bold py-3 hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : sendToPartner ? '📮 Save & Send Letter' : '💾 Save Letter'}
            </button>
          </form>
        </motion.div>

        {/* Tabs for Sent/Received */}
        <div className="flex gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveTab('sent')}
            className={`flex-1 rounded-2xl py-3 font-bold transition ${
              activeTab === 'sent'
                ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg'
                : 'bg-white border-2 border-pink-200 text-pink-600 hover:border-pink-400'
            }`}
          >
            📝 My Letters ({sentLetters.length})
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveTab('received')}
            disabled={!partnerId}
            className={`flex-1 rounded-2xl py-3 font-bold transition ${
              activeTab === 'received'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                : partnerId
                ? 'bg-white border-2 border-purple-200 text-purple-600 hover:border-purple-400'
                : 'bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
          >
            💌 From Partner ({receivedLetters.length})
          </motion.button>
        </div>

        {/* Sent Letters Tab */}
        {activeTab === 'sent' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-white via-pink-50 to-purple-50 rounded-3xl shadow-lg p-8 border-3 border-pink-200 relative"
          >
            <SanrioCornerDecoration position="top-left" size="md" />
            <SanrioCornerDecoration position="top-right" size="md" />
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-pink-600">📝 My Saved Letters</h2>
              <span className="text-sm text-gray-500 bg-pink-100 px-3 py-1 rounded-full font-semibold">{sentLetters.length} saved</span>
            </div>
            
            {sentLetters.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">💝</div>
                <p className="text-gray-500 text-lg">No letters saved yet. Create one above!</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {sentLetters.map((letter, index) => (
                  <motion.div
                    key={letter.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative"
                  >
                    <div className="absolute -top-6 left-4 text-2xl opacity-60 group-hover:opacity-100 transition">
                      🎀
                    </div>
                    <div className="rounded-3xl border-3 border-pink-200 bg-gradient-to-br from-white to-pink-50 p-6 shadow-sm hover:shadow-md hover:border-pink-300 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.3em] text-pink-600 font-black mb-2">
                            {letter.theme} <span className="text-purple-600">•</span> {letter.type}
                          </p>
                          {letter.created_by && (
                            <p className="text-xs text-purple-600 font-semibold mb-2">✍️ From {letter.created_by.name}</p>
                          )}
                          {letter.sent_to_id && (
                            <p className="text-xs text-purple-600 font-semibold mb-2">📮 Sent to partner</p>
                          )}
                          <h3 className="text-xl font-bold text-gray-800 mb-3">{letter.subject}</h3>
                          <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed max-h-32 overflow-hidden">
                            {letter.body}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handleDelete(letter.id)}
                          className="rounded-2xl bg-white px-3 py-2 text-sm font-bold text-pink-600 border-2 border-pink-200 hover:bg-pink-50 hover:border-pink-400 transition flex-shrink-0"
                        >
                          🗑️ Delete
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            <SanrioCornerDecoration position="bottom-left" size="md" />
            <SanrioCornerDecoration position="bottom-right" size="md" />
          </motion.div>
        )}

        {/* Import Modal */}
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold mb-3">Import Letter from Partner</h3>
              <p className="text-sm text-gray-600 mb-3">Paste the share token you received (or scan the QR on your partner's device).</p>
              <textarea
                value={importToken}
                onChange={(e) => setImportToken(e.target.value)}
                rows={6}
                className="w-full rounded-md border px-3 py-2 mb-3"
                placeholder="Paste token here"
              />
              {qrPreview && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">QR Preview (optional):</p>
                  <img src={qrPreview} alt="qr preview" className="h-40 w-40" />
                </div>
              )}
              <div className="flex items-center gap-3 justify-end">
                <button onClick={() => { setImportModalOpen(false); setImportToken(''); setQrPreview(''); }} className="px-4 py-2 rounded-2xl border">Cancel</button>
                <button onClick={handleImportToken} className="px-4 py-2 rounded-2xl bg-pink-600 text-white">Import</button>
              </div>
            </div>
          </div>
        )}

        {/* Received Letters Tab */}
        {activeTab === 'received' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-3xl shadow-lg p-8 border-3 border-purple-200 relative"
          >
            <SanrioCornerDecoration position="top-left" size="md" />
            <SanrioCornerDecoration position="top-right" size="md" />
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-purple-600">💌 Love Letters from Your Partner</h2>
              <span className="text-sm text-gray-500 bg-purple-100 px-3 py-1 rounded-full font-semibold">{receivedLetters.length} received</span>
            </div>
            
            {!partnerId ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">💔</div>
                <p className="text-gray-500 text-lg">Connect with a partner to receive letters!</p>
              </div>
            ) : receivedLetters.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-500 text-lg">No letters yet. Your partner will send you love notes here!</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {receivedLetters.map((letter, index) => (
                  <motion.div
                    key={letter.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative"
                  >
                    <div className="absolute -top-6 right-4 text-2xl opacity-60 group-hover:opacity-100 transition">
                      💕
                    </div>
                    <div className="rounded-3xl border-3 border-purple-300 bg-gradient-to-br from-white to-purple-50 p-6 shadow-sm hover:shadow-lg hover:border-purple-400 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.3em] text-purple-600 font-black mb-2">
                            {letter.theme} <span className="text-pink-600">•</span> {letter.type}
                          </p>
                          {!letter.read_by_recipient && (
                            <p className="text-xs text-pink-600 font-semibold mb-2">✨ NEW</p>
                          )}
                          <h3 className="text-xl font-bold text-gray-800 mb-3">{letter.subject}</h3>
                          <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                            {letter.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            <SanrioCornerDecoration position="bottom-left" size="md" />
            <SanrioCornerDecoration position="bottom-right" size="md" />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Letters;
