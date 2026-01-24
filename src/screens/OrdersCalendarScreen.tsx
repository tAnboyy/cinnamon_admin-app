import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Button,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { fetchOrdersByMonth } from '../services/api';
import { StatusBar } from 'expo-status-bar';
import printerService, { PrinterDevice } from '../services/printerService';

type OrderItem = { name: string; quantity: number };

interface AdminOrder {
  id: string;
  customerName: string;
  pickupTime?: string;
  pickupDate?: string;
  status?: string;
  items: OrderItem[];
  totalPrice: number;
  address?: string;
  placedDateObj: Date;
  isPrinted?: boolean;
  paymentMethod?: string;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  const start = startOfMonth(d);
  const month = start.getMonth();
  const days = [] as Date[];
  for (let i = 0; i < 31; i++) {
    const candidate = new Date(start.getFullYear(), month, i + 1);
    if (candidate.getMonth() !== month) break;
    days.push(candidate);
  }
  return days;
}

const OrdersCalendarScreen = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [manualPrinterIP, setManualPrinterIP] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrdersByMonth(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
        if (!isMounted) return;
        const normalized = Array.isArray(data) ? data.map(normalizeOrder) : [];
        setOrders(normalized);
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Unable to load orders for this month');
          setOrders([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    if (selectedDay.getMonth() !== currentMonth.getMonth() || selectedDay.getFullYear() !== currentMonth.getFullYear()) {
      setSelectedDay(currentMonth);
    }

    return () => {
      isMounted = false;
    };
  }, [currentMonth]);

  const days: Date[] = useMemo(() => daysInMonth(currentMonth), [currentMonth]);

  const ordersByDay = useMemo(() => {
    const map = new Map<string, AdminOrder[]>();
    orders.forEach((order) => {
      if (
        order.placedDateObj.getFullYear() === currentMonth.getFullYear() &&
        order.placedDateObj.getMonth() === currentMonth.getMonth()
      ) {
        const key = dayKey(order.placedDateObj);
        const existing = map.get(key) ?? [];
        existing.push(order);
        map.set(key, existing);
      }
    });
    return map;
  }, [orders, currentMonth]);

  const ordersForSelected = ordersByDay.get(dayKey(selectedDay)) ?? [];

  const markOrderReady = (id: string) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status: 'Ready' } : o)));
    Alert.alert('Order updated', 'Order marked as Ready');
    setSelectedOrder(null);
  };

  const unprintedOrdersForDay = ordersForSelected.filter(o => !o.isPrinted);

  const discoverPrinters = async () => {
    setIsDiscovering(true);
    try {
      const discoveredPrinters = await printerService.discoverPrinters();
      setPrinters(discoveredPrinters);
      
      if (discoveredPrinters.length === 0) {
        Alert.alert('No Printers Found', 'Please enter your printer IP address manually.');
      } else if (discoveredPrinters.length === 1) {
        setSelectedPrinter(discoveredPrinters[0].identifier);
      }
    } catch (error) {
      console.error('Printer discovery error:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  useEffect(() => {
    // Auto-discover printers on mount
    discoverPrinters();
  }, []);

  const handlePrintDay = async () => {
    if (unprintedOrdersForDay.length === 0) {
      Alert.alert('No Orders', 'All orders for this day have been printed.');
      return;
    }

    // Check if printer is selected
    if (!selectedPrinter) {
      console.log('[Calendar] No printer selected, showing printer modal');
      setShowPrinterModal(true);
      return;
    }

    setPrinting(true);
    try {
      console.log(`[Calendar] Printing ${unprintedOrdersForDay.length} orders for ${selectedDay.toLocaleDateString()}`);
      
      // Print each order individually
      for (const order of unprintedOrdersForDay) {
        console.log('[Calendar] Printing order:', order.id);
        // Convert AdminOrder to Order format expected by printer service
        const printableOrder = {
          id: order.id,
          customerName: order.customerName,
          pickupTime: order.pickupTime || 'TBD',
          status: order.status as 'Pending' | 'Ready' | 'Completed' | 'Cancelled' || 'Pending',
          items: order.items,
          totalPrice: order.totalPrice,
          address: order.address,
        };
        await printerService.printReceipt(printableOrder, selectedPrinter);
      }

      Alert.alert('Success', `Successfully printed ${unprintedOrdersForDay.length} receipt(s)!`);

      // Mark all orders as printed
      setOrders(prev =>
        prev.map(o =>
          unprintedOrdersForDay.find(up => up.id === o.id)
            ? { ...o, isPrinted: true }
            : o
        )
      );
    } catch (err: any) {
      console.error('Print error:', err);
      Alert.alert('Print Error', `Failed to print receipts: ${err?.message || 'Unknown error'}`);
    } finally {
      setPrinting(false);
    }
  };

  const changeMonth = (delta: number) => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
    setCurrentMonth(next);
    setSelectedDay(next);
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn} accessibilityLabel="Previous month">
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.monthTitle}>{formatMonthYear(currentMonth)}</Text>
          <Text style={styles.monthSubtitle}>{orders.length} orders</Text>
        </View>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn} accessibilityLabel="Next month">
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarRow}>
        {days.map((day: Date) => {
          const isSelected = day.toDateString() === selectedDay.toDateString();
          const hasOrders = ordersByDay.has(dayKey(day));
          return (
            <TouchableOpacity key={day.toISOString()} onPress={() => setSelectedDay(day)} style={[styles.day, isSelected ? styles.daySelected : null]}>
              <Text style={[styles.dayText, isSelected ? styles.dayTextSelected : null]}>{day.getDate()}</Text>
              {hasOrders && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.dayToolbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listHeaderText}>Orders for {selectedDay.toDateString()}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
        <TouchableOpacity
          style={[styles.printButton, (unprintedOrdersForDay.length === 0 || printing) && styles.printButtonDisabled]}
          onPress={handlePrintDay}
          disabled={unprintedOrdersForDay.length === 0 || printing}
        >
          <Text style={styles.printButtonText}>{printing ? '⏳' : '🖨️'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size={32} color="#111" style={{ marginTop: 16 }} />
      ) : (
        <FlatList
          data={ordersForSelected}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedOrder(item)} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTitle}>{item.customerName}</Text>
                <Text style={styles.orderMeta}>{item.pickupTime || 'Pickup TBD'}</Text>
                <Text style={styles.orderMeta}>Payment: {item.paymentMethod || '—'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderAmount}>${item.totalPrice.toFixed(2)}</Text>
                <View style={styles.statusRow}>
                  <Text style={[styles.statusBadge, statusColor(item.status)]}>{item.status || 'Pending'}</Text>
                  {item.isPrinted && <Text style={styles.printedBadge}>✓ Printed</Text>}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}><Text>No orders for this day.</Text></View>
          )}
        />
      )}

      {selectedOrder && (
        <Modal visible animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Order #{selectedOrder.id}</Text>
              <Text style={styles.modalLine}>Customer: {selectedOrder.customerName}</Text>
              <Text style={styles.modalLine}>Status: {selectedOrder.status}</Text>
              <Text style={styles.modalLine}>Pickup: {selectedOrder.pickupTime || 'TBD'}</Text>
              <Text style={styles.modalLine}>Payment: {selectedOrder.paymentMethod || '—'}</Text>
              {selectedOrder.address ? <Text style={styles.modalLine}>Address: {selectedOrder.address}</Text> : null}
              {selectedOrder.isPrinted && <Text style={styles.modalPrintedLine}>✓ This order has been printed</Text>}
              <Text style={[styles.modalLine, { fontWeight: '600', marginTop: 12 }]}>Items</Text>
              {selectedOrder.items.map((it, idx) => (
                <View key={`${selectedOrder.id}-${idx}`} style={styles.modalItemRow}>
                  <Text>{it.name}</Text>
                  <Text>× {it.quantity}</Text>
                </View>
              ))}
              <Text style={styles.modalTotal}>Total: ${selectedOrder.totalPrice.toFixed(2)}</Text>

              <View style={{ marginTop: 16 }}>
                <Button title="Mark Ready" onPress={() => markOrderReady(selectedOrder.id)} />
              </View>
              <View style={{ marginTop: 12 }}>
                <Button title="Close" onPress={() => setSelectedOrder(null)} />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* Printer Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPrinterModal}
        onRequestClose={() => setShowPrinterModal(false)}
      >
        <View style={styles.printerModalContainer}>
          <View style={styles.printerModalView}>
            <Text style={styles.printerModalTitle}>Select Printer</Text>
            
            {isDiscovering ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.printerModalText}>Discovering printers...</Text>
              </View>
            ) : printers.length === 0 ? (
              <View style={{ width: '100%' }}>
                <Text style={styles.printerModalText}>No printers found automatically</Text>
                <Text style={[styles.printerModalText, { fontSize: 12, marginBottom: 15 }]}>
                  Enter your Star TSP100 IP address:
                </Text>
                <TextInput
                  style={styles.printerInput}
                  placeholder="e.g., 192.168.1.100"
                  value={manualPrinterIP}
                  onChangeText={setManualPrinterIP}
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.printerButton, styles.printerButtonPrimary, { marginTop: 10 }]}
                  onPress={() => {
                    if (manualPrinterIP.trim()) {
                      const identifier = `TCP:${manualPrinterIP.trim()}`;
                      console.log('[Calendar] Using manual printer:', identifier);
                      setSelectedPrinter(identifier);
                      setShowPrinterModal(false);
                      handlePrintDay();
                    } else {
                      Alert.alert('Error', 'Please enter a valid IP address');
                    }
                  }}
                  disabled={!manualPrinterIP.trim()}
                >
                  <Text style={styles.printerButtonText}>Use This Printer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.printerButton, styles.printerButtonSecondary, { marginTop: 10 }]}
                  onPress={discoverPrinters}
                >
                  <Text style={styles.printerButtonText}>Retry Auto-Discovery</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.printerList}>
                {printers.map((printer) => (
                  <TouchableOpacity
                    key={printer.identifier}
                    style={[
                      styles.printerItem,
                      selectedPrinter === printer.identifier && styles.selectedPrinterItem
                    ]}
                    onPress={() => {
                      setSelectedPrinter(printer.identifier);
                      setShowPrinterModal(false);
                      handlePrintDay();
                    }}
                  >
                    <Text style={styles.printerName}>{printer.name}</Text>
                    <Text style={styles.printerIdentifier}>{printer.identifier}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.printerButton, styles.printerButtonCancel, { marginTop: 15 }]}
              onPress={() => setShowPrinterModal(false)}
            >
              <Text style={styles.printerButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, padding: 16, backgroundColor: '#ffffff', margin: 16 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  arrowBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  arrowText: { fontSize: 20, fontWeight: '600' },
  monthTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  monthSubtitle: { color: '#666', marginTop: 2 },
  calendarRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  day: { width: 44, height: 54, margin: 4, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  daySelected: { backgroundColor: '#111' },
  dayText: { color: '#111' },
  dayTextSelected: { color: '#fff' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2e7d32', position: 'absolute', bottom: 6 },
  dayToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginBottom: 8 },
  listHeaderText: { fontWeight: '600', fontSize: 16, marginHorizontal: 8 },
  errorText: { color: '#d32f2f', marginTop: 4 },
  printButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffd723', justifyContent: 'center', alignItems: 'center', marginLeft: 12, elevation: 2 },
  printButtonDisabled: { backgroundColor: '#e0e0e0', opacity: 0.6 },
  printButtonText: { fontSize: 20 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  orderTitle: { fontWeight: '700', fontSize: 15, color: '#111' },
  orderMeta: { color: '#666', marginTop: 2 },
  orderAmount: { fontWeight: '700', color: '#111' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, fontSize: 11, overflow: 'hidden', textTransform: 'capitalize' },
  printedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, fontSize: 10, backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: '600' },
  empty: { padding: 24, alignItems: 'center' },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  modalLine: { marginBottom: 8 },
  modalPrintedLine: { marginBottom: 8, color: '#2e7d32', fontWeight: '600' },
  modalItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  modalTotal: { marginTop: 12, fontWeight: '700' },
  // Printer modal styles
  printerModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  printerModalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 300,
    maxWidth: 400,
  },
  printerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  printerModalText: {
    marginBottom: 10,
    textAlign: 'center',
  },
  printerInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  printerList: {
    width: '100%',
    marginBottom: 15,
  },
  printerItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedPrinterItem: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  printerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  printerIdentifier: {
    fontSize: 12,
    color: '#666',
  },
  printerButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    width: '100%',
  },
  printerButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  printerButtonSecondary: {
    backgroundColor: '#2196F3',
  },
  printerButtonCancel: {
    backgroundColor: '#757575',
  },
  printerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OrdersCalendarScreen;

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatMonthYear(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatCenterText(text: string): string {
  const maxWidth = 32;
  const padding = Math.floor((maxWidth - text.length) / 2);
  return ' '.repeat(Math.max(0, padding)) + text;
}

function statusColor(status?: string) {
  switch ((status || '').toLowerCase()) {
    case 'ready':
      return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
    case 'completed':
      return { backgroundColor: '#e3f2fd', color: '#1565c0' };
    case 'cancelled':
      return { backgroundColor: '#ffebee', color: '#c62828' };
    default:
      return { backgroundColor: '#fff3e0', color: '#ef6c00' };
  }
}

function normalizeOrder(raw: any): AdminOrder {
  const createdAt = raw.createdAt || raw.created_at || raw.timestamp;
  const placedDateObj = toDateObj(createdAt) || new Date();
  const items: OrderItem[] = Array.isArray(raw.items) ? raw.items.map((it: any) => ({
    name: typeof it?.name === 'string' ? it.name : 'Item',
    quantity: typeof it?.quantity === 'number' ? it.quantity : 1,
  })) : [];

  const totalPrice = typeof raw.totalAmount === 'number'
    ? raw.totalAmount
    : typeof raw.totalPrice === 'number'
      ? raw.totalPrice
      : 0;

  return {
    id: String(raw.id || raw.orderId || raw.documentId || Math.random().toString(36).slice(2)),
    customerName: raw.customerName || raw.contactName || raw.userId || 'Customer',
    pickupTime: raw.pickupTime,
    pickupDate: raw.pickupDate,
    status: raw.status || 'Pending',
    items,
    totalPrice,
    address: raw.address,
    placedDateObj,
    isPrinted: raw.isPrinted ?? false,
    paymentMethod: raw.paymentMethod,
  };
}

function toDateObj(value: any): Date | null {
  try {
    if (!value) return null;
    if (typeof value.toDate === 'function') {
      return value.toDate();
    }
    if (typeof value.seconds === 'number') {
      const ms = value.seconds * 1000 + (typeof value.nanos === 'number' ? Math.floor(value.nanos / 1e6) : 0);
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
}
