'use client';

import { useState } from 'react';
import { EigenX402Client } from '@mugdha26/eigenx402-client-sdk';
import type { JobResult } from '@mugdha26/eigenx402-client-sdk';

interface JobFormProps {
  signer: any;
  onLoading: () => void;
  onComplete: (result: JobResult) => void;
  onError: (error: Error) => void;
}

const MODELS = [
  { id: 'gpt-oss-120b-f16', name: 'GPT-OSS 120B (Recommended)' },
  { id: 'qwen3-32b-128k-bf16', name: 'Qwen3 32B (Alternative)' },
];

export function JobForm({ signer, onLoading, onComplete, onError }: JobFormProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gpt-oss-120b-f16');
  const [seed, setSeed] = useState(42);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    onLoading();

    try {
      // Initialize client
      const client = new EigenX402Client({
        serverUrl: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001',
        signerOrProvider: signer,
      });

      // Use TEE service endpoint
      const result = await client.makeX402Request('/api/generate-text', {
        method: 'POST',
        body: {
          prompt,
          model,
          seed,
        },
      });

      onComplete(result);
    } catch (error: any) {
      console.error('Job error:', error);
      onError(error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Create Inference Job</h2>

      {/* Prompt Input */}
      <div className="mb-6">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your prompt here..."
        />
      </div>

      {/* Model Selection */}
      <div className="mb-6">
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
          Model
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Seed Input */}
      <div className="mb-6">
        <label htmlFor="seed" className="block text-sm font-medium text-gray-700 mb-2">
          Seed (for determinism)
        </label>
        <input
          id="seed"
          type="number"
          value={seed}
          onChange={(e) => setSeed(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">
          Same seed + prompt always produces same output
        </p>
      </div>

      {/* Pricing Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Cost</span>
          <span className="text-lg font-semibold text-blue-600">$0.05 USDC</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Payment on Base Sepolia • Verifiable TEE compute
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
      >
        Pay & Run Inference
      </button>
    </form>
  );
}
