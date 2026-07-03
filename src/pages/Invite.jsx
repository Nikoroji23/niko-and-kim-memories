import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function Invite({ user }) {
  const inviteUrl = 'https://nicolie-kim-memories.netlify.app/invite';

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/95 backdrop-blur-xl rounded-[32px] p-10 shadow-2xl border-4 border-blue-200">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-700 mb-4">Partner Features</h1>
          <p className="text-gray-600 mb-8">This app now uses one shared Supabase workspace for Niko and Kim.</p>

          <div className="rounded-3xl bg-blue-50 border-2 border-blue-200 p-8">
            <h2 className="text-2xl font-bold text-blue-700 mb-3">How to Use Together</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>Send this link to Kim, then each of you can choose your name from the dashboard selector.</p>
              <p>Messages, future plans, and memories are saved to Supabase so both phones/computers see the same data.</p>
              <div className="rounded-2xl bg-white border border-blue-200 p-4 break-all text-blue-700 font-semibold">{inviteUrl}</div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={copyInvite} className="rounded-3xl bg-blue-600 text-white font-bold py-3 px-6 hover:opacity-90 transition">Copy Invite Link</button>
              <Link to="/dashboard" className="rounded-3xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 text-center hover:opacity-90 transition">Back to Dashboard</Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Link to="/chat" className="rounded-2xl border border-pink-200 bg-pink-50 p-4 text-center font-bold text-pink-700">Open Chat</Link>
            <Link to="/planner" className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-center font-bold text-cyan-700">Open Planner</Link>
            <Link to="/memories" className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-center font-bold text-orange-700">Open Memories</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Invite;
