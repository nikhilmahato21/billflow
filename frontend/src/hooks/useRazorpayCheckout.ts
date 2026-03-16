import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key:              string;
  subscription_id?: string;
  name?:            string;
  description?:     string;
  image?:           string;
  prefill?: {
    name?:  string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (response: RazorpayPaymentResponse) => void;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id:      string;
  razorpay_subscription_id: string;
  razorpay_signature:       string;
}

interface RazorpayInstance {
  open:  () => void;
  close: () => void;
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script   = document.createElement("script");
    script.src     = RAZORPAY_SCRIPT;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface UseRazorpayCheckoutOptions {
  keyId:          string;
  businessName:   string;
  onSuccess:      (response: RazorpayPaymentResponse) => void;
  onDismiss?:     () => void;
}

export function useRazorpayCheckout({
  keyId,
  businessName,
  onSuccess,
  onDismiss,
}: UseRazorpayCheckoutOptions) {
  const instanceRef = useRef<RazorpayInstance | null>(null);

  // Preload the Razorpay SDK
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const openCheckout = useCallback(async (opts: {
    subscriptionId: string;
    customerName?:  string;
    customerEmail?: string;
    customerPhone?: string;
    description?:   string;
  }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error("Failed to load Razorpay SDK");

    const options: RazorpayOptions = {
      key:            keyId,
      subscription_id: opts.subscriptionId,
      name:           businessName,
      description:    opts.description ?? "Subscription payment",
      image:          "/favicon.svg",
      prefill: {
        name:    opts.customerName,
        email:   opts.customerEmail,
        contact: opts.customerPhone,
      },
      theme:  { color: "#6366f1" },
      modal:  { ondismiss: onDismiss },
      handler: (response) => {
        instanceRef.current = null;
        onSuccess(response);
      },
    };

    instanceRef.current = new window.Razorpay(options);
    instanceRef.current.open();
  }, [keyId, businessName, onSuccess, onDismiss]);

  const closeCheckout = useCallback(() => {
    instanceRef.current?.close();
    instanceRef.current = null;
  }, []);

  return { openCheckout, closeCheckout };
}
