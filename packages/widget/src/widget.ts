/**
 * EigenX402 Payment Gateway Widget
 * Universal payment widget with x402 crypto payments + EigenCompute verification
 *
 * Usage:
 * <!-- AI Inference -->
 * <eigenx402-widget
 *   api-url="https://api.yourservice.com"
 *   endpoint="/api/jobs"
 *   price="0.05"
 *   title="AI Assistant"
 *   mode="ai">
 * </eigenx402-widget>
 *
 * <!-- Generic API -->
 * <eigenx402-widget
 *   api-url="https://api.yourservice.com"
 *   endpoint="/api/resource"
 *   price="1.00"
 *   title="Premium Content"
 *   mode="generic">
 * </eigenx402-widget>
 */

import { EigenX402Client } from '@eigenx402/client-sdk';
import { BrowserProvider } from 'ethers';

interface WidgetAttributes {
  apiUrl: string;
  endpoint: string;
  price: string;
  title: string;
  description: string;
  mode: 'ai' | 'generic';
  model?: string; // For AI mode
  buttonText?: string;
  network?: string;
  currency?: string;
}

class EigenX402Widget extends HTMLElement {
  private shadow: ShadowRoot;
  private client: EigenX402Client | null = null;
  private provider: BrowserProvider | null = null;
  private signer: any = null;
  private address: string | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  private getAttributes(): WidgetAttributes {
    return {
      apiUrl: this.getAttribute('api-url') || 'http://localhost:3001',
      endpoint: this.getAttribute('endpoint') || '/api/jobs',
      price: this.getAttribute('price') || '0.05',
      title: this.getAttribute('title') || 'Payment Gateway',
      description: this.getAttribute('description') || 'Pay to access this resource',
      mode: (this.getAttribute('mode') || 'ai') as 'ai' | 'generic',
      model: this.getAttribute('model') || 'gpt-oss-120b-f16',
      buttonText: this.getAttribute('button-text') || 'Pay & Access',
      network: this.getAttribute('network') || 'base-sepolia',
      currency: this.getAttribute('currency') || 'USDC'
    };
  }

