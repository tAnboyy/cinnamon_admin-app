import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { mealPlans } from '../data/dummyData';

const MealPlanScreen = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={mealPlans}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text>{item.customerName} - Next Pickup: {item.nextPickup}</Text>
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

export default MealPlanScreen;
