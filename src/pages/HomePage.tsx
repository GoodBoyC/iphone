import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../data/products';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] sm:min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-zinc-950" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 60%)'
        }} />
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6 sm:mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-amber-400 text-xs sm:text-sm font-semibold uppercase tracking-widest">Limited-Time Exclusive</span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-4 sm:mb-6 leading-tight">
            Save <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">90%</span> on<br />
            iPhone 17 Pro
          </h1>
          <p className="text-zinc-400 text-base sm:text-xl max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed">
            The most advanced iPhone ever — now at an unprecedented price. Available exclusively through Nover for US residents only.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#products" className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl text-sm sm:text-base hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105">
              Shop Now →
            </a>
            <div className="flex items-center gap-3 text-zinc-500 text-xs sm:text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              In Stock — Ships Today
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      {/* Trust Bar */}
      <section className="border-t border-zinc-800/50 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
          {[
            { icon: '🇺🇸', title: 'US Only', desc: 'Exclusive to United States' },
            { icon: '📦', title: 'Free Shipping', desc: 'Express delivery included' },
            { icon: '🔒', title: 'Secure Checkout', desc: '256-bit SSL encryption' },
            { icon: '⚡', title: 'Fast Dispatch', desc: 'Ships within 24 hours' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-2">
              <span className="text-2xl sm:text-3xl">{item.icon}</span>
              <span className="font-semibold text-white text-xs sm:text-sm">{item.title}</span>
              <span className="text-zinc-500 text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 text-center">
        <p className="text-zinc-600 text-xs">© 2026 Nover. All rights reserved. This is an exclusive promotional event.</p>
      </footer>
    </div>
  );
}

function ProductCard({ product }: { product: typeof products[0] }) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0].name);
  const [selectedStorage, setSelectedStorage] = useState(product.storageOptions[0]);
  const [startX, setStartX] = useState(0);
  const [slideOpacity, setSlideOpacity] = useState(1);
  const thumbScrollRef = useRef<HTMLDivElement>(null);

  // Calculate storage-adjusted price
  const getAdjustedPrice = useCallback((storage: string, base: number) => {
    const storageExtra: Record<string, number> = {
      '256GB': 0, '512GB': 100, '1TB': 200, '2TB': 400
    };
    return base + (storageExtra[storage] || 0);
  }, []);

  const adjustedPrice = getAdjustedPrice(selectedStorage, product.discountPrice);

  // (No auto-slide — manual swipe/arrows only)

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbScrollRef.current) {
      const thumb = thumbScrollRef.current.children[currentSlide] as HTMLElement;
      if (thumb) {
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentSlide]);

  const handleTouchStart = (_e: React.TouchEvent) => {
    setStartX(_e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrentSlide((prev) => (prev + 1) % product.images.length);
      } else {
        setCurrentSlide((prev) => (prev - 1 + product.images.length) % product.images.length);
      }
    }
    setSlideOpacity(1);
  };

  const goToSlide = (index: number) => {
    setSlideOpacity(0);
    setTimeout(() => {
      setCurrentSlide(index);
      setSlideOpacity(1);
    }, 150);
  };

  return (
    <div className="mb-16 sm:mb-24 last:mb-0 scroll-mt-20" id={product.id}>
      <div className="bg-zinc-900/50 rounded-2xl sm:rounded-3xl border border-zinc-800/50 overflow-hidden">
        {/* Top Section: Image + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image Carousel */}
          <div className="relative bg-gradient-to-b from-zinc-800/30 to-zinc-900/30 p-4 sm:p-8 flex flex-col items-center">
            {/* Main Image */}
            <div
              className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-[3/4] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing group"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="absolute inset-0 transition-opacity duration-150"
                style={{ opacity: slideOpacity }}
              >
                <img
                  src={product.images[currentSlide].src}
                  alt={product.images[currentSlide].alt}
                  className="w-full h-full object-cover"
                  loading={currentSlide === 0 ? 'eager' : 'lazy'}
                />
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => goToSlide((currentSlide - 1 + product.images.length) % product.images.length)}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
              >
                ‹
              </button>
              <button
                onClick={() => goToSlide((currentSlide + 1) % product.images.length)}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
              >
                ›
              </button>

              {/* Slide Counter */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white font-mono">
                {currentSlide + 1} / {product.images.length}
              </div>

              {/* Discount Badge */}
              <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold">
                {product.discountPercent}% OFF
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 w-full max-w-sm sm:max-w-md" ref={thumbScrollRef}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentSlide
                      ? 'border-amber-400 scale-105 shadow-lg shadow-amber-500/20'
                      : 'border-zinc-700 opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">{product.tagline}</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white">{product.name}</h2>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-sm ${i < Math.floor(product.rating) ? 'text-amber-400' : 'text-zinc-700'}`}>★</span>
                ))}
              </div>
              <span className="text-zinc-400 text-sm">{product.rating}</span>
              <span className="text-zinc-600 text-xs">({product.reviews.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white">${adjustedPrice.toFixed(2)}</span>
                <span className="text-lg text-zinc-500 line-through">${(product.originalPrice + (selectedStorage === '512GB' ? 100 : selectedStorage === '1TB' ? 200 : selectedStorage === '2TB' ? 400 : 0)).toFixed(2)}</span>
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-bold">SAVE 90%</span>
              </div>
              <p className="text-zinc-500 text-xs mt-1">Original MSRP + free express shipping</p>
            </div>

            {/* Color Selector */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-zinc-300 mb-2 block">
                Color — <span className="text-white">{selectedColor}</span>
              </label>
              <div className="flex gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all flex items-center justify-center ${
                      selectedColor === color.name
                        ? 'border-amber-400 scale-110 shadow-lg'
                        : 'border-zinc-600 hover:border-zinc-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {selectedColor === color.name && (
                      <span className={`text-xs font-bold ${color.value === '#E8E8E8' ? 'text-zinc-800' : 'text-white'}`}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Storage Selector */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-zinc-300 mb-2 block">
                Storage — <span className="text-white">{selectedStorage}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.storageOptions.map((storage) => (
                  <button
                    key={storage}
                    onClick={() => setSelectedStorage(storage)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      selectedStorage === storage
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    {storage}
                  </button>
                ))}
              </div>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {product.specs.slice(0, 6).map((spec) => (
                <div key={spec.label} className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-800/50">
                  <p className="text-zinc-500 text-xs mb-0.5">{spec.label}</p>
                  <p className="text-white text-xs font-medium leading-snug">{spec.value.length > 40 ? spec.value.slice(0, 40) + '…' : spec.value}</p>
                </div>
              ))}
            </div>

            {/* Order Button */}
            <button
              onClick={() => {
                navigate('/verify', {
                  state: {
                    productId: product.id,
                    productName: product.name,
                    color: selectedColor,
                    storage: selectedStorage,
                    price: adjustedPrice,
                  },
                });
              }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-base sm:text-lg hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98]"
            >
              Order Now — ${adjustedPrice.toFixed(2)}
            </button>
          </div>
        </div>

        {/* Full Description */}
        <div className="px-6 sm:px-8 lg:px-10 py-6 sm:py-8 border-t border-zinc-800/50">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4">About this product</h3>
          <div className="text-zinc-400 text-sm sm:text-base leading-relaxed whitespace-pre-line max-w-4xl">
            {product.description}
          </div>
        </div>

        {/* Full Specs Table */}
        <div className="px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Technical Specifications</h3>
          <div className="overflow-x-auto rounded-xl border border-zinc-800/50">
            <table className="w-full text-sm">
              <tbody>
                {product.specs.map((spec, idx) => (
                  <tr key={spec.label} className={`${idx % 2 === 0 ? 'bg-zinc-800/20' : 'bg-zinc-800/10'}`}>
                    <td className="px-4 py-3 text-zinc-400 font-medium whitespace-nowrap w-1/3 sm:w-48">{spec.label}</td>
                    <td className="px-4 py-3 text-zinc-200">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-zinc-600 text-xs mt-3">Source: GSMArena — specifications may vary by region</p>
        </div>
      </div>
    </div>
  );
}


