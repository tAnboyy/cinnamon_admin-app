import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Button } from 'react-native';
import { orders, Order } from '../data/dummyData';

const TodaysOrdersScreen = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
              <Text style={styles.modalText}>Customer: {selectedOrder.customerName}</Text>
              <Text style={styles.modalText}>Pickup: {selectedOrder.pickupTime}</Text>
              <Text style={styles.modalText}>Total: ${selectedOrder.totalPrice.toFixed(2)}</Text>
              {selectedOrder.address && <Text style={styles.modalText}>Address: {selectedOrder.address}</Text>}
              <Button title="Update to Ready" onPress={() => {
                  // Mock update and notification
                  alert('Order status updated to Ready!');
                  setSelectedOrder(null);
              }} />
              <Button title="Close" onPress={() => setSelectedOrder(null)} />
            </View>
          </View>
        </Modal>
      )}
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
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    }
  });

export default TodaysOrdersScreen;
