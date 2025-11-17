'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { JobForm } from '@/components/JobForm';
import { JobResult } from '@/components/JobResult';
import { WalletConnect } from '@/components/WalletConnect';
import { useWallet } from '@/hooks/useWallet';
import type { JobResult as JobResultType } from '@mugdha26/eigenx402-client-sdk';

export default function Home() {
  const { connected, address, signer, connect, disconnect } = useWallet();
  const [jobResult, setJobResult] = useState<JobResultType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJobComplete = (result: JobResultType) => {
    setJobResult(result);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Pay-per-Proof AI Inference
          </h1>
          <p className="text-lg text-gray-600">
            Verifiable compute powered by EigenCompute + x402 crypto payments
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnect
            connected={connected}
            address={address}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>

        {/* Main Content */}
        {!connected ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600">
              Connect your wallet to start using pay-per-proof AI inference
            </p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your request...</p>
          </div>
        ) : jobResult ? (
          <JobResult result={jobResult} onReset={() => setJobResult(null)} />
        ) : (
          <JobForm
            signer={signer}
            onLoading={() => setLoading(true)}
            onComplete={handleJobComplete}
            onError={(error) => {
              setLoading(false);
              console.error('Job error:', error);
            }}
          />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>Built with EigenCompute, x402, and Next.js</p>
        </div>
      </footer>
    </div>
  );
}
