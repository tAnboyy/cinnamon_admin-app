import { Platform } from 'react-native';

const API_BASE = Platform.select({
  ios: 'http://localhost:8080',
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

export async function fetchOrdersByMonth(year: number, month: number) {
  const base = API_BASE ?? 'http://localhost:8080';
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  const url = `${base}/api/admin/orders?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load orders: ${response.status}`);
  }
  return response.json();
}
