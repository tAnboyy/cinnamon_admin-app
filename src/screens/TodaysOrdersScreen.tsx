import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput } from 'react-native';
import { orders, Order } from '../data/dummyData';
import printerService, { PrinterDevice } from '../services/printerService';

const TodaysOrdersScreen = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [manualPrinterIP, setManualPrinterIP] = useState('');

  const discoverPrinters = async () => {
    setIsDiscovering(true);
    try {
      const discoveredPrinters = await printerService.discoverPrinters();
      setPrinters(discoveredPrinters);
      
      if (discoveredPrinters.length === 0) {
        Alert.alert('No Printers Found', 'Please make sure your Star TSP100 printer is connected and on the same network.');
      } else if (discoveredPrinters.length === 1) {
        setSelectedPrinter(discoveredPrinters[0].identifier);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to discover printers. Please try again.');
      console.error('Printer discovery error:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!selectedOrder) return;

    console.log('[Screen] handlePrintReceipt called');
    console.log('[Screen] selectedPrinter:', selectedPrinter);
    console.log('[Screen] printers.length:', printers.length);

    if (!selectedPrinter) {
      console.log('[Screen] No printer selected, showing printer modal');
      setShowPrinterModal(true);
      if (printers.length === 0) {
        await discoverPrinters();
      }
      return;
    }

    setIsPrinting(true);
    try {
      console.log('[Screen] Calling printerService.printReceipt');
      await printerService.printReceipt(selectedOrder, selectedPrinter);
      console.log('[Screen] Print successful!');
      Alert.alert('Success', 'Receipt printed successfully!');
      setSelectedOrder(null);
    } catch (error) {
      console.error('[Screen] Print error:', error);
      Alert.alert('Print Error', `Failed to print receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPrinting(false);
    }
  };

  useEffect(() => {
    discoverPrinters();
  }, []);

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => setSelectedOrder(item)}>
      <Text>{item.customerName} - {item.pickupTime}</Text>
      <Text>{item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
      
      {selectedOrder && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedOrder}
          onRequestClose={() => setSelectedOrder(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <Text style={styles.modalText}>Customer: {selectedOrder.customerName}</Text>
              <Text style={styles.modalText}>Pickup: {selectedOrder.pickupTime}</Text>
              <Text style={styles.modalText}>Total: ${selectedOrder.totalPrice.toFixed(2)}</Text>
              {selectedOrder.address && <Text style={styles.modalText}>Address: {selectedOrder.address}</Text>}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.printButton]}
                  onPress={handlePrintReceipt}
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>🖨️ Print Receipt</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.updateButton]}
                  onPress={() => {
                    alert('Order status updated to Ready!');
                    setSelectedOrder(null);
                  }}
                >
                  <Text style={styles.buttonText}>✓ Update to Ready</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.closeButton]}
                  onPress={() => setSelectedOrder(null)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showPrinterModal}
        onRequestClose={() => setShowPrinterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Select Printer</Text>
            
            {isDiscovering ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.modalText}>Discovering printers...</Text>
              </View>
            ) : printers.length === 0 ? (
              <View style={{ width: '100%' }}>
                <Text style={styles.modalText}>No printers found automatically</Text>
                <Text style={[styles.modalText, { fontSize: 12, marginBottom: 15 }]}>
                  Enter your printer's IP address manually:
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 192.168.1.100"
                  value={manualPrinterIP}
                  onChangeText={setManualPrinterIP}
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.button, styles.printButton, { marginTop: 10 }]}
                  onPress={() => {
                    if (manualPrinterIP.trim()) {
                      const identifier = `TCP:${manualPrinterIP.trim()}`;
                      console.log('[Screen] Using manual printer:', identifier);
                      setSelectedPrinter(identifier);
                      setShowPrinterModal(false);
                      handlePrintReceipt();
                    } else {
                      Alert.alert('Error', 'Please enter a valid IP address');
                    }
                  }}
                  disabled={!manualPrinterIP.trim()}
                >
                  <Text style={styles.buttonText}>Use This Printer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.updateButton, { marginTop: 10 }]}
                  onPress={discoverPrinters}
                >
                  <Text style={styles.buttonText}>Retry Auto-Discovery</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.printerList}>
                {printers.map((printer) => (
                  <TouchableOpacity
                    key={printer.identifier}
                    style={[
                      styles.printerItem,
                      selectedPrinter === printer.identifier && styles.selectedPrinter
                    ]}
                    onPress={() => {
                      setSelectedPrinter(printer.identifier);
                      setShowPrinterModal(false);
                      handlePrintReceipt();
                    }}
                  >
                    <Text style={styles.printerName}>{printer.name}</Text>
                    <Text style={styles.printerIdentifier}>{printer.identifier}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={() => setShowPrinterModal(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    marginBottom: 10,
    textAlign: 'center',
  },
  modalButtons: {
    marginTop: 15,
    width: '100%',
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  printButton: {
    backgroundColor: '#4CAF50',
  },
  updateButton: {
    backgroundColor: '#2196F3',
  },
  closeButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
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
  selectedPrinter: {
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
});

export default TodaysOrdersScreen;
