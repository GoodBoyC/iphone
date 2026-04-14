import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchAddress, lookupZipCode, buildAddressString, type AddressSuggestion } from '../utils/addressUtils';

export default function VerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderInfo = location.state as {
    productId: string;
    productName: string;
    color: string;
    storage: string;
    price: number;
  } | null;

  if (!orderInfo) {
    useEffect(() => { navigate('/'); }, []);
    return null;
  }

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingZip, setLoadingZip] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAddressInput = (value: string) => {
    setFormData(prev => ({ ...prev, address: value }));
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingAddress(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchAddress(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setLoadingAddress(false);
    }, 400);
  };

  const selectAddress = (suggestion: AddressSuggestion) => {
    const a = suggestion.address;
    setFormData(prev => ({
      ...prev,
      address: buildAddressString(suggestion),
      apartment: a.house_number ? '' : prev.apartment,
      city: a.city || '',
      state: a.state || '',
      zip: a.postcode || '',
    }));
    setShowSuggestions(false);
  };

  const handleZipInput = async (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '').slice(0, 5);
    setFormData(prev => ({ ...prev, zip: cleaned }));
    if (cleaned.length === 5) {
      setLoadingZip(true);
      const result = await lookupZipCode(cleaned);
      if (result) {
        setFormData(prev => ({
          ...prev,
          city: result.city,
          state: result.state,
        }));
      }
      setLoadingZip(false);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Valid email required';
    if (!formData.phone.match(/^\+?[\d\s-()]{10,}$/)) errs.phone = 'Valid phone number required (10+ digits)';
    if (!formData.firstName.trim()) errs.firstName = 'First name required';
    if (!formData.lastName.trim()) errs.lastName = 'Last name required';
    if (!formData.address.trim()) errs.address = 'Address required';
    if (!formData.city.trim()) errs.city = 'City required';
    if (!formData.state.trim()) errs.state = 'State required';
    if (!formData.zip.match(/^\d{5}$/)) errs.zip = 'Valid 5-digit ZIP required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      navigate('/payment', {
        state: {
          ...orderInfo,
          ...formData,
        },
      });
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
          {['Shipping', 'Payment', 'Confirm'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 sm:gap-4">
              <div className={`flex items-center gap-1.5 sm:gap-2 ${i === 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i === 0 ? 'border-amber-400 bg-amber-400/10' : 'border-zinc-700'
                }`}>
                  {i + 1}
                </div>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">{step}</span>
              </div>
              {i < 2 && <div className={`w-8 sm:w-16 h-0.5 ${i === 0 ? 'bg-amber-400/50' : 'bg-zinc-800'}`} />}
            </div>
          ))}
        </div>

        {/* Order Summary Mini */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center text-2xl">📱</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{orderInfo.productName}</p>
            <p className="text-xs text-zinc-500">{orderInfo.color} · {orderInfo.storage}</p>
          </div>
          <p className="text-lg font-black text-amber-400">${orderInfo.price.toFixed(2)}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Shipping Details</h2>

          {/* Contact Info */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email" type="email" value={formData.email} error={errors.email}
                onChange={v => updateField('email', v)} placeholder="you@email.com" />
              <Field label="Phone" type="tel" value={formData.phone} error={errors.phone}
                onChange={v => updateField('phone', v)} placeholder="+1 (555) 000-0000" />
            </div>
          </div>

          {/* Name */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Full Name</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name" value={formData.firstName} error={errors.firstName}
                onChange={v => updateField('firstName', v)} placeholder="John" />
              <Field label="Last Name" value={formData.lastName} error={errors.lastName}
                onChange={v => updateField('lastName', v)} placeholder="Doe" />
            </div>
          </div>

          {/* Address */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Shipping Address</h3>
            <div className="space-y-4">
              {/* Address with autocomplete */}
              <div className="relative">
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Street Address <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => handleAddressInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className={`w-full px-4 py-3 rounded-xl bg-zinc-800/50 border text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm ${
                    errors.address ? 'border-red-500' : 'border-zinc-700/50'
                  }`}
                  placeholder="Start typing your address..."
                  autoComplete="street-address"
                />
                {loadingAddress && (
                  <div className="absolute right-3 top-9">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectAddress(s)}
                        className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-700/50 border-b border-zinc-700/50 last:border-0 flex items-start gap-2 transition-colors"
                      >
                        <span className="text-amber-400 mt-0.5">📍</span>
                        <span className="leading-tight">{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
              </div>

              <Field label="Apt / Suite / Unit (optional)" value={formData.apartment}
                onChange={v => updateField('apartment', v)} placeholder="Apt 4B" />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="City" value={formData.city} error={errors.city}
                  onChange={v => updateField('city', v)} placeholder="New York" />
                <div className="relative">
                  <Field label="State" value={formData.state} error={errors.state}
                    onChange={v => updateField('state', v)} placeholder="NY" />
                  {loadingZip && (
                    <div className="absolute right-3 top-9">
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <Field label="ZIP Code" value={formData.zip} error={errors.zip}
                    onChange={handleZipInput} placeholder="10001" />
                  {loadingZip && (
                    <div className="absolute right-3 top-9">
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Country</label>
                <div className="px-4 py-3 rounded-xl bg-zinc-800/30 border border-zinc-700/50 text-zinc-400 text-sm flex items-center gap-2">
                  🇺🇸 United States
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-base sm:text-lg hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98]"
          >
            Continue to Payment →
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, error, onChange, placeholder }: {
  label: string; type?: string; value: string; error?: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
        {label} <span className="text-red-400">*</span>
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl bg-zinc-800/50 border text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm ${
          error ? 'border-red-500' : 'border-zinc-700/50'
        }`}
        placeholder={placeholder}
        autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
