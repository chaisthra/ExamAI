'use client';
import { useState, useEffect } from 'react';
import NotesViewer from '@/components/NotesViewer';
import Link from 'next/link';

interface Session {
  id: string;
  title: string;
  questions: string;
  notes_html: string;
  context_summary: string;
  created_at: string;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSelect = async (session: Session) => {
    setLoadingSession(true);
    const res = await fetch(`/api/sessions/${session.id}`);
    const data = await res.json();
    setSelected(data.session || session);
    setLoadingSession(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    setDeleting(id);
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    setSessions(prev => prev.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
    setDeleting(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">ExamNote AI</h1>
              <p className="text-blue-300 text-xs">Session History</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-blue-300 hover:text-white transition-colors">
              ← Back to App
            </Link>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              className="text-xs text-red-400 hover:text-red-300 border border-red-800/50 px-2 py-1 rounded-full transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loadingSession ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-300 text-sm ml-3">Loading session...</span>
          </div>
        ) : selected ? (
          /* Session Detail View */
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelected(null)}
                className="text-blue-300 hover:text-white text-sm transition-colors"
              >
                ← Back to history
              </button>
              <h2 className="text-white font-semibold">{selected.title}</h2>
              <span className="text-blue-400 text-xs ml-auto">
                {new Date(selected.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <NotesViewer
                html={selected.notes_html}
                isStreaming={false}
                title={selected.title}
              />
            </div>
          </div>
        ) : (
          /* Sessions List */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">Your Saved Sessions</h2>
              <Link
                href="/"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                + New Session
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-white font-semibold text-lg mb-2">No sessions saved yet</p>
                <p className="text-blue-300 text-sm mb-6">Generate notes and click &quot;Looks great!&quot; to save them here.</p>
                <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm transition-colors">
                  Start your first session
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors group"
                  >
                    <button
                      onClick={() => handleSelect(session)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">
                          {session.title || 'Untitled Session'}
                        </h3>
                        <span className="text-blue-400 text-xs flex-shrink-0">
                          {new Date(session.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short'
                          })}
                        </span>
                      </div>
                      {session.context_summary && (
                        <p className="text-blue-300/70 text-xs mt-2 line-clamp-1">
                          📂 {session.context_summary}
                        </p>
                      )}
                      {session.questions && (
                        <p className="text-blue-300/50 text-xs mt-1 line-clamp-2">
                          {session.questions.slice(0, 120)}...
                        </p>
                      )}
                    </button>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <button
                        onClick={() => handleSelect(session)}
                        className="text-xs text-blue-400 hover:text-blue-200 transition-colors"
                      >
                        View notes →
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={deleting === session.id}
                        className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        {deleting === session.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
