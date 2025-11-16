/**
 * React wrapper for EigenX402 payment button widget
 */

import React, { useEffect, useRef, useCallback } from 'react';
import '@eigenx402/widget/button'; // Import button web component
import type { EigenPayButtonProps, PaymentSuccessEvent, PaymentErrorEvent } from './types';

/**
 * EigenPayButton - React component for payment button
 * 
 * @example
 * <EigenPayButton
 *   apiUrl="https://api.yourservice.com"
 *   endpoint="/api/premium-feature"
 *   price="0.10"
 *   label="Unlock Premium"
 *   onPaymentSuccess={(result) => console.log('Paid!', result)}
 *   onPaymentError={(error) => console.error('Failed:', error)}
 * />
 */
export function EigenPayButton(props: EigenPayButtonProps) {
  const ref = useRef<HTMLElement>(null);

  const handlePaymentSuccess = useCallback((event: Event) => {
    const customEvent = event as PaymentSuccessEvent;
    if (props.onPaymentSuccess) {
      props.onPaymentSuccess(customEvent.detail);
    }
  }, [props]);

  const handlePaymentError = useCallback((event: Event) => {
    const customEvent = event as PaymentErrorEvent;
    if (props.onPaymentError) {
      props.onPaymentError(new Error(customEvent.detail.error));
    }
  }, [props]);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    
    // Set attributes
    element.setAttribute('api-url', props.apiUrl);
    element.setAttribute('price', props.price);

    if (props.endpoint) {
      element.setAttribute('endpoint', props.endpoint);
    }
    if (props.label) {
      element.setAttribute('label', props.label);
    }
    if (props.network) {
      element.setAttribute('network', props.network);
    }
    if (props.currency) {
      element.setAttribute('currency', props.currency);
    }

    // Add event listeners
    element.addEventListener('payment-success', handlePaymentSuccess);
    element.addEventListener('payment-error', handlePaymentError);

    return () => {
      element.removeEventListener('payment-success', handlePaymentSuccess);
      element.removeEventListener('payment-error', handlePaymentError);
    };
  }, [props, handlePaymentSuccess, handlePaymentError]);

  return React.createElement('eigenx402-button', {
    ref,
    className: props.className,
    style: props.style
  });
}
