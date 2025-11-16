/**
 * TypeScript types for React widget components
 */

import type { JobResult } from '@eigenx402/client-sdk';

export interface EigenPayWidgetProps {
  apiUrl: string;
  endpoint?: string;
  price: string;
  title?: string;
  description?: string;
  mode?: 'ai' | 'generic';
  model?: string;
  buttonText?: string;
  network?: string;
  currency?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface EigenPayButtonProps {
  apiUrl: string;
  endpoint?: string;
  price: string;
  label?: string;
  network?: string;
  currency?: string;
  className?: string;
  style?: React.CSSProperties;
  onPaymentSuccess?: (result: JobResult) => void;
  onPaymentError?: (error: Error) => void;
}

export interface PaymentSuccessEvent extends CustomEvent {
  detail: JobResult;
}

export interface PaymentErrorEvent extends CustomEvent {
  detail: { error: string };
}
