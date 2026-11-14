import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number into Indonesian Rupiah (e.g. Rp35.000)
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s+/g, '');
}

// Format UTC date into Indonesian convention (e.g. 15 Nov 2026, 14:32 WIB)
export function formatDateId(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE || 'Asia/Jakarta',
    }).format(date) + ' WIB';
  } catch {
    return dateString;
  }
}
