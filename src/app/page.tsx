'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ApiKeySetup from '@/components/ApiKeySetup';
import FileUpload from '@/components/FileUpload';
import NotesViewer from '@/components/NotesViewer';
import FeedbackBar from '@/components/FeedbackBar';

interface UploadedFile {
  name: string;
  text: string;
  fileType: string;
  wordCount: number;
}

type AppPhase = 'setup' | 'input' | 'generating' | 'feedback' | 'done';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [notesHtml, setNotesHtml] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [phase, setPhase] = useState<AppPhase>('setup');
  const [error, setError] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [userPreference, setUserPreference] = useState('');
  const [crosscheck, setCrosscheck] = useState<{ asked: number; generated: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load API key from session storage on mount
  useEffect(() => {
    const savedKey = sessionStorage.getItem('examai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setPhase('input');
    }
  }, []);

  const handleApiKeySet = (key: string) => {
    setApiKey(key);
    setPhase('input');
  };

  const countQuestionsAsked = (text: string): number => {
    // Count numbered lines: "1.", "Q1.", "Q1)", "(1)", etc.
    const numbered = text.match(/^\s*(Q?\d+[\.\)\:]|\(\d+\))/gim);
    if (numbered && numbered.length > 1) return numbered.length;
    // Fallback: count non-empty lines as topics
    return text.split('\n').filter(l => l.trim().length > 0).length;
  };

  const handleGenerate = async (
    feedbackInstruction?: string,
    mode: 'fresh' | 'continue' | 'change' = 'fresh'
  ) => {
    if (!apiKey) {
      setError('Please set your API key first');
      return;
    }
    if (!questionText.trim() && uploadedFiles.length === 0) {
      setError('Please enter questions or upload course material');
      return;
    }

    setError(null);
    setIsStreaming(true);
    setPhase('generating');
    setCrosscheck(null);

    const context = uploadedFiles.map(f => `[File: ${f.name}]\n${f.text}`).join('\n\n---\n\n');
    const currentNotes = notesHtml;

    // For 'change': reset notes and start fresh
    if (mode === 'change') setNotesHtml('');

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questionText || 'Generate comprehensive notes for all topics in the uploaded material',
          context,
          apiKey,
          feedbackInstruction,
          existingNotes: mode === 'continue' ? currentNotes : undefined,
          userPreference: userPreference.trim() || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      // 'continue' appends; 'change' and 'fresh' start clean
      let accumulated = mode === 'continue' ? currentNotes : '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setNotesHtml(accumulated);
      }

      setIsStreaming(false);
      setPhase('feedback');

      // Crosscheck: always run after full generation
      if (questionText.trim()) {
        const asked = countQuestionsAsked(questionText);
        const generated = (accumulated.match(/class="question-card"/g) || []).length;
        setCrosscheck({ asked, generated });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setIsStreaming(false);
        setPhase(notesHtml ? 'feedback' : 'input');
        return;
      }
      setIsStreaming(false);
      setPhase(notesHtml ? 'feedback' : 'input');
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message.includes('authentication') || message.includes('401')
        ? '❌ Invalid API key. Please check your Anthropic API key.'
        : `❌ ${message}`);
    }
  };

  // Case 1: user says "looks good, continue" — append remaining questions
  const handleContinue = () => {
    handleGenerate(
      'The notes above are good. Continue generating the remaining unanswered questions in exactly the same style and depth. Do NOT repeat any questions already answered above.',
      'continue'
    );
  };

  // Case 2: user wants a change — regenerate everything fresh with new instruction
  const handleFeedback = (instruction: string) => {
    handleGenerate(instruction, 'change');
  };

  const handleAccept = async () => {
    setPhase('done');
    if (notesHtml) {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sessionTitle || 'Untitled Session',
          questions: questionText,
          notesHtml,
          contextSummary: uploadedFiles.map(f => f.name).join(', '),
        }),
      });
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleReset = () => {
    setPhase('input');
    setNotesHtml('');
    setQuestionText('');
    setUploadedFiles([]);
    setError(null);
    setSessionTitle('');
    setUserPreference('');
    setCrosscheck(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">ExamNote AI</h1>
              <p className="text-blue-300 text-xs">Last-day exam survival system</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/history" className="text-xs text-blue-300 hover:text-white transition-colors">
              📋 History
            </Link>
            {phase !== 'setup' && (
              <button
                onClick={handleReset}
                className="text-xs text-blue-300 hover:text-white transition-colors"
              >
                ↩ New Session
              </button>
            )}
            {apiKey && (
              <span className="text-xs bg-green-900/50 text-green-300 border border-green-700/50 px-2 py-1 rounded-full">
                ✓ API Key Set
              </span>
            )}
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
        {/* Landing / Setup State */}
        {phase === 'setup' && (
          <div className="max-w-2xl mx-auto mt-16">
            <div className="text-center mb-10">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-4xl font-bold text-white mb-3">ExamNote AI</h2>
              <p className="text-blue-200 text-lg">Convert your question banks into M.Tech-level exam-ready notes in minutes</p>
              <div className="flex flex-wrap justify-center gap-3 mt-5">
                {['📄 PDFs', '📊 PPTs', '📝 Word Docs', '🗒️ Question Banks'].map(tag => (
                  <span key={tag} className="bg-white/10 text-white/80 text-sm px-3 py-1.5 rounded-full border border-white/20">{tag}</span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <ApiKeySetup onKeySet={handleApiKeySet} />
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { icon: '📋', title: 'M.Tech Level Answers', desc: 'Structured, exam-ready notes with technical depth' },
                  { icon: '🎨', title: 'Auto Diagrams', desc: 'SVG diagrams ready to draw in your exam' },
                  { icon: '🖨️', title: 'Print-Ready PDF', desc: 'One-click export to PDF for offline study' },
                ].map(f => (
                  <div key={f.title} className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <p className="text-xs font-semibold text-gray-700">{f.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main App — Input Phase */}
        {(phase === 'input' || phase === 'generating' || phase === 'feedback' || phase === 'done') && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Panel — Input */}
            <div className="lg:col-span-2 space-y-4">
              {/* API Key compact */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <ApiKeySetup onKeySet={handleApiKeySet} currentKey={apiKey} />
              </div>

              {/* Session title */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  📚 Session / Subject Title
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={e => setSessionTitle(e.target.value)}
                  placeholder="e.g. Information Security — Module 3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* File Upload */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  📂 Upload Course Material (Optional)
                </label>
                <FileUpload
                  onFileParsed={file => setUploadedFiles(prev => [...prev, file])}
                  uploadedFiles={uploadedFiles}
                  onRemoveFile={i => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                />
              </div>

              {/* Question Bank Input */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  🗒️ Question Bank / Topics
                </label>
                <textarea
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder={`Paste your questions here. Examples:\n\n1. Explain the CIA triad in information security\n2. What is a firewall? Types and working\n3. Difference between symmetric and asymmetric encryption\n\nOr just paste important topics:`}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={8}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {questionText.length > 0
                    ? `${questionText.split('\n').filter(l => l.trim()).length} lines entered`
                    : 'Tip: Number your questions (1. 2. 3.) for best results'}
                </p>
              </div>

              {/* User Preference */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  ⚙️ Answer Preference <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={userPreference}
                  onChange={e => setUserPreference(e.target.value)}
                  placeholder="e.g. quick answers only · 2-mark level · skip diagrams · very detailed"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Quick answers', 'Very detailed', '2-mark level', 'Skip diagrams', 'Only text, no tables'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setUserPreference(p)}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        userPreference === p
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              {phase !== 'generating' ? (
                <button
                  onClick={() => handleGenerate()}
                  disabled={!apiKey || (!questionText.trim() && uploadedFiles.length === 0)}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/30 text-sm"
                >
                  {notesHtml ? '🔄 Regenerate Notes' : '⚡ Generate Exam Notes'}
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="w-full py-3.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all text-sm"
                >
                  ⏹ Stop Generation
                </button>
              )}

              {/* Progress indicator */}
              {phase === 'generating' && (
                <div className="flex items-center gap-3 bg-blue-900/30 border border-blue-700/50 rounded-xl px-4 py-3">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Generating notes...</p>
                    <p className="text-blue-400 text-xs mt-0.5">Claude is crafting your exam notes. This may take 30–60 seconds.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel — Notes Viewer */}
            <div className="lg:col-span-3">
              {notesHtml ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <NotesViewer
                    html={notesHtml}
                    isStreaming={isStreaming}
                    title={sessionTitle}
                    onStop={handleStop}
                  />

                  {/* Crosscheck banner */}
                  {crosscheck && phase === 'feedback' && (
                    <div className={`px-4 py-3 border-t text-sm flex items-center justify-between gap-4 ${
                      crosscheck.generated >= crosscheck.asked
                        ? 'bg-green-50 border-green-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>{crosscheck.generated >= crosscheck.asked ? '✅' : '⚠️'}</span>
                        <span className={crosscheck.generated >= crosscheck.asked ? 'text-green-700' : 'text-amber-700'}>
                          {crosscheck.generated >= crosscheck.asked
                            ? `All ${crosscheck.asked} question${crosscheck.asked !== 1 ? 's' : ''} generated.`
                            : `${crosscheck.generated} of ${crosscheck.asked} questions generated — ${crosscheck.asked - crosscheck.generated} may be missing.`}
                        </span>
                      </div>
                      {crosscheck.generated < crosscheck.asked && (
                        <button
                          onClick={() => handleGenerate(
                            `Generate the remaining ${crosscheck.asked - crosscheck.generated} questions that were not yet answered. Do NOT repeat any question already answered above.`,
                            'continue'
                          )}
                          className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                        >
                          Generate missing
                        </button>
                      )}
                    </div>
                  )}

                  {/* Feedback Bar — shown after first generation */}
                  {(phase === 'feedback') && (
                    <div className="p-4 border-t border-gray-200">
                      <FeedbackBar
                        onContinue={handleContinue}
                        onFeedback={handleFeedback}
                        onAccept={handleAccept}
                        disabled={isStreaming}
                      />
                    </div>
                  )}

                  {phase === 'done' && (
                    <div className="p-4 border-t border-gray-100 bg-green-50 flex items-center justify-between">
                      <p className="text-green-700 text-sm font-medium">✅ Notes finalized! Use the print button to export as PDF.</p>
                      <button onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-700">Start new session</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full min-h-96 flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-xl text-center p-8">
                  <div className="text-5xl mb-4">📖</div>
                  <h3 className="text-white font-semibold text-lg mb-2">Your notes will appear here</h3>
                  <p className="text-blue-300 text-sm max-w-sm">
                    Upload your course material, paste your question bank, and hit Generate. Your M.Tech-level notes will stream in real-time.
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-xs text-left">
                    {[
                      '① Prescribed Answer — textbook-style',
                      '② M.Tech Answer — full technical depth',
                      '③ Diagram — SVG, ready to draw',
                      '④ Real-World Example — specific & named',
                      '⑤ Exam Tips — 10-mark & 5-mark guidance',
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-blue-300 text-xs">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-blue-400/50 text-xs no-print mt-8">
        ExamNote AI — Powered by Claude claude-sonnet-4-6 · Your API key stays in your browser
      </footer>
    </div>
  );
}
