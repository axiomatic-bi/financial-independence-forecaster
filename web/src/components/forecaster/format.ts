export const formatCompactCurrency = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '£0';
  }
  if (Math.abs(value) < 1000) {
    return `£${Math.round(value).toLocaleString()}`;
  }
  const compact = new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
  return `£${compact}`;
};

export const parseCurrencyValue = (value: string): number => {
  const parsed = Number(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatTableCurrency = (value: number): string => {
  const rounded = Math.round(value);
  const abs = Math.abs(rounded).toLocaleString('en-GB');
  return `${rounded < 0 ? '-' : ''}£${abs}`;
};
