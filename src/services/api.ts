import { Platform } from 'react-native';

const API_BASE = Platform.select({
  ios: 'https://cinnamonbackend-production.up.railway.app',
  android: 'https://cinnamonbackend-production.up.railway.app',
  default: 'https://cinnamonbackend-production.up.railway.app',
});

export async function fetchOrdersByMonth(year: number, month: number) {
  const base = API_BASE ?? 'https://cinnamonbackend-production.up.railway.app';
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  const url = `${base}/api/admin/orders?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load orders: ${response.status}`);
  }
  return response.json();
}

export async function fetchAllOrders() {
  const base = API_BASE ?? 'https://cinnamonbackend-production.up.railway.app';
  const url = `${base}/api/admin/orders`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load orders: ${response.status}`);
  }
  return response.json();
}

export async function fetchMenuItems() {
  const base = API_BASE ?? 'https://cinnamonbackend-production.up.railway.app';
  const response = await fetch(`${base}/api/menu/all`);
  if (!response.ok) throw new Error(`Failed to load menu items: ${response.status}`);
  return response.json();
}

export async function createMenuItem(item: object) {
  const base = API_BASE ?? 'https://cinnamonbackend-production.up.railway.app';
  const response = await fetch(`${base}/api/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error(`Failed to create menu item: ${response.status}`);
  return response.json();
}

export async function updateMenuItem(id: string, item: object) {
  const base = API_BASE ?? 'https://cinnamonbackend-production.up.railway.app';
  const response = await fetch(`${base}/api/menu/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error(`Failed to update menu item: ${response.status}`);
  return response.json();
}

export async function deleteMenuItem(id: string) {
  const base = API_BASE ?? 'https://cinnamonbackend-production.up.railway.app';
  const response = await fetch(`${base}/api/menu/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete menu item: ${response.status}`);
}
