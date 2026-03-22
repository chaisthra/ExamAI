'use client';
import { useState, useEffect } from 'react';

interface ApiKeySetupProps {
  onKeySet: (key: string) => void;
  currentKey?: string;
}

export default function ApiKeySetup({ onKeySet, currentKey }: ApiKeySetupProps) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentKey) setKey(currentKey);
  }, [currentKey]);

  const handleSave = () => {
    if (!key.trim()) return;
    if (!key.startsWith('sk-ant-')) {
      alert('Please enter a valid Anthropic API key (starts with sk-ant-)');
      return;
    }
    sessionStorage.setItem('examai_api_key', key.trim());
    onKeySet(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔑</span>
        <h3 className="font-semibold text-gray-800">Anthropic API Key</h3>
        {currentKey && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            ✓ Connected
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            {showKey ? '🙈' : '👁️'}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {saved ? '✓ Saved!' : 'Save Key'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Your key is stored only in your browser session and never sent to our servers.{' '}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          Get a key →
        </a>
      </p>
    </div>
  );
}
