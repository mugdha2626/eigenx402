/**
 * React wrapper for EigenX402 payment gateway widget
 */

import React, { useEffect, useRef } from 'react';
import '@eigenx402/widget'; // Import web component
import type { EigenPayWidgetProps } from './types';

/**
 * EigenPayWidget - React component for payment gateway
 * 
 * @example
 * // AI Inference mode
 * <EigenPayWidget
 *   apiUrl="https://api.yourservice.com"
 *   price="0.05"
 *   title="AI Assistant"
 *   mode="ai"
 * />
 * 
 * @example
 * // Generic API mode
 * <EigenPayWidget
 *   apiUrl="https://api.yourservice.com"
 *   endpoint="/api/premium-content"
 *   price="1.00"
 *   title="Premium Content"
 *   mode="generic"
 * />
 */
export function EigenPayWidget(props: EigenPayWidgetProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Set attributes on the web component
    const element = ref.current;
    
    element.setAttribute('api-url', props.apiUrl);
    element.setAttribute('price', props.price);

    if (props.endpoint) {
      element.setAttribute('endpoint', props.endpoint);
    }
    if (props.title) {
      element.setAttribute('title', props.title);
    }
    if (props.description) {
      element.setAttribute('description', props.description);
    }
    if (props.mode) {
      element.setAttribute('mode', props.mode);
    }
    if (props.model) {
      element.setAttribute('model', props.model);
    }
    if (props.buttonText) {
      element.setAttribute('button-text', props.buttonText);
    }
    if (props.network) {
      element.setAttribute('network', props.network);
    }
    if (props.currency) {
      element.setAttribute('currency', props.currency);
    }
  }, [props]);

  return React.createElement('eigenx402-widget', {
    ref,
    className: props.className,
    style: props.style
  });
}
