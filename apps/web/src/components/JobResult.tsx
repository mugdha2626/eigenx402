'use client';

import { useState } from 'react';
import type { JobResult as JobResultType } from '@mugdha26/eigenx402-client-sdk';

interface JobResultProps {
  result: JobResultType;
  onReset: () => void;
}

export function JobResult({ result, onReset }: JobResultProps) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'}/api/jobs/${result.jobId}/replay`,
        { method: 'POST' }
      );
      const data = await response.json();
      setVerified(data.verified);
    } catch (error) {
      console.error('Verification error:', error);
      alert('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            ✓
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Job Completed Successfully</h2>
            <p className="text-sm text-gray-600">Verifiable AI inference with cryptographic proof</p>
          </div>
        </div>
      </div>

      {/* What Happened Behind the Scenes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">What Happened Behind the Scenes</h3>
        <div className="space-y-4">
          <VerificationStep
            number={1}
            title="Payment Settled On-Chain"
            description="Your USDC payment was settled on Base Sepolia blockchain"
            status="complete"
            detail={result.txHash}
            link={`https://sepolia.basescan.org/tx/${result.txHash}`}
          />
          <VerificationStep
            number={2}
            title="Deterministic AI Inference"
            description="EigenAI ran your prompt with a fixed seed for reproducible results"
            status="complete"
            detail={`Model: gpt-oss-120b-f16 | Seed: 42`}
          />
          <VerificationStep
            number={3}
            title="Cryptographic Proof Generated"
            description="All inputs, outputs, and execution were hashed with SHA-256"
            status="complete"
            detail={`Output hash: ${result.proof.outputHash.substring(0, 16)}...`}
          />
          <VerificationStep
            number={4}
            title={result.proof.attestation ? "TEE Attestation Signed" : "Local Compute (TEE Coming Soon)"}
            description={result.proof.attestation ? "Trusted Execution Environment verified the computation" : "Deploy to EigenCompute for TEE attestation"}
            status={result.proof.attestation ? "complete" : "pending"}
            detail={result.proof.attestation ? "Intel SGX/AMD SEV attestation" : "Run: npm run docker:build && eigenx app deploy"}
          />
        </div>
      </div>

      {/* Output Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          AI Response
        </h2>
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">{result.output}</pre>
        </div>
      </div>

      {/* Interactive Verification */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-purple-200">
        <h2 className="text-xl font-semibold mb-2">
          Verify Determinism
        </h2>
        <p className="text-gray-600 mb-4 text-sm">
          The magic of verifiable compute: Re-run the same prompt with the same seed and prove the output is identical. This is what makes it trustworthy.
        </p>

        {verified !== null && (
          <div className={`p-4 rounded-lg mb-4 ${verified ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
            <p className={`font-bold text-lg ${verified ? 'text-green-800' : 'text-red-800'}`}>
              {verified ? 'Verification Passed' : 'Verification Failed'}
            </p>
            <p className={`text-sm mt-1 ${verified ? 'text-green-600' : 'text-red-600'}`}>
              {verified
                ? 'Re-ran the inference and output hash matches perfectly! This proves the computation is deterministic and reproducible.'
                : 'Output hash mismatch - verification failed'}
            </p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={verifying}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          {verifying ? 'Verifying...' : 'Verify Output Now'}
        </button>
      </div>

      {/* Technical Details (Collapsible) */}
      <details className="bg-white rounded-lg shadow-md p-6">
        <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
          Technical Proof Details (for developers)
        </summary>
        <div className="mt-4 space-y-3">
          <ProofField label="Blockchain Transaction" value={result.txHash} link={`https://sepolia.basescan.org/tx/${result.txHash}`} />
          <ProofField label="Input Hash (SHA-256)" value={result.proof.inputHash} />
          <ProofField label="Output Hash (SHA-256)" value={result.proof.outputHash} />
          <ProofField label="Model Hash (SHA-256)" value={result.proof.modelHash} />
          <ProofField label="Container Image Digest" value={result.proof.containerImageDigest} />
          <ProofField label="Timestamp" value={result.proof.producedAt} />
          <ProofField label="Job ID" value={result.jobId} />
          {result.proof.attestation && (
            <ProofField label="TEE Attestation" value={result.proof.attestation} />
          )}
        </div>
      </details>

      {/* Actions */}
      <div className="flex justify-center">
        <button
          onClick={onReset}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          ← Create Another Job
        </button>
      </div>
    </div>
  );
}

function VerificationStep({
  number,
  title,
  description,
  status,
  detail,
  link
}: {
  number: number;
  title: string;
  description: string;
  status: 'complete' | 'pending';
  detail?: string;
  link?: string;
}) {
  return (
    <div className="flex items-start space-x-4">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        status === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
      }`}>
        {status === 'complete' ? '✓' : number}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
        {detail && (
          <div className="mt-1">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-blue-600 hover:text-blue-800 underline"
              >
                {detail}
              </a>
            ) : (
              <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{detail}</code>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProofField({ label, value, link }: { label: string; value: string; link?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = value.length > 60 ? `${value.substring(0, 30)}...${value.substring(value.length - 30)}` : value;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center space-x-2">
        <code className="flex-1 bg-gray-50 px-3 py-2 rounded border border-gray-200 text-xs font-mono overflow-x-auto">
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
              {displayValue}
            </a>
          ) : (
            displayValue
          )}
        </code>
        <button
          onClick={handleCopy}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded border border-gray-200 text-xs transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
