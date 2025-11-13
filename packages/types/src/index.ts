export interface X402PaymentRequirement {
  scheme: 'exact';
  network: string; 
  asset: string; 
  payTo: string;
  maxAmountRequired: string; 
  resource: string; 
  description: string;
  maxTimeoutSeconds: number;
  mimeType?: string;
  extra?: Record<string, unknown>;
}

export interface X402PaymentRequired {
  x402Version: number;
  accepts: X402PaymentRequirement[];
}

export interface X402PaymentPayload {
  x402Version: number;
  scheme: 'exact';
  network: string;
  payload: {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;
    v: number;
    r: string;
    s: string;
  };
}

export interface X402PaymentResponse {
  success: boolean;
  txHash: string;
  networkId: string;
  timestamp: number;
}

export interface ComputeProof {
  modelHash: string; 
  inputHash: string;
  outputHash: string;
  containerImageDigest: string;
  producedAt: string;
  attestation: string | null;
}

export interface InferenceRequest {
  prompt: string;
  model: string;
  seed: number;
}

export interface InferenceResponse {
  output: string;
  proof: ComputeProof;
}

export interface JobCreateRequest {
  prompt: string;
  model: string;
  seed?: number;
}

export interface JobCreateResponse {
  jobId: string;
  status: 'pending_payment';
  paymentRequired: X402PaymentRequired;
}

export interface JobRunRequest {
  jobId: string;
}

export interface JobRunResponse {
  jobId: string;
  output: string;
  proof: ComputeProof;
  txHash: string;
  status: 'completed';
}

export interface JobDetails {
  id: string;
  prompt: string;
  model: string;
  seed: number;
  txHash: string | null;
  imageDigest: string | null;
  proof: ComputeProof | null;
  createdAt: string;
  status: 'pending_payment' | 'completed' | 'failed';
}

export interface JobReplayResponse {
  jobId: string;
  verified: boolean;
  originalOutputHash: string;
  recomputedOutputHash: string;
  message?: string;
}

export interface JobRecord {
  id: string;
  prompt: string;
  model: string;
  seed: number;
  txHash: string | null;
  imageDigest: string | null;
  proofJson: string | null; // JSON stringified ComputeProof
  createdAt: Date;
  status: 'pending_payment' | 'completed' | 'failed';
}
export class PaymentRequiredError extends Error {
  constructor(
    public paymentRequired: X402PaymentRequired,
    message: string = 'Payment required to access this resource'
  ) {
    super(message);
    this.name = 'PaymentRequiredError';
  }
}

export class PaymentVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentVerificationError';
  }
}

export class ComputeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComputeError';
  }
}

export interface ServerConfig {
  port: number;
  host: string;
  baseRpcUrl: string;
  network: string;
  chainId: number;
  usdcAddress: string;
  merchantWallet: string;
  merchantPrivateKey: string;
  priceUsdc: string;
  maxTimeoutSeconds: number;
  computeAppUrl: string;
  eigenImageDigest: string;
  databaseUrl: string;
  facilitatorUrl?: string;
}

export interface ComputeAppConfig {
  port: number;
  modelId: string;
  defaultSeed: number;
  eigenImageDigest: string;
  openaiApiKey?: string;
  eigenaiApiKey?: string;
}
