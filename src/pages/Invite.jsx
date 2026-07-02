import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function Invite({ user }) {
  // Partner invites require a backend server for email sending and account linking.
  // This feature is disabled in the client-only version.

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/95 backdrop-blur-xl rounded-[32px] p-10 shadow-2xl border-4 border-blue-200">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-700 mb-4">Partner Features</h1>
          
          <div className="rounded-3xl bg-blue-50 border-2 border-blue-200 p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-blue-700 mb-3">Backend Required</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Partner invites and account linking require a backend server for email sending and secure account management.
            </p>
            <p className="text-gray-600 mb-6">
              This client-only version supports personal memories, letters, and planner tasks that are stored locally in your browser.
            </p>
            <Link
              to="/dashboard"
              className="inline-block rounded-3xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-8 hover:opacity-90 transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Invite;
