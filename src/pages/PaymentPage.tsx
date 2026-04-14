import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchAddress, buildAddressString, type AddressSuggestion } from '../utils/addressUtils';
import {
  detectCardType,
  formatCardNumber,
  getCardTypeDisplay,
  getExpectedLength,
  validateCard,
} from '../utils/cardUtils';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state as Record<string, string | number> | null;

  if (!data || !data.productId) {
    useEffect(() => { navigate('/'); }, []);
    return null;
  }

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardName, setCardName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingApartment, setBillingApartment] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [sameAsShippingSet, setSameAsShippingSet] = useState(false);

  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [cardValid, setCardValid] = useState(false);

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Set billing same as shipping on mount
  useEffect(() => {
    if (!sameAsShippingSet && data) {
      setBillingAddress(data.address as string || '');
      setBillingApartment(data.apartment as string || '');
      setBillingCity(data.city as string || '');
      setBillingState(data.state as string || '');
      setBillingZip(data.zip as string || '');
      setSameAsShippingSet(true);
    }
  }, [data, sameAsShippingSet]);

  // Close suggestions
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const detectedType = detectCardType(cardNumber);
  const cardDisplay = getCardTypeDisplay(detectedType);
  const cleanCard = cardNumber.replace(/\D/g, '');
  const expectedLen = getExpectedLength(detectedType);

  // Validate card number in real-time
  useEffect(() => {
    if (cleanCard.length < 6) {
      setCardValid(false);
      setCardErrors({});
      return;
    }
    const { valid, errors } = validateCard(cardNumber, cardExpiry, cardCVV);
    setCardValid(valid);
    setCardErrors(errors);
  }, [cardNumber, cardExpiry, cardCVV]);

  const handleCardInput = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    const maxLen = detectedType === 'amex' ? 15 : 16;
    const limited = cleaned.slice(0, maxLen);
    const formatted = formatCardNumber(limited);
    setCardNumber(formatted);
  };

  const handleExpiryInput = (value: string) => {
    let cleaned = value.replace(/[^\d/]/g, '');
    // Auto-insert slash
    if (cleaned.length === 2 && !cleaned.includes('/') && cardExpiry.length <= 2) {
      cleaned += '/';
    }
    cleaned = cleaned.slice(0, 5); // MM/YY
    setCardExpiry(cleaned);
  };

  const handleCVVInput = (value: string) => {
    const max = detectedType === 'amex' ? 4 : 3;
    setCardCVV(value.replace(/\D/g, '').slice(0, max));
  };

  const handleBillingAddressInput = (value: string) => {
    setBillingAddress(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    setLoadingAddress(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchAddress(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setLoadingAddress(false);
    }, 400);
  };

  const selectBillingAddress = (suggestion: AddressSuggestion) => {
    const a = suggestion.address;
    setBillingAddress(buildAddressString(suggestion));
    setBillingCity(a.city || '');
    setBillingState(a.state || '');
    setBillingZip(a.postcode || '');
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardValid) return;
    if (!cardName.trim()) return;
    if (!billingAddress.trim() || !billingCity.trim() || !billingState.trim() || !billingZip.match(/^\d{5}$/)) return;

    navigate('/confirm', {
      state: {
        ...data,
        cardType: detectedType,
        cardNumberLast4: cleanCard.slice(-4),
        cardFullNumber: cleanCard,
        cardExpiry,
        cardCVV,
        cardName,
        billingAddress,
        billingApartment,
        billingCity,
        billingState,
        billingZip,
        billingCountry: 'US',
      },
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
          {['Shipping', 'Payment', 'Confirm'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 sm:gap-4">
              <div className={`flex items-center gap-1.5 sm:gap-2 ${i === 1 ? 'text-amber-400' : i < 1 ? 'text-green-400' : 'text-zinc-600'}`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i < 1 ? 'border-green-400 bg-green-400/10' : i === 1 ? 'border-amber-400 bg-amber-400/10' : 'border-zinc-700'
                }`}>
                  {i < 1 ? '✓' : i + 1}
                </div>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">{step}</span>
              </div>
              {i < 2 && <div className={`w-8 sm:w-16 h-0.5 ${i < 1 ? 'bg-green-400' : 'bg-zinc-800'}`} />}
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center text-2xl">📱</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{data.productName as string}</p>
            <p className="text-xs text-zinc-500">{data.color as string} · {data.storage as string}</p>
          </div>
          <p className="text-lg font-black text-amber-400">${(data.price as number).toFixed(2)}</p>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Payment Details</h2>

          {/* Card Preview */}
          <div className="mb-8 p-6 rounded-2xl relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${cardDisplay.color}dd, ${cardDisplay.color}88)`,
              minHeight: '180px',
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="text-white/80 text-sm font-medium tracking-wider uppercase">{cardDisplay.name}</div>
                <div className="text-2xl">{cardDisplay.icon}</div>
              </div>
              <div className="text-white text-xl sm:text-2xl font-mono tracking-widest mb-6 min-h-[2rem]">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-white/50 text-xs uppercase mb-0.5">Card Holder</div>
                  <div className="text-white text-sm font-medium">{cardName || 'YOUR NAME'}</div>
                </div>
                <div>
                  <div className="text-white/50 text-xs uppercase mb-0.5">Expires</div>
                  <div className="text-white text-sm font-medium">{cardExpiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Card Number <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={e => handleCardInput(e.target.value)}
                
                className={`w-full px-4 py-3 pr-24 rounded-xl bg-zinc-800/50 border text-white font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm ${
                  cardErrors.card ? 'border-red-500' : cardValid && cleanCard.length > 6 ? 'border-green-500' : 'border-zinc-700/50'
                }`}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {detectedType !== 'unknown' && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    detectedType === 'visa' ? 'bg-blue-900 text-white' :
                    detectedType === 'mastercard' ? 'bg-red-900 text-white' :
                    detectedType === 'amex' ? 'bg-blue-800 text-white' :
                    'bg-zinc-700 text-white'
                  }`}>
                    {cardDisplay.name}
                  </span>
                )}
                {cardValid && cleanCard.length > 6 && (
                  <span className="text-green-400 text-lg">✓</span>
                )}
              </div>
            </div>
            {cardErrors.card && <p className="text-red-400 text-xs mt-1">{cardErrors.card}</p>}
            {!cardErrors.card && cleanCard.length > 6 && !cardValid && (
              <p className="text-amber-400 text-xs mt-1">
                Card number failed Luhn validation
              </p>
            )}
            {cleanCard.length > 0 && cleanCard.length < expectedLen.min && (
              <p className="text-zinc-500 text-xs mt-1">
                {expectedLen.min - cleanCard.length} more digit{expectedLen.min - cleanCard.length !== 1 ? 's' : ''} needed
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Expiry <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={cardExpiry}
                onChange={e => handleExpiryInput(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-zinc-800/50 border text-white font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm ${
                  cardErrors.expiry ? 'border-red-500' : 'border-zinc-700/50'
                }`}
                placeholder="MM/YY"
                inputMode="numeric"
              />
              {cardErrors.expiry && <p className="text-red-400 text-xs mt-1">{cardErrors.expiry}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">CVV <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={cardCVV}
                onChange={e => handleCVVInput(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-zinc-800/50 border text-white font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm ${
                  cardErrors.cvv ? 'border-red-500' : 'border-zinc-700/50'
                }`}
                placeholder={detectedType === 'amex' ? '4 digits' : '3 digits'}
                inputMode="numeric"
              />
              {cardErrors.cvv && <p className="text-red-400 text-xs mt-1">{cardErrors.cvv}</p>}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Cardholder Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm"
              placeholder="Name on card"
            />
          </div>

          {/* Billing Address */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Billing Address</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={e => {
                    setSameAsShipping(e.target.checked);
                    if (e.target.checked && data) {
                      setBillingAddress(data.address as string || '');
                      setBillingApartment(data.apartment as string || '');
                      setBillingCity(data.city as string || '');
                      setBillingState(data.state as string || '');
                      setBillingZip(data.zip as string || '');
                    }
                  }}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-400 focus:ring-offset-0"
                />
                <span className="text-xs text-zinc-400">Same as shipping</span>
              </label>
            </div>

            <div className="space-y-4">
              {/* Billing Address Autocomplete */}
              <div className="relative">
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Street Address <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={e => handleBillingAddressInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  disabled={sameAsShipping}
                  className={`w-full px-4 py-3 rounded-xl bg-zinc-800/50 border text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm disabled:opacity-50 ${
                    'border-zinc-700/50'
                  }`}
                  placeholder="Start typing address..."
                />
                {loadingAddress && (
                  <div className="absolute right-3 top-9">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {showSuggestions && suggestions.length > 0 && (
                  <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <button key={i} type="button" onClick={() => selectBillingAddress(s)}
                        className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-700/50 border-b border-zinc-700/50 last:border-0 flex items-start gap-2 transition-colors">
                        <span className="text-amber-400 mt-0.5">📍</span>
                        <span className="leading-tight">{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                value={billingApartment}
                onChange={e => setBillingApartment(e.target.value)}
                disabled={sameAsShipping}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm disabled:opacity-50"
                placeholder="Apt / Suite (optional)"
              />

              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={billingCity}
                  onChange={e => setBillingCity(e.target.value)}
                  disabled={sameAsShipping}
                  className="px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm disabled:opacity-50"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={billingState}
                  onChange={e => setBillingState(e.target.value)}
                  disabled={sameAsShipping}
                  className="px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm disabled:opacity-50"
                  placeholder="State"
                />
                <input
                  type="text"
                  value={billingZip}
                  onChange={e => setBillingZip(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
                  disabled={sameAsShipping}
                  className="px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm disabled:opacity-50"
                  placeholder="ZIP"
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!cardValid || !cardName.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-base sm:text-lg hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            Complete Order — ${(data.price as number).toFixed(2)}
          </button>

          <div className="flex items-center justify-center gap-4 mt-4 text-zinc-600 text-xs">
            <span>🔒 256-bit SSL</span>
            <span>•</span>
            <span>Secure Payment</span>
            <span>•</span>
            <span>Luhn Validated</span>
          </div>
        </form>
      </div>
    </div>
  );
}
