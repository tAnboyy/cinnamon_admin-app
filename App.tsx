import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import OrdersCalendarScreen from './src/screens/OrdersCalendarScreen';
import LiveOrdersFeed from './src/screens/LiveOrdersFeed';
import MealPlanScreen from './src/screens/MealPlanScreen';

const Tab = createBottomTabNavigator();

function AdminDashboard() {
    return (
      <Tab.Navigator>
        <Tab.Screen name="ORDERS" component={OrdersCalendarScreen} />
        <Tab.Screen name="Live Feed" component={LiveOrdersFeed} />
        <Tab.Screen name="Meal Plans" component={MealPlanScreen} />
      </Tab.Navigator>
    )
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <NavigationContainer>
      <AdminDashboard />
    </NavigationContainer>
  );
}
