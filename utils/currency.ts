import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Currency {
  code: string;
  symbol: string;
  label: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',   label: 'US Dollar',         flag: '🇺🇸' },
  { code: 'EUR', symbol: '€',   label: 'Euro',              flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',   label: 'British Pound',     flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥',   label: 'Japanese Yen',      flag: '🇯🇵' },
  { code: 'TWD', symbol: 'NT$', label: 'Taiwan Dollar',     flag: '🇹🇼' },
  { code: 'CNY', symbol: '¥',   label: 'Chinese Yuan',      flag: '🇨🇳' },
  { code: 'KRW', symbol: '₩',   label: 'Korean Won',        flag: '🇰🇷' },
  { code: 'AUD', symbol: 'A$',  label: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$',  label: 'Canadian Dollar',   flag: '🇨🇦' },
  { code: 'SGD', symbol: 'S$',  label: 'Singapore Dollar',  flag: '🇸🇬' },
  { code: 'HKD', symbol: 'HK$', label: 'Hong Kong Dollar',  flag: '🇭🇰' },
  { code: 'MXN', symbol: '$',   label: 'Mexican Peso',      flag: '🇲🇽' },
];

const KEY = 'selected_currency';
let _current: Currency = CURRENCIES[0];

export async function loadCurrency(): Promise<Currency> {
  try {
    const code = await AsyncStorage.getItem(KEY);
    const found = CURRENCIES.find(c => c.code === code);
    _current = found ?? CURRENCIES[0];
  } catch {
    _current = CURRENCIES[0];
  }
  return _current;
}

export async function saveCurrency(currency: Currency): Promise<void> {
  _current = currency;
  await AsyncStorage.setItem(KEY, currency.code);
}

export function getCurrency(): Currency {
  return _current;
}

export function fmt(n: number): string {
  return _current.symbol + Math.round(n).toLocaleString('en-US');
}
