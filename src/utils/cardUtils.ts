export function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '').split('').map(Number).reverse();
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i];
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function detectCardType(num: string): string {
  const clean = num.replace(/\D/g, '');
  if (clean.length === 0) return 'unknown';

  // Amex: starts with 34 or 37
  if (/^3[47]/.test(clean)) return 'amex';
  // Visa: starts with 4
  if (/^4/.test(clean)) return 'visa';
  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(clean)) return 'mastercard';
  if (/^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(clean)) return 'mastercard';
  // Discover: starts with 6011, 644-649, 65
  if (/^6011/.test(clean)) return 'discover';
  if (/^64[4-9]/.test(clean)) return 'discover';
  if (/^65/.test(clean)) return 'discover';
  // JCB: starts with 3528-3589
  if (/^35(2[89]|[3-8]\d)/.test(clean)) return 'jcb';
  // Diners Club: starts with 300-305, 3095, 36, 38-39
  if (/^30[0-5]/.test(clean)) return 'diners';
  if (/^36/.test(clean)) return 'diners';
  if (/^3[89]/.test(clean)) return 'diners';

  return 'unknown';
}

export function formatCardNumber(num: string): string {
  const clean = num.replace(/\D/g, '');
  const type = detectCardType(clean);
  if (type === 'amex') {
    // Amex: XXXX XXXXXX XXXXX
    if (clean.length <= 4) return clean;
    if (clean.length <= 10) return clean.slice(0, 4) + ' ' + clean.slice(4);
    return clean.slice(0, 4) + ' ' + clean.slice(4, 10) + ' ' + clean.slice(10, 15);
  }
  // Most cards: XXXX XXXX XXXX XXXX
  const groups = clean.match(/.{1,4}/g);
  return groups ? groups.join(' ') : clean;
}

export function getCardTypeDisplay(type: string): { name: string; color: string; icon: string } {
  const types: Record<string, { name: string; color: string; icon: string }> = {
    visa: { name: 'Visa', color: '#1A1F71', icon: '💳' },
    mastercard: { name: 'Mastercard', color: '#EB001B', icon: '💳' },
    amex: { name: 'American Express', color: '#006FCF', icon: '💳' },
    discover: { name: 'Discover', color: '#FF6000', icon: '💳' },
    jcb: { name: 'JCB', color: '#003B85', icon: '💳' },
    diners: { name: 'Diners Club', color: '#0079BE', icon: '💳' },
    unknown: { name: 'Unknown', color: '#666', icon: '💳' },
  };
  return types[type] || types.unknown;
}

export function getExpectedLength(type: string): { min: number; max: number } {
  switch (type) {
    case 'amex': return { min: 15, max: 15 };
    case 'visa': return { min: 13, max: 16 };
    case 'mastercard': return { min: 16, max: 16 };
    case 'discover': return { min: 16, max: 16 };
    default: return { min: 13, max: 19 };
  }
}

export function validateCard(num: string, expiry: string, cvv: string): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const clean = num.replace(/\D/g, '');
  const type = detectCardType(clean);

  // Luhn check
  if (clean.length > 6 && !luhnCheck(clean)) {
    errors.card = 'Card number is invalid';
  }

  // Length check
  if (type !== 'unknown') {
    const { min, max } = getExpectedLength(type);
    if (clean.length < min) {
      errors.card = `Card number is incomplete (${min} digits required)`;
    } else if (clean.length > max) {
      errors.card = `Card number is too long (${max} digits maximum)`;
    }
  }

  // Expiry check
  if (!expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
    errors.expiry = 'Invalid format (MM/YY)';
  } else {
    const [month, year] = expiry.split('/');
    const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
    if (expDate < new Date()) {
      errors.expiry = 'Card has expired';
    }
  }

  // CVV check
  const expectedCvvLen = type === 'amex' ? 4 : 3;
  if (!cvv.match(/^\d+$/)) {
    errors.cvv = 'CVV must be numeric';
  } else if (cvv.length !== expectedCvvLen) {
    errors.cvv = `CVV must be ${expectedCvvLen} digits`;
  }

  return { valid: Object.keys(errors).length === 0 && clean.length > 0, errors };
}
