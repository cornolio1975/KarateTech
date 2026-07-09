/**
 * Timezone-safe local date formatting utility.
 * Parses 'YYYY-MM-DD' formatted date strings without UTC/timezone shift
 * and formats them cleanly into local presentation strings.
 */
export function formatLocalDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', options || { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', options);
}
