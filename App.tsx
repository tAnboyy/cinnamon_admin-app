import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import TodaysOrdersScreen from './src/screens/TodaysOrdersScreen';
import LiveOrdersFeed from './src/screens/LiveOrdersFeed';
import MealPlanScreen from './src/screens/MealPlanScreen';

const Tab = createBottomTabNavigator();

function Header() {
  return (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#fff', elevation: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', flex: 1 }}>Cinnamon Live - Admin</Text>
    </View>
  );
}

function AdminDashboard() {
    return (
        <>
            <Header />
            <Tab.Navigator>
                <Tab.Screen name="Today's Orders" component={TodaysOrdersScreen} />
                <Tab.Screen name="Live Feed" component={LiveOrdersFeed} />
                <Tab.Screen name="Meal Plans" component={MealPlanScreen} />
            </Tab.Navigator>
        </>
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
