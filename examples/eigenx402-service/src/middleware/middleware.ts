/**
 * Express middleware for x402 payment gating
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import type { PaymentMiddlewareOptions, PaymentRequest } from './types';
import type { X402PaymentRequired } from '../types';
import { createPaymentRequirement, parsePaymentHeader } from './utils';
import { PaymentVerifier } from './verifier';

/**
 * Express middleware that enforces x402 payment before allowing access to a route.
 *
 * If request lacks valid payment:
 *   - Responds with HTTP 402 Payment Required
 *   - Includes x402 payment requirements in response body
 *
 * If request has valid payment:
 *   - Verifies payment signature and amount
 *   - Attaches payment info to request object
 *   - Calls next() to continue to route handler
 *
 * Usage:
 *   app.post('/api/jobs/run',
 *     requirePayment({
 *       amount: '50000', // $0.05 USDC
 *       asset: '0x036Cb...',
 *       network: 'base-sepolia',
 *       payTo: '0xMerchant...',
 *       rpcUrl: 'https://sepolia.base.org',
 *       chainId: 84532
 *     }),
 *     async (req, res) => {
 *       // Payment verified, process request
 *       const txHash = (req as PaymentRequest).txHash;
 *       res.json({ success: true, txHash });
 *     }
 *   );
 */
export function requirePayment(options: PaymentMiddlewareOptions): RequestHandler {
  const verifier = new PaymentVerifier({
    rpcUrl: options.rpcUrl,
    chainId: options.chainId,
    usdcAddress: options.asset,
    merchantPrivateKey: options.merchantPrivateKey,
    enableRealSettlement: options.enableRealSettlement
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check for X-PAYMENT header
      const paymentHeader = req.headers['x-payment'] as string | undefined;

      if (!paymentHeader) {
        // No payment header - return 402 with requirements
        return send402Response(req, res, options);
      }

      // Parse payment header
      const payment = parsePaymentHeader(paymentHeader);

      if (!payment) {
        return res.status(400).json({
          error: 'Invalid X-PAYMENT header format'
        });
      }

      // Verify payment
      const verification = await verifier.verifyPayment(payment, {
        expectedAmount: options.amount,
        expectedRecipient: options.payTo,
        expectedNetwork: options.network
      });

      if (!verification.valid) {
        return res.status(402).json({
          error: 'Payment verification failed',
          reason: verification.reason,
          x402: createPaymentRequirement(req, options)
        });
      }

      // Payment verified - attach to request and continue
      const paymentReq = req as PaymentRequest;
      paymentReq.payment = payment;
      paymentReq.paymentVerified = true;
      paymentReq.txHash = verification.txHash;

      next();
    } catch (error: any) {
      console.error('[requirePayment] Error:', error);
      res.status(500).json({
        error: 'Payment processing error',
        message: error.message
      });
    }
  };
}

/**
 * Send HTTP 402 Payment Required response with x402 requirements
 */
function send402Response(
  req: Request,
  res: Response,
  options: PaymentMiddlewareOptions
): void {
  const paymentRequired: X402PaymentRequired = createPaymentRequirement(req, options);

  res.status(402).json(paymentRequired);
}
