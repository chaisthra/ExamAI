'use client';
import { useState } from 'react';

interface FeedbackBarProps {
  onContinue: () => void;
  onFeedback: (instruction: string) => void;
  onAccept: () => void;
  disabled?: boolean;
}

const QUICK_FEEDBACK = [
  { label: 'Too long — shorten', value: 'Please make all answers shorter and more concise. Keep only the most exam-critical points.' },
  { label: 'Too short — expand', value: 'Please expand all answers with more technical depth, more sub-points, and more detailed diagrams.' },
  { label: 'Simpler language', value: 'Please simplify the language. Explain concepts as if to a student encountering them for the first time.' },
  { label: 'More examples', value: 'Please add more real-world examples for each answer, especially Indian tech industry examples.' },
  { label: 'Better diagrams', value: 'Please improve the SVG diagrams with more detail, clearer labels, and more accurate representations.' },
  { label: 'More exam tips', value: 'Please expand the exam tips section with more specific advice on marks allocation, keywords to use, and common mistakes.' },
];

export default function FeedbackBar({ onContinue, onFeedback, onAccept, disabled }: FeedbackBarProps) {
  const [customFeedback, setCustomFeedback] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomSubmit = () => {
    if (!customFeedback.trim()) return;
    onFeedback(customFeedback.trim());
    setCustomFeedback('');
    setShowCustom(false);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 no-print">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-amber-800">🎯 How&apos;s the level?</p>
          <p className="text-xs text-amber-600 mt-0.5">Continue as-is, or change approach and regenerate fully</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onContinue}
            disabled={disabled}
            className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            → Continue
          </button>
          <button
            onClick={onAccept}
            disabled={disabled}
            className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            ✓ Done
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <p className="w-full text-xs text-amber-700 font-medium">Change approach (regenerates all):</p>
        {QUICK_FEEDBACK.map(fb => (
          <button
            key={fb.value}
            onClick={() => onFeedback(fb.value)}
            disabled={disabled}
            className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-medium rounded-full hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            {fb.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          disabled={disabled}
          className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-medium rounded-full hover:bg-amber-100 disabled:opacity-50 transition-colors"
        >
          ✏️ Custom
        </button>
      </div>

      {showCustom && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customFeedback}
            onChange={e => setCustomFeedback(e.target.value)}
            placeholder="e.g. Focus more on cyber security frameworks, add NIST references..."
            className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customFeedback.trim() || disabled}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
