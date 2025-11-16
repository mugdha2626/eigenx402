/**
 * EigenX402 Payment Button Widget
 * Simple payment button with x402 + EigenCompute verification
 *
 * Usage:
 * <eigenx402-button
 *   api-url="https://api.yourservice.com"
 *   endpoint="/api/premium-feature"
 *   price="0.10"
 *   label="Unlock Premium">
 * </eigenx402-button>
 */

import { EigenX402Client } from '@eigenx402/client-sdk';
import { BrowserProvider } from 'ethers';

interface ButtonAttributes {
  apiUrl: string;
  endpoint: string;
  price: string;
  label: string;
  network: string;
  currency: string;
}

class EigenX402Button extends HTMLElement {
  private shadow: ShadowRoot;
  private client: EigenX402Client | null = null;
  private provider: BrowserProvider | null = null;
  private signer: any = null;
  private address: string | null = null;
  private isPaid: boolean = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  private getAttributes(): ButtonAttributes {
    return {
      apiUrl: this.getAttribute('api-url') || 'http://localhost:3001',
      endpoint: this.getAttribute('endpoint') || '/api/resource',
      price: this.getAttribute('price') || '0.05',
      label: this.getAttribute('label') || 'Pay & Access',
      network: this.getAttribute('network') || 'base-sepolia',
      currency: this.getAttribute('currency') || 'USDC'
    };
  }

  private render() {
    const { label, price, currency } = this.getAttributes();

    this.shadow.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .button-container {
          display: inline-block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        button.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .price-tag {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
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

        .checkmark {
          font-size: 18px;
        }

        .tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          padding: 8px 12px;
          background: #111827;
          color: white;
          font-size: 12px;
          border-radius: 6px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }

        .button-container:hover .tooltip {
          opacity: 1;
        }

        .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #111827;
        }
      </style>

      <div class="button-container">
        <button id="pay-button">
          <span class="label">${label}</span>
          <span class="price-tag">$${price} ${currency}</span>
        </button>
        <div class="tooltip">x402 payment · EigenCompute verified</div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    const button = this.shadow.getElementById('pay-button');
    if (button) {
      button.addEventListener('click', () => this.handleClick());
    }
  }

  private async handleClick() {
    const button = this.shadow.getElementById('pay-button') as HTMLButtonElement;
    if (!button || this.isPaid) return;

    button.disabled = true;

    try {
      if (!this.signer) {
        // Connect wallet first
        await this.connectWallet();
        button.disabled = false;
        return;
      }

      // Execute payment
      button.innerHTML = '<span class="spinner"></span> Processing...';
      
      const result = await this.executePaidRequest();
      
      // Success
      this.isPaid = true;
      button.className = 'success';
      button.innerHTML = '<span class="checkmark">✓</span> Paid & Verified';
      
      // Dispatch custom event with result
      this.dispatchEvent(new CustomEvent('payment-success', {
        detail: result,
        bubbles: true,
        composed: true
      }));

    } catch (error: any) {
      console.error('[Button] Error:', error);
      button.disabled = false;
      const { label, price, currency } = this.getAttributes();
      button.innerHTML = `
        <span class="label">${label}</span>
        <span class="price-tag">$${price} ${currency}</span>
      `;
      
      this.dispatchEvent(new CustomEvent('payment-error', {
        detail: { error: error.message },
        bubbles: true,
        composed: true
      }));
    }
  }

  private async connectWallet() {
    if (!(window as any).ethereum) {
      throw new Error('MetaMask not installed');
    }

    this.provider = new BrowserProvider((window as any).ethereum);
    await this.provider.send('eth_requestAccounts', []);
    
    // Switch to correct network
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
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org'],
          },
        ]);
      }
    }

    this.signer = await this.provider.getSigner();
    this.address = await this.signer.getAddress();

    const { apiUrl } = this.getAttributes();
    this.client = new EigenX402Client({
      serverUrl: apiUrl,
      signerOrProvider: this.signer
    });
  }

  private async executePaidRequest(): Promise<any> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    const { endpoint } = this.getAttributes();

    // Execute paid request through generic x402 flow - works with ANY endpoint!
    const result = await this.client.makeX402Request(endpoint, {
      method: 'POST',
      body: {
        timestamp: Date.now()
      }
    });

    return result;
  }
}

// Define custom element
customElements.define('eigenx402-button', EigenX402Button);

// Export for TypeScript
export { EigenX402Button };
