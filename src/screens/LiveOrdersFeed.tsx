import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { orders } from '../data/dummyData';

const LiveOrdersFeed = () => {
  const liveOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Ready');

  return (
    <View style={styles.container}>
      <FlatList
        data={liveOrders}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text>{item.customerName} - {item.status}</Text>
          </View>
        )}
        keyExtractor={item => item.id}
      />
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
  });

export default LiveOrdersFeed;