  private render() {
    const { price } = this.getAttributes();

    this.shadow.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .widget-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px;
          margin: 0 auto;
        }

        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 24px;
          margin-bottom: 20px;
        }

        h2 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #111827;
        }

        .description {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 16px;
        }

        label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
        }

        textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .price-info {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .price-value {
          font-size: 18px;
          font-weight: 600;
          color: #2563eb;
        }

        .price-note {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        button {
          width: 100%;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .status {
          padding: 12px;
          border-radius: 8px;
          margin-top: 16px;
          font-size: 14px;
        }

        .status-loading {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .status-error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .status-success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .result-container {
          margin-top: 20px;
        }

        .result-output {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          white-space: pre-wrap;
          word-wrap: break-word;
          color: #374151;
          line-height: 1.6;
        }

        .result-proof {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .proof-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
        }

        .proof-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }

        .proof-item:last-child {
          border-bottom: none;
        }

        .proof-label {
          color: #6b7280;
          font-weight: 500;
        }

        .proof-value {
          color: #111827;
          font-family: monospace;
          font-size: 12px;
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tx-link {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
        }

        .tx-link:hover {
          text-decoration: underline;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>

      <div class="widget-container">
        <div id="content"></div>
      </div>
    `;

    this.renderContent();
  }

  private renderContent() {
    const content = this.shadow.getElementById('content');
    if (!content) return;

    if (!this.signer) {
      // Show wallet connect
      content.innerHTML = `
        <div class="card">
          <h2>AI Assistant with Crypto Payments</h2>
          <button class="btn-primary" id="connect-btn">
            Connect Wallet to Continue
          </button>
        </div>
      `;
    } else {
      // Show payment form
      const { price, title, description, mode, buttonText, currency, network } = this.getAttributes();
      
      const formContent = mode === 'ai' ? `
        <div class="form-group">
          <label for="prompt">Your Question</label>
          <textarea id="prompt" placeholder="Ask anything..."></textarea>
        </div>
      ` : `
        <div class="form-group">
          <label for="input-data">Request Data (optional)</label>
          <textarea id="input-data" placeholder="Additional data or parameters..."></textarea>
        </div>
      `;

      content.innerHTML = `
        <div class="card">
          <h2>${title}</h2>
          <p class="description">${description}</p>

          ${formContent}

          <div class="price-info">
            <div class="price-row">
              <span class="price-label">Cost</span>
              <span class="price-value">$${price} ${currency}</span>
            </div>
            <div class="price-note">Payment on ${network} • Verifiable compute with EigenCompute</div>
          </div>

          <button class="btn-primary" id="submit-btn">
            ${buttonText}
          </button>

          <div id="status"></div>
          <div id="result"></div>
        </div>
      `;
    }

    this.attachEventListeners();
  }

  private attachEventListeners() {
    const connectBtn = this.shadow.getElementById('connect-btn');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.connectWallet());
    }

    const submitBtn = this.shadow.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.handleSubmit());
    }
  }

  private async connectWallet() {
    try {
      if (!window.ethereum) {
        this.showStatus('Please install MetaMask to continue', 'error');
        return;
      }

      this.showStatus('Connecting wallet...', 'loading');

      this.provider = new BrowserProvider(window.ethereum);

      // Request account access
      await this.provider.send('eth_requestAccounts', []);

      this.signer = await this.provider.getSigner();
      this.address = await this.signer.getAddress();

      // Switch to Base Sepolia
      const baseSepoliaChainId = 84532;

      try {
        await this.provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${baseSepoliaChainId.toString(16)}` }
        ]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await this.provider.send('wallet_addEthereumChain', [
            {
              chainId: `0x${baseSepoliaChainId.toString(16)}`,
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            },
          ]);
        } else if (switchError.code !== 4001) {
          // Ignore user rejection (4001), throw other errors
          throw switchError;
        }
      }

      // Get fresh signer after network switch
      this.signer = await this.provider.getSigner();
      this.address = await this.signer.getAddress();

      // Initialize client
      const { apiUrl } = this.getAttributes();
      this.client = new EigenX402Client({
        serverUrl: apiUrl,
        signerOrProvider: this.signer
      });

      this.showStatus('Wallet connected!', 'success');
      setTimeout(() => {
        this.renderContent();
      }, 1000);
    } catch (error: any) {
      this.showStatus(`Error: ${error.message}`, 'error');
    }
  }

  private async handleSubmit() {
    const submitBtn = this.shadow.getElementById('submit-btn') as HTMLButtonElement;
    if (!this.client) return;

    const { mode, endpoint } = this.getAttributes();
    let inputData: string;

    if (mode === 'ai') {
      const promptInput = this.shadow.getElementById('prompt') as HTMLTextAreaElement;
      if (!promptInput) return;

      inputData = promptInput.value.trim();
      if (!inputData) {
        this.showStatus('Please enter a question', 'error');
        return;
      }
    } else {
      const dataInput = this.shadow.getElementById('input-data') as HTMLTextAreaElement;
      inputData = dataInput?.value?.trim() || '';
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Processing...';

    try {
      this.showStatus('Creating request and generating payment...', 'loading');

      const { model } = this.getAttributes();

      // Use generic x402 request - works with ANY endpoint!
      const result = await this.client.makeX402Request(endpoint, {
        method: 'POST',
        body: {
          prompt: inputData,
          model: model || 'gpt-oss-120b-f16',
          seed: Math.floor(Math.random() * 1000000)
        }
      });

      this.showStatus('Success! Payment verified and response received from TEE', 'success');
      this.renderResult(result);

      // Dispatch success event
      this.dispatchEvent(new CustomEvent('payment-success', {
        detail: result,
        bubbles: true,
        composed: true
      }));

      // Clear input
      if (mode === 'ai') {
        const promptInput = this.shadow.getElementById('prompt') as HTMLTextAreaElement;
        if (promptInput) promptInput.value = '';
      } else {
        const dataInput = this.shadow.getElementById('input-data') as HTMLTextAreaElement;
        if (dataInput) dataInput.value = '';
      }
    } catch (error: any) {
      this.showStatus(`Error: ${error.message}`, 'error');

      // Dispatch error event
      this.dispatchEvent(new CustomEvent('payment-error', {
        detail: { error: error.message },
        bubbles: true,
        composed: true
      }));
    } finally {
      submitBtn.disabled = false;
      const { buttonText } = this.getAttributes();
      submitBtn.textContent = buttonText || 'Pay & Access';
    }
  }

  private renderResult(result: any) {
    const resultEl = this.shadow.getElementById('result');
    if (!resultEl) return;

    // Flexible rendering - handle different response structures
    const output = result.output || result.result || result.data || JSON.stringify(result, null, 2);
    const txHash = result.txHash || result.transactionHash;
    const proof = result.proof;

    let proofHtml = '';
    if (proof) {
      const txScanUrl = txHash ? `https://sepolia.basescan.org/tx/${txHash}` : null;

      proofHtml = `
        <div class="result-proof">
          <div class="proof-title">Cryptographic Proof from TEE</div>
          ${txScanUrl ? `
            <div class="proof-item">
              <span class="proof-label">Payment TX:</span>
              <a href="${txScanUrl}" target="_blank" class="tx-link">View on BaseScan</a>
            </div>
          ` : ''}
          ${proof.outputHash ? `
            <div class="proof-item">
              <span class="proof-label">Output Hash:</span>
              <span class="proof-value">${proof.outputHash}</span>
            </div>
          ` : ''}
          ${proof.modelHash ? `
            <div class="proof-item">
              <span class="proof-label">Model Hash:</span>
              <span class="proof-value">${proof.modelHash}</span>
            </div>
          ` : ''}
          ${proof.containerImageDigest ? `
            <div class="proof-item">
              <span class="proof-label">Container:</span>
              <span class="proof-value">${proof.containerImageDigest}</span>
            </div>
          ` : ''}
          ${proof.producedAt ? `
            <div class="proof-item">
              <span class="proof-label">Timestamp:</span>
              <span class="proof-value">${proof.producedAt}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    resultEl.innerHTML = `
      <div class="result-container">
        <h2>Response</h2>
        <div class="result-output">${output}</div>
        ${proofHtml}
        <button class="btn-secondary" id="reset-btn" style="margin-top: 16px;">
          Make Another Request
        </button>
      </div>
    `;

    const resetBtn = this.shadow.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resultEl.innerHTML = '';
        const statusEl = this.shadow.getElementById('status');
        if (statusEl) statusEl.innerHTML = '';
      });
    }
  }

  private showStatus(message: string, type: 'loading' | 'error' | 'success') {
    const statusEl = this.shadow.getElementById('status');
    if (!statusEl) return;

    statusEl.className = `status status-${type}`;
    statusEl.textContent = message;
  }
}

// Define custom elements
customElements.define('eigenx402-widget', EigenX402Widget);
customElements.define('eigenx402-ai', EigenX402Widget); // Backward compatibility

// Export for TypeScript
export { EigenX402Widget };
