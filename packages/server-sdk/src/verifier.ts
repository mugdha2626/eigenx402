/**
 * Payment verification logic for EIP-3009 USDC transfers
 */

import { ethers } from 'ethers';
import type { X402PaymentPayload } from '@mugdha26/eigenx402-types';

/**
 * EIP-3009 TransferWithAuthorization domain and types
 * Used for verifying USDC payment signatures
 *
 * Note: Base Sepolia USDC uses domain name "USDC" (not "USD Coin" like mainnet)
 */
const EIP3009_DOMAIN_NAME = 'USDC';
const EIP3009_VERSION = '2';

const TRANSFER_WITH_AUTHORIZATION_TYPEHASH = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' }
  ]
};

/**
 * USDC Contract ABI (minimal - only transferWithAuthorization)
 * EIP-3009: Transfer With Authorization
 */
const USDC_ABI = [
  {
    "inputs": [
      { "name": "from", "type": "address" },
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" },
      { "name": "validAfter", "type": "uint256" },
      { "name": "validBefore", "type": "uint256" },
      { "name": "nonce", "type": "bytes32" },
      { "name": "v", "type": "uint8" },
      { "name": "r", "type": "bytes32" },
      { "name": "s", "type": "bytes32" }
    ],
    "name": "transferWithAuthorization",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export interface VerifierConfig {
  rpcUrl: string;
  chainId: number;
  usdcAddress: string;
  merchantPrivateKey?: string; // Optional: for real settlement
  enableRealSettlement?: boolean; // Optional: flag to enable on-chain settlement
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  txHash?: string;
}

export interface VerificationOptions {
  expectedAmount: string;
  expectedRecipient: string;
  expectedNetwork: string;
}

/**
 * PaymentVerifier handles verification of x402 payment signatures
 * and optionally settlement on-chain.
 */
export class PaymentVerifier {
  private provider: ethers.JsonRpcProvider;
  private config: VerifierConfig;

  constructor(config: VerifierConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  /**
   * Verify payment signature and parameters
   *
   * Checks:
   * 1. Signature validity (EIP-3009)
   * 2. Amount matches expected
   * 3. Recipient matches merchant wallet
   * 4. Validity timestamps
   * 5. Network matches
   */
  async verifyPayment(
    payment: X402PaymentPayload,
    options: VerificationOptions
  ): Promise<VerificationResult> {
    try {
      const { payload } = payment;

      // Verify network
      if (payment.network !== options.expectedNetwork) {
        return {
          valid: false,
          reason: `Network mismatch: expected ${options.expectedNetwork}, got ${payment.network}`
        };
      }

      // Verify amount
      if (payload.value !== options.expectedAmount) {
        return {
          valid: false,
          reason: `Amount mismatch: expected ${options.expectedAmount}, got ${payload.value}`
        };
      }

      // Verify recipient
      if (payload.to.toLowerCase() !== options.expectedRecipient.toLowerCase()) {
        return {
          valid: false,
          reason: `Recipient mismatch: expected ${options.expectedRecipient}, got ${payload.to}`
        };
      }

      // Verify timestamps
      const now = Math.floor(Date.now() / 1000);
      if (now < payload.validAfter) {
        return {
          valid: false,
          reason: 'Payment not yet valid'
        };
      }
      if (now > payload.validBefore) {
        return {
          valid: false,
          reason: 'Payment expired'
        };
      }

      // Verify EIP-3009 signature
      const domain = {
        name: EIP3009_DOMAIN_NAME,
        version: EIP3009_VERSION,
        chainId: this.config.chainId,
        verifyingContract: this.config.usdcAddress
      };

      const message = {
        from: payload.from,
        to: payload.to,
        value: payload.value,
        validAfter: payload.validAfter,
        validBefore: payload.validBefore,
        nonce: payload.nonce
      };

      // Recover signer from signature
      const signature = {
        r: payload.r,
        s: payload.s,
        v: payload.v
      };

      const recoveredAddress = ethers.verifyTypedData(
        domain,
        TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
        message,
        signature
      );

      // Verify signer matches 'from' address
      if (recoveredAddress.toLowerCase() !== payload.from.toLowerCase()) {
        return {
          valid: false,
          reason: `Signature verification failed: signer ${recoveredAddress} does not match from ${payload.from}`
        };
      }

      // All checks passed - now settle payment
      let txHash: string;

      if (this.config.enableRealSettlement && this.config.merchantPrivateKey) {
        // Real on-chain settlement
        console.log('[PaymentVerifier] Real settlement enabled - executing on-chain transfer');
        txHash = await this.settlePayment(payment);
      } else {
        // Simulated settlement for demo/testing
        console.log('[PaymentVerifier] Using simulated settlement (demo mode)');
        txHash = this.generateSimulatedTxHash(payload);
      }

      return {
        valid: true,
        txHash
      };
    } catch (error: any) {
      console.error('[PaymentVerifier] Verification error:', error);
      return {
        valid: false,
        reason: `Verification error: ${error.message}`
      };
    }
  }

  /**
   * Settle payment on-chain by calling transferWithAuthorization
   *
   * This executes the actual USDC transfer on Base Sepolia using EIP-3009.
   * The merchant submits the signed authorization to the USDC contract.
   *
   * @param payment - The signed payment authorization
   * @returns Transaction hash of the settlement transaction
   */
  async settlePayment(payment: X402PaymentPayload): Promise<string> {
    if (!this.config.merchantPrivateKey) {
      throw new Error('Merchant private key not configured for settlement');
    }

    console.log('[PaymentVerifier] Settling payment on-chain...');
    console.log('[PaymentVerifier] From:', payment.payload.from);
    console.log('[PaymentVerifier] To:', payment.payload.to);
    console.log('[PaymentVerifier] Amount:', payment.payload.value);

    // Create wallet instance with merchant private key
    const wallet = new ethers.Wallet(this.config.merchantPrivateKey, this.provider);
    console.log('[PaymentVerifier] Merchant wallet:', await wallet.getAddress());

    // Create USDC contract instance
    const usdc = new ethers.Contract(this.config.usdcAddress, USDC_ABI, wallet);

    // Call transferWithAuthorization
    console.log('[PaymentVerifier] Calling transferWithAuthorization...');
    const tx = await usdc.transferWithAuthorization(
      payment.payload.from,
      payment.payload.to,
      payment.payload.value,
      payment.payload.validAfter,
      payment.payload.validBefore,
      payment.payload.nonce,
      payment.payload.v,
      payment.payload.r,
      payment.payload.s
    );

    console.log('[PaymentVerifier] Transaction submitted:', tx.hash);
    console.log('[PaymentVerifier] Waiting for confirmation...');

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('[PaymentVerifier] Transaction confirmed in block:', receipt.blockNumber);

    return receipt.hash;
  }

  /**
   * Generate a simulated transaction hash for demo purposes
   * In production, this would be replaced with actual on-chain settlement
   */
  private generateSimulatedTxHash(payload: any): string {
    const data = JSON.stringify(payload);
    const hash = ethers.keccak256(ethers.toUtf8Bytes(data));
    return hash;
  }
}
