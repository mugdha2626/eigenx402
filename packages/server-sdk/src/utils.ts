/**
 * Utility functions for x402 payment handling
 */

import { Request } from 'express';
import type { X402PaymentPayload, X402PaymentRequired, X402PaymentRequirement } from '@mugdha26/eigenx402-types';
import type { PaymentMiddlewareOptions } from './types';

/**
 * Create x402 payment requirement object
 */
export function createPaymentRequirement(
  req: Request,
  options: PaymentMiddlewareOptions
): X402PaymentRequired {
  const resource = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  const requirement: X402PaymentRequirement = {
    scheme: 'exact',
    network: options.network,
    asset: options.asset,
    payTo: options.payTo,
    maxAmountRequired: options.amount,
    resource,
    description: options.description || 'Payment required for API access',
    maxTimeoutSeconds: options.maxTimeoutSeconds || 3600
  };

  return {
    x402Version: 1,
    accepts: [requirement]
  };
}

/**
 * Parse X-PAYMENT header into payment payload
 *
 * The header contains base64-encoded JSON with the payment authorization
 */
export function parsePaymentHeader(header: string): X402PaymentPayload | null {
  try {
    // Decode base64
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded) as X402PaymentPayload;

    // Validate structure
    if (!payload.x402Version || !payload.scheme || !payload.network || !payload.payload) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[parsePaymentHeader] Parse error:', error);
    return null;
  }
}

/**
 * Encode payment payload as base64 X-PAYMENT header value
 */
export function encodePaymentHeader(payload: X402PaymentPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, 'utf-8').toString('base64');
}
